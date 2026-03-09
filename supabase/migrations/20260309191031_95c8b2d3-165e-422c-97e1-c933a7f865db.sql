
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS stock_unit_label text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stock_to_recipe_factor numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purchase_unit_label text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purchase_to_stock_factor numeric DEFAULT NULL;
