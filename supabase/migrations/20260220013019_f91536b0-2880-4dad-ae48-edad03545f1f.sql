
-- ============================================
-- MIGRAÇÃO DE SEGURANÇA MASSIVA
-- Corrige políticas RLS permissivas e storage
-- ============================================

-- ============================================
-- 1. TABELAS INTERNAS: Trocar USING(true) por is_authenticated()
-- Categories, checklist_items, checklist_sectors, checklist_subcategories
-- ============================================

-- categories: SELECT era USING(true), mudar para is_authenticated()
DROP POLICY IF EXISTS "Authenticated can view categories" ON public.categories;
CREATE POLICY "Authenticated can view categories"
  ON public.categories FOR SELECT TO authenticated
  USING (is_authenticated());

-- Adicionar DELETE para admins em categories (faltava)
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- checklist_items: SELECT era USING(true)
DROP POLICY IF EXISTS "Authenticated can view checklist_items" ON public.checklist_items;
CREATE POLICY "Authenticated can view checklist_items"
  ON public.checklist_items FOR SELECT TO authenticated
  USING (is_authenticated());

-- checklist_items: ALL for admins tinha WITH CHECK (<nil>), recriar com check explícito
DROP POLICY IF EXISTS "Admins can manage checklist_items" ON public.checklist_items;
CREATE POLICY "Admins can manage checklist_items"
  ON public.checklist_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- checklist_sectors: SELECT era USING(true)
DROP POLICY IF EXISTS "Authenticated can view sectors" ON public.checklist_sectors;
CREATE POLICY "Authenticated can view sectors"
  ON public.checklist_sectors FOR SELECT TO authenticated
  USING (is_authenticated());

-- checklist_sectors: ALL for admins - recriar com check explícito
DROP POLICY IF EXISTS "Admins can manage sectors" ON public.checklist_sectors;
CREATE POLICY "Admins can manage sectors"
  ON public.checklist_sectors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- checklist_subcategories: SELECT era USING(true)
DROP POLICY IF EXISTS "Authenticated can view subcategories" ON public.checklist_subcategories;
CREATE POLICY "Authenticated can view subcategories"
  ON public.checklist_subcategories FOR SELECT TO authenticated
  USING (is_authenticated());

-- checklist_subcategories: ALL for admins - recriar com check explícito
DROP POLICY IF EXISTS "Admins can manage subcategories" ON public.checklist_subcategories;
CREATE POLICY "Admins can manage subcategories"
  ON public.checklist_subcategories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- inventory_items: SELECT era USING(true)
DROP POLICY IF EXISTS "Authenticated can view items" ON public.inventory_items;
CREATE POLICY "Authenticated can view items"
  ON public.inventory_items FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 2. TABELAS DE RECEITAS: restringir a autenticados
-- ============================================

-- recipe_categories: verificar se tem SELECT público
DROP POLICY IF EXISTS "Public can view recipe_categories" ON public.recipe_categories;
DROP POLICY IF EXISTS "Authenticated can view recipe_categories" ON public.recipe_categories;
CREATE POLICY "Authenticated can view recipe_categories"
  ON public.recipe_categories FOR SELECT TO authenticated
  USING (is_authenticated());

-- recipes: verificar
DROP POLICY IF EXISTS "Public can view recipes" ON public.recipes;
DROP POLICY IF EXISTS "Authenticated can view recipes" ON public.recipes;
CREATE POLICY "Authenticated can view recipes"
  ON public.recipes FOR SELECT TO authenticated
  USING (is_authenticated());

-- recipe_ingredients
DROP POLICY IF EXISTS "Public can view recipe_ingredients" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Authenticated can view recipe_ingredients" ON public.recipe_ingredients;
CREATE POLICY "Authenticated can view recipe_ingredients"
  ON public.recipe_ingredients FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 3. REWARD PRODUCTS: restringir a autenticados
-- ============================================

DROP POLICY IF EXISTS "Public can view reward_products" ON public.reward_products;
DROP POLICY IF EXISTS "Authenticated can view reward products" ON public.reward_products;
CREATE POLICY "Authenticated can view reward products"
  ON public.reward_products FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 4. TABELAS DE WHATSAPP: restringir a admins
-- ============================================

-- whatsapp_channels: credenciais API - SOMENTE admins
DROP POLICY IF EXISTS "Admins can manage channels" ON public.whatsapp_channels;
DROP POLICY IF EXISTS "Public can view channels" ON public.whatsapp_channels;
CREATE POLICY "Admins can manage channels"
  ON public.whatsapp_channels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- whatsapp_messages: participantes autenticados
