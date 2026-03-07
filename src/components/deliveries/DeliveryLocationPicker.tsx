import { useEffect, useRef, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Check, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Delivery } from '@/hooks/useDeliveries';

declare global {
  interface Window { L: any; }
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }
    const existing = document.querySelector('script[src*="leaflet"]');
    if (existing) {
      const check = () => {
        if (window.L) resolve();
        else setTimeout(check, 50);
      };
      check();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: Delivery | null;
  onConfirm: (addressId: string, lat: number, lng: number) => Promise<void>;
}

const DEFAULT_CENTER: [number, number] = [-21.9687, -46.7969];

function createMarkerIcon() {
  return window.L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:42px;">
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#f59e0b"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
        <circle cx="16" cy="16" r="5" fill="#f59e0b"/>
      </svg>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

export function DeliveryLocationPicker({ open, onOpenChange, delivery, onConfirm }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initAttemptRef = useRef<number>(0);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Reset state when open changes
  useEffect(() => {
    if (open) {
      setSelectedCoords(null);
      setIsSaving(false);
      setSearchQuery(delivery?.address?.full_address || '');
      setIsSearching(false);
      setMapReady(false);
      initAttemptRef.current = 0;
    } else {
      // Cleanup on close
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      setMapReady(false);
    }
  }, [open, delivery?.id]);

  // Init map with retry — waits for container to be visible
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const tryInitMap = async () => {
      await loadLeaflet();
      if (cancelled) return;

      const container = mapContainerRef.current;
      if (!container || container.clientHeight === 0) {
        // Container not ready yet, retry
        if (initAttemptRef.current < 30) {
          initAttemptRef.current++;
          setTimeout(tryInitMap, 150);
        }
        return;
      }

      const L = window.L;

      // Already initialized
      if (mapInstanceRef.current) return;

      const center = delivery?.address?.lat && delivery?.address?.lng
        ? [delivery.address.lat, delivery.address.lng] as [number, number]
        : DEFAULT_CENTER;

      try {
        const map = L.map(container, {
          zoomControl: true,
          attributionControl: false,
        }).setView(center, 15);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setSelectedCoords({ lat, lng });
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon: createMarkerIcon() }).addTo(map);
          }
        });

        // Keep invalidating until tiles load
        const intervals = [100, 300, 500, 800, 1200, 2000];
        intervals.forEach(ms => {
          setTimeout(() => {
            if (!cancelled && mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, ms);
        });

        setMapReady(true);
      } catch (err) {
        console.error('Map init error:', err);
      }
    };

    // Start after a small delay to let drawer animate
    const startTimer = setTimeout(tryInitMap, 300);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [open, delivery?.id]);

  // Search address via Nominatim
  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || !mapInstanceRef.current) return;

    setIsSearching(true);
    try {
      const searchWithCity = query.toLowerCase().includes('são joão') || query.toLowerCase().includes('sao joao')
        ? query
        : `${query}, São João da Boa Vista, SP, Brasil`;

      const params = new URLSearchParams({
        q: searchWithCity,
        format: 'json',
        limit: '1',
        countrycodes: 'br',
      });

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'User-Agent': 'GardenGestao/1.0' },
      });
      const results = await res.json();

      if (results?.[0]) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        const map = mapInstanceRef.current;

        setSelectedCoords({ lat, lng });
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = window.L.marker([lat, lng], { icon: createMarkerIcon() }).addTo(map);
        }
        map.flyTo([lat, lng], 17, { duration: 0.8 });
      } else {
        toast.error('Endereço não encontrado. Tente ser mais específico.');
      }
    } catch {
      toast.error('Erro ao buscar endereço');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleConfirm = useCallback(async () => {
    if (!selectedCoords || !delivery?.address?.id) return;
    setIsSaving(true);
    try {
      await onConfirm(delivery.address.id, selectedCoords.lat, selectedCoords.lng);
      onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar localização');
    } finally {
      setIsSaving(false);
    }
  }, [selectedCoords, delivery, onConfirm, onOpenChange]);

  const addr = delivery?.address;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} mobileHandleOnly>
      <SheetContent side="bottom" className="!max-h-[92vh] !h-auto !p-0 !rounded-t-3xl">
        <div className="p-4 pb-2 space-y-2.5">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4 text-primary" />
              Marcar localização
            </SheetTitle>
            <SheetDescription className="text-xs">
              {addr?.customer_name && <span className="font-medium text-foreground">{addr.customer_name}</span>}
              {addr?.full_address && <> — {addr.full_address}</>}
            </SheetDescription>
          </SheetHeader>

          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="flex gap-2"
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar endereço..."
              className="h-9 text-sm flex-1"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={isSearching || !searchQuery.trim()}
              className="h-9 px-3 shrink-0"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </form>

          <p className="text-[10px] text-muted-foreground/60">
            Busque o endereço ou toque no mapa para marcar o local
          </p>
        </div>

        {/* Map container — fixed height ensures Leaflet can render */}
        <div
          ref={mapContainerRef}
          className="relative isolate w-full"
          style={{ height: 300, minHeight: 300, background: 'hsl(var(--muted))' }}
        >
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-3 border-t border-border/20">
          <Button
            onClick={handleConfirm}
            disabled={!selectedCoords || isSaving}
            className="w-full gap-2"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</>
            ) : (
              <><Check className="w-4 h-4" /> Confirmar localização</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
