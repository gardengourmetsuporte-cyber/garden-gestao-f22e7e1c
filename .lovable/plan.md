

# Plano de Otimizacao de Performance

## Problema Identificado

O app esta lento porque o Dashboard carrega **8 hooks simultaneamente**, cada um fazendo queries independentes ao banco. Alem disso, o `useChatUnreadCount` faz **N+2 queries** (uma por conversa), e a maioria dos hooks usa `useState/useEffect` puro sem cache, refazendo todas as queries toda vez que voce navega entre paginas.

### Fluxo atual de carregamento:

```text
Auth (2 queries sequenciais)
  -> Unit (2 queries sequenciais)
    -> Dashboard monta e dispara simultaneamente:
       - useLeaderboard (2+ queries)
       - useInventoryDB (1 query pesada com joins)
       - useOrders (1 query pesada com joins)
       - useRewards (2 queries)
       - useUsers (2 queries)
       - useCashClosing (1 query)
       - useFinance (3 queries + init defaults)
       - useRecipes (2 queries)
    -> AppLayout dispara:
       - useNotifications (1 query + realtime)
       - useChatUnreadCount (N+2 queries!)
```

**Total: ~20+ queries ao banco so para abrir o Dashboard**

---

## Solucao Proposta

### 1. Migrar hooks do Dashboard para React Query (cache inteligente)

Converter os hooks principais (`useInventoryDB`, `useOrders`, `useRewards`, `useUsers`, `useCashClosing`, `useLeaderboard`) para usar `useQuery` do TanStack React Query (que ja esta instalado mas subutilizado). Isso adiciona:

- **Cache automatico**: dados ficam em memoria ao navegar entre paginas
- **staleTime**: evita refetch desnecessario por 2-5 minutos
- **Background refetch**: atualiza silenciosamente quando voce volta a pagina

### 2. Criar hook leve `useDashboardStats` 

Em vez de carregar TODOS os dados de cada modulo (todos os itens de estoque, todos os pedidos, etc), criar um hook dedicado que busca apenas as **contagens** necessarias para o Dashboard com queries otimizadas:

```text
- COUNT de itens com estoque critico
- COUNT de pedidos pendentes
- COUNT de resgates pendentes
- COUNT de fechamentos pendentes
- Stats financeiros do mes (ja existente)
```

### 3. Corrigir o N+1 do `useChatUnreadCount`

Substituir o loop que faz uma query por conversa por uma unica query agregada que conta todas as mensagens nao lidas de uma vez.

### 4. Adicionar skeleton loading ao Dashboard

Substituir o "Carregando..." generico por skeletons nos cards, dando feedback visual imediato enquanto os dados carregam.

### 5. Otimizar QueryClient

Configurar `staleTime` e `gcTime` globais no QueryClient para que dados recentes nao sejam rebuscados imediatamente.

---

## Detalhes Tecnicos

### Arquivos que serao modificados:

| Arquivo | Mudanca |
|---|---|
| `src/App.tsx` | Configurar QueryClient com staleTime global |
| `src/hooks/useChatUnreadCount.ts` | Reescrever para query unica |
| `src/hooks/useDashboardStats.ts` | **Novo** - hook leve para contagens |
| `src/hooks/useInventoryDB.ts` | Migrar para useQuery |
| `src/hooks/useOrders.ts` | Migrar para useQuery |
| `src/hooks/useRewards.ts` | Migrar para useQuery |
| `src/hooks/useUsers.ts` | Migrar para useQuery |
| `src/hooks/useCashClosing.ts` | Migrar para useQuery |
| `src/hooks/useLeaderboard.ts` | Migrar para useQuery |
| `src/components/dashboard/AdminDashboard.tsx` | Usar `useDashboardStats` + skeletons |

### Resultado esperado:

- **Primeira carga**: ~8 queries (em vez de 20+)
- **Navegacao entre paginas**: instantanea (dados em cache)
- **Retorno ao Dashboard**: sem recarregamento por 2 min
- **Chat unread**: 1 query em vez de N+2