DROP POLICY IF EXISTS "Public can view whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Authenticated can view whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Authenticated can view whatsapp_messages"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated can insert whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Authenticated can insert whatsapp_messages"
  ON public.whatsapp_messages FOR INSERT TO authenticated
  WITH CHECK (is_authenticated());

-- whatsapp_contacts
DROP POLICY IF EXISTS "Public can view whatsapp_contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Authenticated can view whatsapp_contacts" ON public.whatsapp_contacts;
CREATE POLICY "Authenticated can view whatsapp_contacts"
  ON public.whatsapp_contacts FOR SELECT TO authenticated
  USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated can manage whatsapp_contacts" ON public.whatsapp_contacts;
CREATE POLICY "Authenticated can manage whatsapp_contacts"
  ON public.whatsapp_contacts FOR ALL TO authenticated
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

-- whatsapp_conversations
DROP POLICY IF EXISTS "Public can view whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Authenticated can view whatsapp_conversations" ON public.whatsapp_conversations;
CREATE POLICY "Authenticated can view whatsapp_conversations"
  ON public.whatsapp_conversations FOR SELECT TO authenticated
  USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated can manage whatsapp_conversations" ON public.whatsapp_conversations;
CREATE POLICY "Authenticated can manage whatsapp_conversations"
  ON public.whatsapp_conversations FOR ALL TO authenticated
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

-- whatsapp_orders
DROP POLICY IF EXISTS "Public can view whatsapp_orders" ON public.whatsapp_orders;
DROP POLICY IF EXISTS "Authenticated can view whatsapp_orders" ON public.whatsapp_orders;
CREATE POLICY "Authenticated can view whatsapp_orders"
  ON public.whatsapp_orders FOR SELECT TO authenticated
  USING (is_authenticated());

DROP POLICY IF EXISTS "Authenticated can manage whatsapp_orders" ON public.whatsapp_orders;
CREATE POLICY "Authenticated can manage whatsapp_orders"
  ON public.whatsapp_orders FOR ALL TO authenticated
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

-- whatsapp_ai_logs
DROP POLICY IF EXISTS "Public can view whatsapp_ai_logs" ON public.whatsapp_ai_logs;
DROP POLICY IF EXISTS "Authenticated can view whatsapp_ai_logs" ON public.whatsapp_ai_logs;
CREATE POLICY "Authenticated can view whatsapp_ai_logs"
  ON public.whatsapp_ai_logs FOR SELECT TO authenticated
  USING (is_authenticated());

-- whatsapp_knowledge_base
DROP POLICY IF EXISTS "Public can view whatsapp_knowledge_base" ON public.whatsapp_knowledge_base;
DROP POLICY IF EXISTS "Admins can manage whatsapp_knowledge_base" ON public.whatsapp_knowledge_base;
CREATE POLICY "Admins can manage whatsapp_knowledge_base"
  ON public.whatsapp_knowledge_base FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view whatsapp_knowledge_base"
  ON public.whatsapp_knowledge_base FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 5. TABELAS DE TEMPO: restringir acesso
-- ============================================

-- time_records: usuário vê próprios, admin vê todos
DROP POLICY IF EXISTS "Public can view time_records" ON public.time_records;
DROP POLICY IF EXISTS "Users can view own time_records" ON public.time_records;
DROP POLICY IF EXISTS "Admins can view all time_records" ON public.time_records;
CREATE POLICY "Users can view own time_records"
  ON public.time_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all time_records"
  ON public.time_records FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert own time_records" ON public.time_records;
CREATE POLICY "Users can insert own time_records"
  ON public.time_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own time_records" ON public.time_records;
CREATE POLICY "Users can update own time_records"
  ON public.time_records FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage time_records" ON public.time_records;
CREATE POLICY "Admins can manage time_records"
  ON public.time_records FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- work_schedules: usuário vê próprios, admin vê todos
DROP POLICY IF EXISTS "Public can view work_schedules" ON public.work_schedules;
DROP POLICY IF EXISTS "Users can view own work_schedules" ON public.work_schedules;
DROP POLICY IF EXISTS "Admins can view all work_schedules" ON public.work_schedules;
CREATE POLICY "Users can view own work_schedules"
  ON public.work_schedules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all work_schedules"
  ON public.work_schedules FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert own work_schedules" ON public.work_schedules;
CREATE POLICY "Users can insert own work_schedules"
  ON public.work_schedules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own work_schedules" ON public.work_schedules;
CREATE POLICY "Users can update own work_schedules"
  ON public.work_schedules FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage work_schedules" ON public.work_schedules;
CREATE POLICY "Admins can manage work_schedules"
  ON public.work_schedules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- time_tracking_settings: somente admins
