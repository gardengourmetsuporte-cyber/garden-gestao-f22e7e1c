

# Plano: QR Code Balcão — Link + Checkout com Aprovação Manual

## Resumo

Adicionar o link do QR Code Balcão na seção "Links & Acessos" e modificar o checkout do cardápio digital para detectar `?source=qrcode` e exibir um fluxo diferente: o cliente informa nome e número da mesa (sem endereço/taxa de entrega), e o pedido entra como `awaiting_confirmation` com source `qrcode`, exigindo aprovação manual na tela de pedidos.

## Mudanças

### 1. `src/components/cardapio/CardapioConfigHub.tsx`
- Adicionar item `qrcode` ao array `LINKS_DATA` com URL `${baseUrl}/m/${unitId}?source=qrcode`
- Aparecerá na lista de links com ícone `QrCode`, label "QR Code Balcão"

### 2. `src/components/digital-menu/MenuCart.tsx`
- Receber nova prop `source?: string` (passada pelo DigitalMenu via searchParams)
- Quando `source === 'qrcode'`:
  - Mostrar campos: **Nome** e **Número da mesa** (input numérico) — mesmo padrão do tablet
  - Ocultar campos de endereço, telefone, taxa de entrega
  - No `handleSend`: inserir na `tablet_orders` com `source: 'qrcode'`, `status: 'awaiting_confirmation'`, `table_number: mesa informada`
  - Tela de sucesso mostra "Aguardando aprovação" ao invés de "Confirmado automaticamente"
- Quando source é outro (padrão): manter fluxo de delivery atual

### 3. `src/pages/DigitalMenu.tsx`
- Ler `searchParams.get('source')` e passar como prop `source` ao `MenuCart`

### 4. `src/hooks/useUnifiedOrders.ts`
- Incluir pedidos com `source === 'qrcode'` no filtro de `comandas` (junto com `mesa`) para que apareçam na aba de pedidos do PDV
- Atualizar: `tabletOrders.filter(o => ['mesa', 'mesa_levar', 'qrcode'].includes(o.source || 'mesa'))`

### 5. `src/components/orders/UnifiedOrdersPanel.tsx` e `src/pages/KDS.tsx`
- Tratar source `qrcode` na exibição (label "QR Code", ícone `QrCode`)
- Pedidos qrcode com `awaiting_confirmation` exigem clique em "Aceitar" antes de ir pra cozinha

## Fluxo do Cliente (QR Code)

1. Escaneia QR Code no balcão → abre cardápio digital com `?source=qrcode`
2. Navega, adiciona itens ao carrinho
3. No checkout: informa **nome** e **número da mesa**
4. Pedido entra como `awaiting_confirmation` + `source: 'qrcode'`
5. Operador no PDV vê pedido pendente na aba Comandas → Aceita → vai pra cozinha

## Arquivos Modificados
1. `src/components/cardapio/CardapioConfigHub.tsx` — add link
2. `src/components/digital-menu/MenuCart.tsx` — checkout alternativo para qrcode
3. `src/pages/DigitalMenu.tsx` — passar source prop
4. `src/hooks/useUnifiedOrders.ts` — incluir qrcode nas comandas
5. `src/components/orders/UnifiedOrdersPanel.tsx` — label qrcode
6. `src/pages/KDS.tsx` — label qrcode

