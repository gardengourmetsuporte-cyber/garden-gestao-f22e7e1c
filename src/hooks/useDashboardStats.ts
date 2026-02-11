import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
}

async function fetchDashboardStats(userId: string, unitId: string, isAdmin: boolean): Promise<DashboardStats> {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  // Run all counts in parallel
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
  ] = await Promise.all([
    // Inventory items for critical stock calculation
    supabase
      .from('inventory_items')
      .select('current_stock, min_stock')
      .eq('unit_id', unitId),
    // Pending orders
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', unitId)
      .in('status', ['draft', 'sent']),
    // Pending redemptions (admin only)
    isAdmin
      ? supabase
          .from('reward_redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    // Pending cash closings
    isAdmin
      ? supabase
          .from('cash_closings')
          .select('*', { count: 'exact', head: true })
          .eq('unit_id', unitId)
          .eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    // Recipes count
    supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    // Users count
    isAdmin
      ? supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),
    // Total inventory items
    supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', unitId),
    // Monthly income (paid)
    supabase
      .from('finance_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('unit_id', unitId)
      .eq('type', 'income')
      .eq('is_paid', true)
      .gte('date', startDate)
      .lte('date', endDate),
    // Monthly expense (paid)
    supabase
      .from('finance_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('unit_id', unitId)
      .in('type', ['expense', 'credit_card'])
      .eq('is_paid', true)
      .gte('date', startDate)
      .lte('date', endDate),
    // Pending expenses
    supabase
      .from('finance_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('unit_id', unitId)
      .in('type', ['expense', 'credit_card'])
      .eq('is_paid', false)
      .gte('date', startDate)
      .lte('date', endDate),
  ]);

  const criticalItems = (inventoryRes.data || []).filter(i => i.current_stock <= i.min_stock).length;

  const totalIncome = (incomeRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = (expenseRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
  const pendingExpenses = (pendingExpRes.data || []).reduce((s, t) => s + Number(t.amount), 0);

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
  };
}

export function useDashboardStats() {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id, activeUnitId],
    queryFn: () => fetchDashboardStats(user!.id, activeUnitId!, isAdmin),
    enabled: !!user && !!activeUnitId,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
    },
    isLoading,
  };
}
