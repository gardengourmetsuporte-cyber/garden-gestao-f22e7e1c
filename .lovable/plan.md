

# Rateio Proporcional de Custos Fixos

## Problema Atual
O sistema divide os custos fixos igualmente: `R$ 6.974 / 1.500 produtos = R$ 4,65 por produto`. Uma água de R$5 e um lanche de R$45 recebem o mesmo valor de custo fixo — totalmente irreal.

## Solução: Rateio Proporcional por Preço de Venda

A forma mais justa e utilizada em food service é distribuir custos fixos **proporcionalmente ao preço de venda** do produto. Produtos mais caros absorvem mais custo fixo, pois geram mais receita.

**Fórmula:**
```text
Custo Fixo do Produto = (Preço do Produto / Receita Total Mensal) × Custo Fixo Mensal

Exemplo:
  Receita mensal estimada = R$ 50.000
  Custo fixo mensal = R$ 6.974

  Água (R$ 5):  (5 / 50.000) × 6.974 = R$ 0,70
  Lanche (R$ 45): (45 / 50.000) × 6.974 = R$ 6,28
```

## Mudanças Técnicas

### 1. Configurações (`RecipeCostSettings.tsx` + `useRecipeCostSettings.ts`)
- Substituir o campo "Média de produtos vendidos" por **"Receita mensal estimada"** (faturamento bruto mensal)
- O rateio passa a ser: `fixedCostPerProduct = (sellingPrice / monthlyRevenue) × monthlyFixedCost`
- Migração no banco: adicionar coluna `monthly_revenue` na tabela `recipe_cost_settings` e manter `monthly_products_sold` para retrocompatibilidade

### 2. Função `calculateOperationalCosts`
- Receber o **preço de venda** como parâmetro adicional (além do custo de ingredientes)
- Calcular o custo fixo proporcionalmente ao preço de venda
- Se o preço de venda não for informado, usar fallback do cálculo atual

### 3. Exibição no `RecipeSheet.tsx`
- Buscar o preço de venda do produto do cardápio vinculado à receita (`recipe_id` no `menu_products`)
- Passar o preço para `calculateOperationalCosts`
- Mostrar na seção "Custos Fixos" o valor proporcional

### 4. Chamadas em `Recipes.tsx` e `useRecipeMenuSync.ts`
- Atualizar para passar o preço de venda quando disponível

### 5. UI das Configurações
- Trocar input "Média de produtos vendidos" → "Faturamento mensal estimado (R$)"
- Atualizar tooltip e resumo para mostrar o cálculo proporcional
- Adicionar explicação: "O custo fixo de cada produto é calculado proporcionalmente ao seu preço de venda"

