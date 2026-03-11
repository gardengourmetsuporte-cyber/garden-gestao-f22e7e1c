import { useState, useEffect, useCallback, useRef } from 'react';

interface OnlineStatus {
  /** Whether the browser reports being online */
  isOnline: boolean;
  /** Whether we've confirmed actual connectivity (not just browser online flag) */
  isConnected: boolean;
  /** Timestamp of last successful connection check */
  lastOnlineAt: number | null;
  /** How long we've been offline in seconds (null if online) */
  offlineSince: number | null;
  /** Force a connectivity check */
  checkNow: () => Promise<boolean>;
}

const PING_INTERVAL_ONLINE = 30_000; // 30s when online
const PING_INTERVAL_OFFLINE = 5_000; // 5s when offline (faster retry)
const PING_TIMEOUT = 5_000; // 5s timeout for ping

async function pingServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    // Use a lightweight HEAD request to the app origin
    const response = await fetch(window.location.origin, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(
    navigator.onLine ? Date.now() : null
  );
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const offlineStartRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateOfflineDuration = useCallback(() => {
    if (offlineStartRef.current) {
      setOfflineSince(Math.floor((Date.now() - offlineStartRef.current) / 1000));
    }
  }, []);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    const result = await pingServer();

    if (result) {
      setIsConnected(true);
      setLastOnlineAt(Date.now());
      setOfflineSince(null);
      offlineStartRef.current = null;
    } else {
      setIsConnected(false);
      if (!offlineStartRef.current) {
        offlineStartRef.current = Date.now();
      }
      updateOfflineDuration();
    }

    return result;
  }, [updateOfflineDuration]);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnected(false);
      if (!offlineStartRef.current) {
        offlineStartRef.current = Date.now();
      }
      updateOfflineDuration();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity, updateOfflineDuration]);

  // Periodic ping with adaptive interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const interval = isConnected ? PING_INTERVAL_ONLINE : PING_INTERVAL_OFFLINE;
    intervalRef.current = setInterval(checkConnectivity, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected, checkConnectivity]);

  // Update offline duration ticker
  useEffect(() => {
    if (!isConnected && offlineStartRef.current) {
      const ticker = setInterval(updateOfflineDuration, 1000);
      return () => clearInterval(ticker);
    }
  }, [isConnected, updateOfflineDuration]);

  // Check on visibility change (tab refocus)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkConnectivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkConnectivity]);

  return {
    isOnline,
    isConnected,
    lastOnlineAt,
    offlineSince,
    checkNow: checkConnectivity,
  };
}
