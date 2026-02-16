import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface TimeRecord {
  id: string;
  user_id: string;
  unit_id: string;
  date: string;
  expected_start: string;
  expected_end: string;
  check_in: string | null;
  check_out: string | null;
  late_minutes: number;
  early_departure_minutes: number;
  points_awarded: number;
  points_processed: boolean;
  status: 'pending' | 'checked_in' | 'completed' | 'absent' | 'day_off' | 'manual';
  manual_entry: boolean;
  adjusted_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: { full_name: string; avatar_url: string | null };
}

export interface TimeTrackingSettings {
  id: string;
  unit_id: string;
  user_id: string;
  points_per_minute_late: number;
  points_per_minute_early: number;
  points_on_time_bonus: number;
  grace_period_minutes: number;
  max_penalty_per_day: number;
}

const DEFAULT_SETTINGS: Omit<TimeTrackingSettings, 'id' | 'unit_id' | 'user_id'> = {
  points_per_minute_late: -1,
  points_per_minute_early: -1,
  points_on_time_bonus: 5,
  grace_period_minutes: 5,
  max_penalty_per_day: -30,
};

export function useTimeTracking() {
  const { user, isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const queryKey = ['time-records', activeUnitId];
  const settingsKey = ['time-tracking-settings', activeUnitId];

  // Fetch all time records for the unit (admin) or user
  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_records' as any)
        .select('*')
        .eq('unit_id', activeUnitId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const rows = (data || []) as any[];

      // Batch profile fetch
      const userIds = new Set<string>();
      rows.forEach(r => userIds.add(r.user_id));

      const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', [...userIds]);
        (profiles || []).forEach(p => profileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }));
      }

      return rows.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id) || null,
      })) as TimeRecord[];
    },
    enabled: !!user && !!activeUnitId,
  });

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: settingsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_tracking_settings' as any)
        .select('*')
        .eq('unit_id', activeUnitId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as unknown as TimeTrackingSettings) || null;
    },
    enabled: !!user && !!activeUnitId,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['points'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [queryClient, queryKey]);

  // Calculate points based on time differences
  const calculatePoints = (
    expectedStart: string,
    expectedEnd: string,
    checkIn: string | null,
    checkOut: string | null,
    cfg?: TimeTrackingSettings | null
  ) => {
    const config = cfg || settings || DEFAULT_SETTINGS as any;
    let lateMinutes = 0;
    let earlyMinutes = 0;
    let points = 0;

    if (checkIn && expectedStart) {
      const [eh, em] = expectedStart.split(':').map(Number);
      const [ah, am] = checkIn.split(':').map(Number);
      const diffMin = (ah * 60 + am) - (eh * 60 + em);
      if (diffMin > (config.grace_period_minutes || 5)) {
        lateMinutes = diffMin;
        points += Math.max(lateMinutes * (config.points_per_minute_late || -1), config.max_penalty_per_day || -30);
      }
    }

    if (checkOut && expectedEnd) {
      const [eh, em] = expectedEnd.split(':').map(Number);
      const [ah, am] = checkOut.split(':').map(Number);
      const diffMin = (eh * 60 + em) - (ah * 60 + am);
      if (diffMin > (config.grace_period_minutes || 5)) {
        earlyMinutes = diffMin;
        points += Math.max(earlyMinutes * (config.points_per_minute_early || -1), config.max_penalty_per_day || -30);
      }
    }

    // On-time bonus
    if (checkIn && checkOut && lateMinutes === 0 && earlyMinutes === 0) {
      points = config.points_on_time_bonus || 5;
    }

    return { lateMinutes, earlyMinutes, points };
  };

  // Check-in
  const checkIn = async (expectedStart = '08:00', expectedEnd = '17:00') => {
    if (!user || !activeUnitId) return false;
    const now = new Date();
    const timeStr = format(now, 'HH:mm:ss');
    const dateStr = format(now, 'yyyy-MM-dd');

    try {
      const { lateMinutes, points } = calculatePoints(expectedStart, expectedEnd, timeStr, null);

      const { error } = await supabase
        .from('time_records' as any)
        .upsert({
          user_id: user.id,
          unit_id: activeUnitId,
          date: dateStr,
          expected_start: expectedStart,
          expected_end: expectedEnd,
          check_in: timeStr,
          late_minutes: lateMinutes,
          status: 'checked_in',
        } as any, { onConflict: 'user_id,date,unit_id' });

      if (error) throw error;
      invalidate();
      toast.success(lateMinutes > 0 ? `Check-in registrado (${lateMinutes}min atrasado)` : 'Check-in registrado! ✅');
      return true;
    } catch (err: any) {
      console.error('Check-in error:', err);
      toast.error('Erro ao registrar check-in');
      return false;
    }
  };

  // Check-out
  const checkOut = async () => {
    if (!user || !activeUnitId) return false;
    const now = new Date();
    const timeStr = format(now, 'HH:mm:ss');
    const dateStr = format(now, 'yyyy-MM-dd');

    try {
      // Find today's record
      const { data: existing } = await supabase
        .from('time_records' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('unit_id', activeUnitId)
        .eq('date', dateStr)
        .single();

      if (!existing) {
        toast.error('Nenhum check-in encontrado para hoje');
        return false;
      }

      const record = existing as any;
      const { lateMinutes, earlyMinutes, points } = calculatePoints(
        record.expected_start, record.expected_end, record.check_in, timeStr
      );

      const { error } = await supabase
        .from('time_records' as any)
        .update({
          check_out: timeStr,
          early_departure_minutes: earlyMinutes,
          late_minutes: lateMinutes,
          points_awarded: points,
          status: 'completed',
        } as any)
        .eq('id', record.id);

      if (error) throw error;

      // Process points as bonus_points entry
      if (points !== 0) {
        await processPoints(user.id, dateStr, points);
      }

      invalidate();
      if (points > 0) {
        toast.success(`Check-out registrado! +${points} pontos de pontualidade 🎉`);
      } else if (points < 0) {
        toast.warning(`Check-out registrado. ${points} pontos (atraso/saída antecipada)`);
      } else {
        toast.success('Check-out registrado! ✅');
      }
      return true;
    } catch (err: any) {
      console.error('Check-out error:', err);
      toast.error('Erro ao registrar check-out');
      return false;
    }
  };

  // Process points into bonus_points table
  const processPoints = async (userId: string, dateStr: string, points: number) => {
    if (!activeUnitId) return;
    const monthStr = dateStr.substring(0, 7) + '-01'; // yyyy-MM-01

    try {
      await supabase
        .from('bonus_points')
        .insert({
          user_id: userId,
          unit_id: activeUnitId,
          month: monthStr,
          points,
          reason: points > 0 ? 'Pontualidade' : `Atraso/Saída antecipada (${dateStr})`,
          type: 'auto',
          awarded_by: null,
        });

      // Mark as processed
      await supabase
        .from('time_records' as any)
        .update({ points_processed: true } as any)
        .eq('user_id', userId)
        .eq('date', dateStr)
        .eq('unit_id', activeUnitId);
    } catch (err) {
      console.error('Error processing time points:', err);
    }
  };

  // Admin: manual entry
  const createManualEntry = async (data: {
    user_id: string;
    date: string;
    expected_start: string;
    expected_end: string;
    check_in: string;
    check_out: string;
    notes?: string;
  }) => {
    if (!user || !activeUnitId || !isAdmin) return false;

    const { lateMinutes, earlyMinutes, points } = calculatePoints(
      data.expected_start, data.expected_end, data.check_in, data.check_out
    );

    try {
      const { error } = await supabase
        .from('time_records' as any)
        .upsert({
          user_id: data.user_id,
          unit_id: activeUnitId,
          date: data.date,
          expected_start: data.expected_start,
          expected_end: data.expected_end,
          check_in: data.check_in,
          check_out: data.check_out,
          late_minutes: lateMinutes,
          early_departure_minutes: earlyMinutes,
          points_awarded: points,
          status: 'manual',
          manual_entry: true,
          adjusted_by: user.id,
          notes: data.notes || null,
        } as any, { onConflict: 'user_id,date,unit_id' });

      if (error) throw error;

      // Process points
      if (points !== 0) {
        await processPoints(data.user_id, data.date, points);
      }

      invalidate();
      toast.success('Registro manual salvo');
      return true;
    } catch (err: any) {
      console.error('Manual entry error:', err);
      toast.error('Erro ao salvar registro');
      return false;
    }
  };

  // Save settings
  const saveSettings = async (newSettings: Omit<TimeTrackingSettings, 'id' | 'unit_id' | 'user_id'>) => {
    if (!user || !activeUnitId || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('time_tracking_settings' as any)
        .upsert({
          unit_id: activeUnitId,
          user_id: user.id,
          ...newSettings,
        } as any, { onConflict: 'unit_id' });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: settingsKey });
      toast.success('Configurações salvas');
      return true;
    } catch (err) {
      toast.error('Erro ao salvar configurações');
      return false;
    }
  };

  // Today's record for current user
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = records.find(r => r.user_id === user?.id && r.date === todayStr) || null;

  return {
    records,
    isLoading,
    settings: settings || (DEFAULT_SETTINGS as TimeTrackingSettings),
    todayRecord,
    checkIn,
    checkOut,
    createManualEntry,
    saveSettings,
    refetch: invalidate,
  };
}
