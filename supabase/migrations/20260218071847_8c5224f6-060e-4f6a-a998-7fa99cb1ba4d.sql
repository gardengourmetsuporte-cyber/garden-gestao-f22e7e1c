-- Add scope to checklist_sectors: 'standard' for abertura/fechamento, 'bonus' for bonus-exclusive sectors
ALTER TABLE public.checklist_sectors ADD COLUMN scope text NOT NULL DEFAULT 'standard';

-- Also add scope to checklist_subcategories for consistency
ALTER TABLE public.checklist_subcategories ADD COLUMN scope text NOT NULL DEFAULT 'standard';