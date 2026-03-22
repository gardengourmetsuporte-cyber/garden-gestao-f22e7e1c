

# Fix: Número da ficha não é salvo ao confirmar o modo de venda

## Problema
No `PDV.tsx` linha 577-584, quando o `SaleSourceSheet` confirma, os dados são aplicados ao estado do POS. Porém, o `fichaNumber` retornado pelo sheet **não é setado** — falta `pos.setFichaNumber(data.fichaNumber)`. Por isso, quando `sendOrder()` executa, `fichaNumber` continua `null` e o sistema exibe "Informe o número da ficha" mesmo que o usuário já tenha digitado.

## Correção

### `src/pages/PDV.tsx` (linha ~584)
Adicionar uma linha após `pos.setDeliveryAddress(data.deliveryAddress)`:
```typescript
pos.setFichaNumber(data.fichaNumber);
```

Uma linha. Isso é tudo.

