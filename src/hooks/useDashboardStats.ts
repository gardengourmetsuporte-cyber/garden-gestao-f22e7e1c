import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { differenceInCalendarDays } from 'date-fns';

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
  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    p_user_id: userId,
    p_unit_id: unitId,
    p_is_admin: isAdmin,
  });

  if (error) throw error;

  const result = data as any;
  if (result?.error === 'access_denied') throw new Error('Access denied');

  const now = new Date();
  const billsDueSoon: BillDueSoon[] = (result.billsDueSoon || []).map((b: any) => ({
    id: b.id,
    description: b.description,
    amount: Number(b.amount),
    date: b.date,
    daysUntilDue: differenceInCalendarDays(new Date(b.date + 'T12:00:00'), now),
  }));

  return {
    criticalItems: result.criticalItems ?? 0,
    pendingOrders: result.pendingOrders ?? 0,
    pendingRedemptions: result.pendingRedemptions ?? 0,
    pendingClosings: result.pendingClosings ?? 0,
    recipesCount: result.recipesCount ?? 0,
    usersCount: result.usersCount ?? 0,
    itemsCount: result.itemsCount ?? 0,
    monthBalance: Number(result.monthBalance ?? 0),
    pendingExpenses: Number(result.pendingExpenses ?? 0),
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
