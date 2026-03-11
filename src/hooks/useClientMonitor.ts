import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonitoredClient {
  id: string;
  user_id: string;
  unit_id: string | null;
  label: string;
  notify_on_login: boolean;
  notify_on_actions: boolean;
  created_at: string;
  // Joined
  unit_name?: string;
  user_email?: string;
  user_name?: string;
  plan?: string;
  last_login?: string;
  login_count?: number;
  action_count?: number;
}

export interface ClientActivity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

export function useMonitoredClients() {
  return useQuery({
    queryKey: ['monitored-clients'],
    queryFn: async () => {
      const { data: monitors, error } = await supabase
        .from('monitored_accounts' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!monitors?.length) return [];

      const userIds = [...new Set((monitors as any[]).map(m => m.user_id))];
      const unitIds = [...new Set((monitors as any[]).filter((m: any) => m.unit_id).map((m: any) => m.unit_id))];

      const [profilesRes, unitsRes, loginsRes, actionsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, plan').in('user_id', userIds),
        unitIds.length > 0 ? supabase.from('units').select('id, name').in('id', unitIds) : { data: [] },
        supabase.from('audit_logs' as any).select('user_id, created_at').in('user_id', userIds).eq('action', 'user_login').order('created_at', { ascending: false }).limit(1000),
        supabase.from('audit_logs' as any).select('user_id').in('user_id', userIds).neq('action', 'user_login').limit(10000),
      ]);

      const profileMap: Record<string, any> = {};
      (profilesRes.data || []).forEach(p => { profileMap[p.user_id] = p; });

      const unitMap: Record<string, string> = {};
      ((unitsRes as any).data || []).forEach((u: any) => { unitMap[u.id] = u.name; });

      const loginsByUser: Record<string, { count: number; last: string }> = {};
      ((loginsRes.data || []) as any[]).forEach(l => {
        if (!loginsByUser[l.user_id]) {
          loginsByUser[l.user_id] = { count: 0, last: l.created_at };
        }
        loginsByUser[l.user_id].count++;
      });

      const actionsByUser: Record<string, number> = {};
      ((actionsRes.data || []) as any[]).forEach(a => {
        actionsByUser[a.user_id] = (actionsByUser[a.user_id] || 0) + 1;
      });

      return (monitors as any[]).map(m => ({
        ...m,
        user_name: profileMap[m.user_id]?.full_name || 'Desconhecido',
        user_email: '',
        plan: profileMap[m.user_id]?.plan || 'free',
        unit_name: m.unit_id ? unitMap[m.unit_id] || '' : '',
        last_login: loginsByUser[m.user_id]?.last || null,
        login_count: loginsByUser[m.user_id]?.count || 0,
        action_count: actionsByUser[m.user_id] || 0,
      })) as MonitoredClient[];
    },
    staleTime: 30_000,
  });
}

export function useClientActivity(userId: string | null) {
  return useQuery({
    queryKey: ['client-activity', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('audit_logs' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as unknown as ClientActivity[];
    },
    enabled: !!userId,
    staleTime: 15_000,
  });
}
