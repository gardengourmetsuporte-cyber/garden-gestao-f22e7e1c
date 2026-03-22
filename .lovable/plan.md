

# Tablet orders devem entrar como Ficha quando têm comanda

## Problema
No `TabletMenuCart.tsx` linha 230, o source é sempre `'mesa'` ou `'mesa_levar'`, ignorando se o pedido tem `comanda_number`. Isso faz os pedidos do tablet aparecerem como "Mesa" no PDV e no painel de pedidos, em vez de "Ficha/Comanda".

Além disso, no `CardapioOrdersView.tsx` linha 98, `source === 'qrcode'` está mapeado para o canal `'balcao'` em vez de `'comanda'`.

## Correções

### 1. `src/components/digital-menu/TabletMenuCart.tsx` (linha 230)
Mudar a lógica de source para considerar a comanda:
```
source: comanda ? 'qrcode' : (orderType === 'takeout' ? 'mesa_levar' : 'mesa')
```
Quando o pedido tem número de comanda, o source é `'qrcode'` (que é o source já usado pelo QR Code balcão e reconhecido no sistema todo). Sem comanda, mantém o comportamento atual.

### 2. `src/components/cardapio/CardapioOrdersView.tsx` (linha 98)
Mover `'qrcode'` do canal `'balcao'` para o canal `'comanda'`:
```
if (order.source === 'balcao') return 'balcao';
if (order.source === 'qrcode') return 'comanda';
```

Isso garante que pedidos com comanda apareçam na aba correta do painel de pedidos.

### Arquivos
1. **`src/components/digital-menu/TabletMenuCart.tsx`** — source condicional baseado em comanda
2. **`src/components/cardapio/CardapioOrdersView.tsx`** — qrcode vai para canal comanda

