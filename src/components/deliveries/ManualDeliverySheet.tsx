import { useState, useEffect, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

declare global {
  interface Window { L: any; }
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }
    const existing = document.querySelector('script[src*="leaflet"]');
    if (existing) {
      const check = () => { if (window.L) resolve(); else setTimeout(check, 50); };
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
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: {
    order_number: string;
    full_address: string;
    neighborhood: string;
    customer_name: string;
    notes?: string;
  }) => Promise<any>;
  isPending: boolean;
}

interface GeoResult {
  lat: number;
  lng: number;
  display_name: string;
}

export function ManualDeliverySheet({ open, onOpenChange, onSubmit, isPending }: Props) {
  const [orderNumber, setOrderNumber] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  const [geocoding, setGeocoding] = useState(false);
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);
  const [geoError, setGeoError] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Geocode address with debounce
  const geocode = useCallback(async (query: string) => {
    if (query.trim().length < 5) {
      setGeoResult(null);
      setGeoError(false);
      return;
    }

    setGeocoding(true);
    setGeoError(false);

    try {
      const params = new URLSearchParams({
        q: `${query}, Brasil`,
        format: 'json',
        limit: '1',
        countrycodes: 'br',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'User-Agent': 'GardenGestao/1.0' },
      });
      const results = await res.json();

      if (results?.[0]) {
        const r = results[0];
        setGeoResult({
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          display_name: r.display_name,
        });
      } else {
        setGeoResult(null);
        setGeoError(true);
      }
    } catch {
      setGeoResult(null);
      setGeoError(true);
    } finally {
      setGeocoding(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      geocode(address);
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [address, geocode]);

  // Init/update map
  useEffect(() => {
    if (!geoResult || !open) return;

    const initMap = async () => {
      await loadLeaflet();
      const L = window.L;
      if (!mapContainerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: false,
        }).setView([geoResult.lat, geoResult.lng], 16);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(mapRef.current);
      } else {
        mapRef.current.setView([geoResult.lat, geoResult.lng], 16);
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([geoResult.lat, geoResult.lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:32px;height:32px;background:hsl(var(--primary));border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        markerRef.current = L.marker([geoResult.lat, geoResult.lng], { icon }).addTo(mapRef.current);
      }

      setTimeout(() => mapRef.current?.invalidateSize(), 100);
      setTimeout(() => mapRef.current?.invalidateSize(), 300);
    };

    initMap();
  }, [geoResult, open]);

  // Cleanup map on close
  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!orderNumber.trim() || !address.trim()) return;
    try {
      await onSubmit({
        order_number: orderNumber.trim(),
        full_address: address.trim(),
        neighborhood: neighborhood.trim() || 'Centro',
        customer_name: customerName.trim() || 'Cliente',
        notes: notes.trim() || undefined,
      });
      // Reset
      setOrderNumber('');
      setAddress('');
      setNeighborhood('');
      setCustomerName('');
      setNotes('');
      setGeoResult(null);
      onOpenChange(false);
    } catch {}
  };

  const canSubmit = orderNumber.trim().length > 0 && address.trim().length > 0 && !isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="MapPin" size={20} className="text-primary" />
            Nova Entrega Manual
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Order number */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Nº do Pedido *</Label>
            <Input
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="Ex: 1234"
              className="h-11 text-base font-bold"
              autoFocus={false}
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Endereço *</Label>
            <div className="relative">
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Rua, número, bairro..."
                className="h-11 pr-10"
                autoFocus={false}
              />
              {geocoding && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AppIcon name="Loader2" size={16} className="animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Map preview */}
          {(geoResult || geocoding) && (
            <div className="rounded-xl overflow-hidden border border-border/30 relative" style={{ isolation: 'isolate' }}>
              <div
                ref={mapContainerRef}
                className="w-full bg-secondary/30"
                style={{ height: 180, zIndex: 1 }}
              />
              {geoResult && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
                  <div className="flex items-center gap-1.5">
                    <AppIcon name="CheckCircle2" size={14} className="text-success shrink-0" />
                    <p className="text-[11px] text-foreground/80 truncate">{geoResult.display_name}</p>
                  </div>
                </div>
              )}
              {geocoding && !geoResult && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                  <AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          {geoError && address.trim().length >= 5 && (
            <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 flex items-center gap-2">
              <AppIcon name="AlertTriangle" size={16} className="text-warning shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                Endereço não encontrado no mapa. A entrega será criada sem localização — você pode ajustar depois.
              </p>
            </div>
          )}

          {/* Neighborhood + Customer in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bairro</Label>
              <Input
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                placeholder="Centro"
                className="h-10"
                autoFocus={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cliente</Label>
              <Input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nome (opcional)"
                className="h-10"
                autoFocus={false}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Observações</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Complemento, referência..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 rounded-xl text-base font-bold gap-2 shadow-glow-primary"
          >
            {isPending ? (
              <>
                <AppIcon name="Loader2" size={18} className="animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <AppIcon name="Plus" size={18} />
                Cadastrar Entrega
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
