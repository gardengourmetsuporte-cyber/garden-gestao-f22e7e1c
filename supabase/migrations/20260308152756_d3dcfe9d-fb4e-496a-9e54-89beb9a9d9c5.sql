
CREATE TABLE public.supplier_last_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  unit_price numeric NOT NULL,
  brand text,
  last_quoted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, item_id)
);

ALTER TABLE public.supplier_last_prices ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - edge function uses service role key
