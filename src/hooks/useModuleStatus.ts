import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useTimeBasedUrgency, type UrgencyLevel } from '@/hooks/useTimeBasedUrgency';

export type StatusLevel = 'ok' | 'attention' | 'warning' | 'critical';

export interface ModuleStatus {
  level: StatusLevel;
  count: number;
  tooltip: string;
}

type ModuleStatusMap = Record<string, ModuleStatus | null>;

async function fetchModuleStatuses(
  userId: string,
  unitId: string,
  isAdmin: boolean
): Promise<ModuleStatusMap> {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Determine checklist type based on time of day
  const hour = now.getHours();
  const checklistType = hour < 14 ? 'abertura' : 'fechamento';

  const [
    overdueFinanceRes,
    todayFinanceRes,
    zeroStockRes,
    lowStockRes,
    checklistItemsRes,
    checklistCompletionsRes,
    pendingClosingsRes,
    unpaidPaymentsRes,
    pendingRedemptionsRes,
  ] = await Promise.all([
    // Finance: overdue unpaid transactions (date < today)
    supabase
      .from('finance_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('unit_id', unitId)
      .in('type', ['expense', 'credit_card'])
      .eq('is_paid', false)
      .lt('date', today),
    // Finance: today's unpaid transactions
    supabase
      .from('finance_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('unit_id', unitId)
      .in('type', ['expense', 'credit_card'])
      .eq('is_paid', false)
      .eq('date', today),
    // Inventory: zero stock
    supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', unitId)
      .eq('current_stock', 0),
    // Inventory: low stock (below min but not zero)
    supabase
      .from('inventory_items')
      .select('current_stock, min_stock')
      .eq('unit_id', unitId)
      .gt('current_stock', 0),
    // Checklists: active items for current type
    supabase
      .from('checklist_items')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', unitId)
      .eq('checklist_type', checklistType)
      .eq('is_active', true)
      .is('deleted_at', null),
    // Checklists: completions today for current type
    supabase
      .from('checklist_completions')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', unitId)
      .eq('checklist_type', checklistType)
      .eq('date', today),
    // Cash closings: pending validation
    isAdmin
      ? supabase
          .from('cash_closings')
          .select('*', { count: 'exact', head: true })
          .eq('unit_id', unitId)
          .eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    // Employees: unpaid payments this month
    isAdmin
      ? supabase
          .from('employee_payments')
          .select('*', { count: 'exact', head: true })
          .eq('unit_id', unitId)
          .eq('is_paid', false)
          .eq('reference_month', currentMonth)
          .eq('reference_year', currentYear)
      : Promise.resolve({ count: 0 }),
    // Rewards: pending redemptions
    isAdmin
      ? supabase
          .from('reward_redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
  ]);

  const result: ModuleStatusMap = {};

  // === FINANCE ===
  const overdueCount = overdueFinanceRes.count || 0;
  const todayCount = todayFinanceRes.count || 0;
  if (overdueCount > 0) {
    result['/finance'] = {
      level: 'critical',
      count: overdueCount + todayCount,
      tooltip: `${overdueCount} despesa${overdueCount > 1 ? 's' : ''} vencida${overdueCount > 1 ? 's' : ''}`,
    };
  } else if (todayCount > 0) {
    result['/finance'] = {
      level: 'attention',
      count: todayCount,
      tooltip: `${todayCount} despesa${todayCount > 1 ? 's' : ''} do dia não paga${todayCount > 1 ? 's' : ''}`,
    };
  } else {
    result['/finance'] = { level: 'ok', count: 0, tooltip: 'Financeiro em dia' };
  }

  // === INVENTORY ===
  const zeroCount = zeroStockRes.count || 0;
  const lowItems = (lowStockRes.data || []).filter(
    (i) => i.current_stock <= i.min_stock && i.min_stock > 0
  ).length;
  if (zeroCount > 0) {
    result['/inventory'] = {
      level: 'critical',
      count: zeroCount + lowItems,
      tooltip: `${zeroCount} item${zeroCount > 1 ? 'ns' : ''} com estoque zerado`,
    };
  } else if (lowItems > 0) {
    result['/inventory'] = {
      level: 'attention',
      count: lowItems,
      tooltip: `${lowItems} item${lowItems > 1 ? 'ns' : ''} abaixo do mínimo`,
    };
  } else {
    result['/inventory'] = { level: 'ok', count: 0, tooltip: 'Estoque em dia' };
  }

  // === CHECKLISTS ===
  const totalItems = checklistItemsRes.count || 0;
  const completedItems = checklistCompletionsRes.count || 0;
  const pendingChecklist = Math.max(0, totalItems - completedItems);
  if (pendingChecklist > 0) {
    result['/checklists'] = {
      level: 'attention',
      count: pendingChecklist,
      tooltip: `${pendingChecklist} tarefa${pendingChecklist > 1 ? 's' : ''} pendente${pendingChecklist > 1 ? 's' : ''} (${checklistType})`,
    };
  } else if (totalItems > 0) {
    result['/checklists'] = { level: 'ok', count: 0, tooltip: `Checklist de ${checklistType} completo` };
  }

  // === CASH CLOSING ===
  if (isAdmin) {
    const pendingClosings = (pendingClosingsRes as any).count || 0;
    if (pendingClosings > 0) {
      result['/cash-closing'] = {
        level: 'attention',
        count: pendingClosings,
        tooltip: `${pendingClosings} fechamento${pendingClosings > 1 ? 's' : ''} pendente${pendingClosings > 1 ? 's' : ''}`,
      };
    } else {
      result['/cash-closing'] = { level: 'ok', count: 0, tooltip: 'Fechamentos validados' };
    }
  }

  // === EMPLOYEES ===
  if (isAdmin) {
    const unpaid = (unpaidPaymentsRes as any).count || 0;
    if (unpaid > 0) {
      result['/employees'] = {
        level: 'attention',
        count: unpaid,
        tooltip: `${unpaid} pagamento${unpaid > 1 ? 's' : ''} do mês em aberto`,
      };
    } else {
      result['/employees'] = { level: 'ok', count: 0, tooltip: 'Pagamentos em dia' };
    }
  }

  // === REWARDS ===
  if (isAdmin) {
    const pendingRedemptions = (pendingRedemptionsRes as any).count || 0;
    if (pendingRedemptions > 0) {
      result['/rewards'] = {
        level: 'attention',
        count: pendingRedemptions,
        tooltip: `${pendingRedemptions} resgate${pendingRedemptions > 1 ? 's' : ''} pendente${pendingRedemptions > 1 ? 's' : ''}`,
      };
    } else {
      result['/rewards'] = { level: 'ok', count: 0, tooltip: 'Resgates processados' };
    }
  }

  return result;
}

function escalateLevel(base: StatusLevel, urgency: UrgencyLevel): StatusLevel {
  if (base === 'ok') return 'ok';
  // Map urgency to minimum level
  const urgencyToLevel: Record<UrgencyLevel, StatusLevel> = {
    ok: 'attention',
    attention: 'attention',
    warning: 'warning',
    critical: 'critical',
  };
  const urgencyLevel = urgencyToLevel[urgency];
  const order: StatusLevel[] = ['ok', 'attention', 'warning', 'critical'];
  const baseIdx = order.indexOf(base);
  const urgIdx = order.indexOf(urgencyLevel);
  return order[Math.max(baseIdx, urgIdx)];
}

export function useModuleStatus(enabled = true) {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const { moduleUrgency, urgencyBucket } = useTimeBasedUrgency();

  const { data: rawStatuses } = useQuery({
    queryKey: ['module-status', user?.id, activeUnitId],
    queryFn: () => fetchModuleStatuses(user!.id, activeUnitId!, isAdmin),
    enabled: enabled && !!user && !!activeUnitId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const statuses = rawStatuses || {};

  // Apply temporal escalation
  const result: ModuleStatusMap = { ...statuses };

  if (result['/finance'] && result['/finance'].level !== 'ok') {
    result['/finance'] = {
      ...result['/finance'],
      level: escalateLevel(result['/finance'].level, moduleUrgency.finance),
    };
  }

  if (result['/checklists'] && result['/checklists'].level !== 'ok') {
    const hour = new Date().getHours();
    const checklistUrgency = hour < 14 ? moduleUrgency.checklistAbertura : moduleUrgency.checklistFechamento;
    result['/checklists'] = {
      ...result['/checklists'],
      level: escalateLevel(result['/checklists'].level, checklistUrgency),
    };
  }

  if (result['/cash-closing'] && result['/cash-closing'].level !== 'ok') {
    result['/cash-closing'] = {
      ...result['/cash-closing'],
      level: escalateLevel(result['/cash-closing'].level, moduleUrgency.cashClosing),
    };
  }

  return result;
}
