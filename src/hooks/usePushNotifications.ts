import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  // If there's already an active registration, return immediately
  const regs = await navigator.serviceWorker.getRegistrations();
  const active = regs.find(r => r.active);
  if (active) return active;

  // Otherwise wait for ready with a timeout
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      // Non-blocking check — fire and forget with short timeout
      if (!checkedRef.current) {
        checkedRef.current = true;
        getRegistration(3000).then(reg => {
          if (reg) {
            (reg as any).pushManager.getSubscription().then((sub: any) => setIsSubscribed(!!sub)).catch(() => {});
          }
        }).catch(() => {});
      }
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;
    setIsLoading(true);

    try {
      // Request permission first (instant UI)
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setIsLoading(false);
        return false;
      }

      // Fetch VAPID key and wait for SW in parallel
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
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
  }, []);

  return { isSupported, isSubscribed, permission, isLoading, subscribe, unsubscribe };
}
