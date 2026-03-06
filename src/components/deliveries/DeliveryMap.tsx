import { useEffect, useRef, useCallback, useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
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

async function geocodeAddress(address: string, neighborhood: string, city: string, unitName: string): Promise<{ lat: number; lng: number } | null> {
  // Try multiple query strategies for better results
  const queries = [
    `${address}, ${neighborhood}, ${city || unitName}, SP, Brasil`,
    `${address}, ${city || unitName}, SP, Brasil`,
    `${address}, ${unitName}, Brasil`,
    `${neighborhood}, ${city || unitName}, SP, Brasil`,
  ].filter(Boolean);

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`,
        { headers: { 'User-Agent': 'GardenGestao/1.0' } }
      );
      const results = await res.json();
      if (results?.[0]) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      }
    } catch {}
    // Rate limit between attempts
    await new Promise(r => setTimeout(r, 1100));
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

  const buildPopup = useCallback((delivery: Delivery) => {
    const addr = delivery.address;
    const lat = addr!.lat!;
    const lng = addr!.lng!;
    const statusColor = STATUS_COLORS[delivery.status];
    const statusLabel = STATUS_LABELS[delivery.status];
    const nextStatus: DeliveryStatus | null =
      delivery.status === 'pending' ? 'out' :
      delivery.status === 'out' ? 'delivered' : null;

    return `
      <div style="font-family:system-ui,-apple-system,sans-serif;min-width:180px;max-width:240px;">
        <p style="font-weight:700;font-size:13px;margin:0 0 3px;line-height:1.3;">${addr?.customer_name || 'Sem nome'}</p>
        <p style="font-size:10px;color:#999;margin:0 0 2px;">${addr?.full_address || '—'}</p>
        ${addr?.reference ? `<p style="font-size:10px;color:#bbb;font-style:italic;margin:0 0 6px;">${addr.reference}</p>` : ''}
        <div style="display:flex;align-items:center;gap:6px;margin:6px 0;">
          <span style="font-size:10px;font-weight:600;padding:2px 6px;border-radius:99px;background:${statusColor}20;color:${statusColor};">${statusLabel}</span>
          ${delivery.total > 0 ? `<span style="font-size:12px;font-weight:700;margin-left:auto;">R$ ${delivery.total.toFixed(2)}</span>` : ''}
        </div>
        <div style="display:flex;gap:4px;margin-top:6px;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener"
             style="flex:1;text-align:center;font-size:10px;font-weight:600;padding:5px;border-radius:6px;background:#f0fdf4;color:#16a34a;text-decoration:none;">
            📍 Navegar
          </a>
        </div>
        ${nextStatus ? `
          <button onclick="window.__deliveryStatusChange__('${delivery.id}','${nextStatus}')"
                  style="width:100%;margin-top:6px;font-size:11px;font-weight:600;padding:5px;border-radius:6px;border:none;color:white;background:${STATUS_COLORS[nextStatus]};cursor:pointer;">
            ${nextStatus === 'out' ? 'Marcar Saiu →' : 'Marcar Entregue ✓'}
          </button>
        ` : ''}
      </div>
    `;
  }, []);

  useEffect(() => {
    (window as any).__deliveryStatusChange__ = (id: string, status: DeliveryStatus) => {
      onStatusChange(id, status);
    };
    return () => { delete (window as any).__deliveryStatusChange__; };
  }, [onStatusChange]);

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

      const defaultCenter: [number, number] = [-23.5505, -46.6333];
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(defaultCenter, 12);
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
            <div style="position:relative;width:32px;height:32px;">
              <div style="width:12px;height:12px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,0.3);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>
              <div style="width:24px;height:24px;background:${color}20;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>
            </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -12],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(buildPopup(delivery), { maxWidth: 260, minWidth: 180 });
        markersRef.current.push(marker);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
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
        unitName || ''
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
      toast.success(`${success} endereço(s) localizado(s)`);
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

  return (
    <div className="space-y-2">
      {/* Geocode banner */}
      {withoutCoords.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/40 bg-card/60">
          <div className="flex items-center gap-2 min-w-0">
            {isGeocoding ? (
              <Loader2 className="w-3.5 h-3.5 text-primary shrink-0 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            <p className="text-[11px] text-muted-foreground truncate">
              {isGeocoding
                ? 'Localizando endereços…'
                : `${withoutCoords.length} sem localização`}
            </p>
          </div>
          {!isGeocoding && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] shrink-0 px-2 rounded-lg"
              onClick={() => handleGeocode(withoutCoords)}
            >
              Localizar
            </Button>
          )}
        </div>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        className="rounded-2xl overflow-hidden border border-border/40 shadow-sm"
        style={{ height: 280 }}
      />
    </div>
  );
}
