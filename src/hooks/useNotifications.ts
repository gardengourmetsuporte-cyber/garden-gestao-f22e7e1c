import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'info' | 'alert' | 'success';
  title: string;
  description: string;
  origin: 'estoque' | 'financeiro' | 'checklist' | 'sistema';
  read: boolean;
  created_at: string;
}

async function fetchNotificationsData(userId: string): Promise<AppNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data as unknown as AppNotification[]) || [];
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['notifications', user?.id];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchNotificationsData(user!.id),
    enabled: !!user,
  });

  // Realtime subscription - update cache directly
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as unknown as AppNotification;
            if (newNotif.user_id === user.id) {
              queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
                old ? [newNotif, ...old] : [newNotif]
              );
              playNotificationSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
              old?.map(n => n.id === (payload.new as any).id ? { ...n, ...(payload.new as any) } : n) ?? []
            );
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
              old?.filter(n => n.id !== (payload.old as any).id) ?? []
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
      old?.map(n => n.id === notificationId ? { ...n, read: true } : n) ?? []
    );
    await supabase
      .from('notifications')
      .update({ read: true } as any)
      .eq('id', notificationId);
  }, [queryClient]);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    // Optimistic update
    queryClient.setQueryData<AppNotification[]>(queryKey, (old) =>
      old?.map(n => ({ ...n, read: true })) ?? []
    );
    await supabase
      .from('notifications')
      .update({ read: true } as any)
      .in('id', unreadIds);
  }, [notifications, queryClient]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadNotifications = notifications.filter(n => !n.read);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 830;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.15);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.value = 1200;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc2.start(audioCtx.currentTime + 0.12);
    osc2.stop(audioCtx.currentTime + 0.3);
  } catch {
    // Audio not available
  }
}
