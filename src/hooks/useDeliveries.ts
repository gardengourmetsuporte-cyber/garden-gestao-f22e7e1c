import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export type DeliveryStatus = 'pending' | 'out' | 'delivered' | 'cancelled';

export interface DeliveryAddress {
  id: string;
  unit_id: string;
  customer_name: string;
  full_address: string;
  neighborhood: string;
  city: string;
  reference: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  unit_id: string;
  address_id: string;
  status: DeliveryStatus;
  items_summary: string | null;
  photo_url: string | null;
  total: number;
  notes: string | null;
  assigned_to: string | null;
  delivered_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  address?: DeliveryAddress;
}

export interface OcrDeliveryResult {
  customer_name: string;
  full_address: string;
  neighborhood: string;
  city: string;
  reference: string;
  items_summary: string;
  total: number;
}

export interface NeighborhoodGroup {
  neighborhood: string;
  deliveries: Delivery[];
}

export function useDeliveries() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');

  const queryKey = ['deliveries', activeUnitId];

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase
        .from('deliveries')
        .select('*, address:delivery_addresses(*)')
        .eq('unit_id', activeUnitId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Delivery[];
    },
    enabled: !!user && !!activeUnitId,
  });

  const filteredDeliveries = useMemo(() => {
    if (statusFilter === 'all') return deliveries;
    return deliveries.filter(d => d.status === statusFilter);
  }, [deliveries, statusFilter]);

  const groupedByNeighborhood = useMemo((): NeighborhoodGroup[] => {
    const groups: Record<string, Delivery[]> = {};
    for (const d of filteredDeliveries) {
      const nb = d.address?.neighborhood || 'Sem bairro';
      if (!groups[nb]) groups[nb] = [];
      groups[nb].push(d);
    }
    return Object.entries(groups)
      .map(([neighborhood, deliveries]) => ({ neighborhood, deliveries }))
      .sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
  }, [filteredDeliveries]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // File to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Process image with AI OCR
  const processImage = useCallback(async (file: File): Promise<OcrDeliveryResult> => {
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('delivery-ocr', {
        body: { image_base64: base64, image_type: file.type },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro no processamento');
      return data.data as OcrDeliveryResult;
    } finally {
      setIsProcessing(false);
    }
  }, [fileToBase64]);

  // Upload photo to storage
  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${activeUnitId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('delivery-photos').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('delivery-photos').getPublicUrl(fileName);
    return urlData.publicUrl;
  }, [activeUnitId]);

  // Geocode address using Nominatim (free)
  const geocodeAddress = useCallback(async (address: string, city: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const query = encodeURIComponent(`${address}, ${city}, Brasil`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
        headers: { 'User-Agent': 'GardenGestao/1.0' },
      });
      const results = await res.json();
      if (results?.[0]) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Create delivery
  const createDelivery = useMutation({
    mutationFn: async (params: {
      ocrResult: OcrDeliveryResult;
      photoUrl: string | null;
    }) => {
      const { ocrResult, photoUrl } = params;

      // Geocode the address
      const coords = await geocodeAddress(ocrResult.full_address, ocrResult.city || ocrResult.neighborhood);

      // Create or find address
      const { data: address, error: addrError } = await supabase
        .from('delivery_addresses')
        .insert({
          unit_id: activeUnitId!,
          customer_name: ocrResult.customer_name,
          full_address: ocrResult.full_address,
          neighborhood: ocrResult.neighborhood,
          city: ocrResult.city || '',
          reference: ocrResult.reference || null,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        })
        .select()
        .single();

      if (addrError) throw addrError;

      // Create delivery
      const { data: delivery, error: delError } = await supabase
        .from('deliveries')
        .insert({
          unit_id: activeUnitId!,
          address_id: address.id,
          status: 'pending' as DeliveryStatus,
          items_summary: ocrResult.items_summary || null,
          photo_url: photoUrl,
          total: ocrResult.total || 0,
          created_by: user!.id,
        })
        .select('*, address:delivery_addresses(*)')
        .single();

      if (delError) throw delError;
      return delivery as Delivery;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Entrega cadastrada!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao cadastrar entrega');
    },
  });

  // Update status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DeliveryStatus }) => {
      const updates: Record<string, any> = { status };
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();
      if (status === 'out') updates.assigned_to = user!.id;

      const { error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
    },
  });

  // Delete delivery
  const deleteDelivery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deliveries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Entrega removida');
    },
  });

  // Stats
  const stats = useMemo(() => {
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const out = deliveries.filter(d => d.status === 'out').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    return { pending, out, delivered, total: deliveries.length };
  }, [deliveries]);

  return {
    deliveries: filteredDeliveries,
    allDeliveries: deliveries,
    groupedByNeighborhood,
    isLoading,
    isProcessing,
    statusFilter,
    setStatusFilter,
    stats,
    processImage,
    uploadPhoto,
    createDelivery: createDelivery.mutateAsync,
    isCreating: createDelivery.isPending,
    updateStatus: updateStatus.mutateAsync,
    deleteDelivery: deleteDelivery.mutateAsync,
    invalidate,
  };
}
