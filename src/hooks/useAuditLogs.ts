import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export interface AuditLog {
  id: string;
  user_id: string;
  unit_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
  user_name?: string;
}

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  stock_entrada: 'Entrada de estoque',
  stock_saida: 'Saída de estoque',
  transaction_created: 'Transação criada',
  transaction_deleted: 'Transação removida',
  cash_closing_created: 'Fechamento de caixa',
  cash_closing_updated: 'Fechamento atualizado',
  checklist_completed: 'Checklist concluído',
};

export function getActionLabel(action: string) {
  return ACTION_LABELS[action] || action;
}

export function useAuditLogs() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data: logs } = await query;
      if (!logs || logs.length === 0) return { logs: [] as AuditLog[], userNames: {} as Record<string, string> };

      // Fetch user names for these logs
      const userIds = [...new Set((logs as any[]).map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.user_id] = p.full_name; });

      return {
        logs: (logs as unknown as AuditLog[]).map(l => ({ ...l, user_name: nameMap[l.user_id] || 'Desconhecido' })),
        userNames: nameMap,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const hasMore = (data?.logs.length ?? 0) === PAGE_SIZE;

  return {
    logs: data?.logs ?? [],
    isLoading,
    page,
    setPage,
    hasMore,
    actionFilter,
    setActionFilter,
    actionOptions: Object.entries(ACTION_LABELS).map(([key, label]) => ({ key, label })),
  };
}
