
# Plano: Sincronizacao Automatica de Precos e Custos Operacionais

## Resumo

Este plano implementa duas funcionalidades principais:

1. **Sincronizacao automatica de precos** - Trigger no banco que atualiza todas as fichas tecnicas quando o preco muda no estoque
2. **Custos operacionais do financeiro** - Nova secao nas fichas mostrando custos fixos rateados, impostos, taxas e embalagens
3. **Tela de configuracao** - Nova aba em Configuracoes para definir media de produtos vendidos e taxas adicionais

---

## Parte 1: Migracao de Banco de Dados

### 1.1 Trigger de Sincronizacao de Precos

Criar funcao e trigger que dispara quando `unit_price`, `recipe_unit_price` ou `recipe_unit_type` mudam em `inventory_items`, atualizando automaticamente todas as fichas tecnicas que usam aquele item.

```text
┌──────────────────────────────────┐
│     inventory_items              │
│  recipe_unit_price alterado      │
└────────────────┬─────────────────┘
                 │ TRIGGER
                 ▼
┌──────────────────────────────────┐
│   recipe_ingredients             │
│  UPDATE unit_cost, total_cost    │
│  WHERE item_id = NEW.id          │
└────────────────┬─────────────────┘
                 │ CASCADE
                 ▼
┌──────────────────────────────────┐
│         recipes                  │
│  RECALCULA total_cost,           │
│  cost_per_portion                │
└──────────────────────────────────┘
```

### 1.2 Nova Tabela: recipe_cost_settings

Tabela para armazenar configuracoes de custos operacionais por usuario:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| user_id | uuid | Referencia ao usuario |
| monthly_products_sold | numeric | Media de produtos vendidos por mes |
| tax_percentage | numeric | % de impostos sobre venda |
| card_fee_percentage | numeric | % taxa de maquininha |
| packaging_cost_per_unit | numeric | Custo medio de embalagem por unidade |
| fixed_cost_category_ids | uuid[] | IDs das categorias do financeiro a incluir no rateio |

---

## Parte 2: Nova Aba de Configuracoes

### Arquivo: `src/components/settings/RecipeCostSettings.tsx`

Nova aba em Configuracoes chamada **"Custos"** com icone de calculadora:

```text
┌──────────────────────────────────────────────┐
│ Configuracoes de Custos das Fichas Tecnicas  │
├──────────────────────────────────────────────┤
│                                              │
│ Rateio de Custos Fixos                       │
│ ┌──────────────────────────────────────────┐ │
│ │ Media de produtos vendidos por mes       │ │
│ │ [_____1.500_____] produtos               │ │
│ │                                          │ │
│ │ Os custos fixos do financeiro serao      │ │
│ │ divididos por este numero                │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Taxas Adicionais                             │
│ ┌──────────────────────────────────────────┐ │
│ │ Impostos sobre venda         [ 10 ] %    │ │
│ │ Taxa de maquininha           [  3 ] %    │ │
│ │ Custo de embalagem/unidade   [0.50]      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Categorias de Custo Fixo (do Financeiro)     │
│ ┌──────────────────────────────────────────┐ │
│ │ [x] Despesas Administrativas             │ │
│ │ [x] Folha de Pagamento                   │ │
│ │ [x] Pro-labore                           │ │
│ │ [ ] Taxas Operacionais (ja nas taxas)    │ │
│ │ [ ] Impostos (ja em %)                   │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Custo Fixo Mensal: R$ 15.000,00             │
│ Custo por Produto: R$ 10,00                  │
│                                              │
│ [Salvar Configuracoes]                       │
└──────────────────────────────────────────────┘
```

### Arquivo: `src/pages/Settings.tsx`

Adicionar nova aba "Custos" com icone Calculator ao lado da aba de Pagamentos.

---

## Parte 3: Hook de Custos Operacionais

### Arquivo: `src/hooks/useRecipeCostSettings.ts`

Hook que:

1. Busca configuracoes do usuario da tabela `recipe_cost_settings`
2. Busca gastos do mes atual do financeiro baseado nas categorias selecionadas
3. Calcula o custo operacional por produto

