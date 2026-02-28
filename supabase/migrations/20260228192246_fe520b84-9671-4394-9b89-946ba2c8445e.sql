
-- Supplier price history table
CREATE TABLE IF NOT EXISTS public.supplier_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX idx_supplier_price_history_item ON public.supplier_price_history(item_id, recorded_at DESC);
CREATE INDEX idx_supplier_price_history_unit ON public.supplier_price_history(unit_id);

-- RLS
ALTER TABLE public.supplier_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view price history for their units"
  ON public.supplier_price_history FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert price history for their units"
  ON public.supplier_price_history FOR INSERT TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

-- Trigger to auto-record price changes
CREATE OR REPLACE FUNCTION public.record_price_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.unit_price IS DISTINCT FROM NEW.unit_price AND NEW.unit_price > 0 THEN
    INSERT INTO public.supplier_price_history (item_id, supplier_id, unit_price, unit_id)
    VALUES (NEW.id, NEW.supplier_id, NEW.unit_price, NEW.unit_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_record_price_change
  AFTER UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.record_price_change();
