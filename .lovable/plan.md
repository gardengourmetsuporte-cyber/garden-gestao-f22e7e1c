

# Plano: Ficha Tecnica Robusta - Precos e Sub-Receitas

## Resumo do Problema

1. **Edicao de precos atual e ruim** - O popover e pequeno e escondido
2. **Nao permite receitas dentro de receitas** - Molhos e bases nao podem ser reutilizados
3. **Conversao de unidades limitada** - Precisa ser mais flexivel

---

## 1. Novo Sistema de Ingredientes

### Conceito: Ingrediente Unificado

O sistema passara a suportar dois tipos de ingredientes:
- **Item do Estoque** - Produtos do inventario (atual)
- **Sub-Receita** - Outra ficha tecnica (novo)

```text
Exemplo de uso:
┌────────────────────────────────────────────────┐
│ X-BURGUER ESPECIAL                             │
├────────────────────────────────────────────────┤
│ Ingredientes:                                  │
│                                                │
│ [ESTOQUE] Pao Tradicional                      │
│ 1 un × R$ 0,85 = R$ 0,85                       │
│                                                │
│ [ESTOQUE] Hamburguer 130g                      │
│ 1 un × R$ 3,66 = R$ 3,66                       │
│                                                │
│ [SUB-RECEITA] Molho Especial                   │
│ 50g × R$ 12,00/kg = R$ 0,60                    │
│                                                │
│ CUSTO TOTAL: R$ 5,11                           │
└────────────────────────────────────────────────┘
```

---

## 2. Estrutura do Banco de Dados

### Modificacao na Tabela `recipe_ingredients`

Adicionar campos para suportar sub-receitas:

```sql
ALTER TABLE recipe_ingredients
  ADD COLUMN source_type TEXT NOT NULL DEFAULT 'inventory',
  ADD COLUMN source_recipe_id UUID REFERENCES recipes(id) ON DELETE RESTRICT;

-- source_type: 'inventory' | 'recipe'
-- source_recipe_id: ID da sub-receita (quando source_type = 'recipe')
```

### Logica de Custo para Sub-Receitas

Quando uma sub-receita e usada:
- Usar o `cost_per_portion` como preco base
- A unidade base e o `yield_unit` da sub-receita
- Permitir conversoes (se yield_unit = kg, pode usar g)

---

## 3. Nova Interface de Ingredientes

### Novo Layout do IngredientRow

Substituir o popover por campos inline mais claros:

```text
┌─────────────────────────────────────────────────────────┐
│ [📦] Queijo Mucerala                              [✕]  │
│                                                         │
│ Preco base: R$ [46,00] / kg                             │
│                                                         │
│ Quantidade: [200] g        Custo: R$ 9,20               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ [🍲] Molho Especial (sub-receita)                 [✕]  │
│                                                         │
│ Custo porcao: R$ 12,00/kg (da ficha tecnica)            │
│                                                         │
│ Quantidade: [50] g         Custo: R$ 0,60               │
└─────────────────────────────────────────────────────────┘
```

### Novo IngredientPicker com Abas

```text
┌─────────────────────────────────────────────────┐
│ Adicionar Ingrediente                           │
├─────────────────────────────────────────────────┤
│ [📦 Estoque]  [🍲 Sub-Receitas]                 │
│─────────────────────────────────────────────────│
│ 🔍 Buscar...                                    │
│                                                 │
│ ABA ESTOQUE:                                    │
│ ▼ Carnes                                        │
│   Hamburguer 130g        R$ 3,66/un             │
│   Bacon                  R$ 45,00/kg            │
│                                                 │
│ ▼ Laticinios                                    │
│   Queijo Mucerala        R$ 46,00/kg            │
│                                                 │
│─────────────────────────────────────────────────│
│ ABA SUB-RECEITAS:                               │
│ ▼ Molhos                                        │
│   Molho Especial         R$ 12,00/kg            │
│   Maionese Caseira       R$ 8,50/kg             │
│                                                 │
│ ▼ Bases                                         │
│   Massa de Pizza         R$ 2,30/un             │
└─────────────────────────────────────────────────┘
```

