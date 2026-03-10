

# Corrigir Erro de Relacionamento Ambíguo

## Problema
O PostgREST retorna o erro **"Could not embed because more than one relationship was found for 'recipes' and 'recipe_ingredients'"** porque a tabela `recipe_ingredients` tem **duas** foreign keys para `recipes`: `recipe_id` e `source_recipe_id`. Quando a query não especifica qual FK usar, o PostgREST não consegue decidir.

## Correções (2 arquivos)

### 1. `src/pages/KDS.tsx` — linha 200
Adicionar hint `!recipe_ingredients_recipe_id_fkey` na query do KDS:
```
recipes(recipe_ingredients!recipe_ingredients_recipe_id_fkey(...))
```

### 2. `src/hooks/useRecipes.ts` — linha 290
Na mutation de duplicar receita, trocar:
```
ingredients:recipe_ingredients(*)
```
por:
```
ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(*)
```

Ambas as correções são de uma linha cada. A lógica principal em `useRecipes` (linha 36) já usa o hint correto — apenas esses dois pontos estão faltando.

