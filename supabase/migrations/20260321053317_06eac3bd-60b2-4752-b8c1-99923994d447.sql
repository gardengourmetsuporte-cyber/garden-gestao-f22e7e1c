
-- Rate limiting table for edge functions (especially AI-powered ones)
CREATE TABLE IF NOT EXISTS public.edge_function_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, function_name, window_start)
);

-- Enable RLS
ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role key)
-- No policies needed for authenticated users - this is backend-only

-- Cleanup function for old rate limit entries (called by cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.edge_function_rate_limits
  WHERE window_start < now() - interval '1 hour';
$$;

-- Error log table for client-side error monitoring
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_message text NOT NULL,
  error_stack text,
  module text,
  url text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only insert allowed for authenticated users (no read/update/delete)
CREATE POLICY "Authenticated can insert error logs"
ON public.error_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
