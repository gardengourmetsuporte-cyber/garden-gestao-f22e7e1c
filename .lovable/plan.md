

# Plano: Cardápio Digital Unificado via QR Code

## Visão Geral

Criar uma experiência pública unificada acessada por QR Code (`/m/:unitId`) que combina:
1. **Landing do estabelecimento** (estilo Goomer) com logo, nome, status aberto/fechado
2. **Cardápio digital** com categorias, produtos, opcionais e carrinho
3. **Acesso à roleta de gamificação** integrada
4. **Login rápido opcional** para finalizar pedidos e jogar

A rota atual `/tablet/:unitId` continua funcionando para tablets fixos nas mesas. A nova rota `/m/:unitId` é a experiência mobile-first via QR Code para o celular do cliente.

## Estrutura de Rotas

```text
/m/:unitId              → Landing + Cardápio + Gamificação (nova)
/m/:unitId?mesa=5       → Mesmo, mas com mesa pré-selecionada
/tablet/:unitId         → Fluxo tablet existente (mantido)
/gamification/:unitId   → Roleta standalone (mantido)
```

## Etapa 1: Página Landing do Estabelecimento (`/m/:unitId`)

Nova página `src/pages/DigitalMenu.tsx` com:
- Header com logo da unidade, nome, cidade, tipo de cozinha
- Badge de status (Aberta/Fechada) baseado nos horários configurados
- Bottom navigation: Cardápio | Busca | Pedido | Roleta
- Layout mobile-first inspirado no Goomer (screenshots de referência)
- Sem autenticação necessária para navegar o cardápio

## Etapa 2: Cardápio Digital Completo

Dentro do `DigitalMenu.tsx`:
- Selector de categorias (dropdown ou chips horizontais)
- Lista de produtos por grupo com: imagem, nome, descrição truncada, preço
- Sheet de detalhe do produto ao clicar: imagem grande, descrição completa, grupos de opcionais com checkboxes, botão "Adicionar ao pedido"
- Carrinho flutuante (bottom bar) com contagem e total
- Busca por nome de produto

Dados vindos das tabelas existentes: `menu_categories`, `menu_groups`, `tablet_products`, `menu_option_groups`, `menu_options`, `menu_product_option_groups`

## Etapa 3: Integração da Gamificação

- Tab "Roleta" na bottom navigation
- Reutiliza os componentes `SlotMachine` e `PrizeResult` existentes
- Exige número do pedido para jogar (mesmo fluxo atual)
- Não requer login para jogar

## Etapa 4: Finalização de Pedido

- Ao clicar "Finalizar Pedido" no carrinho:
  - Se não tem mesa definida → pedir número da mesa ou selecionar "Retirada"
  - Cria o pedido via mesma lógica do `useTabletOrder`
  - Mostra tela de confirmação com QR code

## Etapa 5: Geração de QR Code no Admin

- Na aba "Mesas" do TabletAdmin, adicionar botão "QR Code do Cardápio Digital"
- Gera QR com URL `/m/:unitId?mesa=N` para cada mesa
- QR genérico sem mesa para delivery/balcão

## Componentes Novos

| Arquivo | Descrição |
|---|---|
| `src/pages/DigitalMenu.tsx` | Página principal unificada |
| `src/components/digital-menu/MenuLanding.tsx` | Header com info do estabelecimento |
| `src/components/digital-menu/MenuProductList.tsx` | Lista de produtos por categoria |
| `src/components/digital-menu/MenuProductDetail.tsx` | Sheet de detalhe com opcionais |
| `src/components/digital-menu/MenuCart.tsx` | Carrinho e finalização |
| `src/components/digital-menu/MenuBottomNav.tsx` | Navegação inferior (Cardápio/Busca/Pedido/Roleta) |
| `src/components/digital-menu/MenuSearch.tsx` | Busca de produtos |
| `src/hooks/useDigitalMenu.ts` | Hook para buscar cardápio público (sem auth) |

## Banco de Dados

- Adicionar coluna `store_info` (jsonb) na tabela `units` para armazenar: logo_url, tipo de cozinha, cidade, horários de funcionamento
- Ou reutilizar dados existentes se já houver campos equivalentes
- Criar RLS policy para leitura pública das tabelas necessárias: `tablet_products`, `menu_categories`, `menu_groups`, `menu_option_groups`, `menu_options`, `menu_product_option_groups`, `units` (campos públicos), `gamification_prizes`, `gamification_settings`

## Detalhes Técnicos

- Todas as rotas `/m/*` são públicas (sem ProtectedRoute)
- O hook `useDigitalMenu` usa o Supabase client com `anon key` — precisa de RLS policies de SELECT público
- Carrinho armazenado em state local (sem persistência)
- Design mobile-first, dark mode suportado, estética tier-1

