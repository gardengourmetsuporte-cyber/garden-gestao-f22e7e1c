

## Plano: FAB como Toggle de Visão (Cardápio ↔ Ficha Técnica)

### Conceito
Transformar o FAB da aba "Produtos" de "Novo Produto" para um **botão de alternância de visão**. Quando pressionado, a mesma árvore de categorias/grupos mostra uma **camada de dados de ficha técnica** (custo, margem, preço sugerido) sobreposta aos cards de produto. Isso elimina a necessidade da aba "Receitas" separada e do módulo de fichas técnicas externo.

### Mudanças

**1. Estado de visão no CardapioHub (`src/pages/CardapioHub.tsx`)**
- Novo state `viewMode: 'menu' | 'ficha'` (default: `'menu'`)
- FAB alterna entre os modos em vez de abrir "Novo Produto"
  - Modo `menu`: FAB com ícone `ChefHat` e label "Ficha Técnica" → clica → muda para `ficha`
  - Modo `ficha`: FAB com ícone `Eye` e label "Ver Cardápio" → clica → volta para `menu`
- Remover a aba "Receitas" do tab bar (centralizar tudo em Produtos)
- Passar `viewMode` para `MenuGroupContent` e `MenuCategoryTree`

**2. Overlay de ficha técnica no ProductCard/MenuGroupContent**
- Quando `viewMode === 'ficha'`, o `ProductCard` exibe:
  - Custo total (ingredientes + operacional) em vez do preço de venda
  - Margem % real (calculada: `(preço - custo) / custo * 100`)
  - Badge colorido: verde (margem > 200%), amarelo (100-200%), vermelho (< 100%)
  - Preço sugerido baseado na margem padrão
  - Indicador de vínculo com receita (ícone link se `recipe_id` existir)
- Produtos sem `recipe_id` mostram badge "Sem ficha" com opção de vincular

**3. Header contextual no modo ficha**
- Barra no topo indicando "Modo Ficha Técnica" com:
  - Margem média geral do cardápio
  - Botão "Atualizar custos" (reutiliza `refreshCosts` do `useRecipeMenuSync`)
  - Botão "Definir margem em lote" (aplica margem % a todos os produtos vinculados)

**4. Ação de vincular receita a produto existente**
- No modo ficha, ao clicar num produto sem `recipe_id`, abrir um picker de receitas para vincular
- Ao vincular, preenche `recipe_id`, `cost_per_portion` e `profit_margin` no `tablet_products`

### Arquivos Modificados
1. **`src/pages/CardapioHub.tsx`** — state `viewMode`, FAB toggle, remover aba Receitas, header de modo ficha
2. **`src/components/menu/MenuGroupContent.tsx`** — receber `viewMode`, passar para ProductCard
3. **`src/components/menu/ProductCard.tsx`** — renderização condicional com dados de custo/margem
4. **`src/hooks/useRecipeMenuSync.ts`** — reutilizar `getFullCost`, `refreshCosts`, adicionar `batchUpdateMargin`
5. **Novo: `src/components/menu/FichaTecnicaHeader.tsx`** — barra contextual do modo ficha com stats e ações em lote

### Fluxo do Usuário
1. Abre Cardápio → vê a visão normal de produtos (preços de venda, fotos)
2. Toca no FAB (ícone ChefHat) → visão muda para Ficha Técnica (custos, margens, badges)
3. Pode ajustar margens individuais ou em lote
4. Toca no FAB novamente (ícone Eye) → volta para visão do cardápio
5. A aba "Receitas" some; tudo fica centralizado em "Produtos"

