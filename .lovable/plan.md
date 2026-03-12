

# Corrigir Ranking Mensal sem dados

## Problema
O ranking aparece vazio porque o hook `useLeaderboard` faz uma query separada na tabela `user_units` para buscar os `userIds` antes de buscar os perfis. Essa query respeita RLS e pode retornar vazio ou incompleto. Enquanto isso, a RPC `get_leaderboard_data` (SECURITY DEFINER) retorna os dados corretamente, mas o `buildEntries` descarta as entradas porque não encontra os perfis correspondentes no `profileMap`.

## Solução
Remover a query desnecessária a `user_units` no `fetchLeaderboardData` e em vez disso extrair os `userIds` diretamente do resultado da RPC. Isso garante que buscamos perfis apenas dos usuários retornados pela RPC.

### Arquivo: `src/hooks/useLeaderboard.ts`
- Remover as linhas 38-43 (query a `user_units`)
- Extrair `userIds` do resultado da RPC: `const userIds = (rpcData || []).map(r => r.user_id)`
- Buscar profiles com esses IDs

Mudança de ~6 linhas, sem impacto em outros componentes.

