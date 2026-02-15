import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from './useDashboardStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

const HISTORY_KEY = 'garden_copilot_history';
const MAX_HISTORY = 20; // Keep last 20 messages for context

function loadHistory(): AIMessage[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveHistory(messages: AIMessage[]) {
  try {
    // Keep only the last MAX_HISTORY messages
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function useManagementAI() {
  const [messages, setMessages] = useState<AIMessage[]>(loadHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const { stats } = useDashboardStats();
  const greetedRef = useRef(false);

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = format(now, 'EEEE', { locale: ptBR });
  const timeOfDay = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

  // Save history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveHistory(messages);
    }
  }, [messages]);

  const buildContext = useCallback(() => ({
    criticalStockCount: stats.criticalItems,
    pendingRedemptions: stats.pendingRedemptions,
    dayOfWeek,
    timeOfDay,
  }), [stats, dayOfWeek, timeOfDay]);

  const sendMessage = useCallback(async (question?: string) => {
    setIsLoading(true);

    let updatedMessages = [...messages];

    if (question) {
      const userMsg: AIMessage = { role: 'user', content: question };
      updatedMessages = [...updatedMessages, userMsg];
      setMessages(updatedMessages);
    }

    try {
      const { data, error } = await supabase.functions.invoke('management-ai', {
        body: {
          // Send full conversation history for context/memory
          messages: question ? updatedMessages : [],
          context: buildContext(),
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
  }, [messages, buildContext]);

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
