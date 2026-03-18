import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { differenceInDays, isToday, isTomorrow, isPast, addDays } from 'date-fns';

export interface Subscription {
  id: string;
  user_id: string;
  unit_id: string;
  name: string;
  category: string;
  type: 'assinatura' | 'conta_fixa';
  price: number;
  billing_cycle: 'mensal' | 'anual' | 'semanal';
  next_payment_date: string | null;
  status: 'ativo' | 'pausado' | 'cancelado';
  management_url: string | null;
  notes: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionInsert = Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'unit_id'>;

export const SUBSCRIPTION_CATEGORIES = [
  { value: 'streaming', label: 'Streaming', color: '#8b5cf6' },
  { value: 'software', label: 'Software', color: '#3b82f6' },
  { value: 'cloud', label: 'Cloud', color: '#06b6d4' },
  { value: 'alimentacao', label: 'Alimentação', color: '#f59e0b' },
  { value: 'transporte', label: 'Transporte', color: '#10b981' },
  { value: 'telefonia', label: 'Telefonia', color: '#64748b' },
  { value: 'internet', label: 'Internet', color: '#0ea5e9' },
  { value: 'seguros', label: 'Seguros', color: '#ec4899' },
  { value: 'energia', label: 'Energia', color: '#eab308' },
  { value: 'agua', label: 'Água', color: '#38bdf8' },
  { value: 'aluguel', label: 'Aluguel', color: '#f97316' },
  { value: 'academia', label: 'Academia', color: '#22c55e' },
  { value: 'outros', label: 'Outros', color: '#94a3b8' },
];

export function getCategoryInfo(value: string) {
  return SUBSCRIPTION_CATEGORIES.find(c => c.value === value) || SUBSCRIPTION_CATEGORIES[SUBSCRIPTION_CATEGORIES.length - 1];
}

export function getMonthlyPrice(price: number, cycle: string): number {
  if (cycle === 'anual') return price / 12;
  if (cycle === 'semanal') return price * 4.33;
  return price;
}

export type AlertLevel = 'overdue' | 'today' | 'tomorrow' | 'soon';

export function getAlertLevel(dateStr: string | null): AlertLevel | null {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T12:00:00');
  if (isPast(date) && !isToday(date)) return 'overdue';
  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';
  if (differenceInDays(date, new Date()) <= 7) return 'soon';
  return null;
}

export function useSubscriptions() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const queryKey = ['subscriptions', activeUnitId];

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('recurring_subscriptions')
        .select('*')
        .eq('unit_id', activeUnitId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Subscription[];
    },
    enabled: !!activeUnitId && !!user,
  });

  const activeItems = subscriptions.filter(s => s.status === 'ativo');
  const pausedItems = subscriptions.filter(s => s.status === 'pausado');

  const totalMonthly = activeItems.reduce((sum, s) => sum + getMonthlyPrice(s.price, s.billing_cycle), 0);
  const activeCount = activeItems.length;

  const upcomingBills = activeItems
    .filter(s => s.next_payment_date && getAlertLevel(s.next_payment_date))
    .sort((a, b) => (a.next_payment_date! > b.next_payment_date! ? 1 : -1));

  const alerts = activeItems
    .filter(s => s.next_payment_date && getAlertLevel(s.next_payment_date))
    .map(s => ({ ...s, alertLevel: getAlertLevel(s.next_payment_date)! }))
    .sort((a, b) => {
      const order: Record<AlertLevel, number> = { overdue: 0, today: 1, tomorrow: 2, soon: 3 };
      return order[a.alertLevel] - order[b.alertLevel];
    });

  const createMutation = useMutation({
    mutationFn: async (input: SubscriptionInsert) => {
      if (!user || !activeUnitId) throw new Error('Não autenticado');
      const { error } = await supabase.from('recurring_subscriptions').insert({
        ...input,
        user_id: user.id,
        unit_id: activeUnitId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Item criado!'); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subscription> & { id: string }) => {
      const { error } = await supabase.from('recurring_subscriptions').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Atualizado!'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success('Removido!'); },
  });

  return {
    subscriptions,
    isLoading,
    totalMonthly,
    activeCount,
    upcomingBills,
    alerts,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
