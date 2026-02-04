import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ManagerTask, ManagerAppointment, DayPeriod, TaskPriority, SystemAlert, AIContext } from '@/types/agenda';

export function useAgenda(selectedDate: Date = new Date()) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Fetch tasks for selected date
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['manager-tasks', user?.id, dateString],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('manager_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateString)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ManagerTask[];
    },
    enabled: !!user?.id,
  });

  // Fetch appointments for selected date
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['manager-appointments', user?.id, dateString],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('manager_appointments')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateString)
        .order('scheduled_time', { ascending: true });
      
      if (error) throw error;
      return data as ManagerAppointment[];
    },
    enabled: !!user?.id,
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (task: { title: string; period: DayPeriod; priority: TaskPriority }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('manager_tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          period: task.period,
          priority: task.priority,
          date: dateString,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast({ title: 'Tarefa criada!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' });
    },
  });

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      const { error } = await supabase
        .from('manager_tasks')
        .update({
          is_completed: !task.is_completed,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('manager_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      toast({ title: 'Tarefa removida!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' });
    },
  });

  // Add appointment mutation
  const addAppointmentMutation = useMutation({
    mutationFn: async (appointment: { title: string; scheduled_time: string; notes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('manager_appointments')
        .insert({
          user_id: user.id,
          title: appointment.title,
          scheduled_time: appointment.scheduled_time,
          notes: appointment.notes || null,
          date: dateString,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-appointments'] });
      toast({ title: 'Compromisso criado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar compromisso', variant: 'destructive' });
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('manager_appointments')
        .delete()
        .eq('id', appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-appointments'] });
      toast({ title: 'Compromisso removido!' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover compromisso', variant: 'destructive' });
    },
  });

  // Helper functions
  const getTasksByPeriod = useCallback((period: DayPeriod) => {
    return tasks.filter(t => t.period === period);
  }, [tasks]);

  const getAppointmentsByPeriod = useCallback((period: DayPeriod) => {
    const hour = (time: string) => parseInt(time.split(':')[0], 10);
    return appointments.filter(a => {
      const h = hour(a.scheduled_time);
      if (period === 'morning') return h >= 6 && h < 12;
      if (period === 'afternoon') return h >= 12 && h < 18;
      return h >= 18 || h < 6;
    });
  }, [appointments]);

  return {
    tasks,
    appointments,
    isLoading: tasksLoading || appointmentsLoading,
    addTask: addTaskMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    addAppointment: addAppointmentMutation.mutate,
    deleteAppointment: deleteAppointmentMutation.mutate,
    getTasksByPeriod,
    getAppointmentsByPeriod,
    isAddingTask: addTaskMutation.isPending,
    isAddingAppointment: addAppointmentMutation.isPending,
  };
}

export function useAIAssistant() {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async (context: AIContext) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/management-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(context),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Limite de requisições. Tente novamente em alguns minutos.');
        }
        if (response.status === 402) {
          throw new Error('Créditos de IA esgotados.');
        }
        throw new Error('Erro ao obter sugestão');
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
      return data.suggestion;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestion,
    isLoading,
    error,
    fetchSuggestion,
    clearSuggestion: () => setSuggestion(null),
  };
}

export function useSystemAlerts() {
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, current_stock, min_stock');
      if (error) throw error;
      return data;
    },
  });

  const { data: redemptionsData } = useQuery({
    queryKey: ['redemption-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('id')
        .eq('status', 'pending');
      if (error) throw error;
      return data;
    },
  });

  const lowStockItems = inventoryData?.filter(
    item => item.current_stock <= item.min_stock && item.current_stock > 0
  ) || [];
  
  const zeroStockItems = inventoryData?.filter(
    item => item.current_stock === 0
  ) || [];

  const pendingRedemptions = redemptionsData?.length || 0;

  const alerts: SystemAlert[] = [];

  if (zeroStockItems.length > 0) {
    alerts.push({
      type: 'inventory',
      message: `${zeroStockItems.length} item(ns) zerado(s) no estoque`,
      count: zeroStockItems.length,
      severity: 'error',
    });
  }

  if (lowStockItems.length > 0) {
    alerts.push({
      type: 'inventory',
      message: `${lowStockItems.length} item(ns) com estoque baixo`,
      count: lowStockItems.length,
      severity: 'warning',
    });
  }

  if (pendingRedemptions > 0) {
    alerts.push({
      type: 'rewards',
      message: `${pendingRedemptions} resgate(s) aguardando aprovação`,
      count: pendingRedemptions,
      severity: 'info',
    });
  }

  return {
    alerts,
    criticalStockCount: lowStockItems.length,
    zeroStockCount: zeroStockItems.length,
    pendingRedemptions,
  };
}