```typescript
interface RecipeCostSettings {
  monthlyProductsSold: number;
  taxPercentage: number;
  cardFeePercentage: number;
  packagingCostPerUnit: number;
  fixedCostCategoryIds: string[];
}

interface OperationalCosts {
  fixedCostPerProduct: number;  // Rateio dos gastos fixos
  taxAmount: number;            // % sobre ingredientes
  cardFeeAmount: number;        // % taxa maquininha  
  packagingCost: number;        // Custo embalagem
  totalOperational: number;     // Soma
}
```

---

## Parte 4: Interface na Ficha Tecnica

### Arquivo: `src/components/recipes/OperationalCostsSection.tsx`

Novo componente para exibir custos operacionais:

```text
┌──────────────────────────────────────────┐
│ Custos Operacionais             [?]      │
├──────────────────────────────────────────┤
│ Gastos Fixos (rateio)       R$ 10,00     │
│ Impostos (10%)              R$  0,80     │
│ Taxa Maquininha (3%)        R$  0,25     │
│ Embalagem                   R$  0,50     │
├──────────────────────────────────────────┤
│ Subtotal Operacional        R$ 11,55     │
└──────────────────────────────────────────┘
```

### Arquivo: `src/components/recipes/RecipeSheet.tsx`

Adicionar secao de custos operacionais entre os ingredientes e o resumo de custos:

- Importar e usar o hook `useRecipeCostSettings`
- Mostrar breakdown dos custos operacionais
- Atualizar o custo total para incluir custos operacionais

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/migrations/xxx.sql` | NOVA | Trigger de sincronizacao + tabela recipe_cost_settings |
| `src/hooks/useRecipeCostSettings.ts` | NOVA | Hook para buscar/salvar configuracoes e calcular custos |
| `src/components/settings/RecipeCostSettings.tsx` | NOVA | Componente de configuracao de custos |
| `src/components/recipes/OperationalCostsSection.tsx` | NOVA | Componente de exibicao de custos operacionais |
| `src/pages/Settings.tsx` | EDITAR | Adicionar aba "Custos" |
| `src/components/recipes/RecipeSheet.tsx` | EDITAR | Integrar custos operacionais |

---

## Detalhes Tecnicos da Migracao SQL

```sql
-- 1. Funcao de sincronizacao de precos
CREATE OR REPLACE FUNCTION sync_recipe_costs_on_item_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza ingredientes que usam este item
  UPDATE recipe_ingredients ri
  SET 
    unit_cost = COALESCE(NEW.recipe_unit_price, NEW.unit_price, 0),
    total_cost = (conversao de unidades * preco)
  WHERE ri.item_id = NEW.id AND ri.source_type = 'inventory';

  -- Recalcula custos das receitas afetadas
  UPDATE recipes r
  SET 
    total_cost = (SELECT SUM(total_cost) FROM recipe_ingredients WHERE recipe_id = r.id),
    cost_per_portion = total_cost / yield_quantity,
    cost_updated_at = NOW()
  WHERE r.id IN (SELECT recipe_id FROM recipe_ingredients WHERE item_id = NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger
CREATE TRIGGER on_inventory_price_change
  AFTER UPDATE OF unit_price, recipe_unit_price, recipe_unit_type ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_recipe_costs_on_item_price_change();

-- 3. Tabela de configuracoes
CREATE TABLE recipe_cost_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  monthly_products_sold numeric DEFAULT 1000,
  tax_percentage numeric DEFAULT 10,
  card_fee_percentage numeric DEFAULT 3,
  packaging_cost_per_unit numeric DEFAULT 0.50,
  fixed_cost_category_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. RLS
ALTER TABLE recipe_cost_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON recipe_cost_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Resultado Esperado

1. **Precos sincronizam automaticamente** - Alterar preco no estoque atualiza instantaneamente todas as fichas
2. **Configuracao facil** - Nova aba em Configuracoes para definir:
   - Media de produtos vendidos por mes
   - % de impostos
   - % taxa de maquininha
   - Custo de embalagem por unidade
   - Quais categorias do financeiro sao custos fixos
3. **Visibilidade completa** - Ficha tecnica mostra:
   - Custo de ingredientes
   - Rateio de custos fixos do financeiro
   - Impostos, taxas e embalagem
   - Custo total real do produto
