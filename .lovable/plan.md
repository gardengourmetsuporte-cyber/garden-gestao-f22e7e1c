

# Plano: Implementação em Massa — Próximos Gaps Prioritários

Com relatórios de vendas, metas e consumo automático de estoque já implementados, o próximo lote foca em **6 features de alto impacto** que não dependem de hardware/APIs externas.

---

## Bloco 1 — Relatórios Avançados (expandir /reports)

### 1.1 Relatório CMV (Custo de Mercadoria Vendida)
- Novo componente `CMVReport.tsx` — cruza `pos_sale_items` (vendas) com `recipes` + `recipe_ingredients` (custos)
- KPIs: CMV total, CMV %, margem bruta, top 10 produtos por margem
- Hook `useReportCMV.ts` — query pos_sales → items → product_id → recipes → total_cost/cost_per_portion

### 1.2 Relatório de Estoque Valorizado
- Novo componente `InventoryValuationReport.tsx`
- Query `inventory_items` com `current_stock * unit_price` agrupado por categoria
- KPIs: valor total do estoque, por categoria, items abaixo do mínimo

### 1.3 Curva ABC de Produtos
- Novo componente `ABCAnalysisReport.tsx`
- Cruza `pos_sale_items` por volume e receita, classifica em A (80%), B (15%), C (5%)
- Tabela com classificação + gráfico Pareto

### 1.4 Relatório de Funcionários
- Novo componente `EmployeeReport.tsx`
- Cruza `time_entries` para horas trabalhadas, `employee_payments` para custos
- Resumo mensal por funcionário

**Página `/reports`**: Converter para abas (Vendas | CMV | Estoque | ABC | Funcionários)

---

## Bloco 2 — Dashboard Analytics Avançado

### 2.1 Heatmap de Vendas (hora × dia da semana)
- Novo componente `SalesHeatmapWidget.tsx`
- Query `pos_sales` agrupado por `extract(dow)` e `extract(hour)` do `created_at`
- Grid visual 7×24 com intensidade de cor

### 2.2 Comparativo Mês a Mês
- Novo componente `MonthComparisonWidget.tsx`
- Compara faturamento do mês atual vs anterior usando `cash_closings`
- Mostra % de variação com seta up/down

### 2.3 Break-even Calculator
- Novo componente `BreakEvenWidget.tsx`
- Calcula ponto de equilíbrio: custos fixos ÷ (1 - CMV%)
- Usa categorias financeiras para separar fixos vs variáveis

Todos adicionados como widgets opcionais no `DashboardWidgetManager`.

---

## Bloco 3 — Contagem de Estoque (Inventário Periódico)

### Database migration
```sql
CREATE TABLE public.inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'in_progress', -- in_progress, completed
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.inventory_count_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id uuid NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  system_stock numeric NOT NULL DEFAULT 0,
  counted_stock numeric,
  difference numeric GENERATED ALWAYS AS (counted_stock - system_stock) STORED,
  adjusted boolean DEFAULT false,
  counted_by uuid REFERENCES auth.users(id),
  counted_at timestamptz
);
-- RLS using get_user_unit_ids
```

### Frontend
- Botão "Iniciar Contagem" no módulo Estoque
- Sheet `InventoryCountSheet.tsx` — lista items com input de contagem física
- Comparação sistema vs contado com destaque de divergências
- Botão "Ajustar Estoque" para aplicar diferenças

---

## Bloco 4 — Sistema de Reservas

### Database migration
```sql
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  party_size int NOT NULL DEFAULT 2,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  duration_minutes int DEFAULT 120,
  status text DEFAULT 'confirmed', -- confirmed, seated, completed, cancelled, no_show
  table_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS unit-scoped
```

### Frontend
- Nova página `/reservations` com calendar view
- Componente `ReservationCalendar.tsx` — timeline por horário
- Sheet para criar/editar reserva
- Status cards (confirmada, sentada, finalizada, no-show)
- Registro no módulo e rota

---

## Bloco 5 — Cupons de Desconto (Cardápio Digital)

### Database migration
```sql
CREATE TABLE public.discount_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage', -- percentage, fixed
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_value numeric DEFAULT 0,
  max_uses int,
  current_uses int DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, code)
);
-- RLS: admin write, authenticated read for validation
```

### Frontend
- Seção "Cupons" no Settings ou Cardápio admin
- `CouponManager.tsx` — CRUD de cupons
- No cardápio digital: campo "Tem cupom?" no checkout → valida → aplica desconto

---

## Bloco 6 — Histórico de Pedidos do Cliente (CRM)

- Novo componente `CustomerOrderHistory.tsx`
- No detalhe do cliente, aba "Histórico" que cruza:
  - `pos_sales` (por customer_name/phone)
  - `tablet_orders` (por email/phone)
- Mostra timeline de compras com totais

---

## Arquivos a criar/modificar

```
-- Relatórios
src/components/reports/CMVReport.tsx
src/components/reports/InventoryValuationReport.tsx
src/components/reports/ABCAnalysisReport.tsx
src/components/reports/EmployeeReport.tsx
src/hooks/useReportCMV.ts
src/hooks/useReportInventoryValuation.ts
src/hooks/useReportABC.ts
src/hooks/useReportEmployees.ts
src/pages/Reports.tsx (refatorar com abas)

-- Dashboard
src/components/dashboard/SalesHeatmapWidget.tsx
src/components/dashboard/MonthComparisonWidget.tsx
src/components/dashboard/BreakEvenWidget.tsx

-- Contagem de Estoque
src/components/inventory/InventoryCountSheet.tsx
src/hooks/useInventoryCounts.ts

-- Reservas
src/pages/Reservations.tsx
src/components/reservations/ReservationCalendar.tsx
src/components/reservations/ReservationSheet.tsx
src/hooks/useReservations.ts

-- Cupons
src/components/menu/CouponManager.tsx
src/hooks/useCoupons.ts

-- CRM
src/components/customers/CustomerOrderHistory.tsx

-- Migrations (4)
+ inventory_counts + inventory_count_items
+ reservations
+ discount_coupons

-- Registros
src/lib/modules.ts (adicionar reservations)
src/App.tsx (rota /reservations)
src/components/dashboard/AdminDashboard.tsx (novos widgets)
```

---

## Ordem de execução

1. Migrations (3 tabelas novas)
2. Reports: CMV → Estoque Valorizado → ABC → Funcionários + refatorar página com abas
3. Dashboard: Heatmap → MoM → Break-even
4. Contagem de estoque
5. Reservas (página + componentes)
6. Cupons
7. Histórico de pedidos do cliente
8. Registrar módulos e rotas

