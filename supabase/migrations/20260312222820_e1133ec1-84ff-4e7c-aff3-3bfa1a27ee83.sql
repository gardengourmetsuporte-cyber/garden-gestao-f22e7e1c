
-- Game scores table for ranking system
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('snake', 'memory')),
  score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for ranking queries
CREATE INDEX idx_game_scores_ranking ON public.game_scores (unit_id, game_type, score DESC);
CREATE INDEX idx_game_scores_customer ON public.game_scores (customer_id);

-- Enable RLS
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read scores (public ranking)
CREATE POLICY "Anyone can view game scores"
  ON public.game_scores FOR SELECT
  USING (true);

-- Authenticated users can insert their own scores
CREATE POLICY "Authenticated users can insert scores"
  ON public.game_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for live ranking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;
