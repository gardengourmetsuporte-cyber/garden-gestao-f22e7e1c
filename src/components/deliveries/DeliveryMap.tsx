import { useEffect, useRef, useCallback, useState } from 'react';
import { Navigation, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Delivery, DeliveryStatus } from '@/hooks/useDeliveries';

declare global {
  interface Window {
    L: any;
  }
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
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}

async function geocodeAddress(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
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
}

interface Props {
  deliveries: Delivery[];
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onRefresh?: () => void;
}

export function DeliveryMap({ deliveries, onStatusChange, onRefresh }: Props) {
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
      <div style="font-family:inherit;min-width:200px;">
        <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${addr?.customer_name || 'Sem nome'}</p>
        <p style="font-size:11px;color:#888;margin:0 0 2px;">${addr?.full_address || '—'}</p>
        ${addr?.reference ? `<p style="font-size:11px;color:#aaa;font-style:italic;margin:0 0 6px;">${addr.reference}</p>` : ''}
        ${delivery.items_summary ? `<p style="font-size:11px;color:#666;margin:0 0 6px;">${delivery.items_summary}</p>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;background:${statusColor}20;color:${statusColor};">${statusLabel}</span>
          ${delivery.total > 0 ? `<span style="font-size:12px;font-weight:700;">R$ ${delivery.total.toFixed(2)}</span>` : ''}
        </div>
        <div style="display:flex;gap:6px;margin-bottom:${nextStatus ? '8px' : '0'};">
          <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}" target="_blank" rel="noopener"
             style="flex:1;text-align:center;font-size:11px;font-weight:500;padding:6px 8px;border-radius:8px;background:#eff6ff;color:#2563eb;text-decoration:none;">
            🌍 Street View
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener"
             style="flex:1;text-align:center;font-size:11px;font-weight:500;padding:6px 8px;border-radius:8px;background:#f0fdf4;color:#16a34a;text-decoration:none;">
            📍 Rota
          </a>
        </div>
        ${nextStatus ? `
          <button onclick="window.__deliveryStatusChange__('${delivery.id}','${nextStatus}')"
                  style="width:100%;font-size:12px;font-weight:600;padding:6px;border-radius:8px;border:none;color:white;background:${STATUS_COLORS[nextStatus]};cursor:pointer;">
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

  // Initialize map always
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

      // Default: São Paulo center
      const defaultCenter: [number, number] = [-23.5505, -46.6333];
      const map = L.map(mapRef.current, { zoomControl: true }).setView(defaultCenter, 12);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      // Clear old markers
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
          html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(buildPopup(delivery), { maxWidth: 280, minWidth: 200 });
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

  const handleGeocode = useCallback(async (toGeocode: Delivery[]) => {
    if (toGeocode.length === 0) return;
    setIsGeocoding(true);
    let success = 0;

    for (const delivery of toGeocode) {
      const addr = delivery.address;
      if (!addr) continue;

      const coords = await geocodeAddress(
        addr.full_address,
        addr.city || addr.neighborhood
      );

      if (coords) {
        await supabase
          .from('delivery_addresses')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('id', addr.id);
        success++;
      }

      // Nominatim rate limit: 1 req/sec
      await new Promise(r => setTimeout(r, 1100));
    }

    setIsGeocoding(false);
    if (success > 0) {
      toast.success(`${success} endereço(s) localizado(s) no mapa`);
      onRefresh?.();
    } else {
      toast.error('Não foi possível localizar os endereços');
    }
  }, [onRefresh]);

  // Auto-geocode on first render when deliveries lack coords
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
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <LocateFixed className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {isGeocoding ? 'Localizando endereços no mapa…' : `${withoutCoords.length} entrega(s) sem localização`}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs shrink-0 px-2.5"
            onClick={handleGeocode}
            disabled={isGeocoding}
          >
            {isGeocoding ? 'Aguarde' : 'Localizar'}
          </Button>
        </div>
      )}

      {/* Map — compact */}
      <div
        ref={mapRef}
        className="rounded-2xl overflow-hidden border border-border/60 shadow-sm"
        style={{ height: 230 }}
      />
    </div>
  );
}
