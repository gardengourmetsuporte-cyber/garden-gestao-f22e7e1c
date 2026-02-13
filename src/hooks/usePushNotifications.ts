import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SUBSCRIBED_KEY = 'push-subscribed';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Get SW registration with a timeout to avoid infinite waits */
async function getRegistration(timeoutMs = 5000): Promise<ServiceWorkerRegistration | null> {
  const regs = await navigator.serviceWorker.getRegistrations();
  const active = regs.find(r => r.active);
  if (active) return active;

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported] = useState(
    () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  );
  // Fast-path: if permission is granted and we cached subscription, assume subscribed
  const [isSubscribed, setIsSubscribed] = useState(
    () => isSupported && Notification.permission === 'granted' && localStorage.getItem(SUBSCRIBED_KEY) === 'true'
  );
  const [permission, setPermission] = useState<NotificationPermission>(
    () => isSupported ? Notification.permission : 'default'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Background verification on mount only (non-blocking, won't cause prompt to flash)
  useEffect(() => {
    if (!isSupported || !user) return;
    const cached = localStorage.getItem(SUBSCRIBED_KEY) === 'true';
    if (!cached) return;
    getRegistration(2000).then(reg => {
      if (reg) {
        (reg as any).pushManager.getSubscription().then((sub: any) => {
          if (!sub) {
            localStorage.removeItem(SUBSCRIBED_KEY);
            setIsSubscribed(false);
          }
        }).catch(() => {});
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, user]);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;
    setIsLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setIsLoading(false);
        return false;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const [vapidRes, registration] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/push-notifier?action=vapid-key`, {
          headers: { 'Content-Type': 'application/json' },
        }),
        getRegistration(8000),
      ]);

      if (!vapidRes.ok) throw new Error('Failed to get VAPID key');
      if (!registration) throw new Error('Service Worker not available');

      const { publicKey } = await vapidRes.json();

      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const { data: { session } } = await supabase.auth.getSession();
      const saveRes = await fetch(
        `${supabaseUrl}/functions/v1/push-notifier?action=subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        }
      );

      if (!saveRes.ok) throw new Error('Failed to save subscription');

      localStorage.setItem(SUBSCRIBED_KEY, 'true');
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      setIsLoading(false);
      return false;
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await getRegistration(5000);
      if (!registration) return;
      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        await fetch(
          `${supabaseUrl}/functions/v1/push-notifier?action=unsubscribe`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ endpoint }),
          }
        );
      }
      localStorage.removeItem(SUBSCRIBED_KEY);
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
  }, []);

  return { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe };
}
