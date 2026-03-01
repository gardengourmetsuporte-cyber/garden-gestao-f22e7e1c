CREATE OR REPLACE FUNCTION public.delete_unit_cascade(p_unit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization: only unit owner or super_admin can delete
  IF NOT (
    EXISTS (
      SELECT 1 FROM user_units
      WHERE user_id = auth.uid()
        AND unit_id = p_unit_id
        AND role = 'owner'
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only unit owners can delete units';
  END IF;

  -- Delete all related data in dependency order
  DELETE FROM stock_movements WHERE unit_id = p_unit_id;
  DELETE FROM order_items WHERE unit_id = p_unit_id;
  DELETE FROM orders WHERE unit_id = p_unit_id;
  DELETE FROM supplier_invoices WHERE unit_id = p_unit_id;
  DELETE FROM inventory_items WHERE unit_id = p_unit_id;
  DELETE FROM categories WHERE unit_id = p_unit_id;
  DELETE FROM suppliers WHERE unit_id = p_unit_id;
  DELETE FROM checklist_completions WHERE unit_id = p_unit_id;
  DELETE FROM checklist_items WHERE unit_id = p_unit_id;
  DELETE FROM checklist_subcategories WHERE unit_id = p_unit_id;
  DELETE FROM checklist_sectors WHERE unit_id = p_unit_id;
  DELETE FROM finance_transactions WHERE unit_id = p_unit_id;
  DELETE FROM finance_budgets WHERE unit_id = p_unit_id;
  DELETE FROM finance_categories WHERE unit_id = p_unit_id;
  DELETE FROM finance_accounts WHERE unit_id = p_unit_id;
  DELETE FROM finance_tags WHERE unit_id = p_unit_id;
  DELETE FROM credit_card_invoices WHERE unit_id = p_unit_id;
  DELETE FROM cash_closings WHERE unit_id = p_unit_id;
  DELETE FROM employee_payments WHERE unit_id = p_unit_id;
  DELETE FROM employees WHERE unit_id = p_unit_id;
  DELETE FROM reward_redemptions WHERE unit_id = p_unit_id;
  DELETE FROM reward_products WHERE unit_id = p_unit_id;
  DELETE FROM manager_tasks WHERE unit_id = p_unit_id;
  DELETE FROM manager_appointments WHERE unit_id = p_unit_id;
  DELETE FROM payment_method_settings WHERE unit_id = p_unit_id;
  DELETE FROM notifications WHERE unit_id = p_unit_id;
  DELETE FROM user_units WHERE unit_id = p_unit_id;
  DELETE FROM units WHERE id = p_unit_id;
END;
$$;