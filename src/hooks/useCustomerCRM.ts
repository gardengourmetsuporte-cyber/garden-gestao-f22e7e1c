import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { startOfMonth } from 'date-fns';
import { registrarCompra } from '@/lib/customerService';
import type { Customer, LoyaltyRule, LoyaltyEvent } from '@/types/customer';

export function useCustomerCRM(customers: Customer[]) {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const total = customers.length;
    const activeThisMonth = customers.filter(c => c.last_purchase_at && new Date(c.last_purchase_at) >= monthStart).length;
    const inactive = customers.filter(c => c.segment === 'inactive').length;
    const totalSpent = customers.reduce((s, c) => s + (Number(c.total_spent) || 0), 0);
    const totalOrders = customers.reduce((s, c) => s + (Number(c.total_orders) || 0), 0);
    const avgTicket = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const withRepurchase = customers.filter(c => (Number(c.total_orders) || 0) > 1).length;
    const returnRate = total > 0 ? (withRepurchase / total) * 100 : 0;
    return { total, activeThisMonth, inactive, avgTicket, returnRate };
  }, [customers]);

  const { data: loyaltyRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['loyalty_rules', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      const { data, error } = await supabase
        .from('loyalty_rules')
        .select('*')
        .eq('unit_id', unitId)
        .order('created_at');
      if (error) throw error;
      return data as unknown as LoyaltyRule[];
    },
    enabled: !!unitId,
  });

  const createRule = useMutation({
    mutationFn: async (input: Partial<LoyaltyRule>) => {
      if (!unitId) throw new Error('Sem unidade');
      const { error } = await supabase.from('loyalty_rules').insert({
        unit_id: unitId,
        rule_type: input.rule_type!,
        threshold: input.threshold!,
        reward_value: input.reward_value!,
        is_active: input.is_active ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty_rules', unitId] });
      toast.success('Regra criada!');
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...input }: Partial<LoyaltyRule> & { id: string }) => {
      const { error } = await supabase.from('loyalty_rules').update(input as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty_rules', unitId] });
      toast.success('Regra atualizada!');
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loyalty_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty_rules', unitId] });
      toast.success('Regra excluída!');
    },
  });

  const addEvent = useMutation({
    mutationFn: async (input: { customer_id: string; type: string; points: number; description?: string }) => {
      if (!unitId) throw new Error('Sem unidade');
      const { error } = await supabase.from('loyalty_events').insert({
        unit_id: unitId,
        customer_id: input.customer_id,
        type: input.type,
        points: input.points,
        description: input.description || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['loyalty_events', vars.customer_id] });
      qc.invalidateQueries({ queryKey: ['customers', unitId] });
      toast.success('Evento registrado!');
    },
  });

  const recalculateScores = useMutation({
    mutationFn: async () => {
      if (!unitId) throw new Error('Sem unidade');
      const { error } = await supabase.rpc('recalculate_all_customer_scores', { p_unit_id: unitId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers', unitId] });
      toast.success('Scores recalculados!');
    },
  });

  const registerPurchase = useMutation({
    mutationFn: async ({ customerId, valor, date }: { customerId: string; valor: number; date?: string }) => {
      await registrarCompra(customerId, valor, date);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers', unitId] });
      toast.success('Compra registrada!');
    },
  });

  return { stats, loyaltyRules, rulesLoading, createRule, updateRule, deleteRule, addEvent, recalculateScores, registerPurchase };
}

// Separate top-level hook for customer events
export function useCustomerEvents(customerId: string | null) {
  return useQuery({
    queryKey: ['loyalty_events', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from('loyalty_events')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as LoyaltyEvent[];
    },
    enabled: !!customerId,
  });
}