---

## 4. Fluxo de Edicao de Preco Melhorado

### Preco Editavel Inline

O preco do ingrediente sera editavel diretamente na linha:

```text
Preco base: R$ [input editavel] / unidade

- Campo numerico com formato de moeda
- Atualizacao imediata do custo total
- Nao afeta o preco no estoque (apenas nesta ficha)
```

### Indicador Visual

Se o preco foi alterado em relacao ao estoque, mostrar indicador:

```text
┌─────────────────────────────────────────────────┐
│ [📦] Queijo Mucerala                            │
│                                                 │
│ Preco: R$ [48,00] / kg ⚠️ (estoque: R$ 46,00)  │
│                                                 │
│ Quantidade: [200] g     Custo: R$ 9,60          │
└─────────────────────────────────────────────────┘
```

---

## 5. Categorias Especiais para Sub-Receitas

Adicionar categoria "Bases e Preparos" automaticamente:

```sql
INSERT INTO recipe_categories (name, color, icon, sort_order)
VALUES ('Bases e Preparos', '#8b5cf6', 'Soup', 0);
```

Isso permite organizar:
- Molhos
- Massas base
- Preparos que serao reutilizados

---

## 6. Arquivos a Modificar

### Banco de Dados
- Migration para adicionar `source_type` e `source_recipe_id`

### Types
- `src/types/recipe.ts` - Adicionar campos de source

### Componentes
- `src/components/recipes/IngredientRow.tsx` - Novo layout com preco inline
- `src/components/recipes/IngredientPicker.tsx` - Adicionar abas (Estoque/Sub-Receitas)
- `src/components/recipes/RecipeSheet.tsx` - Suportar novo formato de ingrediente

### Hooks
- `src/hooks/useRecipes.ts` - Buscar sub-receitas disponiveis

---

## 7. Logica de Calculo Atualizada

### Para Itens do Estoque
```typescript
// Atual - sem mudancas
cost = convertUnit(quantity, recipeUnit, itemUnit) * itemPrice
```

### Para Sub-Receitas
```typescript
// Novo
// Se a sub-receita rende 1kg e custa R$12,00
// Usar 50g = 0.05kg × R$12,00 = R$0,60
cost = convertUnit(quantity, recipeUnit, subRecipe.yield_unit) * subRecipe.cost_per_portion
```

---

## 8. Restricoes de Seguranca

### Evitar Ciclos
Nao permitir que uma receita A use uma sub-receita B que usa A:

```typescript
function canAddSubRecipe(currentRecipeId: string, subRecipeId: string): boolean {
  // Verificar se subRecipe nao usa currentRecipe em nenhum nivel
  // Implementar verificacao recursiva
}
```

### Atualizacao de Custos em Cascata
Quando uma sub-receita tem seu custo alterado:
- Mostrar indicador nas receitas que a usam
- Botao "Atualizar Custos" para recalcular

---

## 9. Resultado Esperado

1. **Interface limpa** - Precos editaveis inline, sem popovers escondidos
2. **Sub-receitas** - Molhos e bases podem ser criados e reutilizados
3. **Calculo correto** - Conversao de unidades funciona para ambos os tipos
4. **Organizacao** - Categoria especial para preparos base
5. **Indicadores visuais** - Mostrar quando preco foi alterado ou esta desatualizado

---

## Ordem de Implementacao

1. Migration do banco (adicionar source_type e source_recipe_id)
2. Atualizar types em recipe.ts
3. Refatorar IngredientRow com layout inline
4. Adicionar abas ao IngredientPicker
5. Atualizar RecipeSheet para novo formato
6. Atualizar useRecipes para buscar sub-receitas
7. Implementar verificacao de ciclos
8. Testar fluxo completo

