
-- Table for QR code login sessions (tablet shows QR, customer scans with phone)
CREATE TABLE public.qr_login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  customer_email text,
  customer_name text,
  auth_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Enable RLS
ALTER TABLE public.qr_login_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read (tablet polls for status)
CREATE POLICY "Anyone can read qr sessions" ON public.qr_login_sessions
  FOR SELECT TO anon, authenticated USING (true);

-- Anyone can insert (tablet creates session)
CREATE POLICY "Anyone can create qr sessions" ON public.qr_login_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can update (phone completes session)
CREATE POLICY "Authenticated can update qr sessions" ON public.qr_login_sessions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_login_sessions;

-- Auto-cleanup old sessions (index for queries)
CREATE INDEX idx_qr_login_sessions_token ON public.qr_login_sessions(session_token);
CREATE INDEX idx_qr_login_sessions_status ON public.qr_login_sessions(status, expires_at);
