import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDashboardStats } from './useDashboardStats';
import { useChecklists } from './useChecklists';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useManagementAI() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const { stats } = useDashboardStats();

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = format(now, 'EEEE', { locale: ptBR });
  const timeOfDay = hour < 12 ? 'manhã' : hour < 18 ? 'tarde' : 'noite';

  const buildContext = useCallback((question?: string) => ({
    criticalStockCount: stats.criticalItems,
    zeroStockCount: 0, // simplified
    pendingRedemptions: stats.pendingRedemptions,
    pendingTasks: 0,
    completedTasks: 0,
    checklistOpeningStatus: 'não verificado',
    checklistClosingStatus: 'não verificado',
    dayOfWeek,
    timeOfDay,
    ...(question ? { userQuestion: question } : {}),
  }), [stats, dayOfWeek, timeOfDay]);

  const sendMessage = useCallback(async (question?: string) => {
    setIsLoading(true);

    if (question) {
      setMessages(prev => [...prev, { role: 'user', content: question }]);
    }

    try {
      const { data, error } = await supabase.functions.invoke('management-ai', {
        body: buildContext(question),
      });

      if (error) throw error;

      const response = data?.suggestion || 'Não consegui gerar uma resposta no momento.';
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      if (!question) setHasGreeted(true);
    } catch (err: any) {
      const errorMsg = err?.message?.includes('429')
        ? 'Muitas requisições. Tente novamente em alguns minutos.'
        : 'Erro ao consultar o assistente. Tente novamente.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  }, [buildContext]);

  return {
    messages,
    isLoading,
    hasGreeted,
    sendMessage,
  };
}
