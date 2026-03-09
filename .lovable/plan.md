## Plano: Central de Configurações do Cardápio ✅

### Implementado

A aba "Pedidos" no bottom nav do Cardápio foi transformada em **Central de Configurações** com seções colapsáveis (Accordion):

- **Solução Delivery**: Sobre, delivery & retirada, áreas e taxas, pagamento, horários
- **Solução Tablet**: Integração PDV, mesas & QR codes, chave Pix
- **QR Code Balcão**: Link externo (`/m/:unitId?source=qrcode`) para cliente escanear e pedir pelo celular
- **Gamificação**: Roleta de prêmios e probabilidades
- **Rodízio**: Preço fixo, regras e categorias

### Arquivos alterados
- `src/components/layout/BottomTabBar.tsx` — Tab renomeado de "Pedidos" (ShoppingBag) para "Config" (Settings)
- `src/components/cardapio/CardapioConfigHub.tsx` — **Novo** — Hub de configurações com Accordion
- `src/pages/CardapioHub.tsx` — Renderiza CardapioConfigHub quando `?tab=pedidos`
- `src/components/settings/CardapioSettings.tsx` — Prop `embedded` para uso inline sem hub/back button
