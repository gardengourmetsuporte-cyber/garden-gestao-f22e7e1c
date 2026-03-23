

# Editar Rascunho de Pedido + Sugerir Itens com Estoque Baixo

## O que será feito

Ao clicar em "Editar" num pedido rascunho, abre um Sheet onde o usuário pode:
1. Editar quantidades dos itens já no pedido
2. Remover itens
3. Ver e adicionar outros itens do mesmo fornecedor que estão com estoque abaixo do mínimo
4. Salvar alterações

## Arquivos

### 1. `src/hooks/useOrders.ts`
- Adicionar `addOrderItems(orderId, items[])` — insere novos `order_items` no pedido existente
- Adicionar `removeOrderItem(orderItemId)` — deleta um `order_item`

### 2. Novo: `src/components/orders/EditDraftOrderSheet.tsx`
Sheet que recebe o pedido draft e a lista de `items` (inventário). Mostra:

- **Seção "Itens do Pedido"**: cada item com Input de quantidade editável + botão remover (X)
- **Seção "Adicionar Itens"** (abaixo): itens do mesmo fornecedor (`supplier_id === order.supplier_id`) com `current_stock <= min_stock` que **não estão** no pedido. Cada um com botão "+" para adicionar com quantidade sugerida (`min_stock - current_stock`)
- Botão "Salvar" que:
  - Atualiza quantidades alteradas via `updateOrderItem`
  - Remove itens deletados via `removeOrderItem`
  - Adiciona novos itens via `addOrderItems`

### 3. `src/pages/Orders.tsx`
- Adicionar state `editingOrder` e `editSheetOpen`
- No card de pedido draft (linha ~672, área de actions), adicionar botão "Editar" (ícone `Pencil`) antes do botão de deletar
- Renderizar o `EditDraftOrderSheet` com os dados necessários

## Detalhes técnicos

- `addOrderItems` faz insert em `order_items` com `order_id`, `item_id`, `quantity`, `unit_id`
- `removeOrderItem` faz delete em `order_items` por `id`
- O Sheet usa estado local para rastrear alterações (quantidades editadas, itens removidos, itens adicionados) e faz batch no save
- Itens sugeridos filtrados: `items.filter(i => i.supplier_id === order.supplier_id && i.current_stock <= i.min_stock && !orderItemIds.has(i.id))`

