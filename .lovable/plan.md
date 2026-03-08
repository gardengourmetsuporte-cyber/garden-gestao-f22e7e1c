

## Plano: Central Unificada de Pedidos (Comandas + Delivery + iFood)

### Visao Geral

Hoje o sistema tem **tres canais de pedidos isolados**:
1. **Tablet/Mesa** (`tablet_orders`) -- pedidos feitos via tablet nas mesas
2. **Cardapio Digital** (`tablet_orders` via `DigitalMenu`) -- pedidos do link publico
3. **Hub iFood** (`delivery_hub_orders`) -- pedidos externos (iFood, Rappi, etc.)

A visualizacao de pedidos esta fragmentada: `CardapioHub?tab=pedidos` mostra so pedidos do tablet, e `DeliveryHub` mostra so pedidos de plataformas externas. O objetivo e criar um **painel unico** com tres modos de visualizacao filtrada.

---

### Arquitetura Proposta

#### 1. Unificar a origem dos pedidos no banco de dados

Adicionar uma coluna `source` na tabela `tablet_orders` para diferenciar:
- `mesa` -- pedido feito no tablet da mesa (QR code + comanda)
- `delivery` -- pedido feito via cardapio digital publico (link compartilhavel)

A tabela `delivery_hub_orders` continua separada para pedidos do iFood/Rappi (pois tem estrutura diferente: plataforma, IDs externos, webhook).

#### 2. Cardapio Digital -- diferenciar Mesa vs Delivery

No `DigitalMenu.tsx` e `MenuCart.tsx`, adicionar logica:
- Se a URL tem `?mesa=X` -> e pedido de mesa (source = `mesa`)
- Se nao tem `?mesa` -> e pedido de delivery (source = `delivery`), pede nome + telefone + endereco

#### 3. Painel Unificado de Pedidos

Substituir a aba "Pedidos" no `CardapioHub` por um painel com **tres abas**:

```text
[Comandas (Mesa)]  [Delivery]  [iFood/Rappi]
```

- **Comandas**: Filtra `tablet_orders` onde `source = 'mesa'`. Mostra numero da comanda/mesa em destaque.
- **Delivery**: Filtra `tablet_orders` onde `source = 'delivery'`. Mostra nome do cliente e endereco.
- **iFood/Rappi**: Puxa de `delivery_hub_orders` com o hook existente `useDeliveryHub`.

#### 4. Fluxo do QR Code na Mesa

O fluxo atual ja funciona: tablet na mesa -> scan QR -> comanda. Melhorar:
- O campo `table_number` serve como numero da comanda
- Na tela de confirmacao (`TabletConfirm`), exibir QR code com numero da comanda

#### 5. Sobre o iFood -- como conectar

A Edge Function `delivery-hub-webhook` ja esta pronta para receber pedidos via webhook. Para conectar ao iFood:
- O restaurante configura o webhook no painel do iFood apontando para a URL da Edge Function
- Um secret (`DELIVERY_HUB_WEBHOOK_SECRET`) valida as chamadas
- A documentacao na pagina `/docs` sera atualizada com instrucoes passo-a-passo

---

### Mudancas Tecnicas

| O que | Onde | Descricao |
|-------|------|-----------|
| Migracao SQL | `tablet_orders` | Adicionar coluna `source TEXT DEFAULT 'mesa'` |
| Cardapio Digital | `MenuCart.tsx`, `DigitalMenu.tsx` | Se sem `?mesa`, pedir dados de entrega e salvar com `source='delivery'` |
| Painel unificado | `CardapioHub.tsx` (aba pedidos) | Tres sub-abas: Comandas, Delivery, iFood -- cada uma com seu filtro |
| Hook unificado | Novo `useUnifiedOrders.ts` | Agrega dados de `tablet_orders` + `delivery_hub_orders` com filtro por source |
| Instrucoes iFood | `Documentation.tsx` | Secao com URL do webhook e como configurar o secret |

---

### O que NAO muda

- Estrutura do `delivery_hub_orders` (iFood) permanece separada
- Edge Function `delivery-hub-webhook` permanece como esta
- Tablet de mesa (`TabletMenu.tsx`) continua funcionando normalmente
- QR code e fluxo de comanda permanecem

