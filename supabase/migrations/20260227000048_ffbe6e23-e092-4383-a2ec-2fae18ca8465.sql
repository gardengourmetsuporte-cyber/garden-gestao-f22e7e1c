
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
  -- category IDs for inventory items
  cat_carnes uuid;
  cat_aves uuid;
  cat_frios uuid;
  cat_bebidas uuid;
  cat_bebidas_alc uuid;
  cat_hortifruti uuid;
  cat_laticinios uuid;
  cat_mercearia uuid;
  cat_paes uuid;
  cat_molhos uuid;
  cat_descartaveis uuid;
  cat_limpeza uuid;
  -- finance category IDs
  fc_id uuid;
  -- checklist sector/sub IDs
  sector_id uuid;
  sub_id uuid;
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

  -- =============================================
  -- 1. FINANCIAL ACCOUNTS (Carteira + Banco)
  -- =============================================
  INSERT INTO finance_accounts (user_id, name, type, balance, color, icon, unit_id) VALUES
    (p_user_id, 'Carteira', 'wallet', 0, '#3b82f6', 'Wallet', new_unit_id),
    (p_user_id, 'Banco', 'bank', 0, '#22c55e', 'Building2', new_unit_id);

  -- =============================================
  -- 2. FINANCIAL CATEGORIES (expense + income with subcategories)
  -- =============================================

  -- EXPENSE: Matéria-prima
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Matéria-prima', 'expense', 'ShoppingCart', '#ef4444', true, 0, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Carnes', 'expense', 'ShoppingCart', '#ef4444', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Frios', 'expense', 'ShoppingCart', '#ef4444', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Bebidas', 'expense', 'ShoppingCart', '#ef4444', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Panificação', 'expense', 'ShoppingCart', '#ef4444', true, 3, fc_id, new_unit_id),
    (p_user_id, 'Hortifruti', 'expense', 'ShoppingCart', '#ef4444', true, 4, fc_id, new_unit_id),
    (p_user_id, 'Mercado', 'expense', 'ShoppingCart', '#ef4444', true, 5, fc_id, new_unit_id),
    (p_user_id, 'Embalagens', 'expense', 'ShoppingCart', '#ef4444', true, 6, fc_id, new_unit_id);

  -- EXPENSE: Despesas Administrativas
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Despesas Administrativas', 'expense', 'Building2', '#f59e0b', true, 1, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Energia', 'expense', 'Building2', '#f59e0b', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Água', 'expense', 'Building2', '#f59e0b', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Aluguel', 'expense', 'Building2', '#f59e0b', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Limpeza', 'expense', 'Building2', '#f59e0b', true, 3, fc_id, new_unit_id),
    (p_user_id, 'Internet', 'expense', 'Building2', '#f59e0b', true, 4, fc_id, new_unit_id),
    (p_user_id, 'Telefone', 'expense', 'Building2', '#f59e0b', true, 5, fc_id, new_unit_id);

  -- EXPENSE: Folha de Pagamento
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Folha de Pagamento', 'expense', 'Users', '#3b82f6', true, 2, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Salários', 'expense', 'Users', '#3b82f6', true, 0, fc_id, new_unit_id),
    (p_user_id, 'FGTS', 'expense', 'Users', '#3b82f6', true, 1, fc_id, new_unit_id),
    (p_user_id, 'INSS', 'expense', 'Users', '#3b82f6', true, 2, fc_id, new_unit_id),
    (p_user_id, '13º Salário', 'expense', 'Users', '#3b82f6', true, 3, fc_id, new_unit_id),
    (p_user_id, 'Férias', 'expense', 'Users', '#3b82f6', true, 4, fc_id, new_unit_id);

  -- EXPENSE: Pró-labore
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Pró-labore', 'expense', 'UserCheck', '#8b5cf6', true, 3, new_unit_id);

  -- EXPENSE: Taxas Operacionais
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Taxas Operacionais', 'expense', 'CreditCard', '#ec4899', true, 4, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'App Delivery', 'expense', 'CreditCard', '#ec4899', true, 0, fc_id, new_unit_id),
    (p_user_id, 'PDV', 'expense', 'CreditCard', '#ec4899', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Tarifa Bancária', 'expense', 'CreditCard', '#ec4899', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Maquininha', 'expense', 'CreditCard', '#ec4899', true, 3, fc_id, new_unit_id);

  -- EXPENSE: Impostos
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Impostos', 'expense', 'FileText', '#f43f5e', true, 5, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'DAS', 'expense', 'FileText', '#f43f5e', true, 0, fc_id, new_unit_id),
    (p_user_id, 'IPTU', 'expense', 'FileText', '#f43f5e', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Alvará', 'expense', 'FileText', '#f43f5e', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Outros Impostos', 'expense', 'FileText', '#f43f5e', true, 3, fc_id, new_unit_id);

  -- EXPENSE: Financiamentos
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Financiamentos', 'expense', 'Landmark', '#6366f1', true, 6, new_unit_id);

  -- EXPENSE: Investimentos
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Investimentos', 'expense', 'TrendingUp', '#0ea5e9', true, 7, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Equipamentos', 'expense', 'TrendingUp', '#0ea5e9', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Marketing', 'expense', 'TrendingUp', '#0ea5e9', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Reformas', 'expense', 'TrendingUp', '#0ea5e9', true, 2, fc_id, new_unit_id);

  -- INCOME: Vendas Balcão
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Vendas Balcão', 'income', 'Store', '#22c55e', true, 0, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'Dinheiro', 'income', 'Store', '#22c55e', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Débito', 'income', 'Store', '#22c55e', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Crédito', 'income', 'Store', '#22c55e', true, 2, fc_id, new_unit_id),
    (p_user_id, 'Pix', 'income', 'Store', '#22c55e', true, 3, fc_id, new_unit_id);

  -- INCOME: Vendas Delivery
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Vendas Delivery', 'income', 'Truck', '#10b981', true, 1, new_unit_id) RETURNING id INTO fc_id;
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, parent_id, unit_id) VALUES
    (p_user_id, 'iFood', 'income', 'Truck', '#10b981', true, 0, fc_id, new_unit_id),
    (p_user_id, 'Rappi', 'income', 'Truck', '#10b981', true, 1, fc_id, new_unit_id),
    (p_user_id, 'Próprio', 'income', 'Truck', '#10b981', true, 2, fc_id, new_unit_id);

  -- INCOME: Outros
  INSERT INTO finance_categories (user_id, name, type, icon, color, is_system, sort_order, unit_id)
  VALUES (p_user_id, 'Outros', 'income', 'MoreHorizontal', '#64748b', true, 2, new_unit_id);

  -- =============================================
  -- 3. STOCK CATEGORIES + INVENTORY ITEMS
  -- =============================================

  -- Create default stock categories and capture IDs
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Carnes', '#ef4444', 'Beef', 0, new_unit_id) RETURNING id INTO cat_carnes;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Aves', '#f97316', 'Drumstick', 1, new_unit_id) RETURNING id INTO cat_aves;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Frios e Embutidos', '#e11d48', 'Sandwich', 2, new_unit_id) RETURNING id INTO cat_frios;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Bebidas', '#3b82f6', 'Wine', 3, new_unit_id) RETURNING id INTO cat_bebidas;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Bebidas Alcoólicas', '#6366f1', 'Beer', 4, new_unit_id) RETURNING id INTO cat_bebidas_alc;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Hortifruti', '#22c55e', 'Salad', 5, new_unit_id) RETURNING id INTO cat_hortifruti;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Laticínios', '#f59e0b', 'Milk', 6, new_unit_id) RETURNING id INTO cat_laticinios;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Mercearia', '#a855f7', 'ShoppingBasket', 7, new_unit_id) RETURNING id INTO cat_mercearia;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Pães e Massas', '#d97706', 'Croissant', 8, new_unit_id) RETURNING id INTO cat_paes;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Congelados', '#0ea5e9', 'Snowflake', 9, new_unit_id);
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Molhos e Temperos', '#84cc16', 'Flame', 10, new_unit_id) RETURNING id INTO cat_molhos;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Descartáveis', '#8b5cf6', 'Package', 11, new_unit_id) RETURNING id INTO cat_descartaveis;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Embalagens', '#7c3aed', 'Box', 12, new_unit_id);
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Limpeza', '#06b6d4', 'SprayCan', 13, new_unit_id) RETURNING id INTO cat_limpeza;
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Utensílios', '#14b8a6', 'UtensilsCrossed', 14, new_unit_id);
  INSERT INTO categories (name, color, icon, sort_order, unit_id) VALUES
    ('Gás e Combustível', '#f43f5e', 'Fuel', 15, new_unit_id);

  -- Insert default inventory items
  INSERT INTO inventory_items (name, unit_type, current_stock, min_stock, category_id, unit_id) VALUES
    -- Carnes
    ('Picanha', 'kg', 0, 5, cat_carnes, new_unit_id),
    ('Contra-filé', 'kg', 0, 5, cat_carnes, new_unit_id),
    ('Alcatra', 'kg', 0, 5, cat_carnes, new_unit_id),
    ('Fraldinha', 'kg', 0, 3, cat_carnes, new_unit_id),
    ('Costela', 'kg', 0, 5, cat_carnes, new_unit_id),
    ('Carne moída', 'kg', 0, 5, cat_carnes, new_unit_id),
    ('Linguiça', 'kg', 0, 3, cat_carnes, new_unit_id),
    -- Aves
    ('Peito de frango', 'kg', 0, 5, cat_aves, new_unit_id),
    ('Coxa/Sobrecoxa', 'kg', 0, 5, cat_aves, new_unit_id),
    ('Filé de frango', 'kg', 0, 3, cat_aves, new_unit_id),
    -- Frios e Embutidos
    ('Presunto', 'kg', 0, 2, cat_frios, new_unit_id),
    ('Mussarela', 'kg', 0, 3, cat_frios, new_unit_id),
    ('Bacon', 'kg', 0, 2, cat_frios, new_unit_id),
    ('Calabresa', 'kg', 0, 2, cat_frios, new_unit_id),
    -- Bebidas
    ('Coca-Cola 2L', 'unidade', 0, 10, cat_bebidas, new_unit_id),
    ('Guaraná 2L', 'unidade', 0, 10, cat_bebidas, new_unit_id),
    ('Água mineral', 'unidade', 0, 20, cat_bebidas, new_unit_id),
    ('Suco natural', 'litro', 0, 5, cat_bebidas, new_unit_id),
    -- Bebidas Alcoólicas
    ('Cerveja lata', 'unidade', 0, 24, cat_bebidas_alc, new_unit_id),
    ('Cerveja long neck', 'unidade', 0, 12, cat_bebidas_alc, new_unit_id),
    -- Hortifruti
    ('Tomate', 'kg', 0, 5, cat_hortifruti, new_unit_id),
    ('Cebola', 'kg', 0, 5, cat_hortifruti, new_unit_id),
    ('Alface', 'unidade', 0, 10, cat_hortifruti, new_unit_id),
    ('Batata', 'kg', 0, 10, cat_hortifruti, new_unit_id),
    ('Limão', 'kg', 0, 3, cat_hortifruti, new_unit_id),
    ('Alho', 'kg', 0, 1, cat_hortifruti, new_unit_id),
    -- Laticínios
    ('Leite integral', 'litro', 0, 10, cat_laticinios, new_unit_id),
    ('Creme de leite', 'unidade', 0, 5, cat_laticinios, new_unit_id),
    ('Manteiga', 'unidade', 0, 3, cat_laticinios, new_unit_id),
    ('Requeijão', 'unidade', 0, 3, cat_laticinios, new_unit_id),
    -- Mercearia
    ('Arroz 5kg', 'unidade', 0, 3, cat_mercearia, new_unit_id),
    ('Feijão 1kg', 'unidade', 0, 5, cat_mercearia, new_unit_id),
    ('Óleo soja', 'unidade', 0, 5, cat_mercearia, new_unit_id),
    ('Açúcar', 'kg', 0, 5, cat_mercearia, new_unit_id),
    ('Sal', 'kg', 0, 2, cat_mercearia, new_unit_id),
    ('Farinha de trigo', 'kg', 0, 5, cat_mercearia, new_unit_id),
    -- Pães e Massas
    ('Pão francês', 'unidade', 0, 50, cat_paes, new_unit_id),
    ('Pão de hambúrguer', 'unidade', 0, 30, cat_paes, new_unit_id),
    ('Massa de pizza', 'unidade', 0, 10, cat_paes, new_unit_id),
    -- Molhos e Temperos
    ('Ketchup', 'unidade', 0, 3, cat_molhos, new_unit_id),
    ('Mostarda', 'unidade', 0, 3, cat_molhos, new_unit_id),
    ('Maionese', 'unidade', 0, 3, cat_molhos, new_unit_id),
    ('Molho de tomate', 'unidade', 0, 5, cat_molhos, new_unit_id),
    ('Azeite', 'unidade', 0, 2, cat_molhos, new_unit_id),
    -- Descartáveis
    ('Copo descartável 300ml', 'unidade', 0, 100, cat_descartaveis, new_unit_id),
    ('Guardanapo', 'unidade', 0, 200, cat_descartaveis, new_unit_id),
    ('Embalagem marmitex', 'unidade', 0, 50, cat_descartaveis, new_unit_id),
    -- Limpeza
    ('Detergente', 'unidade', 0, 5, cat_limpeza, new_unit_id),
    ('Água sanitária', 'unidade', 0, 3, cat_limpeza, new_unit_id),
    ('Esponja', 'unidade', 0, 10, cat_limpeza, new_unit_id);

  -- =============================================
  -- 4. CHECKLIST SECTORS, SUBCATEGORIES & ITEMS
  -- =============================================

  -- Setor: Cozinha
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

  -- Setor: Salão
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

  -- Setor: Estoque
  INSERT INTO checklist_sectors (name, color, icon, sort_order, unit_id, scope) VALUES
    ('Estoque', '#22c55e', 'Package', 2, new_unit_id, 'standard') RETURNING id INTO sector_id;

  INSERT INTO checklist_subcategories (name, sector_id, sort_order, unit_id, scope) VALUES
    ('Conferência', sector_id, 0, new_unit_id, 'standard') RETURNING id INTO sub_id;
  INSERT INTO checklist_items (name, subcategory_id, checklist_type, points, sort_order, unit_id) VALUES
    ('Conferir validade dos produtos', sub_id, 'abertura', 5, 0, new_unit_id),
    ('Verificar itens em estoque mínimo', sub_id, 'abertura', 5, 1, new_unit_id),
    ('Registrar produtos que acabaram', sub_id, 'fechamento', 5, 2, new_unit_id),
    ('Organizar câmara fria', sub_id, 'fechamento', 5, 3, new_unit_id);

  -- Setor: Caixa
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

  -- Setor: Fachada e Externos
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
  -- 5. PAYMENT SETTINGS (existing)
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
