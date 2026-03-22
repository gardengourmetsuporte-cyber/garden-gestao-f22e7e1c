

# Substituir opção de pagamento por "Comer aqui / Levar"

## O que muda

Remover a seção "Quando pagar?" (linhas 487-539 do `TabletMenuCart.tsx`) e substituir por uma seleção "Comer aqui ou levar?", que já existe como state (`orderType`) mas não tem UI visível no checkout.

O pagamento será sempre "pagar depois" (hardcoded `paymentTiming = 'later'`).

## Correções

### `src/components/digital-menu/TabletMenuCart.tsx`

1. **Remover** a seção "Quando pagar?" (linhas 487-539) inteira
2. **Forçar** `paymentTiming` para sempre ser `'later'` (remover o state ou setar fixo)
3. **Adicionar** no lugar a seção "Comer aqui ou levar?" com dois botões:
   - **Comer aqui** — ícone `UtensilsCrossed`, seta `orderType = 'dine-in'`
   - **Para levar** — ícone `ShoppingBag`, seta `orderType = 'takeout'`
   - Mesmo visual dos botões atuais de pagamento (radio-style cards)
4. **Remover** referências ao `OnlinePaymentSheet` e lógica de PIX online que ficam dependentes de `paymentTiming === 'now'` (tornam-se dead code)

O `orderType` já é usado na linha 230 para definir o `source` como `'mesa_levar'` ou `'mesa'`, então a cozinha já consegue diferenciar.

### Arquivo
1. **`src/components/digital-menu/TabletMenuCart.tsx`** — substituir seção de pagamento por seleção de tipo de consumo

