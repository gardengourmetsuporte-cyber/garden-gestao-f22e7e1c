import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';

export interface TabletProductAdmin {
  id: string;
  unit_id: string;
  name: string;
  codigo_pdv: string | null;
  price: number;
  category: string;
  image_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface TabletTableAdmin {
  id: string;
  unit_id: string;
  number: number;
  status: string;
}

export interface TabletOrderAdmin {
  id: string;
  unit_id: string;
  table_number: number;
  status: string;
  total: number;
  error_message: string | null;
  created_at: string;
  tablet_order_items?: any[];
}

export interface TabletPDVConfig {
  id?: string;
  unit_id: string;
  hub_url: string;
  auth_key: string;
  is_active: boolean;
}

export function useTabletAdmin() {
  const { activeUnitId } = useUnit();
  const { toast } = useToast();
  const [products, setProducts] = useState<TabletProductAdmin[]>([]);
  const [tables, setTables] = useState<TabletTableAdmin[]>([]);
  const [orders, setOrders] = useState<TabletOrderAdmin[]>([]);
  const [pdvConfig, setPdvConfig] = useState<TabletPDVConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!activeUnitId) return;
    const { data } = await supabase
      .from('tablet_products')
      .select('*')
      .eq('unit_id', activeUnitId)
      .order('category')
      .order('sort_order');
    setProducts((data as TabletProductAdmin[]) || []);
  }, [activeUnitId]);

  const fetchTables = useCallback(async () => {
    if (!activeUnitId) return;
    const { data } = await supabase
      .from('tablet_tables')
      .select('*')
      .eq('unit_id', activeUnitId)
      .order('number');
    setTables((data as TabletTableAdmin[]) || []);
  }, [activeUnitId]);

  const fetchOrders = useCallback(async () => {
    if (!activeUnitId) return;
    const { data } = await supabase
      .from('tablet_orders')
      .select('*, tablet_order_items(*, tablet_products(name, codigo_pdv))')
      .eq('unit_id', activeUnitId)
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders((data as TabletOrderAdmin[]) || []);
  }, [activeUnitId]);

  const fetchPDVConfig = useCallback(async () => {
    if (!activeUnitId) return;
    const { data } = await supabase
      .from('tablet_pdv_config')
      .select('*')
      .eq('unit_id', activeUnitId)
      .single();
    setPdvConfig(data as TabletPDVConfig | null);
  }, [activeUnitId]);

  useEffect(() => {
    if (activeUnitId) {
      fetchProducts();
      fetchTables();
      fetchOrders();
      fetchPDVConfig();
    }
  }, [activeUnitId, fetchProducts, fetchTables, fetchOrders, fetchPDVConfig]);

  // Realtime orders
  useEffect(() => {
    if (!activeUnitId) return;
    const channel = supabase
      .channel('tablet-orders-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tablet_orders',
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeUnitId, fetchOrders]);

  // Product CRUD
  const saveProduct = async (product: Partial<TabletProductAdmin> & { name: string; price: number }) => {
    if (!activeUnitId) return;
    setLoading(true);
    try {
      if (product.id) {
        const { error } = await supabase
          .from('tablet_products')
          .update({
            name: product.name,
            codigo_pdv: product.codigo_pdv,
            price: product.price,
            category: product.category || 'Geral',
            description: product.description,
            is_active: product.is_active ?? true,
            sort_order: product.sort_order ?? 0,
          })
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tablet_products')
          .insert({
            unit_id: activeUnitId,
            name: product.name,
            codigo_pdv: product.codigo_pdv,
            price: product.price,
            category: product.category || 'Geral',
            description: product.description,
            is_active: product.is_active ?? true,
            sort_order: product.sort_order ?? 0,
          });
        if (error) throw error;
      }
      toast({ title: 'Produto salvo com sucesso' });
      fetchProducts();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar produto', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('tablet_products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Produto excluído' });
      fetchProducts();
    }
  };

  // Table CRUD
  const addTable = async (number: number) => {
    if (!activeUnitId) return;
    const { error } = await supabase
      .from('tablet_tables')
      .insert({ unit_id: activeUnitId, number });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Mesa ${number} adicionada` });
      fetchTables();
    }
  };

  const removeTable = async (id: string) => {
    const { error } = await supabase.from('tablet_tables').delete().eq('id', id);
    if (!error) { fetchTables(); }
  };

  // PDV Config
  const savePDVConfig = async (config: { hub_url: string; auth_key: string; is_active: boolean }) => {
    if (!activeUnitId) return;
    setLoading(true);
    try {
      if (pdvConfig?.id) {
        const { error } = await supabase
          .from('tablet_pdv_config')
          .update(config)
          .eq('id', pdvConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tablet_pdv_config')
          .insert({ ...config, unit_id: activeUnitId });
        if (error) throw error;
      }
      toast({ title: 'Configuração PDV salva' });
      fetchPDVConfig();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Retry PDV
  const retryPDV = async (orderId: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tablet-order?action=retry-pdv`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ order_id: orderId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Pedido reenviado ao PDV com sucesso' });
      } else {
        toast({ title: 'Erro ao reenviar', description: data.error, variant: 'destructive' });
      }
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return {
    products, tables, orders, pdvConfig, loading,
    saveProduct, deleteProduct,
    addTable, removeTable,
    savePDVConfig,
    retryPDV,
    fetchOrders,
  };
}
