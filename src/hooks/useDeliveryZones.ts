import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface DeliveryZone {
  id: string;
  unit_id: string;
  name: string;
  min_distance_km: number;
  max_distance_km: number;
  fee: number;
  is_active: boolean;
  sort_order: number;
}

export function useDeliveryZones() {
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const queryKey = ['delivery-zones', activeUnitId];

  const { data: zones = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('unit_id', activeUnitId)
        .order('min_distance_km', { ascending: true });
      if (error) throw error;
      return data as DeliveryZone[];
    },
    enabled: !!activeUnitId,
  });

  const upsertZone = useMutation({
    mutationFn: async (zone: Partial<DeliveryZone> & { unit_id: string }) => {
      if (zone.id) {
        const { error } = await supabase
          .from('delivery_zones')
          .update({
            name: zone.name,
            min_distance_km: zone.min_distance_km,
            max_distance_km: zone.max_distance_km,
            fee: zone.fee,
            is_active: zone.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', zone.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('delivery_zones')
          .insert({
            unit_id: zone.unit_id,
            name: zone.name || '',
            min_distance_km: zone.min_distance_km || 0,
            max_distance_km: zone.max_distance_km || 5,
            fee: zone.fee || 0,
            is_active: zone.is_active ?? true,
            sort_order: zones.length,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Zona salva!');
    },
    onError: () => toast.error('Erro ao salvar zona'),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Zona removida');
    },
  });

  return { zones, isLoading, upsertZone, deleteZone };
}

// Hook for customer-facing fee calculation
export function useDeliveryFeeCalculator() {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{
    distance_km: number;
    duration: string;
    fee: number | null;
    zone_name: string | null;
    out_of_range: boolean;
    formatted_address: string;
  } | null>(null);

  const calculateFee = async (unitId: string, address: string) => {
    if (!address.trim() || address.length < 10) {
      setResult(null);
      return null;
    }

    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('delivery-fee-calculator', {
        body: { unit_id: unitId, customer_address: address },
      });

      if (error) throw error;
      if (!data?.success) {
        if (data?.code === 'NO_STORE_ADDRESS') {
          // Store doesn't have address configured, skip fee calculation
          setResult(null);
          return null;
        }
        throw new Error(data?.error || 'Erro no cálculo');
      }

      setResult(data);
      return data;
    } catch (err: any) {
      console.error('Fee calc error:', err);
      setResult(null);
      return null;
    } finally {
      setCalculating(false);
    }
  };

  const reset = () => setResult(null);

  return { calculateFee, calculating, result, reset };
}
