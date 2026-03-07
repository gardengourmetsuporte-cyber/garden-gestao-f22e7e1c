import { useEffect, useRef, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Loader2 } from 'lucide-react';
import type { Delivery } from '@/hooks/useDeliveries';

declare global {
  interface Window { L: any; }
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }
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

// Default center: São João da Boa Vista
const DEFAULT_CENTER: [number, number] = [-21.9687, -46.7969];

export function DeliveryLocationPicker({ open, onOpenChange, delivery, onConfirm }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when delivery changes
  useEffect(() => {
    if (open) {
      setSelectedCoords(null);
      setIsSaving(false);
    }
  }, [open, delivery?.id]);

  // Init map when sheet opens
  useEffect(() => {
    if (!open || !mapRef.current) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      loadLeaflet().then(() => {
        if (cancelled || !mapRef.current) return;
        const L = window.L;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const center = delivery?.address?.lat && delivery?.address?.lng
          ? [delivery.address.lat, delivery.address.lng] as [number, number]
          : DEFAULT_CENTER;

        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView(center, 15);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        // Click to place marker
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setSelectedCoords({ lat, lng });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const icon = L.divIcon({
              className: '',
              html: `
                <div style="position:relative;width:32px;height:42px;">
                  <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="#f59e0b"/>
                    <circle cx="16" cy="16" r="8" fill="white"/>
                    <circle cx="16" cy="16" r="5" fill="#f59e0b"/>
                  </svg>
                </div>`,
              iconSize: [32, 42],
              iconAnchor: [16, 42],
            });
            markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
          }
        });

        // Invalidate size after animation
        setTimeout(() => map.invalidateSize(), 350);
      });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open, delivery?.id]);

  const handleConfirm = useCallback(async () => {
    if (!selectedCoords || !delivery?.address?.id) return;
    setIsSaving(true);
    try {
      await onConfirm(delivery.address.id, selectedCoords.lat, selectedCoords.lng);
      onOpenChange(false);
    } catch {
      // error handled by parent
    } finally {
      setIsSaving(false);
    }
  }, [selectedCoords, delivery, onConfirm, onOpenChange]);

  const addr = delivery?.address;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="!max-h-[90vh] !h-auto !p-0 !rounded-t-3xl">
        <div className="p-4 pb-2">
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

          <p className="text-[11px] text-muted-foreground mt-2 bg-muted/30 rounded-lg px-3 py-2">
            Toque no mapa para marcar onde fica o endereço de entrega
          </p>
        </div>

        {/* Map */}
        <div className="relative isolate" style={{ height: 350 }}>
          <div ref={mapRef} className="w-full h-full" />
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
