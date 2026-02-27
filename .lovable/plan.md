

# Plano: Reestruturação — Cardápio Digital Centralizado + Unificação de Módulos

## Diagnóstico dos Problemas Atuais

1. **Duplicidade de dados**: `useTabletAdmin` e `useMenuAdmin` ambos fazem CRUD na mesma tabela `tablet_products` — dois hooks, dois UIs, dois fluxos para a mesma coisa
2. **Módulos fragmentados no menu**: "Cardápio", "Tablets" e "Gamificação" são 3 entradas separadas no MoreDrawer, quando deveriam ser sub-seções de um módulo unificado
3. **Layout do cardápio digital (`/m/:unitId`) genérico**: Não atinge qualidade premium — falta polish visual, micro-interações, tipografia refinada
4. **TabletAdmin gerencia produtos**: A aba "Produtos" dentro de Tablets é redundante com o Cardápio (`/cardapio`)

## Arquitetura Proposta

```text
Módulo "Cardápio Digital" (novo, unificado)
├── Tab: Produtos (= MenuAdmin atual — hierarquia Categorias > Grupos > Produtos > Opcionais)
├── Tab: Pedidos (= TabletAdmin.orders — pedidos em tempo real)
├── Tab: Mesas & QR (= TabletAdmin.tables + QR codes)
├── Tab: Conexão PDV (= TabletAdmin.config — Colibri)
├── Tab: Roleta (= Gamification admin — prêmios e métricas)
└── Tab: Configurações (= store_info, horários, delivery, branding)
```

A rota `/cardapio` vira o hub central. Rotas `/tablet-admin` e `/gamification` viram redirects para `/cardapio`.

## Etapas de Implementação

### 1. Criar página unificada `CardapioHub.tsx`
- Nova página com tabs: Produtos | Pedidos | Mesas | PDV | Roleta | Config
- Reutiliza componentes existentes: `MenuCategoryTree`, `MenuGroupContent`, `ProductSheet`, `OptionGroupList`, `OptionGroupSheet`, `LinkOptionsDialog`
- Move lógica de pedidos/mesas/PDV do `TabletAdmin` para dentro
- Move admin de gamificação do `Gamification.tsx` para dentro
- Nova tab "Configurações" para editar `store_info` (logo, banner, horários, endereço)

### 2. Eliminar duplicidade de hooks
- Remover aba "Produtos" do `TabletAdmin` — já não existirá como página standalone
- `useTabletAdmin` perde o CRUD de produtos (mantém apenas orders/tables/pdv)
- `useMenuAdmin` vira a fonte única de verdade para produtos

### 3. Unificar módulos no sistema de navegação
- Em `modules.ts`: remover `tablet-admin` e `gamification` como módulos separados
- Expandir `menu-admin` com children: `menu-admin.products`, `menu-admin.orders`, `menu-admin.tables`, `menu-admin.pdv`, `menu-admin.game`, `menu-admin.settings`
- Em `MoreDrawer.tsx`: remover "Tablets" e "Gamificação" do menu — ficam dentro de "Cardápio"

### 4. Redesign premium do cardápio digital (`/m/:unitId`)
- **MenuLanding**: Glassmorphism no banner, shimmer no logo, tipografia hierárquica (28px nome, 13px cuisine), rating placeholder, tempo de entrega com ícone animado
- **MenuProductList**: Cards com sombra suave, imagem 96x96 com rounded-2xl, preço com destaque verde, badge "Mais vendido" com gradiente amber, separador de grupo com linha decorativa
- **MenuProductDetail**: Sheet com spring animation (damping), imagem hero 240px, opcionais com cards individuais (não labels), preço dinâmico que anima ao mudar, botão CTA com gradiente e glow
- **MenuBottomNav**: Blur 40px, borda luminosa sutil, ícone ativo com scale bounce, badge do carrinho com pulse animation
- **MenuCart**: Cards com swipe-to-delete hint, animação de entrada staggered, tela de sucesso com confetti/check animado, cálculo de taxa de serviço opcional
- **MenuSearch**: Debounce 300ms, skeleton loading, highlight do termo buscado nos resultados

### 5. Atualizar rotas em `App.tsx`
- `/cardapio` → `CardapioHub` (protegida)
- `/tablet-admin` → redirect para `/cardapio`
- `/gamification` → redirect para `/cardapio`
- `/m/:unitId` → `DigitalMenu` (pública, mantém)
- Remover lazy imports de `TabletAdmin` e `Gamification` standalone

### 6. Receitas (Fichas Técnicas) — vincular ao cardápio
- Na tab "Produtos" do CardapioHub, mostrar link para ficha técnica do produto (se existir)
- Na página de Receitas, mostrar preço de venda vindo do `tablet_products`
- Ambos compartilham o mesmo produto base — sem duplicação

## Componentes Novos/Modificados

| Arquivo | Ação |
|---|---|
| `src/pages/CardapioHub.tsx` | Criar — página admin unificada |
| `src/pages/MenuAdmin.tsx` | Remover (substituído por CardapioHub) |
| `src/pages/TabletAdmin.tsx` | Remover (absorvido por CardapioHub) |
| `src/pages/Gamification.tsx` | Remover (absorvido por CardapioHub) |
| `src/lib/modules.ts` | Editar — unificar módulos |
| `src/components/layout/MoreDrawer.tsx` | Editar — remover entradas duplicadas |
| `src/App.tsx` | Editar — atualizar rotas |
| `src/components/digital-menu/*.tsx` | Editar — redesign premium completo |
| `src/pages/DigitalMenu.tsx` | Editar — polish visual |

