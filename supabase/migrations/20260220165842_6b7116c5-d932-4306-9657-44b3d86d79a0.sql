
-- =============================================
-- Gamification Module: 3 tables + RLS
-- =============================================

-- 1. gamification_prizes
CREATE TABLE public.gamification_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'item', -- item | discount | empty
  probability numeric NOT NULL DEFAULT 10,
  estimated_cost numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  icon text NOT NULL DEFAULT '🎁',
  color text NOT NULL DEFAULT '#6366f1',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_prizes ENABLE ROW LEVEL SECURITY;

-- Public SELECT for tablet (anon)
CREATE POLICY "Public can view active gamification prizes"
  ON public.gamification_prizes FOR SELECT
  USING (true);

-- Admins manage prizes
CREATE POLICY "Admins can manage gamification prizes"
  ON public.gamification_prizes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. gamification_plays
CREATE TABLE public.gamification_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  customer_name text,
  prize_id uuid REFERENCES public.gamification_prizes(id) ON DELETE SET NULL,
  prize_name text NOT NULL DEFAULT '',
  played_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_plays ENABLE ROW LEVEL SECURITY;

-- Public INSERT for tablet (anon records plays)
CREATE POLICY "Anyone can insert gamification plays"
  ON public.gamification_plays FOR INSERT
  WITH CHECK (true);

-- Admins can view plays
CREATE POLICY "Admins can view gamification plays"
  ON public.gamification_plays FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete plays
CREATE POLICY "Admins can delete gamification plays"
  ON public.gamification_plays FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. gamification_settings (1 row per unit)
CREATE TABLE public.gamification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL UNIQUE REFERENCES public.units(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  max_daily_cost numeric NOT NULL DEFAULT 100,
  points_per_play integer NOT NULL DEFAULT 1,
  cooldown_minutes integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

-- Public SELECT for tablet
CREATE POLICY "Public can view gamification settings"
  ON public.gamification_settings FOR SELECT
  USING (true);

-- Admins manage settings
CREATE POLICY "Admins can manage gamification settings"
  ON public.gamification_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for plays (admin dashboard live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.gamification_plays;
