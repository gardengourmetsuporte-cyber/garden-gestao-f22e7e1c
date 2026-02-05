-- =====================================================
-- PARTE 1: TRIGGER DE SINCRONIZAÇÃO DE PREÇOS
-- Atualiza automaticamente todas as fichas técnicas
-- quando o preço muda no estoque
-- =====================================================

-- Função que recalcula custos quando preço do item muda
CREATE OR REPLACE FUNCTION sync_recipe_costs_on_item_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza todos os ingredientes que usam este item
  UPDATE recipe_ingredients ri
  SET 
    unit_cost = COALESCE(NEW.recipe_unit_price, NEW.unit_price, 0),
    total_cost = (
      CASE 
        -- Unidades iguais
        WHEN (COALESCE(NEW.recipe_unit_type, NEW.unit_type::text) = ri.unit_type::text) THEN
          ri.quantity * COALESCE(NEW.recipe_unit_price, NEW.unit_price, 0)
        -- kg -> g (divide por 1000)
        WHEN (COALESCE(NEW.recipe_unit_type, NEW.unit_type::text) = 'kg' AND ri.unit_type::text = 'g') THEN
          (ri.quantity / 1000) * COALESCE(NEW.recipe_unit_price, NEW.unit_price, 0)
        -- g -> kg (multiplica por 1000)
        WHEN (COALESCE(NEW.recipe_unit_type, NEW.unit_type::text) = 'g' AND ri.unit_type::text = 'kg') THEN
          (ri.quantity * 1000) * COALESCE(NEW.recipe_unit_price, NEW.unit_price, 0)
        -- litro -> ml (divide por 1000)
        WHEN (COALESCE(NEW.recipe_unit_type, NEW.unit_type::text) = 'litro' AND ri.unit_type::text = 'ml') THEN
          (ri.quantity / 1000) * COALESCE(NEW.recipe_unit_price, NEW.unit_price, 0)
        -- ml -> litro (multiplica por 1000)
        WHEN (COALESCE(NEW.recipe_unit_type, NEW.unit_type::text) = 'ml' AND ri.unit_type::text = 'litro') THEN
          (ri.quantity * 1000) * COALESCE(NEW.recipe_unit_price, NEW.unit_price, 0)
        -- Fallback
        ELSE
          ri.quantity * COALESCE(NEW.recipe_unit_price, NEW.unit_price, 0)
      END
    )
  WHERE ri.item_id = NEW.id
    AND ri.source_type = 'inventory';

  -- Recalcula o custo total de todas as receitas afetadas
  UPDATE recipes r
  SET 
    total_cost = (
      SELECT COALESCE(SUM(ri.total_cost), 0)
      FROM recipe_ingredients ri
      WHERE ri.recipe_id = r.id
    ),
    cost_per_portion = (
      SELECT COALESCE(SUM(ri.total_cost), 0) / GREATEST(r.yield_quantity, 1)
      FROM recipe_ingredients ri
      WHERE ri.recipe_id = r.id
    ),
    cost_updated_at = NOW(),
    updated_at = NOW()
  WHERE r.id IN (
    SELECT DISTINCT recipe_id 
    FROM recipe_ingredients 
    WHERE item_id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger que dispara quando preço muda
CREATE TRIGGER on_inventory_price_change
  AFTER UPDATE OF unit_price, recipe_unit_price, recipe_unit_type ON inventory_items
  FOR EACH ROW
  WHEN (
    OLD.unit_price IS DISTINCT FROM NEW.unit_price OR
    OLD.recipe_unit_price IS DISTINCT FROM NEW.recipe_unit_price OR
    OLD.recipe_unit_type IS DISTINCT FROM NEW.recipe_unit_type
  )
  EXECUTE FUNCTION sync_recipe_costs_on_item_price_change();

-- =====================================================
-- PARTE 2: TABELA DE CONFIGURAÇÕES DE CUSTOS
-- Armazena configurações de custos operacionais por usuário
-- =====================================================

CREATE TABLE recipe_cost_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  monthly_products_sold numeric NOT NULL DEFAULT 1000,
  tax_percentage numeric NOT NULL DEFAULT 0,
  card_fee_percentage numeric NOT NULL DEFAULT 0,
  packaging_cost_per_unit numeric NOT NULL DEFAULT 0,
  fixed_cost_category_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE recipe_cost_settings ENABLE ROW LEVEL SECURITY;

-- Política: usuários gerenciam suas próprias configurações
CREATE POLICY "Users manage own cost settings" ON recipe_cost_settings
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_recipe_cost_settings_updated_at
  BEFORE UPDATE ON recipe_cost_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();