-- =============================================
-- FORNECEDORES (Suppliers)
-- =============================================
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view suppliers" ON public.suppliers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo supplier_id na tabela inventory_items
ALTER TABLE public.inventory_items 
  ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- =============================================
-- PEDIDOS (Orders)
-- =============================================
CREATE TYPE public.order_status AS ENUM ('draft', 'sent', 'received', 'cancelled');

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  status order_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view orders" ON public.orders
  FOR SELECT USING (is_authenticated());

CREATE POLICY "Authenticated can insert orders" ON public.orders
  FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated can update orders" ON public.orders
  FOR UPDATE USING (is_authenticated());

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ITENS DO PEDIDO (Order Items)
-- =============================================
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view order_items" ON public.order_items
  FOR SELECT USING (is_authenticated());

CREATE POLICY "Authenticated can insert order_items" ON public.order_items
  FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated can update order_items" ON public.order_items
  FOR UPDATE USING (is_authenticated());

CREATE POLICY "Admins can delete order_items" ON public.order_items
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- SETORES DO CHECKLIST (Checklist Sectors)
-- =============================================
CREATE TABLE public.checklist_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT DEFAULT 'Folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sectors" ON public.checklist_sectors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sectors" ON public.checklist_sectors
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_checklist_sectors_updated_at
  BEFORE UPDATE ON public.checklist_sectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SUBCATEGORIAS DO CHECKLIST (Checklist Subcategories)
-- =============================================
CREATE TABLE public.checklist_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID REFERENCES public.checklist_sectors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view subcategories" ON public.checklist_subcategories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subcategories" ON public.checklist_subcategories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_checklist_subcategories_updated_at
  BEFORE UPDATE ON public.checklist_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ITENS DO CHECKLIST (Checklist Items)
-- =============================================
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcategory_id UUID REFERENCES public.checklist_subcategories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view checklist_items" ON public.checklist_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage checklist_items" ON public.checklist_items
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- MARCAÇÕES DE CHECKLIST (Checklist Completions)
-- =============================================
CREATE TYPE public.checklist_type AS ENUM ('abertura', 'fechamento', 'limpeza');

CREATE TABLE public.checklist_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.checklist_items(id) ON DELETE CASCADE NOT NULL,
  checklist_type checklist_type NOT NULL,
  completed_by UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view completions" ON public.checklist_completions
  FOR SELECT USING (is_authenticated());

CREATE POLICY "Authenticated can insert completions" ON public.checklist_completions
  FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated can update own completions" ON public.checklist_completions
  FOR UPDATE USING (auth.uid() = completed_by);

CREATE POLICY "Admins can delete completions" ON public.checklist_completions
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Índice para buscar completions por data e tipo
CREATE INDEX idx_checklist_completions_date_type ON public.checklist_completions(date, checklist_type);

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Setores padrão
INSERT INTO public.checklist_sectors (name, color, icon, sort_order) VALUES
  ('Cozinha', '#ef4444', 'ChefHat', 1),
  ('Salão', '#3b82f6', 'UtensilsCrossed', 2),
  ('Caixa', '#22c55e', 'Wallet', 3),
  ('Banheiros', '#8b5cf6', 'Bath', 4);

-- Subcategorias padrão
INSERT INTO public.checklist_subcategories (sector_id, name, sort_order)
SELECT id, 'Pista Fria', 1 FROM public.checklist_sectors WHERE name = 'Cozinha'
UNION ALL
SELECT id, 'Pista Quente', 2 FROM public.checklist_sectors WHERE name = 'Cozinha'
UNION ALL
SELECT id, 'Preparo', 3 FROM public.checklist_sectors WHERE name = 'Cozinha'
UNION ALL
SELECT id, 'Mesas', 1 FROM public.checklist_sectors WHERE name = 'Salão'
UNION ALL
SELECT id, 'Bar', 2 FROM public.checklist_sectors WHERE name = 'Salão'
UNION ALL
SELECT id, 'Recepção', 3 FROM public.checklist_sectors WHERE name = 'Salão'
UNION ALL
SELECT id, 'Abertura', 1 FROM public.checklist_sectors WHERE name = 'Caixa'
UNION ALL
SELECT id, 'Fechamento', 2 FROM public.checklist_sectors WHERE name = 'Caixa'
UNION ALL
SELECT id, 'Masculino', 1 FROM public.checklist_sectors WHERE name = 'Banheiros'
UNION ALL
SELECT id, 'Feminino', 2 FROM public.checklist_sectors WHERE name = 'Banheiros';

-- Fornecedores padrão
INSERT INTO public.suppliers (name, phone) VALUES
  ('Fornecedor Geral', null),
  ('Distribuidora de Bebidas', null),
  ('Hortifruti Local', null);