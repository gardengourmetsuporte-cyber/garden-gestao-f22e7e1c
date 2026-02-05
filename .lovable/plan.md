
# Plano: Modulo Ficha Tecnica (Recipe Technical Sheets)

## Visao Geral

Criar um modulo completo de Ficha Tecnica integrado ao sistema existente, permitindo que gestores criem receitas padronizadas utilizando ingredientes do estoque, com calculo automatico de custos.

---

## 1. Estrutura do Banco de Dados

### Novas Tabelas

```text
┌─────────────────────────────────────────────────────────────────┐
│                     recipe_categories                            │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ name (text)           - Ex: "Lanches", "Bebidas", "Acomp."      │
│ color (text)          - Cor para identificacao visual           │
│ icon (text)           - Icone Lucide                            │
│ sort_order (int)      - Ordenacao                               │
│ created_at, updated_at (timestamps)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         recipes                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ name (text)           - Nome da receita                         │
│ category_id (uuid, FK)- Categoria da receita                    │
│ yield_quantity (numeric) - Rendimento (qtd porções)             │
│ yield_unit (text)     - Unidade do rendimento                   │
│ preparation_notes (text) - Observações/modo de preparo          │
│ is_active (boolean)   - Status ativo/inativo                    │
│ total_cost (numeric)  - Custo total calculado (cache)           │
│ cost_per_portion (numeric) - Custo por porção (cache)           │
│ cost_updated_at (timestamp) - Última atualização de custo       │
│ created_at, updated_at (timestamps)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     recipe_ingredients                           │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ recipe_id (uuid, FK)  - Referência à receita                    │
│ item_id (uuid, FK)    - Referência ao item do estoque           │
│ quantity (numeric)    - Quantidade usada                        │
│ unit_type (enum)      - Unidade (kg, g, un, L, ml)              │
│ unit_cost (numeric)   - Custo unitário no momento (cache)       │
│ total_cost (numeric)  - Custo total do ingrediente (cache)      │
│ sort_order (int)      - Ordenação na lista                      │
│ created_at (timestamp)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Novo Enum para Unidades Expandidas

```sql
-- Criar enum com mais opções de unidade para conversões
CREATE TYPE recipe_unit_type AS ENUM (
  'unidade', 'kg', 'g', 'litro', 'ml'
);
```

### Políticas RLS

```text
Recipes/Recipe Categories:
- SELECT: Admins apenas (has_role('admin'))
- INSERT/UPDATE/DELETE: Admins apenas

Recipe Ingredients:
- SELECT: Admins apenas
- INSERT/UPDATE/DELETE: Admins apenas
```

---

## 2. Conversao de Unidades

O sistema precisa converter automaticamente entre unidades para calcular custos corretamente.

```text
Fator de Conversao Base:
┌────────────┬────────────┬────────────┐
│   De       │    Para    │   Fator    │
├────────────┼────────────┼────────────┤
│ kg         │ g          │ 1000       │
│ g          │ kg         │ 0.001      │
│ litro      │ ml         │ 1000       │
│ ml         │ litro      │ 0.001      │
│ unidade    │ unidade    │ 1          │
└────────────┴────────────┴────────────┘

Exemplo de Calculo:
- Item do estoque: Queijo (kg) - Preço: R$ 40,00/kg
- Receita usa: 200g de queijo
- Conversao: 200g = 0.2kg
- Custo: 0.2 × R$ 40,00 = R$ 8,00
```

**Nota importante:** O sistema de estoque atual nao tem campo de preco. Sera necessario adicionar coluna `unit_price` na tabela `inventory_items`.

---

## 3. Estrutura de Arquivos

```text
src/
├── pages/
│   └── Recipes.tsx              # Página principal do módulo
├── components/
│   └── recipes/
│       ├── RecipeList.tsx       # Lista de fichas técnicas
│       ├── RecipeCard.tsx       # Card individual de receita
│       ├── RecipeSheet.tsx      # Sheet de criação/edição
│       ├── RecipeDetail.tsx     # Visualização detalhada
│       ├── IngredientPicker.tsx # Seletor de ingredientes do estoque
│       ├── IngredientRow.tsx    # Linha de ingrediente na receita
│       ├── CostSummary.tsx      # Resumo de custos
│       └── RecipeCategoryPicker.tsx # Seletor de categoria
├── hooks/
│   └── useRecipes.ts            # Hook principal do módulo
└── types/
    └── recipe.ts                # Types do módulo
