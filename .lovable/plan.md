

## Auditoria Arquitetural Sênior — Diagnóstico e Plano de Melhoria

### Estado Atual da Arquitetura

O sistema Atlas/Garden é uma plataforma SaaS multi-tenant madura, com separação de concerns razoável. As melhorias anteriores (segurança IDOR, consolidação de queries, auditoria expandida) elevaram significativamente o nível. O diagnóstico abaixo foca nos gaps remanescentes que bloqueiam comercialização B2B séria.

---

### 1. Riscos Identificados

#### A. Acoplamento Excessivo nos Contextos (Risco: Escalabilidade Frontend)

**Problema**: `AppLayout` instancia 5 hooks pesados em toda renderização: `useNotifications`, `usePoints`, `useLeaderboard`, `useUserModules`, `useAuth`. Cada troca de rota re-executa toda a árvore de sidebar.

**Impacto**: Em dispositivos móveis com 3G, o tempo de interação inicial (TTI) é penalizado. Para 5.000 usuários, o volume combinado de polling (`useNotifications` a cada 60s + `usePoints` com `refetchOnWindowFocus`) gera carga constante.

**Trade-off**: Separar em contextos menores (NotificationContext, PointsContext) adiciona complexidade de código mas reduz re-renders em ~60%. Alternativa: memoizar com `useMemo` + `React.memo` nos componentes filhos — menor impacto arquitetural, menor ganho.

**Decisão recomendada**: Extrair `useLeaderboard` e `usePoints` do `AppLayout` para um componente `<SidebarUserCard>` com `React.memo`, isolando re-renders ao bloco de pontuação. Não criar novos contextos (over-engineering para o tamanho atual).

#### B. Ausência de Soft-Delete Padronizado (Risco: Compliance/Recuperação)

**Problema**: A maioria das mutations usa `DELETE` hard, exceto `finance_accounts` (que usa `is_active: false`). Para clientes B2B, deletar permanentemente transações financeiras, funcionários ou clientes é inaceitável — viola requisitos de retenção de dados e impossibilita auditoria retroativa.

**Impacto**: Mesmo com `audit_logs` capturando `old_values`, o registro original é perdido. Um auditor externo não pode reconstruir o estado completo da base.

**Trade-off**: Soft-delete (coluna `deleted_at`) em todas as tabelas sensíveis exige RLS atualizado (`WHERE deleted_at IS NULL`), refatoração de todas as queries de listagem, e um mecanismo de purge periódico. Implementação gradual é possível mas inconsistência durante a transição cria confusão.

**Decisão recomendada**: Implementar soft-delete apenas nas 4 tabelas de maior risco regulatório: `finance_transactions`, `employees`, `customers`, `inventory_items`. Adicionar `deleted_at timestamptz DEFAULT NULL` e atualizar RLS para filtrar automaticamente.

#### C. Inconsistência no Padrão de Error Handling (Risco: Experiência/Debug)

**Problema**: Mutations no `useFinanceCore` usam `onError: () => toast.error('Erro ao salvar')` — mensagens genéricas sem contexto. Erros de RLS (403), timeout, e constraint violations recebem o mesmo tratamento. Não há logging estruturado de erros no cliente.

**Impacto**: Suporte técnico não consegue diagnosticar problemas de clientes B2B sem reprodução. Sem error tracking (Sentry/equivalent), bugs em produção são invisíveis.

**Trade-off**: Integrar error tracking (ex: Sentry) adiciona uma dependência externa e 15-20KB ao bundle. Alternativa minimalista: criar um `errorReporter` que envia erros críticos para uma Edge Function que grava em `audit_logs` com `action: 'client_error'`.

**Decisão recomendada**: Criar um utilitário `reportError(error, context)` que grava no `audit_logs` via RPC. Sem dependência externa, reutiliza infraestrutura existente. Classificar erros em `toast.error` com mensagens específicas por código HTTP.

#### D. Bundle Size e Code Splitting Incompleto (Risco: Performance Mobile)

**Problema**: `AppLayout` importa `recharts` indiretamente via `FinanceChartWidget` no dashboard. `lucide-react` com 462+ ícones importados individualmente (via `AppIcon` dinâmico) gera tree-shaking parcial. O `BottomTabBar` é carregado para desktop também.

**Impacto**: Bundle principal estimado em 400-500KB gzipped. Para o mercado-alvo (restaurantes com celulares entry-level e 4G instável), cada 100KB adicional = 1-2s de carregamento.

**Trade-off**: Lazy-load do `BottomTabBar` com `useIsMobile()` economiza ~15KB em desktop mas adiciona um flash de layout em mobile. Substituir `AppIcon` por imports estáticos reduz bundle mas elimina a flexibilidade de ícones dinâmicos na sidebar.

