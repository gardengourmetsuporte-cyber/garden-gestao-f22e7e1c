
ALTER TABLE public.recurring_subscriptions 
ADD COLUMN IF NOT EXISTS finance_category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL DEFAULT NULL;

COMMENT ON COLUMN public.recurring_subscriptions.finance_category_id IS 'Vincula assinatura a uma categoria financeira para lançamento automático';
