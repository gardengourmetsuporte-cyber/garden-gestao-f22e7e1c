import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChecklistType } from '@/types/database';

export interface ActiveTimer {
  id: string; // checklist_task_times row id
  itemId: string;
  userId: string;
  userName: string;
  startedAt: Date;
  elapsedSeconds: number;
}

export interface ItemTimeStats {
  itemId: string;
  executionCount: number;
  avgSeconds: number;
  recordSeconds: number;
  recordHolder: string | null;
}

interface TimerSettings {
  isEnabled: boolean;
  minExecutionsForStats: number;
  bonusPointsAvg: number;
  bonusPointsRecord: number;
}

export function useChecklistTimer(checklistType: ChecklistType, date: string) {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch timer settings for this checklist type
  const { data: timerSettings } = useQuery({
    queryKey: ['checklist-timer-settings', activeUnitId, checklistType],
    queryFn: async (): Promise<TimerSettings> => {
      if (!activeUnitId) return { isEnabled: false, minExecutionsForStats: 3, bonusPointsAvg: 2, bonusPointsRecord: 5 };
      const { data } = await supabase
        .from('checklist_timer_settings')
        .select('*')
        .eq('unit_id', activeUnitId)
        .eq('checklist_type', checklistType)
        .maybeSingle();
      if (!data) return { isEnabled: false, minExecutionsForStats: 3, bonusPointsAvg: 2, bonusPointsRecord: 5 };
      return {
        isEnabled: data.is_enabled,
        minExecutionsForStats: data.min_executions_for_stats,
        bonusPointsAvg: data.bonus_points_avg,
        bonusPointsRecord: data.bonus_points_record,
      };
    },
    enabled: !!activeUnitId,
    staleTime: 60_000,
  });

  const isTimerMode = timerSettings?.isEnabled ?? false;

  // Fetch active (unfinished) timers for today
  const { data: rawActiveTimers = [] } = useQuery({
    queryKey: ['checklist-active-timers', activeUnitId, checklistType, date],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data } = await supabase
        .from('checklist_task_times')
        .select('id, item_id, user_id, started_at')
        .eq('unit_id', activeUnitId)
        .eq('checklist_type', checklistType)
        .eq('date', date)
        .is('finished_at', null);
      return data || [];
    },
    enabled: !!activeUnitId && isTimerMode,
    staleTime: 10_000,
  });

  // Build activeTimers with names
  useEffect(() => {
    if (!rawActiveTimers.length) {
      setActiveTimers([]);
      return;
    }
    const userIds = [...new Set(rawActiveTimers.map(t => t.user_id))];
    supabase.from('profiles').select('user_id, full_name').in('user_id', userIds).then(({ data: profiles }) => {
      const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));
      setActiveTimers(rawActiveTimers.map(t => ({
        id: t.id,
        itemId: t.item_id,
        userId: t.user_id,
        userName: nameMap.get(t.user_id) || 'Usuário',
        startedAt: new Date(t.started_at),
        elapsedSeconds: Math.floor((Date.now() - new Date(t.started_at).getTime()) / 1000),
      })));
    });
  }, [rawActiveTimers]);

  // Tick every second to update elapsed
  useEffect(() => {
    if (activeTimers.length === 0) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    tickRef.current = setInterval(() => {
      setActiveTimers(prev => prev.map(t => ({
        ...t,
        elapsedSeconds: Math.floor((Date.now() - t.startedAt.getTime()) / 1000),
      })));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [activeTimers.length]);

  // Validate PIN and return employee info
  const validatePin = useCallback(async (pin: string): Promise<{ userId: string; userName: string } | null> => {
    if (!activeUnitId) return null;
    const { data } = await supabase
      .from('employees')
      .select('user_id, full_name')
      .eq('unit_id', activeUnitId)
      .eq('quick_pin', pin)
      .eq('is_active', true)
      .not('user_id', 'is', null)
      .maybeSingle();
    if (!data || !data.user_id) return null;
    return { userId: data.user_id, userName: data.full_name };
  }, [activeUnitId]);

  // Start timer for an item
  const startTimer = useCallback(async (itemId: string, userId: string) => {
    if (!activeUnitId) return;
    // Check if already has an active timer for this item
    const existing = activeTimers.find(t => t.itemId === itemId && !t.userId); // shouldn't happen
    const { data, error } = await supabase
      .from('checklist_task_times')
      .insert({
        item_id: itemId,
        user_id: userId,
        unit_id: activeUnitId,
        checklist_type: checklistType,
        date,
        started_at: new Date().toISOString(),
      } as any)
      .select('id')
      .single();
    if (error) {
      toast.error('Erro ao iniciar timer');
      console.error(error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['checklist-active-timers', activeUnitId, checklistType, date] });
    toast.success('⏱️ Timer iniciado!');
  }, [activeUnitId, checklistType, date, activeTimers, queryClient]);

  // Finish timer for an item
  const finishTimer = useCallback(async (
    itemId: string,
    userId: string,
    onComplete: (itemId: string, points: number, completedByUserId: string) => void,
    basePoints: number,
  ) => {
    if (!activeUnitId) return;
    const timer = activeTimers.find(t => t.itemId === itemId && t.userId === userId);
    if (!timer) {
      toast.error('Timer não encontrado');
      return;
    }
    const finishedAt = new Date();
    const durationSeconds = Math.floor((finishedAt.getTime() - timer.startedAt.getTime()) / 1000);

    // Get stats to determine bonus
    const { data: stats } = await supabase.rpc('get_checklist_time_stats', { p_item_ids: [itemId] });
    const itemStats = stats?.[0];
    const minExec = timerSettings?.minExecutionsForStats ?? 3;
    let bonusAwarded = 0;

    if (itemStats && itemStats.execution_count >= minExec) {
      const avg = Number(itemStats.avg_seconds);
      const record = Number(itemStats.record_seconds);
      if (durationSeconds < record) {
        bonusAwarded = timerSettings?.bonusPointsRecord ?? 5;
        toast.success(`🏆 RECORDE! +${bonusAwarded} bônus!`, { duration: 4000 });
      } else if (durationSeconds <= avg) {
        bonusAwarded = timerSettings?.bonusPointsAvg ?? 2;
        toast.success(`⚡ Dentro da média! +${bonusAwarded} bônus!`, { duration: 3000 });
      }
    }

    // Update the timer row
    const { error } = await supabase
      .from('checklist_task_times')
      .update({
        finished_at: finishedAt.toISOString(),
        duration_seconds: durationSeconds,
        bonus_awarded: bonusAwarded,
      } as any)
      .eq('id', timer.id);

    if (error) {
      toast.error('Erro ao finalizar timer');
      console.error(error);
      return;
    }

    // Award bonus points if earned
    if (bonusAwarded > 0) {
      const month = date.slice(0, 7) + '-01';
      await supabase.from('bonus_points').insert({
        user_id: userId,
        unit_id: activeUnitId,
        month,
        points: bonusAwarded,
        reason: `Bônus timer: ${durationSeconds}s`,
        type: 'timer_bonus',
      } as any);
    }

    // Mark item as completed
    onComplete(itemId, basePoints + bonusAwarded, userId);

    queryClient.invalidateQueries({ queryKey: ['checklist-active-timers', activeUnitId, checklistType, date] });
    queryClient.invalidateQueries({ queryKey: ['checklist-time-stats'] });

    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    toast.success(`✅ Finalizado em ${mins > 0 ? `${mins}min ` : ''}${secs}s`);
  }, [activeUnitId, activeTimers, checklistType, date, timerSettings, queryClient]);

  // Get time stats for items
  const getTimeStats = useCallback(async (itemIds: string[]): Promise<ItemTimeStats[]> => {
    if (itemIds.length === 0) return [];
    const { data } = await supabase.rpc('get_checklist_time_stats', { p_item_ids: itemIds });
    if (!data) return [];
    return data.map((s: any) => ({
      itemId: s.item_id,
      executionCount: Number(s.execution_count),
      avgSeconds: Number(s.avg_seconds),
      recordSeconds: Number(s.record_seconds),
      recordHolder: s.record_holder,
    }));
  }, []);

  // Check if an item has an active timer
  const getActiveTimer = useCallback((itemId: string): ActiveTimer | undefined => {
    return activeTimers.find(t => t.itemId === itemId);
  }, [activeTimers]);

  // Check if specific user has active timer on item
  const getUserActiveTimer = useCallback((itemId: string, userId: string): ActiveTimer | undefined => {
    return activeTimers.find(t => t.itemId === itemId && t.userId === userId);
  }, [activeTimers]);

  return {
    isTimerMode,
    timerSettings,
    activeTimers,
    validatePin,
    startTimer,
    finishTimer,
    getActiveTimer,
    getUserActiveTimer,
    getTimeStats,
  };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
