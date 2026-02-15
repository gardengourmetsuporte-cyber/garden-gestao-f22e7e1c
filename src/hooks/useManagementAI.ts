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
  const [hasGreeted, setHasGreeted] = useState(false);
  const { stats } = useDashboardStats();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const greetedRef = useRef(false);

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

    const nowDate = new Date();
    const startDate = format(startOfMonth(nowDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(nowDate), 'yyyy-MM-dd');
    const last7days = format(subDays(nowDate, 7), 'yyyy-MM-dd');

    try {
      const [
        accountsRes,
        incomeRes,
        expenseRes,
        pendingExpRes,
        lowStockRes,
        ordersRes,
        closingsRes,
        employeesRes,
        suppliersRes,
        recentTxRes,
        tasksRes,
      ] = await Promise.all([
        // Finance accounts with balances
        supabase.from('finance_accounts').select('name, type, balance').eq('unit_id', activeUnitId).eq('is_active', true),
        // Monthly income total
        supabase.from('finance_transactions').select('amount').eq('user_id', user.id).eq('unit_id', activeUnitId).eq('type', 'income').eq('is_paid', true).gte('date', startDate).lte('date', endDate),
        // Monthly expense total
        supabase.from('finance_transactions').select('amount').eq('user_id', user.id).eq('unit_id', activeUnitId).in('type', ['expense', 'credit_card']).eq('is_paid', true).gte('date', startDate).lte('date', endDate),
        // Pending expenses
        supabase.from('finance_transactions').select('amount, description, date').eq('user_id', user.id).eq('unit_id', activeUnitId).in('type', ['expense', 'credit_card']).eq('is_paid', false).gte('date', startDate).lte('date', endDate).order('date').limit(10),
        // Low stock items
        supabase.from('inventory_items').select('name, current_stock, min_stock, supplier:suppliers(name)').eq('unit_id', activeUnitId).order('current_stock'),
        // Recent orders
        supabase.from('orders').select('status, supplier:suppliers(name), created_at').eq('unit_id', activeUnitId).in('status', ['draft', 'sent']).order('created_at', { ascending: false }).limit(10),
        // Pending cash closings
        supabase.from('cash_closings').select('date, total_amount, status, unit_name').eq('unit_id', activeUnitId).eq('status', 'pending').order('date', { ascending: false }).limit(5),
        // Active employees
        supabase.from('employees').select('full_name, role, is_active').eq('unit_id', activeUnitId).eq('is_active', true),
        // Suppliers
        supabase.from('suppliers').select('name, delivery_frequency').eq('unit_id', activeUnitId),
        // Recent transactions (last 7 days)
        supabase.from('finance_transactions').select('description, amount, type, date, is_paid, category:finance_categories(name)').eq('user_id', user.id).eq('unit_id', activeUnitId).gte('date', last7days).order('date', { ascending: false }).limit(15),
        // Today's tasks
        supabase.from('manager_tasks').select('title, is_completed, priority, period').eq('user_id', user.id).eq('date', format(nowDate, 'yyyy-MM-dd')),
      ]);

      const totalIncome = (incomeRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = (expenseRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const totalPending = (pendingExpRes.data || []).reduce((s, t) => s + Number(t.amount), 0);

      const lowStockItems = (lowStockRes.data || []).filter((i: any) => i.current_stock <= i.min_stock);

      return {
        // Basic
        criticalStockCount: stats.criticalItems,
        pendingRedemptions: stats.pendingRedemptions,
        dayOfWeek,
        timeOfDay,
        // Finance
        accounts: (accountsRes.data || []).map((a: any) => `${a.name} (${a.type}): R$${Number(a.balance).toFixed(2)}`),
        monthlyIncome: totalIncome,
        monthlyExpense: totalExpense,
        monthlyBalance: totalIncome - totalExpense,
        pendingExpensesTotal: totalPending,
        pendingExpenses: (pendingExpRes.data || []).map((e: any) => `${e.description}: R$${Number(e.amount).toFixed(2)} (${e.date})`),
        recentTransactions: (recentTxRes.data || []).map((t: any) => `${t.date} | ${t.type === 'income' ? '+' : '-'}R$${Number(t.amount).toFixed(2)} | ${t.description} | ${t.is_paid ? 'pago' : 'pendente'} | cat: ${(t.category as any)?.name || 'sem'}`),
        // Stock
        lowStockItems: lowStockItems.slice(0, 10).map((i: any) => `${i.name}: ${i.current_stock}/${i.min_stock} (forn: ${(i.supplier as any)?.name || 'nenhum'})`),
        // Orders
        pendingOrders: (ordersRes.data || []).map((o: any) => `${(o.supplier as any)?.name || '?'}: ${o.status}`),
        // Closings
        pendingClosings: (closingsRes.data || []).map((c: any) => `${c.date}: R$${Number(c.total_amount || 0).toFixed(2)} (${c.unit_name})`),
        // Team
        employees: (employeesRes.data || []).map((e: any) => `${e.full_name} (${e.role || 'sem cargo'})`),
        // Suppliers
        suppliers: (suppliersRes.data || []).map((s: any) => `${s.name} [${s.delivery_frequency || 'weekly'}]`),
        // Tasks
        todayTasks: (tasksRes.data || []).map((t: any) => `${t.is_completed ? '✅' : '⬜'} ${t.title} (${t.priority}, ${t.period})`),
      };
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

      const { data, error } = await supabase.functions.invoke('management-ai', {
        body: {
          messages: question ? updatedMessages : [],
          context,
        },
      });

      if (error) throw error;

      const response = data?.suggestion || 'Não consegui gerar uma resposta no momento.';
      const assistantMsg: AIMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
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
    }
  }, [messages, fetchFullContext]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(HISTORY_KEY);
    setHasGreeted(false);
    greetedRef.current = false;
  }, []);

  return {
    messages,
    isLoading,
    hasGreeted,
    sendMessage,
    clearHistory,
  };
}
