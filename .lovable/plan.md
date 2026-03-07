

## Plano: Localização manual para entregas sem coordenadas

### Problema
Quando o geocoding falha (como no caso da Juliana Bonfante), a entrega fica sem pin no mapa e sem botão de navegação. O usuário quer poder definir a localização manualmente.

### Solução
Adicionar uma funcionalidade de "marcar no mapa" para entregas sem coordenadas (ou para corrigir coordenadas erradas).

### Mudanças

**1. DeliveryCard.tsx** -- Indicador visual + ação
- Quando `!hasCoords`, mostrar um badge/botão "Sem localização" com ícone de alerta
- Ao clicar nesse botão (ou no card quando sem coords), abrir um dialog/sheet para marcar manualmente

**2. Novo componente: `DeliveryLocationPicker.tsx`**
- Sheet/Dialog com um mapa Leaflet interativo
- Centralizado na cidade da unidade (âncora padrão)
- O usuário toca/clica no mapa para colocar um pin
- Botão "Confirmar localização" salva as coordenadas
- Inclui campo de busca de endereço opcional (pesquisa Nominatim inline)

**3. useDeliveries.ts** -- Nova mutation `updateAddress`
- Mutation para atualizar `lat` e `lng` na tabela `delivery_addresses`
- `supabase.from('delivery_addresses').update({ lat, lng }).eq('id', addressId)`
- Invalida o cache após sucesso

**4. DeliveryCard.tsx** -- Passar callback `onSetLocation`
- Nova prop `onSetLocation?: (delivery: Delivery) => void`
- Exibida como botão quando `!hasCoords`

**5. Deliveries.tsx** -- Orquestração
- State para controlar qual entrega está sendo editada
- Renderizar `DeliveryLocationPicker` com a entrega selecionada
- Passar `onSetLocation` para `DeliveryCard` via `NeighborhoodGroup`

### Fluxo do usuário
1. Vê o card com indicador "Sem localização" (ícone amarelo de alerta)
2. Clica no botão/card
3. Abre sheet com mapa interativo centralizado em São João da Boa Vista
4. Toca no mapa para posicionar o pin
5. Confirma -> salva lat/lng -> pin aparece no mapa principal

### Detalhes técnicos
- Reutilizar a mesma lógica de carregamento do Leaflet já existente em `DeliveryMap.tsx`
- O mapa do picker será uma instância separada, mais simples, sem markers de outras entregas
- A âncora da cidade será obtida via Nominatim (mesma lógica existente) ou usando coords da unidade se disponíveis

