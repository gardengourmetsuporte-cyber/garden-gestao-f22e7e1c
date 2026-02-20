import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from './useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

const HISTORY_KEY = 'garden_copilot_history';
const MAX_HISTORY = 20;

function loadHistory(): AIMessage[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveHistory(messages: AIMessage[]) {
  try {
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function useManagementAI() {
  const [messages, setMessages] = useState<AIMessage[]>(loadHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const { stats } = useDashboardStats();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const greetedRef = useRef(false);
  const contextCacheRef = useRef<{ data: any; timestamp: number } | null>(null);
  const CONTEXT_TTL = 5 * 60 * 1000; // 5 minutes

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = format(now, 'EEEE', { locale: ptBR });
  const timeOfDay = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

  useEffect(() => {
    if (messages.length > 0) {
      saveHistory(messages);
    }
  }, [messages]);

  // Fetch rich context from all modules
  const fetchFullContext = useCallback(async () => {
    if (!user || !activeUnitId) return {};

    const now = Date.now();
    if (contextCacheRef.current && (now - contextCacheRef.current.timestamp) < CONTEXT_TTL) {
      return contextCacheRef.current.data;
    }

    const nowDate = new Date();
    const startDate = format(startOfMonth(nowDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(nowDate), 'yyyy-MM-dd');
    const last7days = format(subDays(nowDate, 7), 'yyyy-MM-dd');

    try {
      const [
        accountsRes, incomeRes, expenseRes, pendingExpRes,
        lowStockRes, ordersRes, closingsRes, employeesRes,
        suppliersRes, recentTxRes, tasksRes, employeePaymentsRes,
        allMonthTxRes,
      ] = await Promise.all([
        supabase.from('finance_accounts').select('name, type, balance').eq('unit_id', activeUnitId).eq('is_active', true),
        supabase.from('finance_transactions').select('amount').eq('user_id', user.id).eq('unit_id', activeUnitId).eq('type', 'income').eq('is_paid', true).gte('date', startDate).lte('date', endDate),
        supabase.from('finance_transactions').select('amount').eq('user_id', user.id).eq('unit_id', activeUnitId).in('type', ['expense', 'credit_card']).eq('is_paid', true).gte('date', startDate).lte('date', endDate),
        supabase.from('finance_transactions').select('amount, description, date, employee_id').eq('user_id', user.id).eq('unit_id', activeUnitId).in('type', ['expense', 'credit_card']).eq('is_paid', false).gte('date', startDate).lte('date', endDate).order('date').limit(30),
        supabase.from('inventory_items').select('name, current_stock, min_stock, supplier:suppliers(name)').eq('unit_id', activeUnitId).order('current_stock'),
        supabase.from('orders').select('status, supplier:suppliers(name), created_at').eq('unit_id', activeUnitId).in('status', ['draft', 'sent']).order('created_at', { ascending: false }).limit(10),
        supabase.from('cash_closings').select('date, total_amount, status, unit_name').eq('unit_id', activeUnitId).eq('status', 'pending').order('date', { ascending: false }).limit(5),
        supabase.from('employees').select('full_name, role, is_active, base_salary').eq('unit_id', activeUnitId).eq('is_active', true),
        supabase.from('suppliers').select('name, delivery_frequency').eq('unit_id', activeUnitId),
        supabase.from('finance_transactions').select('description, amount, type, date, is_paid, category:finance_categories(name), employee:employees(full_name), supplier:suppliers(name)').eq('user_id', user.id).eq('unit_id', activeUnitId).gte('date', last7days).order('date', { ascending: false }).limit(50),
        supabase.from('manager_tasks').select('title, is_completed, priority, period').eq('user_id', user.id).eq('date', format(nowDate, 'yyyy-MM-dd')),
        supabase.from('employee_payments').select('amount, type, is_paid, payment_date, employee:employees(full_name)').eq('unit_id', activeUnitId).eq('reference_month', nowDate.getMonth() + 1).eq('reference_year', nowDate.getFullYear()).order('payment_date', { ascending: false }).limit(30),
        supabase.from('finance_transactions').select('description, amount, type, date, is_paid').eq('user_id', user.id).eq('unit_id', activeUnitId).gte('date', startDate).lte('date', endDate).order('date', { ascending: false }).limit(100),
      ]);

      const totalIncome = (incomeRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = (expenseRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const totalPending = (pendingExpRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const lowStockItems = (lowStockRes.data || []).filter((i: any) => i.current_stock <= i.min_stock);

      const contextData = {
        criticalStockCount: stats.criticalItems,
        pendingRedemptions: stats.pendingRedemptions,
        dayOfWeek,
        timeOfDay,
        accounts: (accountsRes.data || []).map((a: any) => `${a.name} (${a.type}): R$${Number(a.balance).toFixed(2)}`),
        monthlyIncome: totalIncome,
        monthlyExpense: totalExpense,
        monthlyBalance: totalIncome - totalExpense,
        pendingExpensesTotal: totalPending,
        pendingExpenses: (pendingExpRes.data || []).map((e: any) => `${e.description}: R$${Number(e.amount).toFixed(2)} (${e.date})`),
        recentTransactions: (recentTxRes.data || []).map((t: any) => `${t.date} | ${t.type === 'income' ? '+' : '-'}R$${Number(t.amount).toFixed(2)} | ${t.description} | ${t.is_paid ? 'pago' : 'pendente'} | cat: ${(t.category as any)?.name || 'sem'} | func: ${(t.employee as any)?.full_name || '-'} | forn: ${(t.supplier as any)?.name || '-'}`),
        allMonthTransactions: (allMonthTxRes.data || []).map((t: any) => `${t.date} | ${t.type === 'income' ? '+' : '-'}R$${Number(t.amount).toFixed(2)} | ${t.description} | ${t.is_paid ? 'pago' : 'pendente'}`),
        lowStockItems: lowStockItems.slice(0, 10).map((i: any) => `${i.name}: ${i.current_stock}/${i.min_stock} (forn: ${(i.supplier as any)?.name || 'nenhum'})`),
        pendingOrders: (ordersRes.data || []).map((o: any) => `${(o.supplier as any)?.name || '?'}: ${o.status}`),
        pendingClosings: (closingsRes.data || []).map((c: any) => `${c.date}: R$${Number(c.total_amount || 0).toFixed(2)} (${c.unit_name})`),
        employees: (employeesRes.data || []).map((e: any) => `${e.full_name} (${e.role || 'sem cargo'}) - Salário base: R$${Number(e.base_salary || 0).toFixed(2)}`),
        employeePayments: (employeePaymentsRes.data || []).map((p: any) => `${(p.employee as any)?.full_name || '?'}: R$${Number(p.amount).toFixed(2)} (${p.type}) - ${p.is_paid ? 'pago' : 'pendente'} - ${p.payment_date}`),
        suppliers: (suppliersRes.data || []).map((s: any) => `${s.name} [${s.delivery_frequency || 'weekly'}]`),
        todayTasks: (tasksRes.data || []).map((t: any) => `${t.is_completed ? '✅' : '⬜'} ${t.title} (${t.priority}, ${t.period})`),
      };

      contextCacheRef.current = { data: contextData, timestamp: Date.now() };
      return contextData;
    } catch (err) {
      console.error('Error fetching AI context:', err);
      return {
        criticalStockCount: stats.criticalItems,
        pendingRedemptions: stats.pendingRedemptions,
        dayOfWeek,
        timeOfDay,
      };
    }
  }, [user, activeUnitId, stats, dayOfWeek, timeOfDay]);

  const sendMessage = useCallback(async (question?: string) => {
    setIsLoading(true);

    let updatedMessages = [...messages];

    if (question) {
      const userMsg: AIMessage = { role: 'user', content: question };
      updatedMessages = [...updatedMessages, userMsg];
      setMessages(updatedMessages);
    }

    try {
      const context = await fetchFullContext();

      setIsExecuting(true);

      const { data, error } = await supabase.functions.invoke('management-ai', {
        body: {
          messages: question ? updatedMessages : [],
          context,
          user_id: user?.id || null,
          unit_id: activeUnitId || null,
        },
      });

      if (error) throw error;

      const response = data?.suggestion || 'Não consegui gerar uma resposta no momento.';
      const assistantMsg: AIMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);

      // Invalidate context cache if an action was executed
      if (data?.action_executed) {
        contextCacheRef.current = null;
      }

      if (!question) {
        setHasGreeted(true);
        greetedRef.current = true;
      }
    } catch (err: any) {
      const errorMsg = err?.message?.includes('429')
        ? 'Muitas requisições. Tente novamente em alguns minutos.'
        : 'Erro ao consultar o assistente. Tente novamente.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
      setIsExecuting(false);
    }
  }, [messages, fetchFullContext, user, activeUnitId]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(HISTORY_KEY);
    setHasGreeted(false);
    greetedRef.current = false;
  }, []);

  return {
    messages,
    isLoading,
    isExecuting,
    hasGreeted,
    sendMessage,
    clearHistory,
  };
}
