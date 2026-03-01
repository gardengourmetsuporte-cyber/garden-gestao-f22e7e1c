

## Auditoria de Segurança SaaS — Diagnóstico e Plano de Correção

### Diagnóstico por Categoria

---

#### 1. Autenticação JWT — Estado Atual
- O cliente Supabase já usa `autoRefreshToken: true` e `persistSession: true` — JWT é gerenciado automaticamente com expiração padrão de 1h e refresh automático.
- **Problema**: Não há nada a corrigir aqui; a configuração JWT é gerenciada pelo Lovable Cloud e não pode ser alterada via código.
- **Veredicto**: ✅ OK

#### 2. RBAC — Estado Atual
- Roles armazenadas em `user_roles` (tabela separada) — correto.
- Funções `has_role()` e `user_has_unit_access()` como SECURITY DEFINER — correto.
- `auto_assign_owner_role()` trigger promove owners para admin global — correto.
- **Problema**: Nenhum crítico. O sistema de roles multi-nível (super_admin > admin > funcionario) com resolução por prioridade já está implementado.
- **Veredicto**: ✅ OK

#### 3. Isolamento Multi-Tenant — Estado Atual
- RLS com `user_has_unit_access()` aplicado em tabelas sensíveis.
- **Problemas encontrados**:
  - `daily-digest`: Usa service_role key e itera todos os admins sem scoping — comportamento correto para cron job interno.
  - `bill-reminders`: Mesmo padrão, correto.
  - `marketing-suggestions`: **Sem autenticação.** Aceita `unit_id` no body sem validar quem está chamando. Qualquer pessoa pode acessar dados de produtos e clientes de qualquer unidade.
  - `colibri-health`: **Sem autenticação.** Faz proxy de fetch para URLs externas fornecidas pelo chamador (SSRF potencial).
  - `import-daily-sales`: Autentica via getClaims, mas **não valida se o usuário pertence à unidade** sendo importada.
  - `quotation-public`: Usa token UUID como autenticação — aceitável para link público de fornecedor.
  - `tablet-order`: **Sem autenticação.** Qualquer pessoa pode confirmar pedidos ou enviar ao PDV se souber o `order_id`.

#### 4. Validação de Entradas no Backend
- **Problemas encontrados**:
  - `management-ai`: O `unit_id` vem do body do request, não é validado contra as unidades do usuário. Um usuário autenticado pode enviar `unit_id` de outra empresa e executar ações (criar transações, movimentar estoque) em unidades alheias — **IDOR crítico**.
  - `marketing-suggestions`: `prompt`, `unit_id`, `topic` sem validação de tipo ou tamanho.
  - `tablet-order`: `order_id` e `token` sem sanitização.
  - Nenhuma função valida tamanhos máximos de strings de entrada.

#### 5. IDOR (Insecure Direct Object Reference)
- **Crítico**: `management-ai` aceita `unit_id` do body e executa operações (create_transaction, register_stock_movement, etc.) via service_role key, bypassando RLS. Um usuário autenticado pode operar em qualquer unidade.
- **Crítico**: `import-daily-sales` aceita `unitId` do body sem verificar se o chamador pertence àquela unidade.
- **Médio**: `colibri-health` aceita `hub_url` e `auth_key` arbitrários — permite SSRF.

#### 6. SQL Injection e XSS
- **SQL Injection**: O projeto usa o SDK Supabase (queries parametrizadas) — risco desprezível.
- **XSS**: `dangerouslySetInnerHTML` aparece apenas em `chart.tsx` para CSS gerado internamente (não usa input do usuário) — OK.
- **Veredicto**: ✅ Risco baixo

#### 7. Rate Limiting
- `tablet-order`: Tem rate limiting por IP (10 req/min) — OK.
- **Todas as outras funções**: Nenhum rate limiting. `management-ai` chama IA gateway sem throttle por usuário.
- **Médio**: Adicionar rate limiting por `user_id` em `management-ai` e `ai-insights`.

#### 8. Logs Sensíveis
- `whatsapp-webhook` loga payload recebido (pode conter mensagens de clientes): `console.log("[WEBHOOK] Received payload:", JSON.stringify(body).substring(0, 500))`.
- `stripe-webhook` loga email de clientes.
- **Médio**: Reduzir verbosidade de logs em produção.

---

### Plano de Correção (por prioridade)

#### CRÍTICO — Corrigir IDOR no management-ai
- Validar que o `unit_id` enviado no body pertence ao usuário autenticado
- Query `user_units` com o `user_id` extraído do JWT para verificar acesso
- Se `unit_id` não pertencer ao usuário, rejeitar com 403

#### CRÍTICO — Corrigir IDOR no import-daily-sales
- Após `getClaims`, verificar que o `unitId` do body está em `user_units` do usuário

#### CRÍTICO — Adicionar autenticação ao marketing-suggestions
- Adicionar validação JWT via `getClaims`
- Validar que `unit_id` pertence ao usuário autenticado

#### CRÍTICO — Proteger colibri-health contra SSRF
- Adicionar autenticação JWT
- Restringir `hub_url` a domínios permitidos ou pelo menos bloquear IPs internos/privados

#### CRÍTICO — Adicionar autenticação ao tablet-order
- O rate limiting por IP existe, mas sem autenticação qualquer pessoa pode operar
- Adicionar validação por token de unidade ou autenticação JWT
- Alternativa: validar que o `order_id` pertence a uma unidade ativa (já faz parcialmente via DB lookup)

#### MÉDIO — Rate limiting no management-ai
- Implementar throttle por `user_id` (ex: 30 req/min) usando Map in-memory similar ao tablet-order

#### MÉDIO — Reduzir logs sensíveis
- `whatsapp-webhook`: Não logar conteúdo de mensagens
- `stripe-webhook`: Não logar emails

#### BAIXO — Validação de tamanho de strings
- Adicionar limites de tamanho para entradas de texto nas funções que aceitam input do usuário (description, prompt, notes)

---

### Resumo técnico
- **6 Edge Functions** precisam de correções de segurança
- Nenhuma migração de banco necessária
- Zero alteração de funcionalidade
- Estimativa: ~6 arquivos editados

