import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'info' | 'alert' | 'success';
  title: string;
  description: string;
  origin: 'estoque' | 'financeiro' | 'checklist' | 'caixa' | 'agenda' | 'sistema';
  read: boolean;
  created_at: string;
}

async function fetchNotificationsData(userId: string): Promise<AppNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20);

  return (data as unknown as AppNotification[]) || [];
}

// WhatsApp-style notification sound — distinctive double-tone "pop"
let lastSoundTime = 0;
function playNotificationSound() {
  const now = Date.now();
  if (now - lastSoundTime < 3000) return;
  lastSoundTime = now;

  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const t = audioCtx.currentTime;

    // First tone — rising sweep
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.setValueAtTime(600, t);
    osc1.frequency.linearRampToValueAtTime(900, t + 0.08);
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc1.start(t);
    osc1.stop(t + 0.12);

    // Second tone — higher pop
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.setValueAtTime(1200, t + 0.13);
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.25, t + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
    osc2.start(t + 0.13);
    osc2.stop(t + 0.28);

    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch {
    // Audio not available
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const soundDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryKey = ['notifications', user?.id];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchNotificationsData(user!.id),
    enabled: !!user,
    staleTime: 30_000, // Don't refetch for 30s
    refetchInterval: 60_000, // Poll every 60s as fallback
  });

  // Realtime subscription - debounced batch updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as unknown as AppNotification;
            if (!newNotif.read) {
              queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
                old ? [newNotif, ...old].slice(0, 20) : [newNotif]
              );
              // Debounce sound: wait 500ms to batch rapid inserts
              if (soundDebounceRef.current) clearTimeout(soundDebounceRef.current);
              soundDebounceRef.current = setTimeout(playNotificationSound, 500);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            if (updated.read) {
              // Remove read notifications from unread list
              queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
                old?.filter(n => n.id !== updated.id) ?? []
              );
            }
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
              old?.filter(n => n.id !== (payload.old as any).id) ?? []
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (soundDebounceRef.current) clearTimeout(soundDebounceRef.current);
    };
  }, [user, queryClient]);

  const markAsRead = useCallback(async (notificationId: string) => {
    queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
      old?.filter(n => n.id !== notificationId) ?? []
    );
    await supabase
      .from('notifications')
      .update({ read: true } as any)
      .eq('id', notificationId);
  }, [queryClient]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.map(n => n.id);
    if (unreadIds.length === 0) return;

    queryClient.setQueryData<AppNotification[]>(queryKey, () => []);
    await supabase
      .from('notifications')
      .update({ read: true } as any)
      .in('id', unreadIds);
  }, [notifications, queryClient]);

  const unreadCount = notifications.length;

  return {
    notifications,
    unreadNotifications: notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
