import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Navigation } from 'lucide-react';
import type { Delivery, DeliveryStatus } from '@/hooks/useDeliveries';

// Leaflet CSS loaded via index.html CDN link

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

function createColorIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 28px; height: 28px; 
      background: ${color}; 
      border: 3px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (positions.length > 0 && !fitted.current) {
      fitted.current = true;
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [positions, map]);

  return null;
}

function openStreetView(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`,
    '_blank'
  );
}

function openDirections(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    '_blank'
  );
}

interface Props {
  deliveries: Delivery[];
  onStatusChange: (id: string, status: DeliveryStatus) => void;
}

export function DeliveryMap({ deliveries, onStatusChange }: Props) {
  const deliveriesWithCoords = deliveries.filter(
    (d) => d.address?.lat && d.address?.lng
  );

  const positions: [number, number][] = deliveriesWithCoords.map((d) => [
    d.address!.lat!,
    d.address!.lng!,
  ]);

  // Default center: São Paulo
  const center: [number, number] =
    positions.length > 0 ? positions[0] : [-23.5505, -46.6333];

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
    <div className="rounded-2xl overflow-hidden border border-border/60 bg-card" style={{ height: 'calc(100vh - 320px)', minHeight: 400 }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        {deliveriesWithCoords.map((delivery) => {
          const lat = delivery.address!.lat!;
          const lng = delivery.address!.lng!;
          const icon = createColorIcon(STATUS_COLORS[delivery.status]);
          const addr = delivery.address;

          const nextStatus = (): DeliveryStatus | null => {
            if (delivery.status === 'pending') return 'out';
            if (delivery.status === 'out') return 'delivered';
            return null;
          };
          const next = nextStatus();

          return (
            <Marker key={delivery.id} position={[lat, lng]} icon={icon}>
              <Popup maxWidth={260} minWidth={200}>
                <div className="space-y-2 text-sm" style={{ fontFamily: 'inherit' }}>
                  <div>
                    <p className="font-bold text-base">{addr?.customer_name || 'Sem nome'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{addr?.full_address}</p>
                    {addr?.reference && (
                      <p className="text-xs text-gray-400 italic">{addr.reference}</p>
                    )}
                  </div>

                  {delivery.items_summary && (
                    <p className="text-xs text-gray-600">{delivery.items_summary}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${STATUS_COLORS[delivery.status]}20`,
                        color: STATUS_COLORS[delivery.status],
                      }}
                    >
                      {STATUS_LABELS[delivery.status]}
                    </span>
                    {delivery.total > 0 && (
                      <span className="text-xs font-bold">R$ {delivery.total.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => openStreetView(lat, lng)}
                      className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Street View
                    </button>
                    <button
                      onClick={() => openDirections(lat, lng)}
                      className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      Rota
                    </button>
                  </div>

                  {next && (
                    <button
                      onClick={() => onStatusChange(delivery.id, next)}
                      className="w-full text-xs font-semibold py-1.5 rounded-lg text-white transition-colors"
                      style={{ background: STATUS_COLORS[next] }}
                    >
                      {next === 'out' ? 'Marcar Saiu →' : 'Marcar Entregue ✓'}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
