import { useEffect, useRef, useCallback } from 'react';
import { Navigation } from 'lucide-react';
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

    // CSS already loaded via index.html
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}

interface Props {
  deliveries: Delivery[];
  onStatusChange: (id: string, status: DeliveryStatus) => void;
}

export function DeliveryMap({ deliveries, onStatusChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const deliveriesWithCoords = deliveries.filter(
    (d) => d.address?.lat && d.address?.lng
  );

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
      <div style="font-family: inherit; min-width: 200px;">
        <p style="font-weight: 700; font-size: 14px; margin: 0 0 4px;">${addr?.customer_name || 'Sem nome'}</p>
        <p style="font-size: 11px; color: #888; margin: 0 0 2px;">${addr?.full_address || '—'}</p>
        ${addr?.reference ? `<p style="font-size: 11px; color: #aaa; font-style: italic; margin: 0 0 6px;">${addr.reference}</p>` : ''}
        ${delivery.items_summary ? `<p style="font-size: 11px; color: #666; margin: 0 0 6px;">${delivery.items_summary}</p>` : ''}
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; background: ${statusColor}20; color: ${statusColor};">${statusLabel}</span>
          ${delivery.total > 0 ? `<span style="font-size: 12px; font-weight: 700;">R$ ${delivery.total.toFixed(2)}</span>` : ''}
        </div>
        <div style="display: flex; gap: 6px; margin-bottom: ${nextStatus ? '8px' : '0'};">
          <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}" target="_blank" rel="noopener"
             style="flex: 1; text-align: center; font-size: 11px; font-weight: 500; padding: 6px 8px; border-radius: 8px; background: #eff6ff; color: #2563eb; text-decoration: none;">
            🌍 Street View
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener"
             style="flex: 1; text-align: center; font-size: 11px; font-weight: 500; padding: 6px 8px; border-radius: 8px; background: #f0fdf4; color: #16a34a; text-decoration: none;">
            📍 Rota
          </a>
        </div>
        ${nextStatus ? `
          <button onclick="window.__deliveryStatusChange__('${delivery.id}', '${nextStatus}')"
                  style="width: 100%; font-size: 12px; font-weight: 600; padding: 6px; border-radius: 8px; border: none; color: white; background: ${STATUS_COLORS[nextStatus]}; cursor: pointer;">
            ${nextStatus === 'out' ? 'Marcar Saiu →' : 'Marcar Entregue ✓'}
          </button>
        ` : ''}
      </div>
    `;
  }, []);

  // Expose status change handler globally for popup buttons
  useEffect(() => {
    (window as any).__deliveryStatusChange__ = (id: string, status: DeliveryStatus) => {
      onStatusChange(id, status);
    };
    return () => { delete (window as any).__deliveryStatusChange__; };
  }, [onStatusChange]);

  useEffect(() => {
    if (!mapRef.current || deliveriesWithCoords.length === 0) return;

    let cancelled = false;

    loadLeaflet().then(() => {
      if (cancelled || !mapRef.current) return;
      const L = window.L;

      // Destroy previous map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current, { zoomControl: true });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      const bounds: [number, number][] = [];

      deliveriesWithCoords.forEach((delivery) => {
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
  }, [deliveriesWithCoords, buildPopup]);

  if (deliveriesWithCoords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-border/60 bg-card">
        <Navigation className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Nenhuma entrega com coordenadas
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          As coordenadas são extraídas automaticamente ao cadastrar entregas
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="rounded-2xl overflow-hidden border border-border/60"
      style={{ height: 'calc(100vh - 320px)', minHeight: 400 }}
    />
  );
}
