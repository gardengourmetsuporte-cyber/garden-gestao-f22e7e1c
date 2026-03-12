

# Protocolo Completo de Testes — Garden Gestão

Dado o tamanho do sistema (55+ páginas, 100+ hooks, 124 tabelas), o protocolo será dividido em testes unitários para lógica pura e testes de integração para fluxos críticos.

---

## Escopo dos Testes

### Bloco 1 — Testes Unitários de Lógica Pura (libs/)

| Arquivo | O que testar |
|---------|-------------|
| `lib/plans.ts` | ✅ Já coberto (12 testes) |
| `lib/format.ts` | `formatCurrency`, `formatCurrencyCompact`, `formatCurrencySimple` — edge cases (0, negativos, milhões) |
| `lib/points.ts` | `clampPoints`, `calculateEarnedPoints`, `calculateSpentPoints`, `calculatePointsSummary`, `getPointsColors`, `formatPoints` |
| `lib/checklistTiming.ts` | `getDeadlineInfo`, `shouldAutoClose`, `getCurrentChecklistType`, `formatDeadlineSetting` — com diferentes horários/datas |
| `lib/modules.ts` | `getModuleKeyFromRoute`, `getSubModuleKeys`, `isSubModuleKey`, `getParentModuleKey` |
| `lib/exportExcel.ts` | `exportTransactionsExcel`, `exportCashClosingsExcel`, `exportInventoryExcel` — verificar que geram dados formatados (mock do XLSX.writeFile) |
| `lib/normalizePhone.ts` | Normalização de telefones BR |

### Bloco 2 — Testes de Hooks (lógica de carrinho/cart)

| Hook | O que testar |
|------|-------------|
| `hooks/pos/usePOSCart.ts` | `addToCart` (merge qty), `removeFromCart`, `clearCart`, `updateCartItem`, `loadOrderIntoCart`, cálculo de `subtotal`/`total` com desconto |

### Bloco 3 — Testes de Componentes Críticos

| Componente | O que testar |
|-----------|-------------|
| `EmptyState` | Renderiza ícone, título, descrição, action button |
| `PullToRefreshIndicator` | Renderiza spinner, mostra/esconde baseado em pullDistance |
| Skeletons (`widget-skeleton.tsx`) | Cada skeleton renderiza sem crash |

---

## Arquivos de Teste a Criar

```text
src/lib/__tests__/format.test.ts
src/lib/__tests__/points.test.ts
src/lib/__tests__/checklistTiming.test.ts
src/lib/__tests__/modules.test.ts
src/lib/__tests__/exportExcel.test.ts
src/lib/__tests__/normalizePhone.test.ts
src/hooks/pos/__tests__/usePOSCart.test.ts
src/components/ui/__tests__/empty-state.test.tsx
src/components/ui/__tests__/widget-skeleton.test.tsx
```

---

## Detalhes dos Testes Principais

### format.test.ts (~8 testes)
- `formatCurrency(0)` → `"R$ 0,00"`
- `formatCurrency(1234.56)` → `"R$ 1.234,56"`
- Valores negativos, milhões, centavos

### points.test.ts (~15 testes)
- `clampPoints` com valores 0, 1, 2, 3, 4, 5, -1
- `calculateEarnedPoints` filtra `awarded_points: false`
- `calculateSpentPoints` filtra status != approved/delivered
- `calculatePointsSummary` retorna balance correto
- `getPointsColors` retorna CSS vars corretas
- `formatPoints(1000)` → `"1.000"`

### checklistTiming.test.ts (~12 testes)
- `getDeadlineInfo` com deadline no futuro → `passed: false`
- `getDeadlineInfo` com deadline passada → `passed: true`
- `shouldAutoClose` para abertura/fechamento/bonus
- `formatDeadlineSetting(null)` → `"Sem limite"`
- `getCurrentChecklistType` baseado em horário

### modules.test.ts (~10 testes)
- `getModuleKeyFromRoute('/finance')` → `'finance'`
- `getModuleKeyFromRoute('/unknown')` → `null`
- `getSubModuleKeys('finance')` retorna array correto
- `isSubModuleKey('finance.view')` → `true`
- `getParentModuleKey('finance.view')` → `'finance'`

### exportExcel.test.ts (~6 testes)
- Mock `XLSX.writeFile` e verificar que `json_to_sheet` recebe dados formatados
- Verificar colunas corretas para cada tipo de export
- Edge case: lista vazia

### usePOSCart.test.ts (~10 testes)
- Adicionar produto ao carrinho
- Merge de quantidades (mesmo produto)
- Remover item
- Aplicar desconto
- `clearCart` reseta tudo
- `loadOrderIntoCart` carrega pedido pendente
- `subtotal` e `total` calculados corretamente

---

## Total Estimado

~70 testes cobrindo toda a lógica pura do sistema. Cada arquivo roda independente, sem dependência de Supabase (tudo mockado ou puro).

## Execução

Todos os testes serão executados via `vitest` após criação para validar que passam.

