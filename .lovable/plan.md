

# Adicionar aba iFood na CardapioOrdersView

## Problema
A tela de pedidos do Cardápio mostra apenas pedidos internos (Mesa, Balcão, QR Code, Delivery) vindos do `useTabletAdmin`. Falta a aba **iFood** que já existe no `useUnifiedOrders` e `useDeliveryHub`.

## Solução

### 1. `CardapioHub.tsx` — Passar pedidos do iFood
- Importar `useDeliveryHub` e chamar com `activeUnit?.id`
- Passar `hubOrders` como nova prop para `CardapioOrdersView`

### 2. `CardapioOrdersView.tsx` — Adicionar canal iFood
- Adicionar `'ifood'` ao type `Channel`
- Adicionar entrada no array `CHANNELS`: `{ id: 'ifood', label: 'iFood', icon: 'ShoppingBag', ... }`
- Aceitar nova prop `hubOrders` (array de `HubOrder`)
- Normalizar `hubOrders` para o formato `OrderItem` e incluir no fluxo de filtragem/contagem
- Quando `channel === 'ifood'`, mostrar apenas os pedidos do hub
- Incluir pedidos do hub na aba "Todos"
- Mapear status do hub (`new`, `accepted`, `preparing`, etc.) para os status visuais existentes

### Impacto
- Nenhuma mudança no banco de dados
- Apenas 2 arquivos alterados: `CardapioHub.tsx` e `CardapioOrdersView.tsx`

