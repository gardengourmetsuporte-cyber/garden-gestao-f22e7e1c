

# Plano: Módulo CRM — Banco de Clientes

## Visao Geral

Criar o módulo "Clientes" completo: tabela no banco, hook de dados, página com listagem/cadastro/importação CSV, e integrar na árvore de módulos e rotas.

## 1. Migration: Criar tabela `customers`

```sql
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  origin text NOT NULL DEFAULT 'manual', -- 'manual' | 'pdv' | 'mesa' | 'ifood' | 'whatsapp' | 'csv'
  notes text,
  total_spent numeric DEFAULT 0,
  total_orders integer DEFAULT 0,
  last_purchase_at timestamptz,
  birthday date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS: unit access
CREATE POLICY "Users can view customers of their unit"
  ON public.customers FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update customers"
  ON public.customers FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete customers"
  ON public.customers FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Updated_at trigger
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index
CREATE INDEX idx_customers_unit_id ON public.customers(unit_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
```

## 2. Hook `useCustomers`

Arquivo: `src/hooks/useCustomers.ts`

- CRUD completo via Supabase (listagem com filtro por unit_id, criação, edição, exclusão)
- Função `importCSV` que parseia CSV (nome, telefone, email) e faz bulk insert
- useQuery + useMutation com invalidação

## 3. Página `Customers.tsx`

Arquivo: `src/pages/Customers.tsx`

- Listagem com busca por nome/telefone
- Stats no topo: total de clientes, novos este mes, origens
- Botao de adicionar cliente manualmente (sheet/dialog)
- Botao de importar CSV
- Card de cada cliente com nome, telefone, origem, total gasto, ultima compra

## 4. Componentes

- `src/components/customers/CustomerSheet.tsx` — Form de criar/editar cliente
- `src/components/customers/CustomerImportCSV.tsx` — Upload e preview de CSV antes de importar
- `src/components/customers/CustomerCard.tsx` — Card de listagem

## 5. Integração na navegação

- Adicionar módulo `customers` em `src/lib/modules.ts` no grupo "Gestão" com sub-módulos:
  - `customers.view` — Ver clientes
  - `customers.create` — Criar/editar clientes
  - `customers.import` — Importar CSV
  - `customers.delete` — Excluir clientes
- Adicionar rota `/customers` em `App.tsx`
- Adicionar lazy import da página
- Adicionar item no `MoreDrawer` / `BottomTabBar`

## 6. Tipo TypeScript

Arquivo: `src/types/customer.ts`

```typescript
export interface Customer {
  id: string;
  unit_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  origin: 'manual' | 'pdv' | 'mesa' | 'ifood' | 'whatsapp' | 'csv';
  notes: string | null;
  total_spent: number;
  total_orders: number;
  last_purchase_at: string | null;
  birthday: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

## Ordem de implementação

1. Migration do banco
2. Tipo TypeScript
3. Hook useCustomers
4. Componentes (Sheet, ImportCSV, Card)
5. Página Customers
6. Rotas e navegação (App.tsx, modules.ts, MoreDrawer)

