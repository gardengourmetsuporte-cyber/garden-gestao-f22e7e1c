

# Auditoria Completa dos Fluxos de Pedidos — Bugs Encontrados

Após análise detalhada de todos os fluxos (Tablet → PDV → KDS), identifiquei os seguintes problemas:

---

## Bug 1: PDV `sendOrder` não grava `comanda_number` quando source é `ficha`

**Onde**: `src/hooks/pos/usePOSCheckout.ts` linhas 162-171

Quando o PDV envia um pedido no modo Ficha, o `orderData` não inclui `comanda_number: fichaNumber`. O campo `fichaNumber` está disponível no state mas nunca é inserido no banco. O pedido entra sem comanda e aparece genérico no KDS.

**Fix**: Adicionar `comanda_number: saleSource === 'ficha' ? fichaNumber : null` ao `orderData`.

---

## Bug 2: `OrderDetailSheet` não mostra comanda no badge para fichas

**Onde**: `src/components/pdv/PendingOrdersSheet.tsx` linhas 159-167

Quando o pedido é do tipo `ficha` com `comanda_number`, o detalhe do pedido mostra apenas "Fichas/Comandas" genérico em vez de "Comanda X". Falta a verificação `sourceKey === 'ficha' && order.comanda_number`.

**Fix**: Adicionar condição para exibir `Comanda ${order.comanda_number}` no badge de info do detalhe.

---

## Bug 3: `mesa_levar` não é diferenciado no `OrderDetailSheet`

**Onde**: `src/components/pdv/PendingOrdersSheet.tsx` linhas 159-167

O badge "Para levar" aparece nos cards da lista (linha 563-564) mas **não** no sheet de detalhe do pedido. Quando o operador abre o detalhe, perde essa informação.

**Fix**: Adicionar badge "Para levar" no `OrderDetailSheet` quando `order.source === 'mesa_levar'`.

---

## Bug 4: `renderOrderCard` (modo lista) não mostra comanda nem "Para levar"

**Onde**: `src/components/pdv/PendingOrdersSheet.tsx` linhas 419-452

O modo lista (`viewMode === 'list'`) não tem os mesmos indicadores que o modo blocks. Falta exibir `Comanda X` para fichas e "Para levar" para `mesa_levar`.

**Fix**: Adicionar mesma lógica do modo blocks no `renderOrderCard`.

---

## Bug 5: `auto_accept_tablet_order` trigger não reconhece `mesa_levar` nem `qrcode`

**Onde**: Trigger SQL `auto_accept_tablet_order`

O trigger só auto-confirma `mesa` e `balcao`:
```sql
IF NEW.source IN ('mesa', 'balcao') AND ...
```
Pedidos com `source = 'mesa_levar'` ou `source = 'qrcode'` ficam como `pending` em vez de auto-confirmar, exigindo confirmação manual desnecessária.

**Fix**: Migration para adicionar `'mesa_levar'` e `'qrcode'` à lista de sources auto-confirmados.

---

## Resumo de Correções

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `usePOSCheckout.ts` | Adicionar `comanda_number` ao `orderData` do `sendOrder` |
| 2-4 | `PendingOrdersSheet.tsx` | Exibir comanda e "Para levar" no detalhe e modo lista |
| 5 | Migration SQL | Atualizar trigger para incluir `mesa_levar` e `qrcode` |

5 bugs em 2 arquivos + 1 migration.

