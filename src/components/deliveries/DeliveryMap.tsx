import { useEffect, useRef, useCallback, useState } from 'react';
import { LocateFixed, Loader2, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Delivery, DeliveryStatus } from '@/hooks/useDeliveries';

declare global {
  interface Window { L: any; }
}

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  pending: '#f59e0b',
  out: '#3b82f6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pendente',
  out: 'Em rota',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
};

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

async function geocodeAddress(
  address: string,
  neighborhood: string,
  city: string,
  unitName: string,
): Promise<{ lat: number; lng: number } | null> {
  const normalizedCity = city?.trim().length >= 4 ? city.trim() : unitName.trim();
  const queries = [
    `${address}, ${neighborhood}, ${normalizedCity}, SP, Brasil`,
    `${address}, ${normalizedCity}, SP, Brasil`,
    `${address}, ${normalizedCity}, Brasil`,
    `${address}, Brasil`,
  ];

  let anchor: { lat: number; lng: number } | null = null;
  if (normalizedCity) {
    try {
      const anchorParams = new URLSearchParams({
        q: `${normalizedCity}, SP, Brasil`,
        format: 'json',
        limit: '1',
        countrycodes: 'br',
      });
      const anchorRes = await fetch(`https://nominatim.openstreetmap.org/search?${anchorParams.toString()}`, {
        headers: { 'User-Agent': 'GardenGestao/1.0' },
      });
      const anchorResults = await anchorRes.json();
      if (anchorResults?.[0]) {
        anchor = {
          lat: parseFloat(anchorResults[0].lat),
          lng: parseFloat(anchorResults[0].lon),
        };
      }
    } catch (error) {
      console.warn('Falha ao obter âncora da cidade', error);
    }
  }

  for (const q of queries) {
    try {
      const params = new URLSearchParams({
        q,
        format: 'json',
        limit: '1',
        countrycodes: 'br',
      });

      if (anchor) {
        params.set('viewbox', `${anchor.lng - 0.7},${anchor.lat + 0.7},${anchor.lng + 0.7},${anchor.lat - 0.7}`);
        params.set('bounded', '1');
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'User-Agent': 'GardenGestao/1.0' },
      });
      const results = await res.json();
      if (results?.[0]) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      }
    } catch (error) {
      console.warn('Falha ao geocodificar endereço', error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  return null;
}

interface Props {
  deliveries: Delivery[];
  unitName?: string;
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onRefresh?: () => void;
}

export function DeliveryMap({ deliveries, unitName, onStatusChange, onRefresh }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodedRef = useRef(false);

  const withCoords = deliveries.filter(d => d.address?.lat && d.address?.lng);
  const withoutCoords = deliveries.filter(d => d.address && (!d.address.lat || !d.address.lng));

  /* ── Popup builder ── */
  const buildPopup = useCallback((delivery: Delivery) => {
    const addr = delivery.address!;
    const lat = addr.lat!;
    const lng = addr.lng!;
    const color = STATUS_COLORS[delivery.status];
    const label = STATUS_LABELS[delivery.status];
    const next: DeliveryStatus | null =
      delivery.status === 'pending' ? 'out' :
      delivery.status === 'out' ? 'delivered' : null;

    return `
      <div style="font-family:system-ui,-apple-system,sans-serif;min-width:170px;max-width:230px;">
        <p style="font-weight:700;font-size:13px;margin:0 0 2px;">${addr.customer_name || 'Sem nome'}</p>
        <p style="font-size:10px;color:#888;margin:0 0 4px;">${addr.full_address || '—'}</p>
        <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
          <span style="font-size:10px;font-weight:600;padding:2px 6px;border-radius:99px;background:${color}20;color:${color};">${label}</span>
          ${delivery.total > 0 ? `<span style="font-size:12px;font-weight:700;margin-left:auto;">R$ ${delivery.total.toFixed(2)}</span>` : ''}
        </div>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener"
           style="display:block;text-align:center;margin-top:6px;font-size:10px;font-weight:600;padding:5px;border-radius:6px;background:#f0fdf4;color:#16a34a;text-decoration:none;">
          📍 Abrir rota
        </a>
        ${next ? `
          <button onclick="window.__deliveryStatusChange__('${delivery.id}','${next}')"
                  style="width:100%;margin-top:4px;font-size:11px;font-weight:600;padding:5px;border-radius:6px;border:none;color:white;background:${STATUS_COLORS[next]};cursor:pointer;">
            ${next === 'out' ? '🚚 Saiu para entrega' : '✅ Marcar entregue'}
          </button>
        ` : ''}
      </div>
    `;
  }, []);

  /* ── Global status change handler ── */
  useEffect(() => {
    (window as any).__deliveryStatusChange__ = (id: string, status: DeliveryStatus) => {
      onStatusChange(id, status);
    };
    return () => { delete (window as any).__deliveryStatusChange__; };
  }, [onStatusChange]);

  /* ── Map init ── */
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    loadLeaflet().then(() => {
      if (cancelled || !mapRef.current) return;
      const L = window.L;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([-23.5505, -46.6333], 12);
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'topright' }).addTo(map);
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('© <a href="https://openstreetmap.org">OSM</a>')
        .addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const bounds: [number, number][] = [];

      withCoords.forEach((delivery) => {
        const lat = delivery.address!.lat!;
        const lng = delivery.address!.lng!;
        const color = STATUS_COLORS[delivery.status];
        bounds.push([lat, lng]);

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:36px;height:36px;">
              <div style="width:28px;height:28px;background:${color}25;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>
              <div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px ${color}40;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>
            </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(buildPopup(delivery), { maxWidth: 250, minWidth: 170 });
        markersRef.current.push(marker);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [withCoords, buildPopup]);

  /* ── Geocoding ── */
  const handleGeocode = useCallback(async (toGeocode: Delivery[]) => {
    if (toGeocode.length === 0) return;
    setIsGeocoding(true);
    let success = 0;

    for (const delivery of toGeocode) {
      const addr = delivery.address;
      if (!addr) continue;

      const coords = await geocodeAddress(
        addr.full_address,
        addr.neighborhood,
        addr.city,
        unitName || '',
      );
      if (coords) {
        await supabase
          .from('delivery_addresses')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('id', addr.id);
        success++;
      }
    }

    setIsGeocoding(false);
    if (success > 0) {
      toast.success(`${success} endereço(s) localizado(s) no mapa`);
      onRefresh?.();
    } else {
      toast.error('Não foi possível localizar os endereços');
    }
  }, [onRefresh, unitName]);

  useEffect(() => {
    if (withoutCoords.length > 0 && !geocodedRef.current && !isGeocoding) {
      geocodedRef.current = true;
      handleGeocode(withoutCoords);
    }
  }, [withoutCoords.length, handleGeocode, isGeocoding]);

  /* ── Render ── */
  return (
    <div className="space-y-2">
      {/* Geocode banner */}
      {withoutCoords.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/30 bg-card/50">
          <div className="flex items-center gap-2 min-w-0">
            {isGeocoding ? (
              <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4 text-primary shrink-0" />
            )}
            <p className="text-[11px] text-muted-foreground">
              {isGeocoding
                ? 'Localizando endereços no mapa…'
                : `${withoutCoords.length} entrega(s) sem localização`}
            </p>
          </div>
          {!isGeocoding && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] px-2.5 rounded-lg shrink-0"
              onClick={() => handleGeocode(withoutCoords)}
            >
              Localizar
            </Button>
          )}
        </div>
      )}

      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden border border-border/30 shadow-sm">
        <div
          ref={mapRef}
          style={{ height: 260 }}
          className="w-full"
        />
        {withCoords.length === 0 && !isGeocoding && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm">
            <Map className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground/40 font-medium">Aguardando localização</p>
          </div>
        )}
      </div>
    </div>
  );
}
