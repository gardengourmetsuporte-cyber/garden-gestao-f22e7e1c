
ALTER TABLE public.production_orders ADD COLUMN item_id uuid REFERENCES public.inventory_items(id);
ALTER TABLE public.production_orders ALTER COLUMN recipe_id DROP NOT NULL;