```

---

## 4. Fluxo de Telas

### 4.1 Lista de Fichas Tecnicas (/recipes)

```text
┌──────────────────────────────────────┐
│ [←]  Fichas Técnicas            [+]  │
│─────────────────────────────────────│
│ 📊 Resumo                            │
│ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │ 12     │ │ R$156  │ │ 3      │    │
│ │Receitas│ │Custo Md│ │Inativas│    │
│ └────────┘ └────────┘ └────────┘    │
│─────────────────────────────────────│
│ [🔍 Buscar receitas...]              │
│─────────────────────────────────────│
│ ▼ Lanches (5)                        │
│ ┌──────────────────────────────────┐│
│ │ 🍔 X-Burguer            [⋮]      ││
│ │ Custo: R$ 8,83 │ Porção: R$ 8,83 ││
│ │ ● Ativo                          ││
│ └──────────────────────────────────┘│
│ ┌──────────────────────────────────┐│
│ │ 🍔 X-Salada             [⋮]      ││
│ │ Custo: R$ 10,50│ Porção: R$ 10,50││
│ │ ● Ativo                          ││
│ └──────────────────────────────────┘│
│─────────────────────────────────────│
│ ▼ Bebidas (3)                        │
│ ...                                  │
└──────────────────────────────────────┘
```

### 4.2 Criacao/Edicao de Receita (Sheet)

```text
┌──────────────────────────────────────┐
│ [✕]     Nova Ficha Técnica   [Salvar]│
│─────────────────────────────────────│
│ Nome da Receita                      │
│ ┌──────────────────────────────────┐│
│ │ X-Burguer Tradicional            ││
│ └──────────────────────────────────┘│
│                                      │
│ Categoria                            │
│ ┌──────────────────────────────────┐│
│ │ Lanches                      [▼] ││
│ └──────────────────────────────────┘│
│                                      │
│ Rendimento                           │
│ ┌────────────┐  ┌──────────────────┐│
│ │ 1          │  │ Unidades     [▼] ││
│ └────────────┘  └──────────────────┘│
│─────────────────────────────────────│
│ INGREDIENTES                    [+]  │
│ ┌──────────────────────────────────┐│
│ │ Pão Tradicional                  ││
│ │ 1 un          →        R$ 0,85   ││
│ │                            [✕]   ││
│ └──────────────────────────────────┘│
│ ┌──────────────────────────────────┐│
│ │ Hambúrguer 130g                  ││
│ │ 1 un          →        R$ 3,66   ││
│ │                            [✕]   ││
│ └──────────────────────────────────┘│
│ ┌──────────────────────────────────┐│
│ │ Queijo Muçarela                  ││
│ │ 40 g          →        R$ 1,85   ││
│ │                            [✕]   ││
│ └──────────────────────────────────┘│
│─────────────────────────────────────│
│ ┌──────────────────────────────────┐│
│ │ CUSTO TOTAL          R$ 8,83     ││
│ │ CUSTO POR PORÇÃO     R$ 8,83     ││
│ └──────────────────────────────────┘│
│─────────────────────────────────────│
│ Observações (opcional)               │
│ ┌──────────────────────────────────┐│
│ │ Modo de preparo...               ││
│ └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

### 4.3 Seletor de Ingrediente (Sheet Secundário)

```text
┌──────────────────────────────────────┐
│ [←]   Adicionar Ingrediente          │
│─────────────────────────────────────│
│ [🔍 Buscar no estoque...]            │
│─────────────────────────────────────│
│ ▼ Carnes                             │
│   Hambúrguer 130g      R$ 3,66/un    │
│   Bacon Fatiado        R$ 45,00/kg   │
│   Calabresa           R$ 28,00/kg   │
│                                      │
│ ▼ Hortifruti                         │
│   Alface              R$ 2,50/un     │
│   Tomate              R$ 4,00/kg     │
│   Cebola              R$ 3,50/kg     │
│                                      │
│ ▼ Laticínios                         │
│   Queijo Muçarela     R$ 46,00/kg    │
│   Cheddar             R$ 52,00/kg    │
└──────────────────────────────────────┘
(Ao selecionar, abre input de quantidade)
```

---

## 5. Detalhes Tecnicos

### 5.1 Hook useRecipes

```typescript
// Funcionalidades principais:
- fetchRecipes(): Lista todas as receitas com ingredientes
- fetchRecipeCategories(): Lista categorias de receitas
- addRecipe(data): Cria nova receita
- updateRecipe(id, data): Atualiza receita existente
- deleteRecipe(id): Remove receita
- duplicateRecipe(id): Duplica receita existente
- toggleRecipeActive(id): Alterna status ativo/inativo
- addIngredient(recipeId, itemId, quantity, unit): Adiciona ingrediente
- updateIngredient(id, updates): Atualiza ingrediente
- removeIngredient(id): Remove ingrediente
- recalculateCosts(recipeId): Recalcula custos da receita
```

### 5.2 Calculo de Custos

O calculo sera feito em tempo real no frontend e salvo no banco como cache:

