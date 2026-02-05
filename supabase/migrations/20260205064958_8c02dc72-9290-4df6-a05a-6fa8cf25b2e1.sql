-- Add source_type and source_recipe_id to recipe_ingredients
ALTER TABLE recipe_ingredients
  ADD COLUMN source_type TEXT NOT NULL DEFAULT 'inventory',
  ADD COLUMN source_recipe_id UUID REFERENCES recipes(id) ON DELETE RESTRICT;

-- Add constraint to ensure source_recipe_id is only set when source_type is 'recipe'
ALTER TABLE recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_source_check 
  CHECK (
    (source_type = 'inventory' AND source_recipe_id IS NULL) OR 
    (source_type = 'recipe' AND source_recipe_id IS NOT NULL AND item_id IS NOT NULL)
  );

-- Make item_id nullable since sub-recipes don't need it
ALTER TABLE recipe_ingredients
  ALTER COLUMN item_id DROP NOT NULL;

-- Update constraint to allow null item_id for sub-recipes
ALTER TABLE recipe_ingredients
  DROP CONSTRAINT recipe_ingredients_source_check;

ALTER TABLE recipe_ingredients
  ADD CONSTRAINT recipe_ingredients_source_check 
  CHECK (
    (source_type = 'inventory' AND item_id IS NOT NULL) OR 
    (source_type = 'recipe' AND source_recipe_id IS NOT NULL)
  );

-- Insert default category for bases and preparations
INSERT INTO recipe_categories (name, color, icon, sort_order)
VALUES ('Bases e Preparos', '#8b5cf6', 'Soup', 0)
ON CONFLICT DO NOTHING;