

## Plan: Push Notification for Delivery Dispatch

### What happens today
When a delivery person clicks "Despachar" or a delivery status changes to `out` (em rota), only a local toast appears. No push notification is sent to PDV users.

### What we'll build
When a delivery status changes to `out`, the system will:
1. Insert a notification in the `notifications` table for all unit users with PDV access
2. The existing DB trigger (`send_push_on_notification`) will automatically fire push notifications
3. The existing in-app notification system will play the WhatsApp-style sound and show the card

### Changes

**1. Database: Create a trigger function for delivery dispatch notifications**
- New migration with a function `notify_delivery_dispatched()` that fires `AFTER UPDATE` on `deliveries` when `status` changes to `'out'`
- The function queries all users with access to the `pdv` module in the same unit (via `user_modules` or `user_roles`)
- For each user, it inserts a row into `notifications` with:
  - `type: 'alert'`
  - `origin: 'sistema'` (or add a new origin `'entregas'`)
  - `title: '🚀 Entrega saiu!'`
  - `description: 'Pedido #XXX saiu para entrega'`
- The existing `send_push_on_notification` trigger handles the push automatically

**2. Add `'entregas'` as notification origin**
- Update `useNotifications.ts` `AppNotification` type to include `'entregas'` origin
- Add `entregas` category to `NotificationSettings.tsx` categories list
- Add the category to `notification_preferences` defaults

**3. Update `useDeliveries.ts` — no changes needed**
The trigger fires on the DB level, so no frontend code changes are needed for the dispatch itself.

**4. Ensure push is auto-activated**
- On the Deliveries page or PDV page, auto-prompt push subscription if not already subscribed (using `usePushNotifications().subscribe()`)

### Technical Details

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION public.notify_delivery_dispatched()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  unit_row RECORD;
  user_record RECORD;
  order_num TEXT;
BEGIN
  IF NEW.status = 'out' AND (OLD.status IS DISTINCT FROM 'out') THEN
    order_num := COALESCE(NEW.order_number, LEFT(NEW.id::text, 8));
    
    -- Notify all users in this unit who have PDV or deliveries module access
    FOR user_record IN
      SELECT DISTINCT um.user_id 
      FROM public.user_modules um
      WHERE um.unit_id = NEW.unit_id 
        AND um.module_key IN ('pdv', 'deliveries')
        AND um.user_id != NEW.assigned_to  -- don't notify the delivery person
    LOOP
      INSERT INTO public.notifications (user_id, type, title, description, origin)
      VALUES (
        user_record.user_id,
        'info',
        '🚀 Entrega saiu!',
        'Pedido #' || order_num || ' saiu para entrega',
        'sistema'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_delivery_dispatched
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_delivery_dispatched();
```

### File changes summary
| File | Change |
|------|--------|
| New migration SQL | Trigger function + trigger on `deliveries` |
| `src/hooks/useNotifications.ts` | Add `'entregas'` to origin type |
| `src/components/settings/NotificationSettings.tsx` | Add `entregas` category |
| `src/pages/Deliveries.tsx` | Auto-prompt push subscription on mount |
| `src/components/pdv/PendingOrdersSheet.tsx` | Auto-prompt push subscription on mount |

