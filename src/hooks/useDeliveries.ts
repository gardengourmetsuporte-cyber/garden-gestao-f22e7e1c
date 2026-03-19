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
  order_number: string;
  address?: DeliveryAddress;
}

export interface OcrDeliveryResult {
  order_number: string;
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
  const { activeUnitId, activeUnit } = useUnit();
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
    if (statusFilter === 'all') return deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled');
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

  // Downscale/compress image before OCR to reduce memory pressure on low-end Android
  const optimizeImageForOcr = useCallback(async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const maxDimension = 1600;
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const targetWidth = Math.max(1, Math.round(img.width * scale));
          const targetHeight = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(imageUrl);
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(imageUrl);
              if (!blob) {
                resolve(file);
                return;
              }

              const compressedFile = new File(
                [blob],
                `${file.name.replace(/\.[^.]+$/, '')}.jpg`,
                { type: 'image/jpeg' }
              );
              resolve(compressedFile);
            },
            'image/jpeg',
            0.82
          );
        } catch {
          URL.revokeObjectURL(imageUrl);
          resolve(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve(file);
      };

      img.src = imageUrl;
    });
  }, []);

  // Process image with AI OCR
  const processImage = useCallback(async (file: File): Promise<OcrDeliveryResult> => {
    setIsProcessing(true);
    try {
      const optimizedFile = await optimizeImageForOcr(file);
      const base64 = await fileToBase64(optimizedFile);
      const { data, error } = await supabase.functions.invoke('delivery-ocr', {
        body: { image_base64: base64, image_type: optimizedFile.type || file.type },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro no processamento');
      return data.data as OcrDeliveryResult;
    } finally {
      setIsProcessing(false);
    }
  }, [fileToBase64, optimizeImageForOcr]);

  // Upload photo to storage
  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${activeUnitId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('delivery-photos').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('delivery-photos').getPublicUrl(fileName);
    return urlData.publicUrl;
  }, [activeUnitId]);

  const normalizeText = useCallback((value: string): string => {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const getSignificantCityWords = useCallback((city: string): string[] => {
    return normalizeText(city)
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['de', 'da', 'do', 'das', 'dos'].includes(w));
  }, [normalizeText]);

  // Common business-name words that indicate a unit name, not a city
  const BUSINESS_KEYWORDS = ['restaurante', 'pizzaria', 'lanchonete', 'padaria', 'bar', 'cafe', 'empresa', 'loja', 'hamburgueria', 'garden', 'demo', 'teste', 'minha', 'pizza', 'beni', 'grill', 'bistro', 'cantina', 'churrascaria', 'sorveteria', 'acaiteria', 'doceria', 'confeitaria', 'sushi', 'poke', 'food', 'burguer', 'burger', 'delivery'];

  const looksLikeBusinessName = useCallback((value: string): boolean => {
    if (!value?.trim()) return true;
    const words = normalizeText(value).split(/\s+/);
    return words.some(w => BUSINESS_KEYWORDS.includes(w));
  }, [normalizeText]);

  const resolveGeocodeCity = useCallback((city: string, unitName: string): string => {
    const cityTrimmed = city?.trim() || '';
    const unitTrimmed = unitName?.trim() || '';

    // If city looks like a business name, discard it
    if (looksLikeBusinessName(cityTrimmed)) {
      if (!looksLikeBusinessName(unitTrimmed)) return unitTrimmed;
      return '';
    }

    const cityWords = getSignificantCityWords(cityTrimmed);
    const unitWords = getSignificantCityWords(unitTrimmed);

    if (!cityTrimmed) {
      if (!looksLikeBusinessName(unitTrimmed)) return unitTrimmed;
      return '';
    }
    if (!unitTrimmed) return cityTrimmed;

    if (cityWords.length < 3 && unitWords.length >= cityWords.length && !looksLikeBusinessName(unitTrimmed)) return unitTrimmed;

    const cityBase = normalizeText(cityTrimmed);
    const unitBase = normalizeText(unitTrimmed);
    if (unitBase.includes(cityBase) || cityBase.includes(unitBase)) {
      if (!looksLikeBusinessName(unitTrimmed)) return unitTrimmed;
      return cityTrimmed;
    }

    return cityTrimmed;
  }, [getSignificantCityWords, normalizeText, looksLikeBusinessName]);

  const distanceKm = useCallback((a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }, []);

  const pickValidResult = useCallback((result: any, anchor: { lat: number; lng: number } | null, city: string) => {
    const lat = Number.parseFloat(result?.lat);
    const lng = Number.parseFloat(result?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    if (anchor && distanceKm(anchor, { lat, lng }) > 25) return null;

    // Validate using all significant words of the city name to avoid
    // partial matches like "São João" matching "Jardim Nova São João" in SP
    const cityToken = normalizeText(city);
    const displayName = normalizeText(String(result?.display_name || ''));
    if (cityToken && displayName) {
      const cityWords = cityToken.split(/\s+/).filter(w => w.length > 2 && !['de','da','do','das','dos'].includes(w));
      const allMatch = cityWords.every(w => displayName.includes(w));
      if (!allMatch) return null;
      // Extra: reject if display_name has the city words only as part of a neighborhood name
      // by checking the result's address components
      const addressCity = normalizeText(String(result?.address?.city || result?.address?.town || result?.address?.municipality || ''));
      if (addressCity && !cityWords.every(w => addressCity.includes(w))) return null;
    }

    return { lat, lng };
  }, [distanceKm, normalizeText]);

  // Strip apartment/unit/complement info that confuses geocoders
  const cleanAddress = useCallback((addr: string): string => {
    return addr
      .replace(/\bnº\s*/gi, '')
      .replace(/\b(apto?|apartamento|bloco?|sala|casa|unid(ade)?|lote|quadra|andar|fundos|frente)\b\s*\d*/gi, '')
      .replace(/,\s*,/g, ',')
      .replace(/,\s*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }, []);

  // Geocode address using Nominatim (free)
  const geocodeAddress = useCallback(async (address: string, city: string): Promise<{ lat: number; lng: number } | null> => {
    const storeCity = (activeUnit?.store_info as any)?.city || '';
    const fallbackCity = city?.trim() || storeCity || activeUnit?.city || resolveGeocodeCity('', (activeUnit?.name || '').trim());
    const cleaned = cleanAddress(address);
    const streetOnly = cleaned.replace(/,\s*\d+[^,]*$/g, '').trim();

    const cityPart = fallbackCity ? `${fallbackCity}, ` : '';
    const queries = Array.from(new Set([
      `${cleaned}, ${cityPart}SP, Brasil`,
      `${streetOnly}, ${cityPart}SP, Brasil`,
      `${cleaned}, ${cityPart}Brasil`,
      `${streetOnly}, ${cityPart}Brasil`,
      `${cleaned}, Brasil`,
    ].filter((q) => q.replace(/[,\s]/g, '').length > 0)));

    let anchor: { lat: number; lng: number } | null = null;
    if (fallbackCity) {
      try {
        const anchorParams = new URLSearchParams({
          q: `${fallbackCity}, SP, Brasil`,
          format: 'json',
          limit: '1',
          countrycodes: 'br',
        });
        const anchorRes = await fetch(`https://nominatim.openstreetmap.org/search?${anchorParams.toString()}`, {
          headers: { 'User-Agent': 'GardenGestao/1.0' },
        });
        const anchorResults = await anchorRes.json();
        const parsedAnchor = pickValidResult(anchorResults?.[0], null, fallbackCity);
        if (parsedAnchor) anchor = parsedAnchor;
      } catch (error) {
        console.warn('Falha ao obter âncora da cidade para geocoding', error);
      }
    }

    // First pass: bounded
    for (const query of queries) {
      try {
        const params = new URLSearchParams({ q: query, format: 'json', limit: '1', countrycodes: 'br', addressdetails: '1' });
        if (anchor) {
          params.set('viewbox', `${anchor.lng - 0.35},${anchor.lat + 0.35},${anchor.lng + 0.35},${anchor.lat - 0.35}`);
          params.set('bounded', '1');
        }
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { 'User-Agent': 'GardenGestao/1.0' },
        });
        const results = await res.json();
        const parsed = pickValidResult(results?.[0], anchor, fallbackCity);
        if (parsed) return parsed;
      } catch (error) {
        console.warn('Falha ao geocodificar endereço', error);
      }
    }

    // Second pass: unbounded fallback
    for (const query of queries) {
      try {
        const params = new URLSearchParams({ q: query, format: 'json', limit: '1', countrycodes: 'br', addressdetails: '1' });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { 'User-Agent': 'GardenGestao/1.0' },
        });
        const results = await res.json();
        const parsed = pickValidResult(results?.[0], anchor, fallbackCity);
        if (parsed) return parsed;
      } catch (error) {
        console.warn('Falha ao geocodificar endereço (fallback)', error);
      }
    }

    // Third pass: raw search without city validation (last resort)
    if (!anchor) {
      for (const query of queries.slice(0, 2)) {
        try {
          const params = new URLSearchParams({ q: query, format: 'json', limit: '1', countrycodes: 'br', addressdetails: '1' });
          const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            headers: { 'User-Agent': 'GardenGestao/1.0' },
          });
          const results = await res.json();
          const result = results?.[0];
          const lat = Number.parseFloat(result?.lat);
          const lng = Number.parseFloat(result?.lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        } catch (error) {
          console.warn('Falha ao geocodificar endereço (último recurso)', error);
        }
      }
    }

    return null;
  }, [activeUnit?.name, activeUnit?.city, cleanAddress, pickValidResult, resolveGeocodeCity]);

  // Create delivery
  const createDelivery = useMutation({
    mutationFn: async (params: {
      ocrResult: OcrDeliveryResult;
      photoUrl: string | null;
    }) => {
      const { ocrResult, photoUrl } = params;

      const normalizedCity = resolveGeocodeCity(ocrResult.city || '', activeUnit?.name || '');
      const fallbackCity = normalizedCity || (activeUnit?.store_info as any)?.city || activeUnit?.city || '';

      // Geocode the address
      const coords = await geocodeAddress(ocrResult.full_address, fallbackCity);

      // Create or find address
      const { data: address, error: addrError } = await supabase
        .from('delivery_addresses')
        .insert({
          unit_id: activeUnitId!,
          customer_name: ocrResult.customer_name,
          full_address: ocrResult.full_address,
          neighborhood: ocrResult.neighborhood,
          city: fallbackCity,
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
          order_number: ocrResult.order_number || '',
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
      if (!activeUnitId) throw new Error('Unidade não selecionada');

      const updates: Record<string, any> = { status };
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();

      if (status === 'out') {
        if (!user?.id) throw new Error('Usuário não autenticado');
        updates.assigned_to = user.id;
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id)
        .eq('unit_id', activeUnitId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar status da entrega');
    },
  });

  // Update address coordinates
  const updateAddress = useMutation({
    mutationFn: async ({ id, lat, lng }: { id: string; lat: number; lng: number }) => {
      const { error } = await supabase
        .from('delivery_addresses')
        .update({ lat, lng })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Localização salva!');
    },
    onError: () => {
      toast.error('Erro ao salvar localização');
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

  // Create manual delivery (typed by hand, no OCR)
  const createManualDelivery = useMutation({
    mutationFn: async (params: {
      order_number: string;
      full_address: string;
      neighborhood: string;
      customer_name: string;
      notes?: string;
    }) => {
      const city = (activeUnit?.store_info as any)?.city || activeUnit?.city || '';
      const coords = await geocodeAddress(params.full_address, city);

      const { data: address, error: addrError } = await supabase
        .from('delivery_addresses')
        .insert({
          unit_id: activeUnitId!,
          customer_name: params.customer_name || 'Cliente',
          full_address: params.full_address,
          neighborhood: params.neighborhood || 'Centro',
          city,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        })
        .select()
        .single();

      if (addrError) throw addrError;

      const { data: delivery, error: delError } = await supabase
        .from('deliveries')
        .insert({
          unit_id: activeUnitId!,
          address_id: address.id,
          status: 'pending' as DeliveryStatus,
          order_number: params.order_number,
          notes: params.notes || null,
          total: 0,
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
    createManualDelivery: createManualDelivery.mutateAsync,
    isCreating: createDelivery.isPending,
    isCreatingManual: createManualDelivery.isPending,
    updateStatus: updateStatus.mutateAsync,
    updateAddress: updateAddress.mutateAsync,
    deleteDelivery: deleteDelivery.mutateAsync,
    invalidate,
  };
}
