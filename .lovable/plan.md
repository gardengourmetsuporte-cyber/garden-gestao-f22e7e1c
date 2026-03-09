## Plano: Rateio Proporcional de Custos Fixos ✅

### Implementado

O cálculo de custos fixos foi alterado de **divisão igualitária** para **rateio proporcional por preço de venda**.

**Fórmula anterior:** `Custo Fixo / Nº Produtos = valor igual para todos`  
**Fórmula nova:** `(Preço do Produto / Faturamento Mensal) × Custo Fixo Mensal`

Exemplo (custo fixo = R$ 6.974, faturamento = R$ 50.000):
- Água (R$ 5): R$ 0,70 de custo fixo
- Lanche (R$ 45): R$ 6,28 de custo fixo

### Arquivos alterados
- Migration: adicionada coluna `monthly_revenue` em `recipe_cost_settings`
- `src/hooks/useRecipeCostSettings.ts` — `calculateOperationalCosts` agora aceita `sellingPrice` opcional
- `src/components/settings/RecipeCostSettings.tsx` — campo "Faturamento mensal estimado" no lugar de "Média de produtos vendidos"
- `src/components/recipes/RecipeSheet.tsx` — passa preço de venda para cálculo proporcional
- `src/hooks/useRecipeMenuSync.ts` — usa preço do produto vinculado no cardápio