**Decisão recomendada**: (1) Lazy-load `BottomTabBar` apenas para mobile via `React.lazy` com check de viewport. (2) Manter `AppIcon` dinâmico mas adicionar preload dos ícones mais usados (os 10 da sidebar) via `import()` paralelo no idle callback existente.

#### E. Polling Excessivo sem WebSocket (Risco: Custo de Infra a Escala)

**Problema**: O sistema usa 4 mecanismos de polling simultâneos:
- `useNotifications`: 60s interval
- `AuthContext`: subscription polling a cada 15min
- `useProfile`: `refetchInterval: 60_000`  
- `visibilitychange` handler com debounce de 30s

Para 5.000 usuários, isso gera ~5.000 × 4 = 20.000 requests/minuto = 333 req/s constante, mais os bursts de visibility change.

**Trade-off**: Migrar para Supabase Realtime (WebSocket) elimina polling mas adiciona complexidade de gestão de canais e reconexão. Polling é mais resiliente a falhas de rede intermitente (comum em restaurantes). Abordagem híbrida: Realtime para notifications + polling reduzido (5min) para subscription status.

**Decisão recomendada**: Implementar Realtime apenas para `notifications` (tabela já existe, alto valor de UX). Aumentar intervalo de polling do `useProfile` para 5min. Manter polling de subscription como está (já a cada 15min).

#### F. Ausência de Feature Flags (Risco: Deploys Arriscados)

**Problema**: Módulos premium são controlados por `MODULE_REQUIRED_PLAN` hardcoded. Rollout de features novas exige deploy. Não há capacidade de desabilitar uma feature com bug em produção sem deploy.

**Trade-off**: Feature flags via tabela DB (`feature_flags`) adicionam uma query por sessão mas dão controle total. Serviços externos (LaunchDarkly) adicionam custo e dependência. Feature flags via environment variables são limitadas (requerem rebuild).

**Decisão recomendada**: Criar tabela `feature_flags` (chave, valor boolean, escopo: global/unit/plan) com RLS de leitura pública. Query única no boot do app, cache no `AuthContext` ou `UnitContext`. Custo zero de infra, controle granular.

---

### 2. Plano de Melhoria (Priorizado)

| # | Melhoria | Tipo | Impacto | Arquivos |
|---|----------|------|---------|----------|
| 1 | Soft-delete em tabelas regulatórias | Migration SQL | Compliance B2B, retenção de dados | 1 migration + 4 hooks |
| 2 | Realtime para notifications | Frontend + SQL | -80% polling, UX instantânea | `useNotifications.ts` + 1 migration |
| 3 | Error reporter centralizado | Frontend | Diagnóstico de produção | 1 util + mutation wrapper |
| 4 | Feature flags via DB | Migration + Frontend | Controle de rollout sem deploy | 1 migration + 1 hook + `AppLayout` |
| 5 | Isolamento de re-renders no AppLayout | Frontend | -60% re-renders na sidebar | `AppLayout.tsx` (memo split) |
| 6 | Lazy-load BottomTabBar para mobile | Frontend | -15KB bundle desktop | `AppLayout.tsx` |

---

### 3. Justificativas Técnicas

**Por que soft-delete e não hard-delete + audit log?**
Audit logs capturam o snapshot no momento da deleção, mas não substituem o registro original. Em disputas legais ou auditorias financeiras, o registro íntegro na tabela original tem peso jurídico superior a um log JSON. Além disso, soft-delete permite "restaurar" registros — funcionalidade esperada por clientes enterprise.

**Por que Realtime só para notifications e não para tudo?**
WebSockets consomem conexões persistentes. Com 5.000 usuários, cada canal Realtime adicional multiplica o consumo de recursos do Supabase. Notifications são o único caso onde latência <1s tem impacto direto em UX (alertas de estoque, checklists). Demais dados (finanças, estoque) toleram stale de 30s-5min sem degradação perceptível.

**Por que feature flags em DB e não em env vars?**
Environment variables exigem rebuild+deploy para alterar. Em cenário de emergência (bug em módulo de pagamento), o tempo de resposta com env vars é 5-10 minutos; com DB flag é <10 segundos. Para SaaS B2B com SLA, a diferença é crítica.

**Por que não criar contextos separados para Points/Leaderboard?**
O custo de manutenção de 8+ contextos React (Auth, Unit, CoinAnimation, FabAction + novos) supera o benefício de isolamento. `React.memo` em componentes folha atinge 80% do ganho com 20% do esforço. Contextos adicionais só se justificam quando o número de consumers ultrapassar 10 componentes distintos.

