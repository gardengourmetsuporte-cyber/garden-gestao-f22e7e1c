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
  old_values: Record<string, any> | null;
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
  user_unit_added: 'Membro adicionado',
  user_unit_updated: 'Papel alterado',
  user_unit_removed: 'Membro removido',
  access_level_updated: 'Permissão alterada',
  access_level_deleted: 'Permissão removida',
  employee_created: 'Funcionário criado',
  employee_updated: 'Funcionário editado',
  employee_deleted: 'Funcionário removido',
  customer_deleted: 'Cliente removido',
  customer_anonymized: 'Cliente anonimizado (LGPD)',
  finance_account_created: 'Conta criada',
  finance_account_updated: 'Conta editada',
  finance_account_deleted: 'Conta removida',
  user_login: 'Login realizado',
  stock_transfer_created: 'Transferência de estoque',
  stock_transfer_completed: 'Transferência recebida',
};

export function getActionLabel(action: string) {
  return ACTION_LABELS[action] || action;
}

export function useAuditLogs() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00`);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`);
      }

      const { data: logs } = await query;
      if (!logs || logs.length === 0) return { logs: [] as AuditLog[], userNames: {} as Record<string, string> };

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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    actionOptions: Object.entries(ACTION_LABELS).map(([key, label]) => ({ key, label })),
  };
}
