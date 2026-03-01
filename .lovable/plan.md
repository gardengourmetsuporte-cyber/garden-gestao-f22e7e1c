

## Plano de Refatoração Estrutural

### Diagnóstico dos Problemas Encontrados

**1. `formatCurrency` duplicada 20+ vezes**
A mesma função `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)` está copiada em 20 arquivos diferentes, com variações inconsistentes (algumas usam `toLocaleString`, outras `notation: 'compact'`).

**2. Invalidação de cache gamification repetida**
O bloco `invalidateQueries(['points']) + invalidateQueries(['profile']) + invalidateQueries(['leaderboard'])` aparece 6 vezes em 3 arquivos (useChecklists, useTimeTracking, MedalSettings).

**3. `useFinanceCore.ts` monolítico (545 linhas)**
Mistura fetch helpers, mutations CRUD, undo/redo, computações derivadas e inicialização de defaults num único arquivo.

**4. `useChecklists.ts` monolítico (491 linhas)**
CRUD de sectors, subcategories, items, completions, reorder, contest e split — tudo num hook.

**5. `as any` excessivo (~553 ocorrências)**
Principalmente em hooks que operam tabelas não tipadas no schema auto-gerado. Não será possível eliminar todos (dependem do schema real), mas os mais flagrantes podem ser isolados.

**6. `src/types/database.ts` duplica tipos do Supabase**
Interfaces manuais que divergem do `types.ts` auto-gerado, forçando casting.

---

### Mudanças Planejadas

#### A. Criar `src/lib/format.ts` — utilitário centralizado
- Exportar `formatCurrency(value)`, `formatCurrencyCompact(value)`, `formatCurrencySimple(value)`
- Substituir todas as 20+ definições locais por imports desse arquivo
- **Nenhuma mudança funcional**

#### B. Criar `src/lib/queryKeys.ts` — constantes de query keys
- Centralizar keys como `QUERY_KEYS.points`, `QUERY_KEYS.profile`, `QUERY_KEYS.leaderboard`
- Criar helper `invalidateGamificationCaches(queryClient)` para eliminar o bloco repetido de 3 invalidações

#### C. Dividir `useFinanceCore.ts` em 3 arquivos
- `src/hooks/finance/useFinanceFetch.ts` — fetch helpers (fetchAccountsCore, fetchCategoriesCore, fetchTransactionsCore)
- `src/hooks/finance/useFinanceUndoRedo.ts` — lógica de undo/redo + mutations com undo
- `src/hooks/finance/useFinanceCore.ts` — hook principal que compõe os anteriores
- `src/hooks/finance/initializeDefaults.ts` — função `initializeDefaultsCore` isolada
- Re-exportar de `src/hooks/useFinanceCore.ts` para manter imports existentes

#### D. Dividir `useChecklists.ts` em módulos
- `src/hooks/checklists/useChecklistFetch.ts` — fetchSectorsData, fetchCompletionsData
- `src/hooks/checklists/useChecklistCRUD.ts` — CRUD de sectors/subcategories/items
- `src/hooks/checklists/useChecklistCompletions.ts` — toggleCompletion, splitCompletion, contestCompletion
- `src/hooks/checklists/useChecklists.ts` — hook composto
- Re-exportar de `src/hooks/useChecklists.ts`

#### E. Limpar `src/types/database.ts`
- Manter apenas tipos que **não existem** no schema auto-gerado (tipos compostos com joins, enums de domínio)
- Adicionar comentário indicando que tipos base vêm de `integrations/supabase/types.ts`

---

### O que NÃO será alterado
- Nenhuma funcionalidade
- Nenhum componente visual
- Nenhuma rota ou página
- Imports de componentes UI permanecem iguais
- O arquivo `integrations/supabase/types.ts` (auto-gerado)

### Ordem de execução
1. `src/lib/format.ts` + substituições
2. `src/lib/queryKeys.ts` + substituições
3. Split de `useFinanceCore`
4. Split de `useChecklists`
5. Limpeza de `database.ts`

### Estimativa
~30 arquivos tocados, todos com mudanças de import/extração — zero alteração de comportamento.

