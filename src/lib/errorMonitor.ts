import { supabase } from '@/integrations/supabase/client';

interface ErrorPayload {
  message: string;
  stack?: string;
  module?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

const ERROR_BUFFER: ErrorPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_BUFFER = 10;
const FLUSH_INTERVAL = 5_000;

/**
 * Lightweight client-side error monitor.
 * Buffers errors and flushes them to error_logs table in batches.
 */
export function captureError(error: unknown, context?: { module?: string; extra?: Record<string, unknown> }) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack?.slice(0, 1000) : undefined;

  // Dedup: skip if same message already in buffer
  if (ERROR_BUFFER.some(e => e.message === message)) return;

  ERROR_BUFFER.push({
    message,
    stack,
    module: context?.module,
    url: window.location.pathname,
    metadata: context?.extra,
  });

  if (ERROR_BUFFER.length >= MAX_BUFFER) {
    flushErrors();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushErrors, FLUSH_INTERVAL);
  }
}

async function flushErrors() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (ERROR_BUFFER.length === 0) return;

  const batch = ERROR_BUFFER.splice(0, MAX_BUFFER);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return; // Don't log for unauthenticated users

    const rows = batch.map(e => ({
      user_id: userId,
      error_message: e.message,
      error_stack: e.stack ?? null,
      module: e.module ?? null,
      url: e.url ?? null,
      user_agent: navigator.userAgent?.slice(0, 200) ?? null,
      metadata: e.metadata ?? null,
    }));

    await supabase.from('error_logs' as any).insert(rows);
  } catch {
    // Silently fail — error monitoring must never break the app
  }
}

/**
 * Install global error handlers that feed into the monitor.
 * Call once at app startup.
 */
export function installGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    captureError(event.error || event.message, { module: 'global' });
  });
}
