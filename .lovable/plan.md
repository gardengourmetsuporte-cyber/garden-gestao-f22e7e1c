

# Cobrar pedido existente — Pular "Modo da Venda"

## Problema
Ao clicar em "Cobrar" num pedido existente, o sistema abre o `SaleSourceSheet` (Modo da Venda), pedindo para escolher Balcão/Mesa/Delivery/Ficha. Isso não faz sentido porque o pedido já tem um canal definido — só precisa ir direto para o pagamento.

## Correção

### `src/pages/PDV.tsx`

**`handleChargeOrder`** (linha 124-132): Em vez de abrir o SaleSourceSheet, ir direto para o pagamento:
- Carregar o pedido no carrinho (já faz)
- Setar o `saleSource` baseado no source do pedido existente
- Abrir `setPaymentOpen(true)` diretamente, sem passar pelo SaleSourceSheet

**Botão "Cobrar" no carrinho** (linha 436-440): Quando já tem um `activeOrderId` (pedido carregado), pular o SaleSourceSheet e ir direto para pagamento. Só abrir o SaleSourceSheet quando for venda nova (sem `activeOrderId`).

### Lógica:
```
Se activeOrderId existe → ir direto pro pagamento
Se não → abrir SaleSourceSheet normalmente
```

