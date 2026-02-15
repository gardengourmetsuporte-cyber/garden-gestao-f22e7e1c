
-- Create access_levels table for custom permission profiles
CREATE TABLE public.access_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  modules TEXT[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_levels ENABLE ROW LEVEL SECURITY;

-- Only admins can manage access levels
CREATE POLICY "Admins can manage access_levels"
  ON public.access_levels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view access levels (needed to check own permissions)
CREATE POLICY "Authenticated can view access_levels"
  ON public.access_levels FOR SELECT
  USING (is_authenticated());

-- Add access_level_id to user_units to link users to access levels per unit
ALTER TABLE public.user_units
  ADD COLUMN access_level_id UUID REFERENCES public.access_levels(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_access_levels_updated_at
  BEFORE UPDATE ON public.access_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