```typescript
function calculateIngredientCost(
  item: InventoryItem,      // Item do estoque
  quantity: number,          // Quantidade usada
  recipeUnit: RecipeUnitType // Unidade na receita
): number {
  // Obter preço unitário do item
  const itemPrice = item.unit_price ?? 0;
  const itemUnit = item.unit_type; // kg, litro, unidade
  
  // Converter unidades se necessário
  const convertedQty = convertUnit(quantity, recipeUnit, itemUnit);
  
  // Calcular custo
  return convertedQty * itemPrice;
}
```

### 5.3 Atualizacao de Precos

Opcoes para atualizar custos quando precos do estoque mudam:

1. **Sob demanda**: Botao "Atualizar custos" na ficha
2. **Ao abrir**: Recalcula quando usuario abre a ficha
3. **Indicador visual**: Mostra quando custo esta desatualizado

---

## 6. Migracao do Banco de Dados

```sql
-- 1. Adicionar preco unitario na tabela de estoque
ALTER TABLE inventory_items 
ADD COLUMN unit_price NUMERIC DEFAULT 0;

-- 2. Criar enum de unidades para receitas
CREATE TYPE recipe_unit_type AS ENUM ('unidade', 'kg', 'g', 'litro', 'ml');

-- 3. Criar tabela de categorias de receitas
CREATE TABLE recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT DEFAULT 'ChefHat',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Criar tabela de receitas
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES recipe_categories(id) ON DELETE SET NULL,
  yield_quantity NUMERIC NOT NULL DEFAULT 1,
  yield_unit TEXT NOT NULL DEFAULT 'unidade',
  preparation_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  cost_per_portion NUMERIC NOT NULL DEFAULT 0,
  cost_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Criar tabela de ingredientes da receita
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit_type recipe_unit_type NOT NULL,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Habilitar RLS
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- 7. Políticas - Apenas admins
CREATE POLICY "Admins can manage recipe_categories"
  ON recipe_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage recipes"
  ON recipes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage recipe_ingredients"
  ON recipe_ingredients FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 8. Inserir categorias padrão
INSERT INTO recipe_categories (name, color, icon, sort_order) VALUES
  ('Lanches', '#f97316', 'Sandwich', 1),
  ('Acompanhamentos', '#22c55e', 'Soup', 2),
  ('Bebidas', '#3b82f6', 'Coffee', 3),
  ('Sobremesas', '#ec4899', 'IceCream', 4);
```

---

## 7. Navegacao

### Adicionar ao Menu Lateral

```typescript
// Em AppLayout.tsx, adicionar item:
{
  icon: ChefHat,
  label: 'Fichas Técnicas',
  href: '/recipes',
  adminOnly: true  // Apenas gestores
}
```

### Nova Rota

```typescript
// Em App.tsx
<Route
  path="/recipes"
  element={
    <ProtectedRoute>
      <Recipes />
    </ProtectedRoute>
  }
/>
```

---

## 8. Ordenacao e Filtros

A lista de receitas podera ser ordenada por:

- Nome (A-Z / Z-A)
- Maior custo primeiro
- Menor custo primeiro
- Mais recentes
- Status (ativos primeiro / inativos primeiro)

---

## 9. Restricoes Implementadas

| Restricao | Implementacao |
|-----------|---------------|
| Apenas gestores | RLS + verificacao isAdmin no frontend |
| Ingredientes do estoque | Picker conectado a inventory_items |
| Sem baixa automatica | Nao implementado (escopo futuro) |
| Sem vinculo com vendas | Nao implementado (escopo futuro) |

---

## 10. Resultado Final

O modulo entregara:

1. **Lista organizada** de fichas tecnicas por categoria
2. **Criacao intuitiva** com seletor de ingredientes do estoque
3. **Calculo automatico** de custo total e por porcao
4. **Conversao de unidades** inteligente (kg/g, L/ml)
5. **Visualizacao clara** dos custos de cada ingrediente
6. **Ordenacao por custo** para identificar receitas mais caras
7. **Duplicacao de receitas** para criar variacoes rapidamente
8. **Status ativo/inativo** para controle do cardapio

---

## Ordem de Implementacao

1. Criar migracao do banco (novas tabelas + campo unit_price)
2. Criar types em `src/types/recipe.ts`
3. Criar hook `useRecipes.ts`
4. Criar componentes base (RecipeCard, IngredientRow)
5. Criar pagina principal `Recipes.tsx`
6. Criar sheet de criacao/edicao `RecipeSheet.tsx`
7. Criar seletor de ingredientes `IngredientPicker.tsx`
8. Adicionar rota e menu lateral
9. Implementar ordenacao e filtros
10. Testar fluxo completo
