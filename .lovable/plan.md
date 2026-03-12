## Sistema de Comandas Físicas com QR Code ✅

### Implementado

Sistema de comandas físicas numeradas (1-100) com QR code para vincular pedidos e facilitar cobrança agrupada.

### Fluxo
1. Admin gera e imprime QR codes das comandas (Configurações → Comandas Físicas)
2. Cliente faz pedido no tablet → ao finalizar, escaneia a comanda física com a câmera
3. Pedido é vinculado ao `comanda_number` automaticamente
4. Na cobrança, todos os pedidos da mesma comanda são agrupados

### Arquivos criados/alterados
- **Migration**: coluna `comanda_number` (integer, nullable) + índice na `tablet_orders`
- `src/components/cardapio/ComandaQRGenerator.tsx` — gerador de QR codes para impressão
- `src/components/digital-menu/ComandaScanner.tsx` — scanner de câmera com fallback manual
- `src/components/digital-menu/TabletMenuCart.tsx` — botão "Escanear Comanda" no checkout
- `src/components/orders/UnifiedOrdersPanel.tsx` — exibe "Comanda #N" nos cards
- `src/components/cardapio/CardapioConfigHub.tsx` — seção "Comandas Físicas" no admin
- `src/pages/TabletBill.tsx` — suporte a `?comanda=N` para agrupar pedidos por comanda
