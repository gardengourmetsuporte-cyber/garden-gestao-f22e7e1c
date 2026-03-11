import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import {
  getQueuedOperations,
  getPendingCount,
  updateOperation,
  removeOperation,
  type QueuedOperation,
} from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_RETRIES = 5;
const SYNC_INTERVAL = 10_000; // 10s

async function syncSale(op: QueuedOperation): Promise<boolean> {
  const { sale, items, payments, sourceOrderId } = op.payload;

  const { data: inserted, error: saleErr } = await supabase
    .from('pos_sales')
    .insert(sale)
    .select('id')
    .single();
  if (saleErr) throw saleErr;

  if (items?.length) {
    const mapped = items.map((i: any) => ({ ...i, sale_id: inserted.id }));
    const { error: itemsErr } = await supabase.from('pos_sale_items').insert(mapped);
    if (itemsErr) throw itemsErr;
  }

  if (payments?.length) {
    const mapped = payments.map((p: any) => ({ ...p, sale_id: inserted.id }));
    const { error: payErr } = await supabase.from('pos_sale_payments').insert(mapped);
    if (payErr) throw payErr;
  }

  if (sourceOrderId) {
    await supabase.from('tablet_orders').update({ status: 'delivered' }).eq('id', sourceOrderId);
  }

  return true;
}

async function syncTabletOrder(op: QueuedOperation): Promise<boolean> {
  const { order, items } = op.payload;

  const { data: inserted, error: orderErr } = await supabase
    .from('tablet_orders')
    .insert(order)
    .select('id')
    .single();
  if (orderErr) throw orderErr;

  if (items?.length) {
    const mapped = items.map((i: any) => ({ ...i, order_id: inserted.id }));
    const { error: itemsErr } = await supabase.from('tablet_order_items').insert(mapped);
    if (itemsErr) throw itemsErr;
  }

  return true;
}

async function processSingleOp(op: QueuedOperation): Promise<boolean> {
  try {
    await updateOperation(op.id, { status: 'syncing' });

    if (op.type === 'pos_sale') {
      await syncSale(op);
    } else if (op.type === 'tablet_order') {
      await syncTabletOrder(op);
    }

    await removeOperation(op.id);
    return true;
  } catch (err: any) {
    const retries = op.retries + 1;
    await updateOperation(op.id, {
      status: retries >= MAX_RETRIES ? 'failed' : 'pending',
      retries,
      lastError: err.message || 'Erro desconhecido',
    });
    return false;
  }
}

export function useOfflineSync() {
  const { isConnected } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB unavailable
    }
  }, []);

  const syncAll = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const ops = await getQueuedOperations();
      const pending = ops.filter(o => o.status === 'pending');

      if (pending.length === 0) {
        syncingRef.current = false;
        setIsSyncing(false);
        return;
      }

      let synced = 0;
      let failed = 0;

      for (const op of pending) {
        const ok = await processSingleOp(op);
        if (ok) synced++;
        else failed++;
      }

      if (synced > 0) {
        toast.success(`${synced} operação(ões) sincronizada(s)`, {
          description: 'Dados offline enviados com sucesso.',
        });
      }
      if (failed > 0) {
        toast.error(`${failed} operação(ões) falharam`, {
          description: 'Serão tentadas novamente.',
        });
      }
    } catch (err) {
      console.error('[OfflineSync] Error processing queue:', err);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  // Auto-sync when connection comes back
  useEffect(() => {
    if (isConnected) {
      syncAll();
    }
  }, [isConnected, syncAll]);

  // Periodic sync attempt
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      if (isConnected && !syncingRef.current) syncAll();
    }, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [isConnected, syncAll]);

  // Refresh count on mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return {
    pendingCount,
    isSyncing,
    syncAll,
    refreshCount,
    isConnected,
  };
}
