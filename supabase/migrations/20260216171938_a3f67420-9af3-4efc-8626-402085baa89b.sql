
-- Time records table for employee check-in/check-out
CREATE TABLE public.time_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Expected schedule
  expected_start time WITHOUT TIME ZONE NOT NULL DEFAULT '08:00',
  expected_end time WITHOUT TIME ZONE NOT NULL DEFAULT '17:00',
  
  -- Actual times
  check_in time WITHOUT TIME ZONE,
  check_out time WITHOUT TIME ZONE,
  
  -- Calculated delays (in minutes, positive = late/early departure)
  late_minutes integer NOT NULL DEFAULT 0,
  early_departure_minutes integer NOT NULL DEFAULT 0,
  
  -- Points awarded (negative for penalties)
  points_awarded integer NOT NULL DEFAULT 0,
  points_processed boolean NOT NULL DEFAULT false,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checked_in', 'completed', 'absent', 'day_off', 'manual')),
  
  -- Metadata
  manual_entry boolean NOT NULL DEFAULT false,
  adjusted_by uuid,
  notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- One record per user per date per unit
  UNIQUE (user_id, date, unit_id)
);

-- Enable RLS
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own time records"
  ON public.time_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all time records"
  ON public.time_records FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own time records"
  ON public.time_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending records"
  ON public.time_records FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'checked_in'));

CREATE POLICY "Admins can manage all time records"
  ON public.time_records FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Time tracking settings (per unit)
CREATE TABLE public.time_tracking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  
  -- Points configuration
  points_per_minute_late integer NOT NULL DEFAULT -1,
  points_per_minute_early integer NOT NULL DEFAULT -1,
  points_on_time_bonus integer NOT NULL DEFAULT 5,
  
  -- Grace period (minutes allowed before counting as late)
  grace_period_minutes integer NOT NULL DEFAULT 5,
  
  -- Max penalty per day
  max_penalty_per_day integer NOT NULL DEFAULT -30,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.time_tracking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage time settings"
  ON public.time_tracking_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view time settings"
  ON public.time_tracking_settings FOR SELECT
  USING (is_authenticated());

-- Index for performance
CREATE INDEX idx_time_records_user_date ON public.time_records (user_id, date);
CREATE INDEX idx_time_records_unit_date ON public.time_records (unit_id, date);
