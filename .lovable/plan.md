
# Auditoria Completa do Sistema - Plano de Melhorias

## Resumo Executivo

Apos analise detalhada de todo o codigo-fonte, banco de dados, politicas RLS, logs do console e arquitetura, identifiquei **12 problemas concretos** organizados por prioridade. O sistema esta bem construido no geral, mas ha bugs ativos, problemas de performance e ajustes de seguranca que devem ser tratados.

---

## PRIORIDADE ALTA - Bugs Ativos

### 1. Bug: Loop infinito no Popover de Notificacoes (CRITICO)

O console mostra: `Maximum update depth exceeded` originado no `PopoverTrigger` dentro do `AppLayoutContent`. Isso causa re-renders infinitos no header da pagina principal, degradando performance em todos os dispositivos.

**Causa provavel:** O componente `Popover` do Radix esta disparando `onOpenChange` de forma que atualiza estado em loop. Provavelmente relacionado a como `notifOpen` interage com o ciclo de renderizacao.

**Correcao:** Memorizar o callback `onOpenChange` com `useCallback` e verificar se o estado ja esta no valor desejado antes de atualizar.

**Arquivo:** `src/components/layout/AppLayout.tsx` (linhas 178-192)

### 2. Bug: Chat - N+1 no calculo de mensagens nao lidas

Em `useChat.ts` (linhas 100-108), dentro do loop `for (const conv of convData)`, ha uma query individual de `COUNT` para cada conversa. Com 20 conversas, sao 20 queries extras.

**Correcao:** Buscar todas as mensagens nao lidas em uma unica query batch usando `convIds` e `gt('created_at', minLastReadAt)`, depois agrupar por `conversation_id` no JavaScript.

**Arquivo:** `src/hooks/useChat.ts`

### 3. Bug: Finance - `initializeDefaults` executado a cada troca de mes

Em `useFinance.ts` (linhas 169-174), a funcao `initializeDefaults` e chamada dentro do `queryFn` de transacoes, que re-executa toda vez que o `monthKey` muda. Embora haja um check de idempotencia interno, isso gera 2 queries extras (accounts + categories) em cada mudanca de mes.

**Correcao:** Mover a inicializacao para um `useEffect` separado que executa apenas uma vez por sessao, usando um ref de controle.

**Arquivo:** `src/hooks/useFinance.ts`

---

## PRIORIDADE ALTA - Seguranca

### 4. Tabela `push_config` sem politicas RLS

O linter do banco detectou que `push_config` tem RLS habilitado mas nenhuma politica configurada. Essa tabela contem `vapid_private_key`, que e uma chave criptografica sensivel. Sem politicas, nenhum usuario consegue ler (o que e bom), mas tambem nao ha protecao explicita.

**Correcao:** Adicionar politica `SELECT` restritiva (`USING (false)`) para bloquear acesso direto. As edge functions que precisam acessar ja usam `service_role_key`.

### 5. Politicas RLS `USING (true)` em INSERT/UPDATE

O linter detectou 5 warnings de politicas permissivas. Estas sao as politicas de `INSERT` em `checklist_completions` e `chat_participants` que usam apenas `is_authenticated()` sem restricao adicional.

**Avaliacao:** Para `checklist_completions`, o padrao e aceitavel (qualquer usuario autenticado pode completar tarefas). Para `chat_participants`, o INSERT ja valida `is_authenticated()` no check, o que e intencional para permitir que criadores adicionem membros. Estes sao falsos positivos funcionais - documentar como aceitos.

---

## PRIORIDADE MEDIA - Performance

### 6. Leaderboard carrega TODOS os completions e redemptions

Em `useLeaderboard.ts`, `fetchLeaderboardData()` busca **todas** as completions e redemptions do sistema inteiro sem filtro de `unit_id`. Em um sistema com milhares de registros, isso se torna lento.

**Correcao:** Filtrar por `unit_id` usando o `activeUnitId` para manter consistencia multi-tenant e reduzir volume de dados.

