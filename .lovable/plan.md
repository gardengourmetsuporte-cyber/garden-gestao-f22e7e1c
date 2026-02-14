
# Refatoracao Completa: Nivel App Unicornio

## Diagnostico Atual

Apos analise detalhada de todos os hooks e paginas, identifiquei **5 problemas criticos** que comprometem a confiabilidade e a experiencia profissional do sistema:

### Problemas Encontrados

1. **Hooks sem cache (React Query)**: `useFinance`, `useChecklists`, `useCashClosing` e `useChat` usam `useState/useEffect` puro -- ao trocar de pagina e voltar, os dados sao recarregados do zero, causando telas de loading repetitivas e perda de fluidez.

2. **Queries N+1 no Fechamento de Caixa**: Para cada fechamento, o sistema faz uma query individual para buscar o perfil do usuario e outra para o validador. Com 30 fechamentos, sao 60+ queries extras.

3. **Queries N+1 no Chat**: Cada conversa dispara 3 queries paralelas (participantes, ultima mensagem, unread count). Com 15 conversas, sao 45+ queries.

4. **Queries N+1 nos Checklists**: O `fetchCompletions` faz uma query de perfil para CADA completion individual ao inves de buscar todos os perfis de uma vez.

5. **Import duplicado no useCashClosing**: O arquivo importa `supabase` duas vezes (como `supabase` e `sb`), um indicativo de codigo acumulado sem revisao.

---

## Plano de Refatoracao

### Fase 1: Migrar useFinance para React Query

O hook mais critico do sistema. Atualmente tem ~470 linhas com gerenciamento manual de estado.

**Mudancas:**
- Substituir `useState` + `useEffect` por `useQuery` para accounts, categories e transactions
- Substituir funcoes CRUD manuais por `useMutation` com invalidacao automatica de cache
- Manter a logica de `initializeDefaults` como funcao auxiliar chamada uma unica vez
- Manter a logica de `reorderTransactions` com optimistic update via `queryClient.setQueryData`
- Resultado: transicoes instantaneas entre abas do modulo financeiro

### Fase 2: Migrar useChecklists para React Query

**Mudancas:**
- `sectors` via `useQuery` com queryKey `['checklist-sectors', activeUnitId]`
- `completions` via `useQuery` parametrizado por `date` e `type`
- Eliminar o loop N+1 de profiles em `fetchCompletions` -- buscar todos os user_ids unicos e fazer uma unica query de profiles
- Todas as operacoes CRUD (addSector, addItem, toggleCompletion, etc.) via `useMutation`
- Manter as funcoes de reorder com optimistic update

### Fase 3: Migrar useCashClosing para React Query

**Mudancas:**
- Remover import duplicado (`sb`)
- `closings` via `useQuery` com queryKey `['cash-closings', activeUnitId]`
- Eliminar N+1 de profiles: buscar todos os `user_id` e `validated_by` unicos em uma unica query
- `createClosing`, `approveClosing`, `markDivergent` via `useMutation`
- Manter a logica complexa de `integrateWithFinancial` como funcao auxiliar dentro da mutation de aprovacao

### Fase 4: Migrar useChat para React Query

**Mudancas:**
- `conversations` via `useQuery` com queryKey `['chat-conversations', activeUnitId]`
- Otimizar fetchConversations: buscar todos os profiles de participantes em uma unica query ao inves de por conversa
- `messages` via `useQuery` parametrizado por `activeConversationId`
- `sendMessage` e `createConversation` via `useMutation`
- Manter subscricoes realtime como `useEffect` separado que invalida o cache

### Fase 5: Limpeza e Padronizacao Global

**Mudancas:**
- Remover `useInventory.ts` (localStorage) se nao esta sendo usado (o sistema ja usa `useInventoryDB.ts` com React Query)
- Padronizar tratamento de erros: todas as mutations devem ter `onError` com toast
- Garantir que todos os hooks usem `staleTime` consistente (2 min global ja configurado no QueryClient)

---

## Detalhes Tecnicos

### Padrao de Migracao (aplicado em cada hook)

```text
ANTES (useState/useEffect):
  useState -> fetch em useEffect -> setData manual -> refetch manual apos CRUD

DEPOIS (React Query):
  useQuery (cache automatico) -> useMutation (CRUD) -> invalidateQueries (refetch automatico)
```

### O que NAO muda

- Toda a logica de negocios permanece identica (calculos financeiros, integracao caixa-financeiro, permissoes, etc.)
- Nenhuma tabela ou RLS sera alterada
- Nenhum componente de UI sera modificado visualmente
- As interfaces/tipos exportados pelos hooks permanecem compativeis
- As paginas que consomem os hooks nao precisam de alteracao (mesmos retornos)

### Beneficios Esperados

- Navegacao entre modulos sem telas de loading (dados em cache)
- App volta instantaneamente ao minimizar e reabrir (cache persistido em memoria)
- Reducao de ~70% nas queries ao banco de dados (eliminacao de N+1)
- Codigo mais previsivel e testavel com padroes uniformes
