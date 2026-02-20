import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from './useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { format, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

const OLD_HISTORY_KEY = 'garden_copilot_history';
const MAX_HISTORY = 20;
const CONVERSATION_KEY = 'garden_copilot_conversation_id';

export function useManagementAI() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const { stats } = useDashboardStats();
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const greetedRef = useRef(false);
  const contextCacheRef = useRef<{ data: any; timestamp: number } | null>(null);
  const loadedRef = useRef(false);
  const CONTEXT_TTL = 5 * 60 * 1000;

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = format(now, 'EEEE', { locale: ptBR });
  const timeOfDay = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('copilot_conversations')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(30);
    setConversations(data || []);
  }, [user]);

  // Load messages for a conversation
  const loadConversationMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('copilot_messages')
      .select('role, content, image_url')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(MAX_HISTORY);

    const msgs: AIMessage[] = (data || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      imageUrl: m.image_url || undefined,
    }));
    setMessages(msgs);
    if (msgs.length > 0) {
      setHasGreeted(true);
      greetedRef.current = true;
    }
  }, []);

  // Initialize: load last conversation or migrate from localStorage
  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;

    const init = async () => {
      await loadConversations();

      // Check for stored conversation id
      const storedId = localStorage.getItem(CONVERSATION_KEY);
      if (storedId) {
        setConversationId(storedId);
        await loadConversationMessages(storedId);
        return;
      }

      // Migrate from old localStorage history
      try {
        const oldHistory = localStorage.getItem(OLD_HISTORY_KEY);
        if (oldHistory) {
          const oldMessages: AIMessage[] = JSON.parse(oldHistory);
          if (oldMessages.length > 0) {
            // Create a new conversation and migrate messages
            const { data: conv } = await supabase
              .from('copilot_conversations')
              .insert({ user_id: user.id, unit_id: activeUnitId, title: 'Conversa migrada' })
              .select('id')
              .single();

            if (conv) {
              const rows = oldMessages.map((m) => ({
                conversation_id: conv.id,
                role: m.role,
                content: m.content,
                image_url: m.imageUrl || null,
              }));
              await supabase.from('copilot_messages').insert(rows);
              setConversationId(conv.id);
              localStorage.setItem(CONVERSATION_KEY, conv.id);
              setMessages(oldMessages);
              setHasGreeted(true);
              greetedRef.current = true;
            }
            localStorage.removeItem(OLD_HISTORY_KEY);
            await loadConversations();
          }
        }
      } catch {}
    };
    init();
  }, [user, activeUnitId, loadConversations, loadConversationMessages]);

  // Save a message to the database
  const saveMessage = useCallback(async (convId: string, msg: AIMessage) => {
    await supabase.from('copilot_messages').insert({
      conversation_id: convId,
      role: msg.role,
      content: msg.content,
      image_url: msg.imageUrl || null,
    });
  }, []);

  // Ensure a conversation exists, create if needed
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId;
    if (!user) throw new Error('User not authenticated');

    const { data: conv } = await supabase
      .from('copilot_conversations')
      .insert({ user_id: user.id, unit_id: activeUnitId, title: 'Nova conversa' })
      .select('id')
      .single();

    if (!conv) throw new Error('Failed to create conversation');
    setConversationId(conv.id);
    localStorage.setItem(CONVERSATION_KEY, conv.id);
    await loadConversations();
    return conv.id;
  }, [conversationId, user, activeUnitId, loadConversations]);

  // Switch to a different conversation
  const switchConversation = useCallback(async (convId: string) => {
    setConversationId(convId);
    localStorage.setItem(CONVERSATION_KEY, convId);
    setHasGreeted(false);
    greetedRef.current = false;
    await loadConversationMessages(convId);
  }, [loadConversationMessages]);

  // Start a new conversation
  const newConversation = useCallback(() => {
    setConversationId(null);
    localStorage.removeItem(CONVERSATION_KEY);
    setMessages([]);
    setHasGreeted(false);
    greetedRef.current = false;
  }, []);

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
    const todayStr = format(nowDate, 'yyyy-MM-dd');
    const next7days = format(addDays(nowDate, 7), 'yyyy-MM-dd');

    try {
      const [
        accountsRes, incomeRes, expenseRes, pendingExpRes,
        lowStockRes, ordersRes, closingsRes, employeesRes,
        suppliersRes, recentTxRes, tasksRes, employeePaymentsRes,
        allMonthTxRes,
        checklistItemsRes, checklistCompletionsRes,
        supplierInvoicesRes, budgetsRes, budgetSpentRes,
        preferencesRes,
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
        supabase.from('manager_tasks').select('title, is_completed, priority, period').eq('user_id', user.id).eq('date', todayStr),
        supabase.from('employee_payments').select('amount, type, is_paid, payment_date, employee:employees(full_name)').eq('unit_id', activeUnitId).eq('reference_month', nowDate.getMonth() + 1).eq('reference_year', nowDate.getFullYear()).order('payment_date', { ascending: false }).limit(30),
        supabase.from('finance_transactions').select('description, amount, type, date, is_paid').eq('user_id', user.id).eq('unit_id', activeUnitId).gte('date', startDate).lte('date', endDate).order('date', { ascending: false }).limit(100),
        supabase.from('checklist_items').select('id, checklist_type').eq('unit_id', activeUnitId).eq('is_active', true).is('deleted_at', null),
        supabase.from('checklist_completions').select('id, checklist_type, is_skipped').eq('unit_id', activeUnitId).eq('date', todayStr),
        supabase.from('supplier_invoices').select('description, amount, due_date, is_paid, supplier:suppliers(name)').eq('unit_id', activeUnitId).eq('is_paid', false).gte('due_date', todayStr).lte('due_date', next7days).order('due_date').limit(10),
        supabase.from('finance_budgets').select('planned_amount, category:finance_categories(name)').eq('unit_id', activeUnitId).eq('user_id', user.id).eq('month', nowDate.getMonth() + 1).eq('year', nowDate.getFullYear()),
        supabase.from('finance_transactions').select('amount, category_id').eq('user_id', user.id).eq('unit_id', activeUnitId).in('type', ['expense', 'credit_card']).eq('is_paid', true).gte('date', startDate).lte('date', endDate),
        supabase.from('copilot_preferences').select('key, value, category').eq('user_id', user.id).limit(50),
      ]);

      const totalIncome = (incomeRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = (expenseRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const totalPending = (pendingExpRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const lowStockItems = (lowStockRes.data || []).filter((i: any) => i.current_stock <= i.min_stock);

      const checklistItems = checklistItemsRes.data || [];
      const checklistCompletions = checklistCompletionsRes.data || [];
      const abertura = checklistItems.filter((i: any) => i.checklist_type === 'abertura');
      const fechamento = checklistItems.filter((i: any) => i.checklist_type === 'fechamento');
      const aberturaCompleted = checklistCompletions.filter((c: any) => c.checklist_type === 'abertura').length;
      const fechamentoCompleted = checklistCompletions.filter((c: any) => c.checklist_type === 'fechamento').length;
      const checklistProgress = `Abertura: ${aberturaCompleted}/${abertura.length} (${abertura.length > 0 ? Math.round((aberturaCompleted / abertura.length) * 100) : 0}%) | Fechamento: ${fechamentoCompleted}/${fechamento.length} (${fechamento.length > 0 ? Math.round((fechamentoCompleted / fechamento.length) * 100) : 0}%)`;

      const upcomingInvoices = (supplierInvoicesRes.data || []).map((inv: any) =>
        `${(inv.supplier as any)?.name || '?'}: ${inv.description} - R$${Number(inv.amount).toFixed(2)} (vence ${inv.due_date})`
      );

      const budgetData = budgetsRes.data || [];
      const spentByCat: Record<string, number> = {};
      (budgetSpentRes.data || []).forEach((t: any) => {
        if (t.category_id) {
          spentByCat[t.category_id] = (spentByCat[t.category_id] || 0) + Number(t.amount);
        }
      });
      const budgetStatus = budgetData.map((b: any) => {
        const catName = (b.category as any)?.name || 'Sem categoria';
        const spent = spentByCat[(b.category as any)?.id] || 0;
        const pct = b.planned_amount > 0 ? Math.round((spent / b.planned_amount) * 100) : 0;
        return `${catName}: R$${spent.toFixed(2)} / R$${Number(b.planned_amount).toFixed(2)} (${pct}%)`;
      });

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
        checklistProgress,
        upcomingInvoices,
        budgetStatus,
        preferences: (preferencesRes.data || []).map((p: any) => `${p.key} = ${p.value} (${p.category})`),
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

  const sendMessage = useCallback(async (question?: string, imageBase64?: string) => {
    setIsLoading(true);

    let updatedMessages = [...messages];
    let convId: string;

    try {
      convId = await ensureConversation();
    } catch {
      setIsLoading(false);
      return;
    }

    if (question) {
      const userMsg: AIMessage = { role: 'user', content: question, imageUrl: imageBase64 };
      updatedMessages = [...updatedMessages, userMsg];
      setMessages(updatedMessages);
      // Save user message to DB
      await saveMessage(convId, userMsg);

      // Auto-title: use first user message as conversation title
      if (updatedMessages.filter(m => m.role === 'user').length === 1) {
        const title = question.slice(0, 80);
        await supabase.from('copilot_conversations').update({ title }).eq('id', convId);
        await loadConversations();
      }
    }

    try {
      const context = await fetchFullContext();

      const { data, error } = await supabase.functions.invoke('management-ai', {
        body: {
          messages: question ? updatedMessages.map(m => ({ role: m.role, content: m.content, imageUrl: m.imageUrl })) : [],
          context,
          user_id: user?.id || null,
          unit_id: activeUnitId || null,
          image: imageBase64 || null,
        },
      });

      if (error) throw error;

      const response = data?.suggestion || 'Não consegui gerar uma resposta no momento.';

      if (data?.action_executed) {
        setIsExecuting(true);
        contextCacheRef.current = null;
      }

      const assistantMsg: AIMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);
      // Save assistant message to DB
      await saveMessage(convId, assistantMsg);

      if (!question) {
        setHasGreeted(true);
        greetedRef.current = true;
      }
    } catch (err: any) {
      const errorMsg = err?.message?.includes('429')
        ? 'Muitas requisições. Tente novamente em alguns minutos.'
        : 'Erro ao consultar o assistente. Tente novamente.';
      const errAIMsg: AIMessage = { role: 'assistant', content: errorMsg };
      setMessages(prev => [...prev, errAIMsg]);
      await saveMessage(convId, errAIMsg);
    } finally {
      setIsLoading(false);
      setIsExecuting(false);
    }
  }, [messages, fetchFullContext, user, activeUnitId, ensureConversation, saveMessage, loadConversations]);

  const clearHistory = useCallback(async () => {
    // Delete current conversation from DB
    if (conversationId) {
      await supabase.from('copilot_conversations').delete().eq('id', conversationId);
    }
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem(CONVERSATION_KEY);
    localStorage.removeItem(OLD_HISTORY_KEY);
    setHasGreeted(false);
    greetedRef.current = false;
    await loadConversations();
  }, [conversationId, loadConversations]);

  return {
    messages,
    isLoading,
    isExecuting,
    hasGreeted,
    sendMessage,
    clearHistory,
    // New: conversation management
    conversations,
    conversationId,
    switchConversation,
    newConversation,
  };
}
