

## Plano: Custo Fixo Manual com Rateio Proporcional ao Preço de Venda

O método atual (proporcional) já é o correto. O problema é que o **valor do custo fixo mensal** está vindo errado porque depende das transações lançadas no financeiro (que podem estar incompletas). A solução é deixar o usuário informar o valor real manualmente.

### Como vai funcionar

```text
Configurações:
  ┌─────────────────────────────────────────┐
  │  Custo Fixo Mensal Total: R$ 25.000     │  ← usuário digita
  │  Faturamento Mensal:      R$ 80.000     │  ← usuário digita
  └─────────────────────────────────────────┘

Na ficha técnica (automático):
  Produto vendido a R$ 30,00
  Custo fixo = (30 / 80.000) × 25.000 = R$ 9,37
```

### Alterações

**1. Migração — nova coluna**
- Adicionar `monthly_fixed_cost_manual numeric default 0` na tabela `recipe_cost_settings`

**2. Hook `useRecipeCostSettings.ts`**
- Remover a query que busca transações do financeiro (`monthly-fixed-cost`)
- Remover a query de categorias de despesa (`finance-expense-categories`)
- Usar `monthly_fixed_cost_manual` diretamente no cálculo
- Fórmula: `(sellingPrice / monthlyRevenue) × monthlyFixedCostManual`

**3. Tela de configurações `RecipeCostSettings.tsx`**
- Substituir a seção de checkboxes de categorias por um único campo: **"Custo Fixo Mensal Total (R$)"**
- Manter o campo de faturamento mensal
- Preview: "Produto de R$ 30 → R$ X de custo fixo"
- Interface mais limpa e direta

### Arquivos
- `src/hooks/useRecipeCostSettings.ts`
- `src/components/settings/RecipeCostSettings.tsx`
- Migração SQL (1 coluna nova)

