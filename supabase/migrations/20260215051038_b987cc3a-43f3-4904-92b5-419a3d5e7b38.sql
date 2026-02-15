
-- Tabela de pontos bonus para sistema de ranking justo
CREATE TABLE public.bonus_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  reason text NOT NULL,
  type text NOT NULL DEFAULT 'manual',
  badge_id text,
  awarded_by uuid,
  month date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bonus_points ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage bonus_points"
ON public.bonus_points
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own bonus points
CREATE POLICY "Users can view own bonus_points"
ON public.bonus_points
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can insert their own auto bonus
CREATE POLICY "Users can insert own auto bonus"
ON public.bonus_points
FOR INSERT
WITH CHECK (auth.uid() = user_id AND type = 'auto');

-- Index for efficient queries
CREATE INDEX idx_bonus_points_user_month ON public.bonus_points (user_id, month);
CREATE INDEX idx_bonus_points_unit_month ON public.bonus_points (unit_id, month);
CREATE INDEX idx_bonus_points_badge_cooldown ON public.bonus_points (user_id, badge_id, month);