**Arquivo:** `src/hooks/useLeaderboard.ts`

### 7. Profile duplica dados do Leaderboard

Em `useProfile.ts`, a funcao `fetchProfileData` busca novamente TODOS os `checklist_completions` (campo `allCompletions`) apenas para calcular o rank do usuario. Esses dados ja existem no cache do `useLeaderboard`.

**Correcao:** Receber o `leaderboard` como parametro ou consultar o cache do React Query diretamente em vez de refazer a query.

**Arquivo:** `src/hooks/useProfile.ts`

### 8. Employee Payments sem filtro de `unit_id` na query

Em `useEmployees.ts` (linhas 119-142), `useEmployeePayments` nao aplica filtro de `unit_id`, potencialmente mostrando pagamentos de todas as unidades.

**Correcao:** Adicionar `.eq('unit_id', activeUnitId)` na query de pagamentos quando `activeUnitId` estiver disponivel.

**Arquivo:** `src/hooks/useEmployees.ts`

---

## PRIORIDADE MEDIA - UX/UI

### 9. Rewards e Recipes sem filtro de `unit_id`

`useRewards.ts` busca `reward_products` e `reward_redemptions` sem filtrar por unidade. `useRecipes.ts` busca receitas e categorias sem filtrar por unidade. Em um sistema multi-tenant, isso mistura dados de unidades diferentes.

**Correcao:** Adicionar filtro de `unit_id` em ambos os hooks, seguindo o padrao ja estabelecido em `useInventoryDB`, `useChecklists`, etc.

**Arquivos:** `src/hooks/useRewards.ts`, `src/hooks/useRecipes.ts`

### 10. Checklist completions sem filtro de `unit_id`

Em `useChecklists.ts` (linhas 44-50), `fetchCompletionsData` nao filtra por `unit_id`, podendo mostrar completions de outras unidades.

**Correcao:** Adicionar filtro `.eq('unit_id', activeUnitId)` na query de completions.

**Arquivo:** `src/hooks/useChecklists.ts`

---

## PRIORIDADE BAIXA - Qualidade de Codigo

### 11. Tipo `as any` excessivo em `useCashClosing`

O hook `useCashClosing.ts` usa `as any` em 8+ lugares para acessar a tabela `cash_closings`. Isso indica que a tabela pode nao estar refletida nos tipos gerados.

**Correcao:** Verificar se o tipo `cash_closings` existe em `types.ts`. Se nao existir, regenerar os tipos. Se existir, remover os casts desnecessarios.

### 12. Leaderboard sem query `enabled` guard

Em `useLeaderboard.ts`, o `useQuery` para leaderboard nao tem `enabled: !!user`, fazendo a query executar mesmo antes do login.

**Correcao:** Adicionar `enabled: !!user` (importando `useAuth`).

---

## Resumo de Arquivos Afetados

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/AppLayout.tsx` | Fix loop infinito Popover |
| `src/hooks/useChat.ts` | Eliminar N+1 em unread count |
| `src/hooks/useFinance.ts` | Mover `initializeDefaults` para useEffect |
| `src/hooks/useLeaderboard.ts` | Filtro unit_id + enabled guard |
| `src/hooks/useProfile.ts` | Reutilizar cache do leaderboard |
| `src/hooks/useEmployees.ts` | Filtro unit_id em payments |
| `src/hooks/useRewards.ts` | Filtro unit_id |
| `src/hooks/useRecipes.ts` | Filtro unit_id |
| `src/hooks/useChecklists.ts` | Filtro unit_id em completions |
| `src/hooks/useCashClosing.ts` | Remover casts `as any` |
| Migration SQL | RLS para `push_config` |

---

## Garantias

- Nenhuma funcionalidade sera removida
- Nenhum dado sera perdido
- Todas as integrações permanecem intactas
- O design visual nao sera alterado
- A estrutura de tabelas permanece a mesma