DROP POLICY IF EXISTS "Public can view time_tracking_settings" ON public.time_tracking_settings;
DROP POLICY IF EXISTS "Admins can manage time_tracking_settings" ON public.time_tracking_settings;
DROP POLICY IF EXISTS "Authenticated can view time_tracking_settings" ON public.time_tracking_settings;
CREATE POLICY "Authenticated can view time_tracking_settings"
  ON public.time_tracking_settings FOR SELECT TO authenticated
  USING (is_authenticated());
CREATE POLICY "Admins can manage time_tracking_settings"
  ON public.time_tracking_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- time_alert_settings
DROP POLICY IF EXISTS "Public can view time_alert_settings" ON public.time_alert_settings;
DROP POLICY IF EXISTS "Authenticated can view time_alert_settings" ON public.time_alert_settings;
CREATE POLICY "Authenticated can view time_alert_settings"
  ON public.time_alert_settings FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 6. SMART RECEIVINGS: restringir a autenticados
-- ============================================

DROP POLICY IF EXISTS "Public can view smart_receivings" ON public.smart_receivings;
DROP POLICY IF EXISTS "Authenticated can view smart_receivings" ON public.smart_receivings;
CREATE POLICY "Authenticated can view smart_receivings"
  ON public.smart_receivings FOR SELECT TO authenticated
  USING (is_authenticated());

DROP POLICY IF EXISTS "Public can view smart_receiving_items" ON public.smart_receiving_items;
DROP POLICY IF EXISTS "Authenticated can view smart_receiving_items" ON public.smart_receiving_items;
CREATE POLICY "Authenticated can view smart_receiving_items"
  ON public.smart_receiving_items FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 7. SUPPLIER INVOICES: restringir a autenticados
-- ============================================

DROP POLICY IF EXISTS "Public can view supplier_invoices" ON public.supplier_invoices;
DROP POLICY IF EXISTS "Authenticated can view supplier_invoices" ON public.supplier_invoices;
CREATE POLICY "Authenticated can view supplier_invoices"
  ON public.supplier_invoices FOR SELECT TO authenticated
  USING (is_authenticated());

-- suppliers
DROP POLICY IF EXISTS "Public can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated can view suppliers" ON public.suppliers;
CREATE POLICY "Authenticated can view suppliers"
  ON public.suppliers FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 8. TABLET PDV CONFIG: restringir a admins (credenciais sensíveis)
-- ============================================

DROP POLICY IF EXISTS "Public can view tablet_pdv_config" ON public.tablet_pdv_config;
DROP POLICY IF EXISTS "Admins can manage tablet_pdv_config" ON public.tablet_pdv_config;
CREATE POLICY "Admins can manage tablet_pdv_config"
  ON public.tablet_pdv_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 9. PUSH CONFIG: bloquear acesso direto (chaves privadas)
-- ============================================

DROP POLICY IF EXISTS "Public can view push_config" ON public.push_config;
DROP POLICY IF EXISTS "No direct access to push_config" ON public.push_config;
CREATE POLICY "No direct access to push_config"
  ON public.push_config FOR SELECT
  USING (false);

-- ============================================
-- 10. TASK CATEGORIES: restringir a autenticados
-- ============================================

DROP POLICY IF EXISTS "Public can view task_categories" ON public.task_categories;
DROP POLICY IF EXISTS "Authenticated can view task_categories" ON public.task_categories;
CREATE POLICY "Authenticated can view task_categories"
  ON public.task_categories FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 11. PROFILES: adicionar DELETE policy
-- ============================================

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 12. STOCK MOVEMENTS: garantir que está restrito
-- ============================================

DROP POLICY IF EXISTS "Public can view stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated can view stock_movements" ON public.stock_movements;
CREATE POLICY "Authenticated can view stock_movements"
  ON public.stock_movements FOR SELECT TO authenticated
  USING (is_authenticated());

-- ============================================
-- 13. STORAGE: Tornar cash-receipts privado
-- ============================================

-- Remover política pública de SELECT
DROP POLICY IF EXISTS "Cash receipts are publicly accessible" ON storage.objects;

-- Criar política autenticada para visualizar
CREATE POLICY "Authenticated can view cash receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cash-receipts' AND auth.uid() IS NOT NULL);

-- Tornar o bucket privado
UPDATE storage.buckets SET public = false WHERE id = 'cash-receipts';

-- ============================================
-- 14. RECIPE COST SETTINGS: restringir
-- ============================================

DROP POLICY IF EXISTS "Public can view recipe_cost_settings" ON public.recipe_cost_settings;
DROP POLICY IF EXISTS "Authenticated can view recipe_cost_settings" ON public.recipe_cost_settings;
CREATE POLICY "Authenticated can view recipe_cost_settings"
  ON public.recipe_cost_settings FOR SELECT TO authenticated
  USING (is_authenticated());
