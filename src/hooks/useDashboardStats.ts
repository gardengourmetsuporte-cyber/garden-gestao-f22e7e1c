import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { startOfMonth, endOfMonth, format, addDays, differenceInCalendarDays } from 'date-fns';

export interface BillDueSoon {
  id: string;
  description: string;
  amount: number;
  date: string;
  daysUntilDue: number;
}

export interface DashboardStats {
  criticalItems: number;
  pendingOrders: number;
  pendingRedemptions: number;
  pendingClosings: number;
  recipesCount: number;
  usersCount: number;
  itemsCount: number;
  monthBalance: number;
  pendingExpenses: number;
  billsDueSoon: BillDueSoon[];
}

async function fetchDashboardStats(userId: string, unitId: string, isAdmin: boolean): Promise<DashboardStats> {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
  const todayStr = format(now, 'yyyy-MM-dd');
  const weekLaterStr = format(addDays(now, 7), 'yyyy-MM-dd');

  const [
    inventoryRes,
    ordersRes,
    redemptionsRes,
    closingsRes,
    recipesRes,
    usersRes,
    itemsRes,
    incomeRes,
    expenseRes,
    pendingExpRes,
    billsDueRes,
  ] = await Promise.all([
    supabase.from('inventory_items').select('current_stock, min_stock').eq('unit_id', unitId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('unit_id', unitId).in('status', ['draft', 'sent']),
    isAdmin
      ? supabase.from('reward_redemptions').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    isAdmin
      ? supabase.from('cash_closings').select('*', { count: 'exact', head: true }).eq('unit_id', unitId).eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('is_active', true),
    isAdmin
      ? supabase.from('profiles').select('*', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),
    supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
    supabase.from('finance_transactions').select('amount').eq('user_id', userId).eq('unit_id', unitId).eq('type', 'income').eq('is_paid', true).gte('date', startDate).lte('date', endDate),
    supabase.from('finance_transactions').select('amount').eq('user_id', userId).eq('unit_id', unitId).in('type', ['expense', 'credit_card']).eq('is_paid', true).gte('date', startDate).lte('date', endDate),
    supabase.from('finance_transactions').select('amount').eq('user_id', userId).eq('unit_id', unitId).in('type', ['expense', 'credit_card']).eq('is_paid', false).gte('date', startDate).lte('date', endDate),
    // Bills due in next 7 days
    supabase.from('finance_transactions').select('id, description, amount, date').eq('user_id', userId).eq('unit_id', unitId).in('type', ['expense', 'credit_card']).eq('is_paid', false).gte('date', todayStr).lte('date', weekLaterStr).order('date').limit(10),
  ]);

  const criticalItems = (inventoryRes.data || []).filter(i => i.current_stock <= i.min_stock).length;
  const totalIncome = (incomeRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = (expenseRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
  const pendingExpenses = (pendingExpRes.data || []).reduce((s, t) => s + Number(t.amount), 0);

  const billsDueSoon: BillDueSoon[] = ((billsDueRes as any).data || []).map((b: any) => ({
    id: b.id,
    description: b.description,
    amount: Number(b.amount),
    date: b.date,
    daysUntilDue: differenceInCalendarDays(new Date(b.date + 'T12:00:00'), now),
  }));

  return {
    criticalItems,
    pendingOrders: ordersRes.count || 0,
    pendingRedemptions: (redemptionsRes as any).count || 0,
    pendingClosings: (closingsRes as any).count || 0,
    recipesCount: recipesRes.count || 0,
    usersCount: (usersRes as any).count || 0,
    itemsCount: itemsRes.count || 0,
    monthBalance: totalIncome - totalExpense,
    pendingExpenses,
    billsDueSoon,
  };
}

export function useDashboardStats() {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id, activeUnitId],
    queryFn: () => fetchDashboardStats(user!.id, activeUnitId!, isAdmin),
    enabled: !!user && !!activeUnitId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    stats: stats || {
      criticalItems: 0,
      pendingOrders: 0,
      pendingRedemptions: 0,
      pendingClosings: 0,
      recipesCount: 0,
      usersCount: 0,
      itemsCount: 0,
      monthBalance: 0,
      pendingExpenses: 0,
      billsDueSoon: [],
    },
    isLoading,
  };
}
