ALTER TABLE public.brand_identity 
  ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_url text DEFAULT '';