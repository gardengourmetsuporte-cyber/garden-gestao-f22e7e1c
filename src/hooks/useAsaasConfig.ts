import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAsaasConfig(unitId: string | undefined) {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) { setLoading(false); return; }
    supabase
      .from('asaas_config')
      .select('is_active')
      .eq('unit_id', unitId)
      .maybeSingle()
      .then(({ data }) => {
        setIsActive(!!data?.is_active);
        setLoading(false);
      });
  }, [unitId]);

  return { asaasActive: isActive, loading };
}
