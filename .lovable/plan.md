

# Plano: Relatório de Vendas + Consumo Automático de Estoque + Metas no Dashboard

Dado o volume de gaps (67 itens), vou focar nos **3 de maior impacto imediato** que são 100% implementáveis dentro do Lovable sem dependências externas (sem impressora, sem TEF, sem API iFood).

---

## Escopo desta iteração

| # | Feature | Justificativa |
|---|---------|--------------|
| 1 | **Relatório de Vendas consolidado** | "Clientes vão cobrar no dia 1" — cruza `pos_sales` + `cash_closings` com filtros e export Excel/PDF |
| 2 | **Consumo automático de estoque por venda** | "Feature matadora" — trigger no DB que desconta ingredientes da ficha técnica quando venda é finalizada |
| 3 | **Metas de vendas no Dashboard** | Gestores precisam disso diariamente — tabela `sales_goals` + progress bar no widget |

---

## 1. Relatório de Vendas

### Database
- Nenhuma migração necessária — usa `pos_sales` + `pos_sale_items` + `pos_sale_payments` existentes

### Novo componente: `src/components/reports/SalesReport.tsx`
- Filtros: período (date range), fonte (balcão/delivery/tablet), método de pagamento
- KPIs: total vendido, quantidade de vendas, ticket médio, desconto total
- Tabela com vendas detalhadas
- Botão exportar Excel (reusa padrão `xlsx`) e PDF
- Acessível via nova rota `/reports` ou sub-aba no Financeiro

### Novo hook: `src/hooks/useReportSales.ts`
- Query `pos_sales` com joins em items e payments
- Filtros dinâmicos por data, source, status
- Agrupamento por dia/semana/mês

### Lib: `src/lib/exportSalesReport.ts`
- `exportSalesExcel()` — planilha com abas: Resumo + Detalhado
- `exportSalesPdf()` — PDF com cabeçalho da unidade, KPIs e tabela

---

## 2. Consumo Automático de Estoque por Venda

### Database migration
```sql
-- Função que desconta ingredientes da ficha técnica quando uma venda é finalizada
CREATE OR REPLACE FUNCTION public.auto_consume_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item RECORD;
  ingredient RECORD;
  sale_unit_id uuid;
BEGIN
  -- Só processar vendas com status 'paid'
  IF NEW.status != 'paid' THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status = 'paid' THEN RETURN NEW; END IF;

  sale_unit_id := NEW.unit_id;

  -- Para cada item da venda
  FOR item IN
    SELECT si.product_id, si.quantity
    FROM pos_sale_items si
    WHERE si.sale_id = NEW.id AND si.product_id IS NOT NULL
  LOOP
    -- Para cada ingrediente da receita do produto
    FOR ingredient IN
      SELECT ri.item_id, ri.quantity as recipe_qty, r.yield_quantity
      FROM recipe_ingredients ri
      JOIN recipes r ON r.id = ri.recipe_id
      WHERE r.product_id = item.product_id
        AND ri.source_type = 'inventory'
        AND ri.item_id IS NOT NULL
    LOOP
      -- Descontar: (qty vendida / yield) * qty_ingrediente
      UPDATE inventory_items
      SET current_stock = GREATEST(0,
        current_stock - (item.quantity::numeric / GREATEST(ingredient.yield_quantity, 1)) * ingredient.recipe_qty
      ), updated_at = now()
      WHERE id = ingredient.item_id AND unit_id = sale_unit_id;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_consume_stock
AFTER INSERT OR UPDATE ON pos_sales
FOR EACH ROW EXECUTE FUNCTION auto_consume_stock_on_sale();
```

Isso conecta automaticamente PDV → Receitas → Estoque sem nenhuma mudança no frontend.

---

## 3. Metas de Vendas no Dashboard

### Database migration
```sql
CREATE TABLE public.sales_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  month date NOT NULL, -- primeiro dia do mês
  daily_goal numeric DEFAULT 0,
  monthly_goal numeric DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, month)
);
ALTER TABLE sales_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unit_access" ON sales_goals FOR ALL TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));
```

### Frontend
- Widget `SalesGoalWidget.tsx` no Dashboard: progress ring com meta diária e mensal
- Sheet para definir metas (admin only)
- Integra com `useDashboardAnalytics` para dados reais vs. meta

---

## Arquivos a criar/modificar

```
src/hooks/useReportSales.ts          (novo)
src/components/reports/SalesReport.tsx (novo)
src/lib/exportSalesReport.ts         (novo)
src/components/dashboard/SalesGoalWidget.tsx (novo)
src/hooks/useSalesGoals.ts           (novo)
src/pages/Reports.tsx                (novo — ou sub-rota)
+ 2 migrações SQL
+ Registro de rota + menu
```

---

## O que NÃO entra agora

Impressão, TEF, NFC-e real, API iFood, reservas — todos dependem de integrações externas pesadas ou hardware. Ficam para iterações futuras com planejamento específico.

---

## Ordem de execução

1. Migração: trigger de consumo automático de estoque
2. Migração: tabela `sales_goals`
3. Hook + componente de Relatório de Vendas com export
4. Widget de metas no Dashboard
5. Registro de rota `/reports`

