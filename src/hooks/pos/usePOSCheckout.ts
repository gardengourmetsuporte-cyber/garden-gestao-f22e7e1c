import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { enqueueOperation } from '@/lib/offlineDb';
import { toast } from 'sonner';
import type { CartItem, PaymentLine } from './types';

interface CheckoutDeps {
  activeUnitId: string | null;
  userId: string | undefined;
  cart: CartItem[];
  customerName: string;
  customerDocument: string;
  tableNumber: number | null;
  subtotal: number;
  discount: number;
  total: number;
  saleNotes: string;
  saleSource: 'balcao' | 'mesa' | 'delivery' | 'ficha';
  fichaNumber: number | null;
  deliveryPhone: string;
  deliveryAddress: string;
  clearCart: () => void;
  fetchPendingOrders: () => Promise<void>;
}

export function usePOSCheckout(deps: CheckoutDeps) {
  const { isConnected } = useOnlineStatus();
  const [savingSale, setSavingSale] = useState(false);

  const finalizeSale = useCallback(async (payments: PaymentLine[], sourceOrderId?: string) => {
    const { activeUnitId, userId, cart, customerName, customerDocument, tableNumber, subtotal, discount, total, saleNotes, saleSource, fichaNumber, deliveryPhone, deliveryAddress, clearCart, fetchPendingOrders } = deps;
    if (!activeUnitId || !userId) return null;
    const paymentTotal = payments.reduce((s, p) => s + p.amount, 0);
    if (paymentTotal < total) {
      toast.error('Valor dos pagamentos insuficiente');
      return null;
    }

    const saleData = {
      unit_id: activeUnitId,
      user_id: userId,
      source: sourceOrderId ? 'pedido' : saleSource,
      source_order_id: sourceOrderId || null,
      customer_name: customerName || null,
      customer_document: customerDocument || null,
      customer_phone: (saleSource === 'delivery' && deliveryPhone) ? deliveryPhone : null,
      table_number: tableNumber,
      subtotal,
      discount,
      total,
      status: 'paid',
      notes: saleSource === 'delivery' && deliveryAddress
        ? (saleNotes ? `${saleNotes} | Endereço: ${deliveryAddress}` : `Endereço: ${deliveryAddress}`)
        : (saleNotes || null),
      paid_at: new Date().toISOString(),
    };

    const itemsData = cart.map(i => ({
      product_id: i.product.id || null,
      product_name: i.product.name,
      product_code: i.product.codigo_pdv || null,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount: i.discount,
      total_price: i.quantity * i.unit_price - i.discount,
      notes: i.notes || null,
    }));

    const paymentsData = payments.map(p => ({
      method: p.method,
      amount: p.amount,
      change_amount: p.change_amount,
    }));

    if (!isConnected) {
      try {
        const offlineId = crypto.randomUUID();
        await enqueueOperation({
          id: offlineId, type: 'pos_sale',
          payload: { sale: saleData, items: itemsData, payments: paymentsData, sourceOrderId },
          createdAt: new Date().toISOString(), retries: 0, status: 'pending',
        });
        toast.success('Venda salva offline!', { description: 'Será sincronizada quando a conexão voltar.' });
        clearCart();
        return offlineId;
      } catch {
        toast.error('Erro ao salvar venda offline');
        return null;
      }
    }

    setSavingSale(true);
    try {
      const { data: sale, error: saleError } = await supabase
        .from('pos_sales').insert(saleData).select('id').single();
      if (saleError) throw saleError;

      if (cart.length > 0) {
        const { error: itemsError } = await supabase
          .from('pos_sale_items').insert(itemsData.map(i => ({ ...i, sale_id: sale.id })));
        if (itemsError) throw itemsError;
      }

      const { error: payError } = await supabase
        .from('pos_sale_payments').insert(paymentsData.map(p => ({ ...p, sale_id: sale.id })));
      if (payError) throw payError;

      if (sourceOrderId) {
        await supabase.from('tablet_orders').update({ status: 'delivered' }).eq('id', sourceOrderId);
      }

      toast.success('Venda finalizada!');
      clearCart();
      fetchPendingOrders();
      return sale.id;
    } catch (err: any) {
      if (!navigator.onLine || err.message?.includes('fetch')) {
        try {
          const offlineId = crypto.randomUUID();
          await enqueueOperation({
            id: offlineId, type: 'pos_sale',
            payload: { sale: saleData, items: itemsData, payments: paymentsData, sourceOrderId },
            createdAt: new Date().toISOString(), retries: 0, status: 'pending',
          });
          toast.success('Venda salva offline!', { description: 'Será sincronizada quando a conexão voltar.' });
          clearCart();
          return offlineId;
        } catch {}
      }
      toast.error('Erro ao finalizar venda: ' + err.message);
      return null;
    } finally {
      setSavingSale(false);
    }
  }, [deps, isConnected]);

  const sendOrder = useCallback(async (paymentInfo?: { method: string; change: number }) => {
    const { activeUnitId, userId, cart, saleSource, customerName, deliveryPhone, deliveryAddress, tableNumber, total, clearCart, fetchPendingOrders } = deps;
    if (!activeUnitId || !userId) return null;
    if (cart.length === 0) { toast.error('Carrinho vazio'); return null; }

    if (saleSource === 'mesa' && !tableNumber) {
      toast.error('Informe o número da mesa'); return null;
    }
    if (saleSource === 'balcao' && !customerName.trim()) {
      toast.error('Informe o nome do cliente'); return null;
    }
    if (saleSource === 'delivery') {
      if (!customerName.trim()) { toast.error('Informe o nome do cliente'); return null; }
      if (!deliveryPhone.trim()) { toast.error('Informe o telefone'); return null; }
      if (!deliveryAddress.trim()) { toast.error('Informe o endereço'); return null; }
    }

    const orderData: any = {
      unit_id: activeUnitId,
      table_number: tableNumber || 0,
      status: 'pending',
      total,
      source: saleSource,
      customer_name: customerName.trim() || null,
      customer_phone: saleSource === 'delivery' ? deliveryPhone.replace(/\D/g, '') : null,
      customer_address: saleSource === 'delivery' ? deliveryAddress.trim() : null,
    };

    if (paymentInfo) {
      orderData.payment_method = paymentInfo.method;
      orderData.payment_change = paymentInfo.change;
    }

    const itemsData = cart.map(c => ({
      product_id: c.product.id || null,
      quantity: c.quantity,
      notes: c.notes || null,
      unit_price: c.unit_price,
    }));

    if (!isConnected) {
      try {
        const offlineId = crypto.randomUUID();
        await enqueueOperation({
          id: offlineId, type: 'tablet_order',
          payload: { order: orderData, items: itemsData },
          createdAt: new Date().toISOString(), retries: 0, status: 'pending',
        });
        toast.success('Pedido salvo offline!', { description: 'Será enviado quando a conexão voltar.' });
        clearCart();
        return offlineId;
      } catch {
        toast.error('Erro ao salvar pedido offline');
        return null;
      }
    }

    setSavingSale(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('tablet_orders').insert(orderData).select('id').single();
      if (orderError || !order) throw new Error(orderError?.message || 'Erro ao criar pedido');

      const { error: itemsError } = await supabase
        .from('tablet_order_items').insert(itemsData.map(i => ({ ...i, order_id: order.id })));
      if (itemsError) throw new Error(itemsError.message);

      toast.success('Pedido enviado!');
      clearCart();
      fetchPendingOrders();
      return order.id;
    } catch (err: any) {
      if (!navigator.onLine || err.message?.includes('fetch')) {
        try {
          const offlineId = crypto.randomUUID();
          await enqueueOperation({
            id: offlineId, type: 'tablet_order',
            payload: { order: orderData, items: itemsData },
            createdAt: new Date().toISOString(), retries: 0, status: 'pending',
          });
          toast.success('Pedido salvo offline!', { description: 'Será enviado quando a conexão voltar.' });
          clearCart();
          return offlineId;
        } catch {}
      }
      toast.error('Erro ao enviar pedido: ' + (err.message || 'erro desconhecido'));
      return null;
    } finally {
      setSavingSale(false);
    }
  }, [deps, isConnected]);

  const cancelOrder = useCallback(async (orderId: string) => {
    const { activeUnitId, clearCart, fetchPendingOrders } = deps;
    if (!activeUnitId) return false;
    try {
      const { error: orderErr } = await supabase
        .from('tablet_orders').update({ status: 'cancelled' }).eq('id', orderId);
      if (orderErr) throw orderErr;

      await supabase
        .from('pos_sales').update({ status: 'cancelled' })
        .eq('source_order_id', orderId).eq('unit_id', activeUnitId);

      toast.success('Pedido cancelado!');
      clearCart();
      fetchPendingOrders();
      return true;
    } catch (err: any) {
      toast.error('Erro ao cancelar: ' + err.message);
      return false;
    }
  }, [deps]);

  const validatePinWithPermission = useCallback(async (pin: string, requiredModule: string): Promise<{ authorized: boolean; userName: string }> => {
    const { activeUnitId } = deps;
    if (!activeUnitId) return { authorized: false, userName: '' };

    const { data: emp } = await supabase
      .from('employees')
      .select('user_id, full_name')
      .eq('unit_id', activeUnitId)
      .eq('quick_pin', pin)
      .eq('is_active', true)
      .not('user_id', 'is', null)
      .maybeSingle();

    if (!emp?.user_id) return { authorized: false, userName: '' };

    const { data: uu } = await supabase
      .from('user_units')
      .select('access_level_id, role')
      .eq('user_id', emp.user_id)
      .eq('unit_id', activeUnitId)
      .maybeSingle();

    if (uu?.role === 'owner' || uu?.role === 'admin') {
      return { authorized: true, userName: emp.full_name };
    }

    const { data: globalRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', emp.user_id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();
    if (globalRole) {
      return { authorized: true, userName: emp.full_name };
    }

    if (!uu?.access_level_id) return { authorized: false, userName: emp.full_name };

    const { data: al } = await supabase
      .from('access_levels')
      .select('modules')
      .eq('id', uu.access_level_id)
      .maybeSingle();

    const modules = al?.modules || [];
    const hasPermission =
      modules.includes(requiredModule) ||
      (requiredModule === 'menu-admin.pdv-cancel' && modules.includes('menu-admin.pdv'));

    return { authorized: hasPermission, userName: emp.full_name };
  }, [deps]);

  return { savingSale, finalizeSale, sendOrder, cancelOrder, validatePinWithPermission };
}
