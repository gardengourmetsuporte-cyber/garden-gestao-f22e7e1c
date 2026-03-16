
ALTER TABLE public.customer_reviews
  ADD COLUMN IF NOT EXISTS rating_comida smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rating_atendimento smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rating_ambiente smallint DEFAULT NULL;
