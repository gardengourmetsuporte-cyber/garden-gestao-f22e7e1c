-- 1. Adicionar preço unitário na tabela de estoque
ALTER TABLE inventory_items 
ADD COLUMN unit_price NUMERIC DEFAULT 0;

-- 2. Criar enum de unidades para receitas
CREATE TYPE recipe_unit_type AS ENUM ('unidade', 'kg', 'g', 'litro', 'ml');

-- 3. Criar tabela de categorias de receitas
CREATE TABLE recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT DEFAULT 'ChefHat',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Criar tabela de receitas
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES recipe_categories(id) ON DELETE SET NULL,
  yield_quantity NUMERIC NOT NULL DEFAULT 1,
  yield_unit TEXT NOT NULL DEFAULT 'unidade',
  preparation_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  cost_per_portion NUMERIC NOT NULL DEFAULT 0,
  cost_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Criar tabela de ingredientes da receita
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit_type recipe_unit_type NOT NULL,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Habilitar RLS
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- 7. Políticas - Apenas admins
CREATE POLICY "Admins can manage recipe_categories"
  ON recipe_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage recipes"
  ON recipes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage recipe_ingredients"
  ON recipe_ingredients FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Inserir categorias padrão
INSERT INTO recipe_categories (name, color, icon, sort_order) VALUES
  ('Lanches', '#f97316', 'Sandwich', 1),
  ('Acompanhamentos', '#22c55e', 'Soup', 2),
  ('Bebidas', '#3b82f6', 'Coffee', 3),
  ('Sobremesas', '#ec4899', 'IceCream', 4);

-- 9. Triggers para updated_at
CREATE TRIGGER update_recipe_categories_updated_at
  BEFORE UPDATE ON recipe_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();