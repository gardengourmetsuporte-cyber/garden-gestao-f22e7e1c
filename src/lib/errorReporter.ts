import { supabase } from '@/integrations/supabase/client';

interface ErrorContext {
  module?: string;
  action?: string;
  entityId?: string;
  userId?: string;
  unitId?: string | null;
  extra?: Record<string, unknown>;
}

/**
 * Centralized error reporter that logs critical client-side errors
 * to the audit_logs table via RPC for production diagnostics.
 */
export async function reportError(error: unknown, context: ErrorContext = {}) {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack?.slice(0, 500) : undefined;

    // Determine HTTP status code if available
    const statusCode = (error as any)?.status || (error as any)?.code || null;

    const details = {
      message: errorMessage,
      stack: errorStack,
      statusCode,
      module: context.module,
      action: context.action,
      entityId: context.entityId,
      userAgent: navigator.userAgent?.slice(0, 200),
      url: window.location.pathname,
      ...context.extra,
    };

    // Only report if we have a user context
    if (!context.userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      context.userId = session.user.id;
    }

    await supabase.rpc('log_audit_event' as any, {
      p_user_id: context.userId,
      p_unit_id: context.unitId ?? null,
      p_action: 'client_error',
      p_entity_type: context.module || 'frontend',
      p_entity_id: null,
      p_details: details,
    });
  } catch {
    // Silently fail — we don't want error reporting to cause more errors
  }
}

/**
 * Returns a user-friendly error message based on HTTP status codes.
 */
export function getErrorMessage(error: unknown, fallback = 'Erro inesperado'): string {
  const status = (error as any)?.status || (error as any)?.code;

  switch (status) {
    case 401:
    case 403:
      return 'Sem permissão para esta ação';
    case 404:
      return 'Registro não encontrado';
    case 409:
      return 'Conflito: registro já existe';
    case 422:
      return 'Dados inválidos';
    case 429:
      return 'Muitas requisições. Tente novamente em alguns segundos';
    case 500:
    case 502:
    case 503:
      return 'Erro no servidor. Tente novamente';
    default:
      if (error instanceof Error && error.message) {
        // Check for common Supabase/Postgres error patterns
        if (error.message.includes('row-level security')) return 'Sem permissão para esta ação';
        if (error.message.includes('duplicate key')) return 'Registro duplicado';
        if (error.message.includes('foreign key')) return 'Registro referenciado por outros dados';
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          return 'Sem conexão com o servidor';
        }
      }
      return fallback;
  }
}
