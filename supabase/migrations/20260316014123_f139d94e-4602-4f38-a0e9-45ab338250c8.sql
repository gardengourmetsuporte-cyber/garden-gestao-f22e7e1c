
-- Backfill access_level_id for existing user_units records with role='member' and no access level
UPDATE public.user_units uu
SET access_level_id = al.id
FROM public.access_levels al
WHERE uu.access_level_id IS NULL
  AND uu.role = 'member'
  AND al.unit_id = uu.unit_id
  AND al.is_default = true;
