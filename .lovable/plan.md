

# Auditoria do Sistema — Bugs e Problemas Encontrados

Após análise detalhada do código, identifiquei os seguintes problemas reais que afetam o funcionamento em produção:

---

## Bug 1: Pedidos do tablet com comanda (source `qrcode`) não aparecem no grupo certo no PDV

**Onde**: `src/components/pdv/PendingOrdersSheet.tsx` (linhas 54-62)

A função `getSourceKey()` não reconhece `source: 'qrcode'`. Quando um pedido vem do tablet com comanda, o source é `'qrcode'`, mas o mapeamento não tem essa opção. O pedido cai no bucket genérico (exibido como "qrcode" sem ícone nem label configurados).

**Também**: `SOURCE_CONFIG` (linhas 46-52) não tem entrada para `'qrcode'` nem `'ficha'`.

**Fix**: Adicionar `if (s.includes('qrcode') || s.includes('ficha')) return 'ficha';` no `getSourceKey()` e `ficha: { icon: 'Receipt', label: 'Fichas/Comandas' }` no `SOURCE_CONFIG`.

---

## Bug 2: Ao cobrar pedido com source `qrcode`, o PDV não reconhece como source válido

**Onde**: `src/pages/PDV.tsx` (linha 130)

```typescript
const orderSource = (order.source as 'balcao' | 'mesa' | 'delivery' | 'ficha') || 'balcao';
```

O casting não inclui `'qrcode'` — quando o source é `'qrcode'`, ele é aceito mas o POS state fica com `'qrcode'` que não é um valor reconhecido pelo PDV (espera `'ficha'`). Isso pode causar comportamento inesperado no pagamento.

**Fix**: Mapear `'qrcode'` para `'ficha'` antes de setar.

---

## Bug 3: `comanda_number` não é carregado nos pedidos pendentes do PDV

**Onde**: `src/hooks/pos/usePOSOrders.ts` (linha 15)

O `select` não inclui `comanda_number`, e o tipo `PendingOrder` não tem esse campo. Então quando o operador do PDV vê um pedido, ele não sabe qual é a comanda — só vê "Mesa X". Para fichas/comandas isso é crítico.

**Fix**: Adicionar `comanda_number` ao select e ao tipo `PendingOrder`, e exibir no card do pedido.

---

## Bug 4: Pedidos com source `mesa_levar` não agrupam corretamente no PDV

**Onde**: `src/components/pdv/PendingOrdersSheet.tsx` (linha 58)

```typescript
if (s.includes('mesa') || s.includes('table')) return 'mesa';
```

`mesa_levar` contém `mesa`, então é agrupado como `mesa`. Isso está parcialmente OK, mas o label do card mostra "Mesa X" sem indicar que é "para levar". O operador não sabe que deve embalar.

**Fix**: Verificar `mesa_levar` antes de `mesa` e adicionar indicador visual "Para levar".

---

## Bug 5: Pedidos cancelados pelo PDV podem continuar aparecendo momentaneamente no CardapioOrdersView

**Onde**: `src/components/cardapio/CardapioOrdersView.tsx`

O painel de pedidos do cardápio (KDS) usa polling/realtime, mas o `cancelOrder` no PDV faz update otimista apenas no `pendingOrders` local. O KDS depende de realtime, que pode ter delay. Isso é um problema menor mas perceptível.

---

## Bug 6: `handleChargeOrder` não seta `fichaNumber` no POS state

**Onde**: `src/pages/PDV.tsx` (linhas 124-137)

Ao cobrar um pedido que veio como ficha/comanda, o `fichaNumber` não é setado — `pos.setFichaNumber()` não é chamado. Se o pedido tem `comanda_number`, ele deveria ser propagado.

**Fix**: Adicionar `pos.setFichaNumber(order.comanda_number || null)` (após adicionar `comanda_number` ao tipo).

---

## Resumo de Correções

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `PendingOrdersSheet.tsx` | Adicionar `qrcode`/`ficha` ao `getSourceKey` e `SOURCE_CONFIG` |
| 2 | `PDV.tsx` | Mapear `qrcode` → `ficha` no `handleChargeOrder` |
| 3 | `usePOSOrders.ts` + `types.ts` | Adicionar `comanda_number` ao select e tipo |
| 4 | `PendingOrdersSheet.tsx` | Diferenciar `mesa_levar` visualmente |
| 5 | Menor — sem ação imediata | |
| 6 | `PDV.tsx` | Setar `fichaNumber` ao cobrar pedido |

Todos os 5 bugs corrigíveis estão em 4 arquivos. Posso implementar tudo de uma vez.

