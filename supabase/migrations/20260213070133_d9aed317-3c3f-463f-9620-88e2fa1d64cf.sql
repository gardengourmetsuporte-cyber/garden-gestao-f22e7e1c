
-- Create finance_snapshots table
CREATE TABLE public.finance_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id),
  name text NOT NULL DEFAULT '',
  accounts_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  transactions_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_balance numeric NOT NULL DEFAULT 0,
  month date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.finance_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only access their own snapshots
CREATE POLICY "Users manage own snapshots"
ON public.finance_snapshots
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
