

# Análise Senior — Garden Gestão SaaS

## Visão Geral
O sistema é um SaaS completo para gestão de restaurantes com ~140 tabelas, ~45 Edge Functions, ~65 páginas, e 33 usuários em uso. A arquitetura é sólida para MVP, mas há ajustes críticos, importantes e de polimento necessários antes de escalar para o mercado.

---

## CRÍTICO — Bloqueia lançamento

### 1. Stripe Webhook busca TODOS os usuários
No `stripe-webhook/index.ts` linha 54:
```
const { data: users } = await supabaseAdmin.auth.admin.listUsers();
const user = users?.users?.find(u => u.email === customerEmail);
```
Isso carrega TODOS os usuários na memória para achar um por email. Com 1.000+ clientes, vai estourar memória e timeout. **Solução**: usar `supabaseAdmin.auth.admin.listUsers({ filter: ... })` ou buscar pela tabela `profiles` com `eq('email', customerEmail)`.

### 2. Políticas RLS "always true" em tabelas sensíveis
O linter detectou **17 políticas com `USING(true)` ou `WITH CHECK(true)`** em INSERT/UPDATE/DELETE. Algumas são intencionais (tabelas públicas como menu, gamificação), mas outras precisam revisão:
- `mural_posts` — ALL com `true` para authenticated (qualquer usuário logado de qualquer restaurante pode editar/deletar posts de outro)
- `delivery_hub_order_items/orders` — INSERT sem filtro de `unit_id`
- `loyalty_events` — INSERT sem filtro
- `qr_login_sessions` — UPDATE com `true`

Cada uma precisa ser restrita ao `unit_id` ou `user_id` correto.

### 3. Tabela `supplier_last_prices` SEM política RLS
Única tabela sem nenhuma política. Qualquer usuário autenticado pode ler/escrever preços de fornecedores de qualquer restaurante.

### 4. `check-subscription` usa `getClaims` em vez de `getUser`
A Edge Function valida tokens com `getClaims` que não verifica se a sessão foi revogada. Um token de um usuário banido ou deslogado continua válido até expirar. Para um SaaS com cobrança, isso é risco.

---

## IMPORTANTE — Impacta qualidade e confiabilidade

### 5. Herança de plano com múltiplos pontos de resolução
O plano do usuário é resolvido em 3 lugares diferentes: `fetchUserData`, `refreshSubscription` e `setEffectivePlan` (chamado pelo `UnitContext`). Cada um tem lógica ligeiramente diferente com race conditions. Já causou bugs (Vinicius bloqueado). **Sugestão**: centralizar em uma única função `resolvePlan(userId, unitId)` chamada de um só ponto.

### 6. Polling de subscription a cada 15 minutos
Cada usuário logado chama `check-subscription` a cada 15 min + a cada 10s no login + a cada visibilitychange. Com 500 usuários simultâneos, são ~2.000 chamadas/hora para o Stripe. **Sugestão**: mover para modelo event-driven (webhook já existe) e só chamar check-subscription no login e ao trocar de unidade.

### 7. Erro silenciado excessivamente
O `UnhandledRejectionGuard` suprime erros de `Failed to fetch`, `FunctionsHttpError`, etc. Em produção isso pode mascarar falhas reais de Edge Functions ou do banco. **Sugestão**: logar para um serviço de monitoramento (Sentry/LogFlare) antes de suprimir.

### 8. Cache de autenticação no localStorage
Plano, perfil e role ficam em `localStorage`. Se o webhook do Stripe atualizar o plano para `canceled`, o cache local continua mostrando `active` até a próxima verificação (pode ser 15 min). **Sugestão**: invalidar cache sempre que `check-subscription` retornar um plano diferente do cacheado.

### 9. Falta de índices para queries frequentes
Tabelas com alto volume como `audit_logs` (18k), `checklist_completions` (4.3k), `finance_transactions` (2.2k) provavelmente precisam de índices compostos em `(unit_id, created_at)` para evitar full table scans conforme crescem.

---

## MELHORIAS — Qualidade de produto

### 10. Sem rate limiting nas Edge Functions
Nenhuma das 45 funções tem rate limiting. Um atacante pode chamar `management-ai`, `marketing-generate-image` ou `finance-categorize` milhares de vezes, consumindo créditos de IA. **Sugestão**: implementar rate limit por `user_id` via Redis/KV ou tabela de controle.

### 11. Sem monitoramento/alertas
Não há integração com Sentry, LogFlare, ou similar. Erros em produção só são descobertos quando o usuário reporta. Essencial para um SaaS pago.

### 12. Empty catch blocks em 37 arquivos
341 instâncias de `catch {}` ou `catch () {}` que engolem erros silenciosamente. Muitos são legítimos (vibrate, localStorage), mas alguns em fluxos críticos como POS checkout e entregas precisam de tratamento adequado.

### 13. Onboarding e self-service incompleto
- Não há trial period configurado
- Não há fluxo de upgrade in-app (só redireciona para `/plans`)
- Falta email transacional de boas-vindas, expiração de trial, etc.

### 14. Sem testes automatizados
Nenhum teste unitário ou de integração visível. Para um SaaS com 65+ páginas e fluxos financeiros, é alto risco de regressão.

---

## RESUMO PRIORIZADO

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Fix Stripe webhook listUsers | 30min | Crítico |
| 2 | Restringir RLS permissivas | 2-3h | Crítico |
| 3 | Adicionar RLS em supplier_last_prices | 15min | Crítico |
| 4 | Trocar getClaims por getUser | 30min | Crítico |
| 5 | Centralizar resolução de plano | 3-4h | Importante |
| 6 | Reduzir polling de subscription | 1-2h | Importante |
| 7 | Adicionar monitoramento (Sentry) | 2-3h | Importante |
| 8 | Rate limiting em Edge Functions de IA | 3-4h | Importante |
| 9 | Índices de performance | 1-2h | Importante |
| 10 | Limpeza de empty catches críticos | 1-2h | Melhoria |
| 11 | Setup de onboarding/trial | 4-6h | Melhoria |

**Recomendação**: resolver itens 1-4 antes de qualquer publicação, pois são vulnerabilidades de segurança e escalabilidade que podem causar perda de dados entre restaurantes ou falhas de cobrança.

