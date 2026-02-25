import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export type QuotationStatus = 'draft' | 'sent' | 'comparing' | 'contested' | 'resolved';
export type QuotationSupplierStatus = 'pending' | 'responded' | 'contested';

export interface Quotation {
  id: string;
  user_id: string;
  unit_id: string;
  title: string;
  status: QuotationStatus;
  deadline: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  quotation_suppliers?: QuotationSupplier[];
  quotation_items?: QuotationItem[];
}

export interface QuotationSupplier {
  id: string;
  quotation_id: string;
  supplier_id: string;
  token: string;
  status: QuotationSupplierStatus;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
  supplier?: { id: string; name: string; phone: string | null };
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_id: string;
  quantity: number;
  winner_supplier_id: string | null;
  created_at: string;
  item?: { id: string; name: string; unit_type: string };
}

export interface QuotationPrice {
  id: string;
  quotation_item_id: string;
  quotation_supplier_id: string;
  unit_price: number;
  brand: string | null;
  notes: string | null;
  round: number;
  created_at: string;
}

export function useQuotations() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const queryKey = ['quotations', activeUnitId];

  const { data: quotations = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_suppliers(*, supplier:suppliers(id, name, phone)),
          quotation_items(*, item:inventory_items(id, name, unit_type))
        `)
        .eq('unit_id', activeUnitId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Quotation[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, activeUnitId]);

  const createQuotation = useMutation({
    mutationFn: async (params: {
      title: string;
      deadline?: string;
      supplierIds: string[];
      items: { item_id: string; quantity: number }[];
    }) => {
      const { data: q, error: qErr } = await supabase
        .from('quotations')
        .insert({
          user_id: user!.id,
          unit_id: activeUnitId!,
          title: params.title,
          deadline: params.deadline || null,
          status: 'sent' as any,
        })
        .select()
        .single();
      if (qErr) throw qErr;

      // Insert suppliers
      const suppInserts = params.supplierIds.map(sid => ({
        quotation_id: q.id,
        supplier_id: sid,
      }));
      const { error: sErr } = await supabase
        .from('quotation_suppliers')
        .insert(suppInserts);
      if (sErr) throw sErr;

      // Insert items
      const itemInserts = params.items.map(i => ({
        quotation_id: q.id,
        item_id: i.item_id,
        quantity: i.quantity,
      }));
      const { error: iErr } = await supabase
        .from('quotation_items')
        .insert(itemInserts);
      if (iErr) throw iErr;

      return q;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Cotação criada!');
    },
  });

  const fetchPrices = async (quotationId: string): Promise<QuotationPrice[]> => {
    const { data: items } = await supabase
      .from('quotation_items')
      .select('id')
      .eq('quotation_id', quotationId);

    if (!items || items.length === 0) return [];

    const { data, error } = await supabase
      .from('quotation_prices')
      .select('*')
      .in('quotation_item_id', items.map(i => i.id))
      .order('round', { ascending: false });

    if (error) throw error;
    return data as unknown as QuotationPrice[];
  };

  const contestSupplier = useMutation({
    mutationFn: async ({ quotationId, supplierId }: { quotationId: string; supplierId: string }) => {
      // Find the quotation_supplier
      const { data: qs } = await supabase
        .from('quotation_suppliers')
        .select('id')
        .eq('quotation_id', quotationId)
        .eq('supplier_id', supplierId)
        .single();

      if (!qs) throw new Error('Supplier not found');

      await supabase
        .from('quotation_suppliers')
        .update({ status: 'contested' as any })
        .eq('id', qs.id);

      await supabase
        .from('quotations')
        .update({ status: 'contested' as any })
        .eq('id', quotationId);
    },
    onSuccess: () => {
      invalidate();
      toast.success('Contestação enviada!');
    },
  });

  const resolveQuotation = useMutation({
    mutationFn: async (quotationId: string) => {
      // Fetch all data
      const { data: qItems } = await supabase
        .from('quotation_items')
        .select('id, item_id, quantity')
        .eq('quotation_id', quotationId);

      const { data: qSuppliers } = await supabase
        .from('quotation_suppliers')
        .select('id, supplier_id')
        .eq('quotation_id', quotationId);

      if (!qItems || !qSuppliers) throw new Error('No data');

      const prices = await fetchPrices(quotationId);

      // For each item, find best price (latest round per supplier)
      const winners: { item_id: string; quantity: number; supplier_id: string }[] = [];

      for (const item of qItems) {
        const itemPrices = prices.filter(p => p.quotation_item_id === item.id);
        // Get latest price per supplier
        const latestBySupplier = new Map<string, QuotationPrice>();
        for (const p of itemPrices) {
          const existing = latestBySupplier.get(p.quotation_supplier_id);
          if (!existing || p.round > existing.round) {
            latestBySupplier.set(p.quotation_supplier_id, p);
          }
        }

        let bestPrice: QuotationPrice | null = null;
        for (const p of latestBySupplier.values()) {
          if (!bestPrice || p.unit_price < bestPrice.unit_price) {
            bestPrice = p;
          }
        }

        if (bestPrice) {
          const winnerQs = qSuppliers.find(s => s.id === bestPrice!.quotation_supplier_id);
          if (winnerQs) {
            // Update winner on item
            await supabase
              .from('quotation_items')
              .update({ winner_supplier_id: winnerQs.supplier_id })
              .eq('id', item.id);

            winners.push({
              item_id: item.item_id,
              quantity: item.quantity,
              supplier_id: winnerQs.supplier_id,
            });
          }
        }
      }

      // Group by supplier and create orders
      const grouped = new Map<string, { item_id: string; quantity: number }[]>();
      for (const w of winners) {
        if (!grouped.has(w.supplier_id)) grouped.set(w.supplier_id, []);
        grouped.get(w.supplier_id)!.push({ item_id: w.item_id, quantity: w.quantity });
      }

      for (const [supplierId, items] of grouped) {
        const { data: order, error: oErr } = await supabase
          .from('orders')
          .insert({
            supplier_id: supplierId,
            created_by: user!.id,
            status: 'draft' as any,
            unit_id: activeUnitId,
            notes: `Gerado pela cotação`,
          })
          .select()
          .single();

        if (oErr) throw oErr;

        const orderItems = items.map(i => ({
          order_id: order.id,
          item_id: i.item_id,
          quantity: i.quantity,
          unit_id: activeUnitId,
        }));

        await supabase.from('order_items').insert(orderItems);
      }

      await supabase
        .from('quotations')
        .update({ status: 'resolved' as any, resolved_at: new Date().toISOString() })
        .eq('id', quotationId);
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Pedidos gerados com sucesso!');
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    quotations,
    isLoading,
    createQuotation: createQuotation.mutateAsync,
    contestSupplier: contestSupplier.mutateAsync,
    resolveQuotation: resolveQuotation.mutateAsync,
    deleteQuotation: deleteQuotation.mutateAsync,
    fetchPrices,
    invalidate,
  };
}
