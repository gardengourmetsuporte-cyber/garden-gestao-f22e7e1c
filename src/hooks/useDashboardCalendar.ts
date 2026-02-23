import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useAgenda } from '@/hooks/useAgenda';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { CalendarEvent, CalendarDayEvents } from '@/types/calendar';
import type { MarketingPost } from '@/types/marketing';

interface FinanceDayRow {
  date: string;
  amount: number;
  type: string;
}

export function useDashboardCalendar(currentMonth: Date) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const { allTasks } = useAgenda();

  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthNum = currentMonth.getMonth() + 1;
  const yearNum = currentMonth.getFullYear();

  // Finance transactions for the month (lightweight query)
  const { data: financeRows = [], isLoading: financeLoading } = useQuery({
    queryKey: ['dashboard-calendar-finance', monthStart, activeUnitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('date, amount, type, description')
        .eq('unit_id', activeUnitId!)
        .eq('is_paid', true)
        .gte('date', monthStart)
        .lte('date', monthEnd);
      if (error) throw error;
      return (data || []) as (FinanceDayRow & { description?: string })[];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 5 * 60 * 1000,
  });

  // Marketing posts for the month (fixed filter)
  const { data: marketingPosts = [], isLoading: marketingLoading } = useQuery({
    queryKey: ['dashboard-calendar-marketing', monthStart, activeUnitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_posts' as any)
        .select('id, title, status, scheduled_at, published_at')
        .eq('unit_id', activeUnitId!)
        .or(`and(scheduled_at.gte.${monthStart},scheduled_at.lte.${monthEnd}T23:59:59),and(published_at.gte.${monthStart},published_at.lte.${monthEnd}T23:59:59)`);
      if (error) throw error;
      return (data || []) as unknown as Pick<MarketingPost, 'id' | 'title' | 'status' | 'scheduled_at' | 'published_at'>[];
    },
    enabled: !!user && !!activeUnitId,
    staleTime: 5 * 60 * 1000,
  });

  // Schedules (day_off) for the month
  const { data: scheduleRows = [], isLoading: scheduleLoading } = useQuery({
    queryKey: ['dashboard-calendar-schedules', monthNum, yearNum, activeUnitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_schedules')
        .select('id, user_id, day_off, status, profiles:profiles!work_schedules_user_id_fkey(full_name)')
        .eq('month', monthNum)
        .eq('year', yearNum);
      if (error) {
        // Fallback without join
        const { data: fallback } = await supabase
          .from('work_schedules')
          .select('id, user_id, day_off, status')
          .eq('month', monthNum)
          .eq('year', yearNum);
        return (fallback || []).map((s: any) => ({ ...s, profile_name: null }));
      }
      return (data || []).map((s: any) => ({
        ...s,
        profile_name: s.profiles?.full_name || null,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = financeLoading || marketingLoading || scheduleLoading;

  // Calculate finance peak threshold (2x daily average) - only expenses
  const expensesByDay = useMemo(() => {
    const map = new Map<string, number>();
    financeRows.filter(r => r.type === 'expense').forEach(r => {
      map.set(r.date, (map.get(r.date) || 0) + Math.abs(r.amount));
    });
    return map;
  }, [financeRows]);

  const financePeakThreshold = useMemo(() => {
    if (expensesByDay.size === 0) return Infinity;
    const totalExpense = Array.from(expensesByDay.values()).reduce((a, b) => a + b, 0);
    const daysInMonth = endOfMonth(currentMonth).getDate();
    const dailyAvg = totalExpense / daysInMonth;
    return dailyAvg * 2;
  }, [expensesByDay, currentMonth]);

  // Build consolidated events map
  const eventsMap = useMemo(() => {
    const map = new Map<string, CalendarDayEvents>();

    const getDay = (dateStr: string): CalendarDayEvents => {
      if (!map.has(dateStr)) {
        map.set(dateStr, { tasks: [], finance: [], marketing: [], schedules: [] });
      }
      return map.get(dateStr)!;
    };

    // Tasks from agenda
    allTasks.forEach(task => {
      if (!task.due_date) return;
      // Normalize date to avoid timezone issues (append T12:00:00)
      const dateKey = task.due_date.substring(0, 10);
      const day = getDay(dateKey);
      day.tasks.push({
        id: task.id,
        type: task.is_completed ? 'task_done' : 'task_pending',
        title: task.title,
        time: task.due_time || undefined,
        subtitle: (task.category as any)?.name || undefined,
      });
    });

    // Finance: all transactions grouped by day for detail view
    financeRows.forEach(r => {
      const day = getDay(r.date);
      day.finance.push({
        id: `fin-${r.date}-${day.finance.length}`,
        type: r.type === 'expense' ? 'finance_peak' : 'finance_income',
        title: r.description || (r.type === 'expense' ? 'Despesa' : 'Receita'),
        amount: Math.abs(r.amount),
      });
    });

    // Mark peak days with a summary entry at the beginning
    expensesByDay.forEach((total, dateStr) => {
      if (total >= financePeakThreshold) {
        const day = getDay(dateStr);
        day.finance.unshift({
          id: `fin-peak-${dateStr}`,
          type: 'finance_peak',
          title: `Pico: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          amount: total,
          subtitle: 'Acima da média',
        });
      }
    });

    // Marketing posts
    marketingPosts.forEach(post => {
      const d = post.scheduled_at || post.published_at;
      if (!d) return;
      const dateKey = d.substring(0, 10);
      const day = getDay(dateKey);
      day.marketing.push({
        id: post.id,
        type: 'marketing',
        title: post.title,
        subtitle: post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Agendado' : 'Rascunho',
      });
    });

    // Schedules
    scheduleRows.forEach((s: any) => {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(s.day_off).padStart(2, '0')}`;
      const day = getDay(dateStr);
      day.schedules.push({
        id: s.id,
        type: 'schedule',
        title: s.profile_name || 'Funcionário',
        subtitle: s.status === 'approved' ? 'Aprovada' : s.status === 'pending' ? 'Pendente' : 'Rejeitada',
      });
    });

    return map;
  }, [allTasks, financeRows, expensesByDay, financePeakThreshold, marketingPosts, scheduleRows, monthNum, yearNum]);

  return { eventsMap, isLoading };
}
