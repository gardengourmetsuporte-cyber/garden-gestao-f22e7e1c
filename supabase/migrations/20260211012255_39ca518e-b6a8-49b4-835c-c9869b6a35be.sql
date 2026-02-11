
-- Drop the old unique constraint on name only
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Add a new unique constraint scoped to unit_id
ALTER TABLE public.categories ADD CONSTRAINT categories_name_unit_unique UNIQUE (name, unit_id);
