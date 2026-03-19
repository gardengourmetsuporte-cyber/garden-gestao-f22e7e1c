

## Plano: Permitir unidade diferente na ficha técnica vs estoque

### Problema
O Gouda Empanado está cadastrado no estoque como "unidade" (cada pacote = 1 un), mas na ficha técnica o usuário precisa usar "kg" como unidade do ingrediente. Atualmente, o seletor de unidade só mostra unidades "compatíveis" (unidade → só unidade, kg → kg/g, litro → litro/ml), impedindo essa conversão.

### Solução
O banco de dados já possui os campos `recipe_unit_type`, `recipe_unit_price` e `stock_to_recipe_factor` na tabela `inventory_items`, porém eles não estão sendo utilizados. O plano é ativar essa infraestrutura existente.

### Alterações

**1. `src/hooks/useRecipes.ts`** — Adicionar `recipe_unit_type` e `recipe_unit_price` ao SELECT da query de inventory items (linhas 99-105).

**2. `src/components/recipes/RecipeSheet.tsx`** — Em `handleAddInventoryItem`, usar `recipe_unit_type` e `recipe_unit_price` quando disponíveis no item, em vez de sempre usar `unit_type`/`unit_price`.

**3. `src/components/recipes/IngredientRow.tsx`** — Remover a restrição de unidades compatíveis (`filteredUnitOptions`), permitindo que o usuário escolha qualquer unidade (un, kg, g, L, ml). O cálculo de custo já suporta conversões entre famílias de unidade via `calculateIngredientCost`.

**4. `src/types/recipe.ts`** — Atualizar `getCompatibleUnits` para retornar todas as unidades quando chamada, ou remover a restrição no IngredientRow. Opcionalmente, adicionar conversão entre "unidade" e "kg" quando o item tem `recipe_unit_type` configurado.

### Detalhes técnicos

- O campo `recipe_unit_type` indica qual unidade o item usa em receitas (ex: "kg" mesmo que no estoque seja "unidade")
- O campo `recipe_unit_price` indica o preço por essa unidade de receita (ex: R$ 77,99/kg)
- O `IngredientRow` passará a mostrar **todas as 5 unidades** no seletor, independente da unidade base do estoque
- O cálculo de custo continuará usando `calculateIngredientCost` que já faz conversão automática entre unidades da mesma família, e para famílias diferentes (un→kg), usará o `recipe_unit_price` como referência

