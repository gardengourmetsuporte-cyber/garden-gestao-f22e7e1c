
-- Add role column to user_units for per-unit role management
ALTER TABLE public.user_units
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

-- Create invites table
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  invited_by uuid NOT NULL,
  accepted_at timestamptz,
  expires_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Admins/owners of the unit can manage invites
CREATE POLICY "Unit admins can view invites"
  ON public.invites FOR SELECT
  USING (
    public.user_has_unit_access(auth.uid(), unit_id)
  );

CREATE POLICY "Unit admins can create invites"
  ON public.invites FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND public.user_has_unit_access(auth.uid(), unit_id)
  );

CREATE POLICY "Unit admins can update invites"
  ON public.invites FOR UPDATE
  USING (
    public.user_has_unit_access(auth.uid(), unit_id)
  );

CREATE POLICY "Unit admins can delete invites"
  ON public.invites FOR DELETE
  USING (
    public.user_has_unit_access(auth.uid(), unit_id)
  );

-- Allow anonymous read of invite by token (for invite accept page)
CREATE POLICY "Anyone can read invite by token"
  ON public.invites FOR SELECT
  USING (true);

-- Create index for token lookups
CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_email ON public.invites(email);

-- Update existing user_units to set proper roles
-- Owners (created_by) get 'owner' role
UPDATE public.user_units uu
SET role = 'owner'
FROM public.units u
WHERE uu.unit_id = u.id AND uu.user_id = u.created_by;
