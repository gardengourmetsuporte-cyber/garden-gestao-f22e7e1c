
# Plano: Correcao de Sub-receitas e Interface de Gerenciamento

## Problemas Identificados

### 1. Erro de Query no Supabase (PGRST201)
A query de busca de receitas esta retornando **erro 300** porque agora existem duas foreign keys de `recipe_ingredients` para `recipes`:
- `recipe_id` (ingrediente pertence a qual receita)
- `source_recipe_id` (ingrediente vem de qual sub-receita)

O Supabase nao sabe qual relacao usar e exige um hint explicito.

**Correcao:** Atualizar a query no hook `useRecipes.ts` para especificar qual FK usar:
```sql
ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(...)
```

### 2. Interface para Gerenciar Sub-receitas
Adicionar sistema de abas/filtros na pagina de Fichas Tecnicas para organizar:
- **Produtos** (fichas tecnicas normais - lanches, pratos)
- **Bases e Preparos** (sub-receitas - molhos, massas, preparos)

---

## Solucao Tecnica

### Arquivo: `src/hooks/useRecipes.ts`
- Corrigir a query para usar hint explicito na FK: `recipe_ingredients!recipe_ingredients_recipe_id_fkey`
- Manter o join de `source_recipe` com sua FK explicita

### Arquivo: `src/pages/Recipes.tsx`
- Adicionar sistema de abas: "Produtos" | "Bases e Preparos"
- Filtrar receitas pela categoria (detectar se e "Bases e Preparos")
- Contador de itens em cada aba

### Arquivo: `src/components/recipes/RecipeSheet.tsx`
- Adicionar opcao para marcar receita como "Base/Preparo" (usando categoria)
- Pre-selecionar categoria correta quando criar a partir da aba

### Arquivo: `src/components/recipes/IngredientRow.tsx`
- Corrigir key duplicada (estava usando `item_id` que pode ser null para sub-receitas)

---

## Mudancas Detalhadas

### 1. useRecipes.ts - Query Corrigida

```typescript
// ANTES (erro 300):
ingredients:recipe_ingredients(
  *,
  item:inventory_items(...),
  source_recipe:recipes!recipe_ingredients_source_recipe_id_fkey(...)
)

// DEPOIS (com hint explicito):
ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(
  *,
  item:inventory_items(...),
  source_recipe:recipes!recipe_ingredients_source_recipe_id_fkey(...)
)
```

### 2. Recipes.tsx - Sistema de Abas

Layout proposto:

```text
┌──────────────────────────────────────┐
│ Fichas Técnicas                  [+] │
├──────────────────────────────────────┤
│ [📋 Produtos (8)] [🍲 Bases (3)]     │  <- Tabs
├──────────────────────────────────────┤
│ [🔍 Buscar...]                       │
│                                      │
│ ▼ Lanches (5)                        │
│   X-Burguer                          │
│   X-Salada                           │
│   ...                                │
└──────────────────────────────────────┘
```

Logica:
- "Produtos" = receitas que NAO sao categoria "Bases e Preparos"
- "Bases e Preparos" = receitas na categoria especifica
- Botao [+] na aba de Bases ja pre-seleciona a categoria

### 3. RecipeSheet.tsx - Ajustes

- Quando abrir sheet pela aba "Bases", pre-selecionar categoria "Bases e Preparos"
- Adicionar validacao para evitar duplicatas

### 4. IngredientRow.tsx - Key Unica

```typescript
// ANTES:
<IngredientRow key={ingredient.item_id} ... />

// DEPOIS:
<IngredientRow 
  key={ingredient.source_type === 'recipe' 
    ? `recipe-${ingredient.source_recipe_id}` 
    : `item-${ingredient.item_id}`} 
  ... 
/>
```

---

## Preco Hibrido (ja implementado)

O sistema ja suporta:
- Preco padrao vem do estoque
- Pode editar o preco inline na ficha
- Indicador visual quando preco difere do estoque

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useRecipes.ts` | Corrigir query com hint de FK |
| `src/pages/Recipes.tsx` | Adicionar abas Produtos/Bases |
| `src/components/recipes/RecipeSheet.tsx` | Prop para pre-selecionar categoria |

---

## Resultado Esperado

1. **Receitas salvam corretamente** - Query corrigida resolve erro 300
2. **Sub-receitas aparecem no picker** - Lista de receitas funciona
3. **Interface organizada** - Aba dedicada para "Bases e Preparos"
4. **Criar sub-receita facil** - Botao [+] na aba ja abre com categoria certa
5. **Preco hibrido funcionando** - Editar inline com indicador de diferenca
