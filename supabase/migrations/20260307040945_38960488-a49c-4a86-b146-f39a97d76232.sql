
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
  v_slug text;
  fc_id uuid;
  sector_id uuid;
  sub_id uuid;
  al_full_id uuid;
  al_employee_id uuid;
  all_modules text[];
BEGIN
  IF EXISTS (SELECT 1 FROM user_units WHERE user_id = p_user_id) THEN
    RETURN (SELECT unit_id FROM user_units WHERE user_id = p_user_id LIMIT 1);
  END IF;

  v_slug := 'minha-empresa';
  WHILE EXISTS (SELECT 1 FROM units WHERE slug = v_slug) LOOP
    v_slug := 'minha-empresa-' || substr(gen_random_uuid()::text, 1, 8);
  END LOOP;

  INSERT INTO units (name, slug, created_by)
  VALUES ('Minha Empresa', v_slug, p_user_id)
  RETURNING id INTO new_unit_id;

  INSERT INTO user_units (user_id, unit_id, is_default, role)
  VALUES (p_user_id, new_unit_id, true, 'owner');

  -- =============================================
  -- 0. DEFAULT ACCESS LEVELS
  -- =============================================
  all_modules := ARRAY[
    'agenda','agenda.view','agenda.create','agenda.appointments',
    'copilot',
    'finance','finance.view','finance.create','finance.delete','finance.accounts','finance.categories','finance.reports','finance.planning','finance.credit_cards','finance.backup',
    'customers','customers.view','customers.create','customers.import','customers.delete',
    'inventory','inventory.view','inventory.create','inventory.delete','inventory.movements','inventory.invoices','inventory.smart_receiving',
    'orders','orders.view','orders.create','orders.receive','orders.quotations',
    'checklists','checklists.complete','checklists.manage','checklists.contest','checklists.history',
    'cash-closing','cash-closing.create','cash-closing.validate','cash-closing.view_history','cash-closing.integrate',
    'deliveries','deliveries.view','deliveries.create','deliveries.manage',
    'recipes','recipes.view','recipes.create','recipes.costs',
    'employees','employees.view','employees.manage','employees.payments','employees.schedule','employees.time_tracking','employees.performance','employees.bonus',
    'rewards','rewards.shop','rewards.manage','rewards.approve',
    'ranking',
    'personal-finance',
    'marketing','marketing.calendar','marketing.create','marketing.ai','marketing.brand_core',
    'menu-admin','menu-admin.view','menu-admin.products','menu-admin.categories','menu-admin.options','menu-admin.orders','menu-admin.tables','menu-admin.pdv','menu-admin.game',
    'whatsapp','whatsapp.conversations','whatsapp.settings','whatsapp.knowledge','whatsapp.orders',
    'settings','settings.team','settings.access_levels','settings.stock_categories','settings.suppliers','settings.units','settings.payment_methods','settings.recipe_costs','settings.rewards','settings.medals','settings.notifications','settings.profile','settings.audit','settings.checklist_management'
  ];

  INSERT INTO access_levels (unit_id, name, description, modules, is_default)
  VALUES (new_unit_id, 'Acesso Completo', 'Acesso total a todos os módulos', all_modules, false)
  RETURNING id INTO al_full_id;

  INSERT INTO access_levels (unit_id, name, description, modules, is_default)
  VALUES (new_unit_id, 'Funcionário', 'Acesso operacional básico para funcionários',
    ARRAY['checklists','checklists.complete','checklists.history','ranking','rewards','rewards.shop','cash-closing','cash-closing.create','deliveries','deliveries.view','deliveries.create','recipes','recipes.view','personal-finance'],
    true)
  RETURNING id INTO al_employee_id;

  UPDATE user_units SET access_level_id = al_full_id
  WHERE user_id = p_user_id AND unit_id = new_unit_id;

  -- =============================================
  -- 1. FINANCIAL ACCOUNTS
  -- =============================================
  INSERT INTO finance_accounts (user_id, name, type, balance, color, icon, unit_id) VALUES
    (p_user_id, 'Carteira', 'wallet', 0, '#3b82f6', 'Wallet', new_unit_id),
    (p_user_id, 'Banco', 'bank', 0, '#22c55e', 'Building2', new_unit_id);

  -- =============================================
  -- 2. FINANCIAL CATEGORIES
  -- =============================================
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Matéria-prima', 'expense', 'ShoppingCart', '#ef4444', true, 0, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Carnes', 'expense', 'Soup', '#ef4444', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Frios', 'expense', 'Droplets', '#60a5fa', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Bebidas', 'expense', 'Wine', '#3b82f6', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Panificação', 'expense', 'ChefHat', '#f59e0b', true, 3, fc_id, new_unit_id),
    (p_user_id, 'Hortifruti', 'expense', 'Leaf', '#22c55e', true, 4, fc_id, new_unit_id),
    (p_user_id, 'Mercado', 'expense', 'ShoppingBag', '#a855f7', true, 5, fc_id, new_unit_id),
    (p_user_id, 'Embalagens', 'expense', 'Package', '#8b5cf6', true, 6, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Despesas Administrativas', 'expense', 'Building2', '#f59e0b', true, 1, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Energia', 'expense', 'Zap', '#eab308', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Água', 'expense', 'Droplets', '#38bdf8', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Aluguel', 'expense', 'House', '#f59e0b', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Limpeza', 'expense', 'Bath', '#06b6d4', true, 3, fc_id, new_unit_id),
    (p_user_id, 'Internet', 'expense', 'Wifi', '#8b5cf6', true, 4, fc_id, new_unit_id),
    (p_user_id, 'Telefone', 'expense', 'Phone', '#64748b', true, 5, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Folha de Pagamento', 'expense', 'Users', '#3b82f6', true, 2, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Salários', 'expense', 'Banknote', '#3b82f6', true, 0, fc_id, new_unit_id),
    (p_user_id, 'FGTS', 'expense', 'Shield', '#22c55e', true, 1, fc_id, new_unit_id),
    (p_user_id, 'INSS', 'expense', 'Shield', '#14b8a6', true, 2, fc_id, new_unit_id),
    (p_user_id, '13º Salário', 'expense', 'Gift', '#f59e0b', true, 3, fc_id, new_unit_id),
    (p_user_id, 'Férias', 'expense', 'Sun', '#f97316', true, 4, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Pró-labore', 'expense', 'Briefcase', '#84cc16', true, 3, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Taxas Operacionais', 'expense', 'Receipt', '#ec4899', true, 4, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'App Delivery', 'expense', 'Truck', '#f97316', true, 0, fc_id, new_unit_id),
    (p_user_id, 'PDV', 'expense', 'Monitor', '#8b5cf6', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Tarifa Bancária', 'expense', 'Landmark', '#64748b', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Maquininha', 'expense', 'CreditCard', '#ec4899', true, 3, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Impostos', 'expense', 'FileText', '#f43f5e', true, 5, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'DAS', 'expense', 'FileText', '#f43f5e', true, 0, fc_id, new_unit_id),
    (p_user_id, 'IPTU', 'expense', 'Building2', '#f43f5e', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Alvará', 'expense', 'FileCheck', '#f43f5e', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Outros Impostos', 'expense', 'FileText', '#f43f5e', true, 3, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Financiamentos', 'expense', 'Landmark', '#6366f1', true, 6, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Investimentos', 'expense', 'TrendingUp', '#0ea5e9', true, 7, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Equipamentos', 'expense', 'Wrench', '#0ea5e9', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Marketing', 'expense', 'Megaphone', '#0ea5e9', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Reformas', 'expense', 'Hammer', '#0ea5e9', true, 2, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Vendas Balcão', 'income', 'Store', '#22c55e', true, 0, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Dinheiro', 'income', 'Banknote', '#22c55e', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Débito', 'income', 'CreditCard', '#3b82f6', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Crédito', 'income', 'CreditCard', '#8b5cf6', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Pix', 'income', 'QrCode', '#06b6d4', true, 3, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Vendas Delivery', 'income', 'Truck', '#10b981', true, 1, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'iFood', 'income', 'Truck', '#ef4444', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Rappi', 'income', 'Truck', '#f97316', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Próprio', 'income', 'Truck', '#10b981', true, 2, fc_id, new_unit_id);

  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Outros', 'income', 'MoreHorizontal', '#64748b', true, 2, new_unit_id);

  -- =============================================
  -- 3. STOCK CATEGORIES ONLY (no items — user picks a template)
  -- =============================================
  -- Categories are NOT pre-created either; they come with the template selection

  -- =============================================
  -- 4. CHECKLIST SECTORS, SUBCATEGORIES & ITEMS
  -- =============================================
  INSERT INTO checklist_sectors (name, color, icon, sort_order, unit_id, scope) VALUES
    ('Cozinha', '#ef4444', 'Flame', 0, new_unit_id, 'standard') RETURNING id INTO sector_id;
  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Equipamentos', sector_id, 0, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, subcategory_id, checklist_type, points, sort_order, unit_id) VALUES
    ('Ligar fogão e fornos', sub_id, 'abertura', 5, 0, new_unit_id),
    ('Verificar temperatura das geladeiras', sub_id, 'abertura', 5, 1, new_unit_id),
    ('Ligar chapas e fritadeiras', sub_id, 'abertura', 5, 2, new_unit_id),
    ('Desligar fogão e fornos', sub_id, 'fechamento', 5, 3, new_unit_id),
    ('Limpar chapas e fritadeiras', sub_id, 'fechamento', 5, 4, new_unit_id),
    ('Verificar temperatura das geladeiras (fechamento)', sub_id, 'fechamento', 5, 5, new_unit_id);
  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Higiene', sector_id, 1, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, subcategory_id, checklist_type, points, sort_order, unit_id) VALUES
    ('Higienizar bancadas e superfícies', sub_id, 'abertura', 5, 0, new_unit_id),
    ('Verificar lixeiras limpas', sub_id, 'abertura', 5, 1, new_unit_id),
    ('Lavar e sanitizar bancadas', sub_id, 'fechamento', 5, 2, new_unit_id),
    ('Retirar lixo da cozinha', sub_id, 'fechamento', 5, 3, new_unit_id),
    ('Limpar piso da cozinha', sub_id, 'fechamento', 5, 4, new_unit_id);

  INSERT INTO checklist_sectors (name, color, icon, sort_order, unit_id, scope) VALUES
    ('Salão', '#3b82f6', 'Armchair', 1, new_unit_id, 'standard') RETURNING id INTO sector_id;
  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Ambiente', sector_id, 0, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, subcategory_id, checklist_type, points, sort_order, unit_id) VALUES
    ('Ligar ar-condicionado/ventiladores', sub_id, 'abertura', 5, 0, new_unit_id),
    ('Verificar iluminação', sub_id, 'abertura', 5, 1, new_unit_id),
    ('Organizar mesas e cadeiras', sub_id, 'abertura', 5, 2, new_unit_id),
    ('Desligar ar-condicionado', sub_id, 'fechamento', 5, 3, new_unit_id),
    ('Limpar mesas e cadeiras', sub_id, 'fechamento', 5, 4, new_unit_id),
    ('Varrer e passar pano no salão', sub_id, 'fechamento', 5, 5, new_unit_id);
  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Atendimento', sector_id, 1, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, subcategory_id, checklist_type, points, sort_order, unit_id) VALUES
    ('Preparar cardápios nas mesas', sub_id, 'abertura', 5, 0, new_unit_id),
    ('Abastecer porta-guardanapos', sub_id, 'abertura', 5, 1, new_unit_id),
    ('Recolher cardápios', sub_id, 'fechamento', 5, 2, new_unit_id),
    ('Reabastecer molheiras e sachês', sub_id, 'fechamento', 5, 3, new_unit_id);

  INSERT INTO checklist_sectors (name, color, icon, sort_order, unit_id, scope) VALUES
    ('Estoque', '#22c55e', 'Package', 2, new_unit_id, 'standard') RETURNING id INTO sector_id;
  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Conferência', sector_id, 0, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, subcategory_id, checklist_type, points, sort_order, unit_id) VALUES
    ('Conferir validade dos produtos', sub_id, 'abertura', 5, 0, new_unit_id),
    ('Verificar itens em estoque mínimo', sub_id, 'abertura', 5, 1, new_unit_id),
    ('Registrar produtos que acabaram', sub_id, 'fechamento', 5, 2, new_unit_id),
    ('Organizar câmara fria', sub_id, 'fechamento', 5, 3, new_unit_id);

  INSERT INTO checklist_sectors (name, color, icon, sort_order, unit_id, scope) VALUES
    ('Caixa', '#f59e0b', 'DollarSign', 3, new_unit_id, 'standard') RETURNING id INTO sector_id;
  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Financeiro', sector_id, 0, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, subcategory_id, checklist_type, points, sort_order, unit_id) VALUES
    ('Conferir troco inicial', sub_id, 'abertura', 5, 0, new_unit_id),
    ('Ligar máquinas de cartão', sub_id, 'abertura', 5, 1, new_unit_id),
    ('Verificar bobina de impressora', sub_id, 'abertura', 5, 2, new_unit_id),
    ('Fechar caixa do dia', sub_id, 'fechamento', 5, 3, new_unit_id),
    ('Conferir sangrias e suprimentos', sub_id, 'fechamento', 5, 4, new_unit_id),
    ('Guardar dinheiro no cofre', sub_id, 'fechamento', 5, 5, new_unit_id);

  INSERT INTO checklist_sectors (name, color, icon, sort_order, unit_id, scope) VALUES
    ('Fachada e Externos', '#8b5cf6', 'Store', 4, new_unit_id, 'standard') RETURNING id INTO sector_id;
  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Estrutura', sector_id, 0, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, subcategory_id, checklist_type, points, sort_order, unit_id) VALUES
    ('Abrir portas e portões', sub_id, 'abertura', 5, 0, new_unit_id),
    ('Ligar letreiro/luminoso', sub_id, 'abertura', 5, 1, new_unit_id),
    ('Verificar limpeza da calçada', sub_id, 'abertura', 5, 2, new_unit_id),
    ('Fechar portas e portões', sub_id, 'fechamento', 5, 3, new_unit_id),
    ('Desligar letreiro', sub_id, 'fechamento', 5, 4, new_unit_id),
    ('Verificar fechamento de janelas', sub_id, 'fechamento', 5, 5, new_unit_id);

  -- =============================================
  -- 5. PAYMENT SETTINGS
  -- =============================================
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
