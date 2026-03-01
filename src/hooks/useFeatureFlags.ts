import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  scope: string;
  scope_value: string | null;
}

async function fetchFlags(): Promise<FeatureFlag[]> {
  const { data } = await supabase
    .from('feature_flags' as any)
    .select('key, enabled, scope, scope_value');
  return (data as unknown as FeatureFlag[]) || [];
}

/**
 * Fetches feature flags once on boot, caches for the session.
 * Use `isEnabled('flag_key')` to check if a feature is active.
 */
export function useFeatureFlags() {
  const { user } = useAuth();

  const { data: flags = [] } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFlags,
    enabled: !!user,
    staleTime: 5 * 60_000, // Cache for 5 minutes
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  function isEnabled(key: string, unitId?: string | null): boolean {
    const flag = flags.find(f => f.key === key);
    if (!flag) return true; // Default: enabled if no flag exists

    if (!flag.enabled) return false;

    // Scope filtering
    if (flag.scope === 'unit' && flag.scope_value && unitId) {
      return flag.scope_value === unitId;
    }

    return flag.enabled;
  }

  return { flags, isEnabled };
}
