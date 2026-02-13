

# Plano: Performance + Persistencia de Tela ao Minimizar

## O que esta acontecendo

Quando voce minimiza o app e volta, todos os componentes que usam `useState` + `useEffect` perdem seus dados e refazem todas as queries do zero. Isso acontece porque esses hooks nao tem cache -- os dados vivem apenas na memoria do componente, e quando o celular suspende/retoma o app, React pode re-montar os componentes, disparando tudo de novo.

Hooks que ja usam React Query (como `useDashboardStats`) NAO tem esse problema, porque os dados ficam em um cache global que sobrevive entre navegacoes e re-montagens.

## Solucao

Migrar os 7 hooks restantes para React Query. Com isso:
- Os dados ficam no cache global por 2 minutos
- Ao minimizar e voltar, a tela aparece instantaneamente com os dados do cache
- O refetch acontece silenciosamente em background, sem tela de loading
- Comportamento identico a apps profissionais

---

## Etapas de Implementacao

### 1. `useNotifications` -- Migrar para React Query + Realtime

Substituir `useState/useEffect` por `useQuery` para o fetch inicial. Manter o canal realtime, mas ao receber eventos, usar `queryClient.setQueryData` para atualizar o cache diretamente (sem re-fetch). As funcoes `markAsRead` e `markAllAsRead` atualizam o cache local de forma otimista.

### 2. `usePoints` -- Migrar para React Query

Substituir por `useQuery` simples. Os pontos mudam raramente, entao o cache de 2 minutos e perfeito.

### 3. `useChatUnreadCount` -- Migrar para React Query + Realtime

Substituir por `useQuery` para a contagem. O canal realtime invalida o cache (`queryClient.invalidateQueries`) ao receber novas mensagens, disparando um refetch silencioso em background.

### 4. `useLeaderboard` -- Migrar para React Query

Separar `leaderboard` e `sectorPoints` em duas queries `useQuery` independentes. Dados do leaderboard mudam pouco, cache de 2 minutos elimina todas as re-buscas ao navegar.

### 5. `useRewards` -- Migrar para React Query

Separar em 3 queries: `products`, `redemptions` e `allRedemptions` (admin). Mutations (`createProduct`, `redeemProduct`, etc) usam `useMutation` com invalidacao automatica do cache.

### 6. `useInventoryDB` -- Migrar para React Query

Separar `items` e `movements` em 2 queries `useQuery`. Mutations (`addItem`, `registerMovement`, etc) invalidam o cache apos sucesso. Funcoes derivadas (`getLowStockItems`, etc) usam `useMemo` sobre os dados do cache.

### 7. `useOrders` -- Migrar para React Query

`orders` vira `useQuery`. Mutations (`createOrder`, `updateOrderStatus`, etc) invalidam o cache apos sucesso.

---

## Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/hooks/useNotifications.ts` | useQuery + realtime com setQueryData |
| `src/hooks/usePoints.ts` | useQuery |
| `src/hooks/useChatUnreadCount.ts` | useQuery + realtime com invalidation |
| `src/hooks/useLeaderboard.ts` | 2x useQuery |
| `src/hooks/useRewards.ts` | 3x useQuery + useMutation |
| `src/hooks/useInventoryDB.ts` | 2x useQuery + useMutation |
| `src/hooks/useOrders.ts` | useQuery + useMutation |

## O que NAO muda

- Nenhuma alteracao visual
- Nenhuma mudanca no banco de dados
- A interface das funcoes exportadas dos hooks permanece compativel
- Componentes que consomem esses hooks continuam funcionando sem alteracao

## Resultado esperado

| Cenario | Antes | Depois |
|---|---|---|
| Minimizar e voltar ao app | Tela de loading + re-fetch total | Tela aparece instantanea do cache |
| Navegar Dashboard -> Estoque -> Dashboard | ~20+ queries | 0 queries (dados em cache) |
| Sidebar (pontos + notificacoes + chat) | Re-fetch a cada pagina | Cache por 2 min |

