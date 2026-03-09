-- Composite indexes for digital menu performance
CREATE INDEX IF NOT EXISTS idx_tablet_products_unit_active ON public.tablet_products (unit_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_categories_unit_active ON public.menu_categories (unit_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_groups_unit_active ON public.menu_groups (unit_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_option_groups_unit_active ON public.menu_option_groups (unit_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_options_group_active ON public.menu_options (option_group_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_product_option_groups_product ON public.menu_product_option_groups (product_id);
CREATE INDEX IF NOT EXISTS idx_tablet_order_items_order ON public.tablet_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_tablet_orders_unit_status ON public.tablet_orders (unit_id, status);