
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_user_id uuid,
  p_unit_id uuid,
  p_is_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_start_date date;
  v_end_date date;
  v_today date;
  v_week_later date;
  v_result jsonb;
  v_critical_items int;
  v_items_count int;
  v_pending_orders int;
  v_pending_redemptions int;
  v_pending_closings int;
  v_recipes_count int;
  v_users_count int;
  v_total_income numeric;
  v_total_expense numeric;
  v_pending_expenses numeric;
  v_bills_due jsonb;
BEGIN
  -- Check access
  IF NOT user_has_unit_access(p_user_id, p_unit_id) THEN
    RETURN jsonb_build_object('error', 'access_denied');
  END IF;

  v_today := CURRENT_DATE;
  v_start_date := date_trunc('month', v_today)::date;
  v_end_date := (date_trunc('month', v_today) + interval '1 month' - interval '1 day')::date;
  v_week_later := v_today + 7;

  -- Critical inventory items
  SELECT COUNT(*) INTO v_critical_items
  FROM inventory_items
  WHERE unit_id = p_unit_id AND current_stock <= min_stock;

  -- Total inventory items
  SELECT COUNT(*) INTO v_items_count
  FROM inventory_items WHERE unit_id = p_unit_id;

  -- Pending orders
  SELECT COUNT(*) INTO v_pending_orders
  FROM orders WHERE unit_id = p_unit_id AND status IN ('draft', 'sent');

  -- Pending redemptions (admin only)
  IF p_is_admin THEN
    SELECT COUNT(*) INTO v_pending_redemptions
    FROM reward_redemptions WHERE status = 'pending';

    SELECT COUNT(*) INTO v_pending_closings
    FROM cash_closings WHERE unit_id = p_unit_id AND status = 'pending';

    SELECT COUNT(*) INTO v_users_count FROM profiles;
  ELSE
    v_pending_redemptions := 0;
    v_pending_closings := 0;
    v_users_count := 0;
  END IF;

  -- Recipes count
  SELECT COUNT(*) INTO v_recipes_count FROM recipes WHERE is_active = true;

  -- Monthly income
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
  FROM finance_transactions
  WHERE user_id = p_user_id AND unit_id = p_unit_id
    AND type = 'income' AND is_paid = true
    AND date >= v_start_date AND date <= v_end_date;

  -- Monthly expense
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
  FROM finance_transactions
  WHERE user_id = p_user_id AND unit_id = p_unit_id
    AND type IN ('expense', 'credit_card') AND is_paid = true
    AND date >= v_start_date AND date <= v_end_date;

  -- Pending expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_expenses
  FROM finance_transactions
  WHERE user_id = p_user_id AND unit_id = p_unit_id
    AND type IN ('expense', 'credit_card') AND is_paid = false
    AND date >= v_start_date AND date <= v_end_date;

  -- Bills due in next 7 days (with category info via parent)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ft.id,
    'description', ft.description,
    'amount', ft.amount,
    'date', ft.date,
    'categoryName', COALESCE(parent_cat.name, cat.name, 'Sem categoria'),
    'categoryIcon', COALESCE(parent_cat.icon, cat.icon, 'Receipt'),
    'categoryColor', COALESCE(parent_cat.color, cat.color, '#888888')
  ) ORDER BY ft.date), '[]'::jsonb)
  INTO v_bills_due
  FROM finance_transactions ft
  LEFT JOIN finance_categories cat ON cat.id = ft.category_id
  LEFT JOIN finance_categories parent_cat ON parent_cat.id = cat.parent_id
  WHERE ft.user_id = p_user_id AND ft.unit_id = p_unit_id
    AND ft.type IN ('expense', 'credit_card') AND ft.is_paid = false
    AND ft.date >= v_today AND ft.date <= v_week_later;

  RETURN jsonb_build_object(
    'criticalItems', v_critical_items,
    'pendingOrders', v_pending_orders,
    'pendingRedemptions', v_pending_redemptions,
    'pendingClosings', v_pending_closings,
    'recipesCount', v_recipes_count,
    'usersCount', v_users_count,
    'itemsCount', v_items_count,
    'monthBalance', v_total_income - v_total_expense,
    'pendingExpenses', v_pending_expenses,
    'billsDueSoon', v_bills_due
  );
END;
$$;
