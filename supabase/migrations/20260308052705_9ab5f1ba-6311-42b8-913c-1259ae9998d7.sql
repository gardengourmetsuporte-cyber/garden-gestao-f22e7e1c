-- Grant permissions on tablet_orders to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON public.tablet_orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.tablet_orders TO authenticated;

-- Grant permissions on tablet_order_items to anon and authenticated roles
GRANT SELECT, INSERT ON public.tablet_order_items TO anon;
GRANT SELECT, INSERT ON public.tablet_order_items TO authenticated;