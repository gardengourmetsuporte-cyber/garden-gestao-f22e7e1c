import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkSchedule, ScheduleStatus } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export function useSchedule() {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user, isAdmin]);

  async function fetchSchedules() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('day_off', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set((data || []).map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);
      
      // Merge profiles with schedules
      const schedulesWithProfiles = (data || []).map(schedule => ({
        ...schedule,
        profile: profiles?.find(p => p.user_id === schedule.user_id) || null
      }));
      
      setSchedules(schedulesWithProfiles as WorkSchedule[]);
    } catch {
      // Error handled silently - user sees empty state
    } finally {
      setIsLoading(false);
    }
  }

  async function createSchedule(month: number, year: number, dayOff: number, notes?: string) {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('work_schedules')
        .insert({
          user_id: user.id,
          month,
          year,
          day_off: dayOff,
          notes: notes || null,
          unit_id: activeUnitId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      await fetchSchedules();
      return data;
    } catch (error) {
      // Re-throw for caller to handle with generic message
      throw new Error('Erro ao criar folga');
    }
  }

  async function updateSchedule(id: string, updates: { day_off?: number; notes?: string }) {
    try {
      const { error } = await supabase
        .from('work_schedules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchSchedules();
    } catch (error) {
      // Re-throw for caller to handle with generic message
      throw new Error('Erro ao atualizar folga');
    }
  }

  async function approveSchedule(id: string, approved: boolean, notes?: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('work_schedules')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_by: user.id,
          notes: notes || null,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchSchedules();
    } catch (error) {
      // Re-throw for caller to handle with generic message
      throw new Error('Erro ao aprovar folga');
    }
  }

  async function deleteSchedule(id: string) {
    try {
      const { error } = await supabase
        .from('work_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSchedules();
    } catch (error) {
      // Re-throw for caller to handle with generic message
      throw new Error('Erro ao excluir folga');
    }
  }

  // Get schedules for a specific month/year
  function getSchedulesForMonth(month: number, year: number): WorkSchedule[] {
    return schedules.filter(s => s.month === month && s.year === year);
  }

  // Get current user's schedule for a month
  function getUserScheduleForMonth(month: number, year: number): WorkSchedule | undefined {
    return schedules.find(
      s => s.month === month && s.year === year && s.user_id === user?.id
    );
  }

  // Get pending schedules (for admin)
  function getPendingSchedules(): WorkSchedule[] {
    return schedules.filter(s => s.status === 'pending');
  }

  return {
    schedules,
    isLoading,
    createSchedule,
    updateSchedule,
    approveSchedule,
    deleteSchedule,
    getSchedulesForMonth,
    getUserScheduleForMonth,
    getPendingSchedules,
    refetch: fetchSchedules,
  };
}
