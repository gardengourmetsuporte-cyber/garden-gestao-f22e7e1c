-- Add recipe-specific unit and price fields to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN recipe_unit_type text DEFAULT NULL,
ADD COLUMN recipe_unit_price numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.inventory_items.recipe_unit_type IS 'Unit type for recipe calculations (kg, g, litro, ml, unidade). If null, uses unit_type';
COMMENT ON COLUMN public.inventory_items.recipe_unit_price IS 'Price per recipe unit. If null, uses unit_price';