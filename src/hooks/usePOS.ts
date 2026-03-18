// Composed POS hook — delegates to sub-hooks for maintainability
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePOSProducts } from './pos/usePOSProducts';
import { usePOSCart } from './pos/usePOSCart';
import { usePOSOrders } from './pos/usePOSOrders';
import { usePOSCheckout } from './pos/usePOSCheckout';

// Re-export types for backward compatibility
export type { POSProduct, CartItem, CartItemOption, PendingOrder, PaymentLine } from './pos/types';

export function usePOS() {
  const { activeUnitId } = useUnit();
  const { user } = useAuth();

  const { products, categories, loadingProducts } = usePOSProducts(activeUnitId);
  const cartHook = usePOSCart();
  const { pendingOrders, loadingOrders, fetchPendingOrders } = usePOSOrders(activeUnitId);

  const { savingSale, finalizeSale, sendOrder, cancelOrder, validatePinWithPermission } = usePOSCheckout({
    activeUnitId,
    userId: user?.id,
    cart: cartHook.cart,
    customerName: cartHook.customerName,
    customerDocument: cartHook.customerDocument,
    tableNumber: cartHook.tableNumber,
    subtotal: cartHook.subtotal,
    discount: cartHook.discount,
    total: cartHook.total,
    saleNotes: cartHook.saleNotes,
    saleSource: cartHook.saleSource,
    fichaNumber: cartHook.fichaNumber,
    deliveryPhone: cartHook.deliveryPhone,
    deliveryAddress: cartHook.deliveryAddress,
    clearCart: cartHook.clearCart,
    fetchPendingOrders,
  });

  return {
    products, categories, loadingProducts,
    pendingOrders, loadingOrders, fetchPendingOrders,
    savingSale, finalizeSale, sendOrder, cancelOrder, validatePinWithPermission,
    ...cartHook,
  };
}
