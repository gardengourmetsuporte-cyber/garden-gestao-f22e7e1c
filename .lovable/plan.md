

## Avaliação de Maturidade SaaS — Diagnóstico e Plano de Melhorias

### O que já está bem implementado

| Aspecto | Status | Detalhes |
|---|---|---|
| Autenticação JWT | ✅ | Gerenciada pelo Supabase, refresh automático, polling de subscription |
| RBAC com roles separadas | ✅ | `user_roles` em tabela separada, `has_role()` SECURITY DEFINER |
| Isolamento multi-tenant | ✅ | RLS com `user_has_unit_access()`, 18+ tabelas protegidas |
| Permissões granulares | ✅ | `access_levels` com árvore hierárquica de sub-módulos |
| Logs de auditoria | ✅ Parcial | Existe `audit_logs` com triggers automáticos (estoque, financeiro, checklists) |
| Proteção IDOR | ✅ | Validação `unit_id` em Edge Functions |
| Modelo de billing | ✅ | Stripe checkout, subscription polling, herança de plano por unidade |

### Gaps que impedem venda B2B

---

#### 1. Cobertura de auditoria incompleta (CRÍTICO para B2B)

Os triggers de audit só cobrem 4 entidades: `stock_movements`, `finance_transactions`, `cash_closings`, `checklist_completions`. Faltam eventos críticos para compliance B2B:

- **Alterações de permissão** (quem mudou o access_level de quem)
- **Login/logout** (trilha de acesso)
- **Alterações de perfil/role** (elevação de privilégio)
- **Exclusão de dados** (clientes, funcionários, receitas)
- **Alterações em configurações** (métodos de pagamento, categorias financeiras)
- **Exportações de dados** (CSV, PDF — para LGPD/compliance)

**Impacto**: Clientes B2B (redes de restaurantes) exigem trilha de auditoria completa para SOC2/compliance interno.

#### 2. Ausência de histórico de alterações (change history)

O sistema não rastreia o **estado anterior** dos registros. O `audit_logs` registra "transação criada" com detalhes, mas quando alguém **edita** uma transação de R$500 para R$5, não há registro do valor anterior. Isso é um requisito fundamental para:

- Detecção de fraude
- Disputas trabalhistas (pontos alterados retroativamente)
- Auditoria financeira (valores originais vs. modificados)

**Impacto**: Sem diff de campos, o audit log é informativo mas não probatório.

#### 3. Sem exportação de logs de auditoria

O `AuditLogSettings` exibe logs paginados na UI, mas não oferece exportação (CSV/PDF). Clientes B2B precisam extrair logs para auditores externos.

#### 4. Sem retenção/archiving policy para audit logs

A tabela `audit_logs` cresce indefinidamente. Para 5.000 usuários com ~50 ações/dia = 250k registros/dia = 91M/ano. Sem particionamento ou archiving, queries ficam lentas.

#### 5. Sem webhook/integração de eventos

Clientes enterprise esperam poder integrar eventos do sistema (webhook para ERPs, Slack notifications para eventos críticos). Não há infraestrutura de event dispatch.

---

### Plano de Melhorias

#### A. Expandir cobertura de auditoria via triggers

Adicionar triggers `log_audit_event` para:
- `user_units` (INSERT/UPDATE/DELETE) — rastrear mudanças de papel e acesso
- `access_levels` (UPDATE/DELETE) — rastrear alterações de permissão
- `employees` (INSERT/UPDATE/DELETE)
- `customers` (DELETE)
- `finance_accounts` (INSERT/UPDATE/DELETE)

**Impacto**: +5 triggers, zero mudança de código frontend.

#### B. Adicionar campo `old_values` ao audit log

Alterar a function `log_audit_event` para aceitar um parâmetro opcional `p_old_values jsonb`. Nos triggers de UPDATE, capturar o `row_to_json(OLD)` e armazená-lo. Adicionar coluna `old_values jsonb` à tabela `audit_logs`.

**Impacto**: Diff de campos disponível para toda operação de UPDATE auditada.

#### C. Exportação de logs (CSV)

Adicionar botão de exportação CSV no `AuditLogSettings.tsx` que gera o arquivo com os filtros ativos.

**Impacto**: 1 componente editado, nenhuma migração.

#### D. Adicionar audit de login via trigger no auth

Como não podemos modificar o schema `auth`, criar um trigger leve: ao carregar o `AuthContext` e detectar `SIGNED_IN`, chamar `supabase.rpc('log_audit_event', ...)` direto do frontend para registrar o login.

**Impacto**: 1 linha no AuthContext, nenhuma migração.

#### E. Política de retenção (índice parcial + TTL)

Adicionar um índice parcial para logs com mais de 1 ano e documentar que um cron job futuro poderá arquivar registros antigos. Por agora, apenas garantir que o índice `(unit_id, created_at DESC)` já existente seja suficiente (já existe).

**Impacto**: Documentação + 1 índice condicional opcional.

---

### Resumo de execução

| Tarefa | Tipo | Arquivos |
|---|---|---|
| Triggers de auditoria expandidos | Migração SQL | 1 migration |
| Coluna `old_values` + update na function | Migração SQL | mesma migration |
| Exportação CSV de logs | Frontend | `AuditLogSettings.tsx` |
| Audit de login no frontend | Frontend | `AuthContext.tsx` |
| Expandir `ACTION_LABELS` no hook | Frontend | `useAuditLogs.ts` |

Total: 1 migração SQL + 3 arquivos frontend editados. Zero alteração funcional nos módulos existentes.

