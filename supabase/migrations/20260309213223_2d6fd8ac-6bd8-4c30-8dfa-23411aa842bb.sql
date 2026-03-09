
-- Add production stock fields to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS min_ready_stock integer DEFAULT 0;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS current_ready_stock integer DEFAULT 0;

-- Create production_orders table for history
CREATE TABLE production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) NOT NULL,
  recipe_id uuid REFERENCES recipes(id) NOT NULL,
  quantity integer NOT NULL,
  produced_by uuid NOT NULL,
  notes text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_access" ON production_orders
  FOR ALL TO authenticated
  USING (user_has_unit_access(auth.uid(), unit_id));
