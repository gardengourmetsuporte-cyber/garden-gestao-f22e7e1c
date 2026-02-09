
-- Add sort_order to inventory categories table
ALTER TABLE public.categories ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Initialize sort_order based on current name ordering
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 as rn
  FROM public.categories
)
UPDATE public.categories c
SET sort_order = o.rn
FROM ordered o
WHERE c.id = o.id;
