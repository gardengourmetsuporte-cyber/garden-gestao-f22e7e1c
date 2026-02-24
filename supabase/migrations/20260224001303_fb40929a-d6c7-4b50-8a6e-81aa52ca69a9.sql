
CREATE OR REPLACE FUNCTION public.auto_provision_unit(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_unit_id uuid;
  cat record;
  i int := 0;
BEGIN
  -- Check if user already has units
  IF EXISTS (SELECT 1 FROM user_units WHERE user_id = p_user_id) THEN
    RETURN (SELECT unit_id FROM user_units WHERE user_id = p_user_id LIMIT 1);
  END IF;

  -- Create default unit
  INSERT INTO units (name, slug, created_by)
  VALUES ('Minha Empresa', 'minha-empresa', p_user_id)
  RETURNING id INTO new_unit_id;

  -- Assign user as owner
  INSERT INTO user_units (user_id, unit_id, is_default, role)
  VALUES (p_user_id, new_unit_id, true, 'owner');

  -- Create default stock categories
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Carnes', '#ef4444', 'Beef', 0, new_unit_id),
    ('Aves', '#f97316', 'Drumstick', 1, new_unit_id),
    ('Frios e Embutidos', '#e11d48', 'Sandwich', 2, new_unit_id),
    ('Bebidas', '#3b82f6', 'Wine', 3, new_unit_id),
    ('Bebidas Alcoólicas', '#6366f1', 'Beer', 4, new_unit_id),
    ('Hortifruti', '#22c55e', 'Salad', 5, new_unit_id),
    ('Laticínios', '#f59e0b', 'Milk', 6, new_unit_id),
    ('Mercearia', '#a855f7', 'ShoppingBasket', 7, new_unit_id),
    ('Pães e Massas', '#d97706', 'Croissant', 8, new_unit_id),
    ('Congelados', '#0ea5e9', 'Snowflake', 9, new_unit_id),
    ('Molhos e Temperos', '#84cc16', 'Flame', 10, new_unit_id),
    ('Descartáveis', '#8b5cf6', 'Package', 11, new_unit_id),
    ('Embalagens', '#7c3aed', 'Box', 12, new_unit_id),
    ('Limpeza', '#06b6d4', 'SprayCan', 13, new_unit_id),
    ('Utensílios', '#14b8a6', 'UtensilsCrossed', 14, new_unit_id),
    ('Gás e Combustível', '#f43f5e', 'Fuel', 15, new_unit_id);

  -- Create default payment settings
  INSERT INTO payment_method_settings (method_key, method_name, settlement_type, settlement_days, settlement_day_of_week, fee_percentage, is_active, create_transaction, user_id, unit_id) VALUES
    ('cash_amount', 'Dinheiro', 'immediate', 0, NULL, 0, true, true, p_user_id, new_unit_id),
    ('debit_amount', 'Débito', 'business_days', 1, NULL, 0.72, true, true, p_user_id, new_unit_id),
    ('credit_amount', 'Crédito', 'business_days', 30, NULL, 2.99, true, true, p_user_id, new_unit_id),
    ('pix_amount', 'Pix', 'immediate', 0, NULL, 0, true, true, p_user_id, new_unit_id),
    ('meal_voucher_amount', 'Vale Refeição', 'business_days', 30, NULL, 3.5, true, true, p_user_id, new_unit_id),
    ('delivery_amount', 'Delivery (iFood)', 'fixed_weekday', 0, 3, 12, true, true, p_user_id, new_unit_id),
    ('signed_account_amount', 'Conta Assinada', 'immediate', 0, NULL, 0, true, false, p_user_id, new_unit_id);

  RETURN new_unit_id;
END;
$function$;
