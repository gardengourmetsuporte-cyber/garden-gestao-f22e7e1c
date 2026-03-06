import { useEffect, useRef, useCallback, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Loader2, Map } from 'lucide-react';
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

// Strip apartment/unit/complement info that confuses geocoders
function cleanAddress(addr: string): string {
  return addr
    .replace(/\b(apto?|apartamento|bloco?|sala|casa|unid(ade)?|lote|quadra|andar|fundos|frente)\b\s*\d*/gi, '')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function pickValidResult(
  result: any,
  anchor: { lat: number; lng: number } | null,
  city: string,
): { lat: number; lng: number } | null {
  const lat = Number.parseFloat(result?.lat);
  const lng = Number.parseFloat(result?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Strict: max 25km from city anchor to avoid cross-city matches
  if (anchor && distanceKm(anchor, { lat, lng }) > 25) return null;

  const cityToken = normalizeText(city);
  const displayName = normalizeText(String(result?.display_name || ''));
  // Always validate city name when we have one, even with anchor
  if (cityToken && displayName && !displayName.includes(cityToken)) return null;

  return { lat, lng };
}

async function geocodeAddress(
  address: string,
  neighborhood: string,
  city: string,
  unitName: string,
): Promise<{ lat: number; lng: number } | null> {
  const normalizedCity = city?.trim().length >= 4 ? city.trim() : unitName.trim();
  const cleaned = cleanAddress(address);
  const streetOnly = cleaned.replace(/,\s*\d+[^,]*$/g, '').trim();

  const queries = Array.from(new Set([
    `${cleaned}, ${neighborhood}, ${normalizedCity}, SP, Brasil`,
    `${cleaned}, ${normalizedCity}, SP, Brasil`,
    `${streetOnly}, ${neighborhood}, ${normalizedCity}, SP, Brasil`,
    `${streetOnly}, ${normalizedCity}, SP, Brasil`,
    `${cleaned}, ${normalizedCity}, Brasil`,
    `${streetOnly}, ${normalizedCity}, Brasil`,
    `${neighborhood}, ${normalizedCity}, SP, Brasil`,
    `${cleaned}, Brasil`,
  ].filter((q) => q.replace(/[,\s]/g, '').length > 0)));

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
      const parsedAnchor = pickValidResult(anchorResults?.[0], null, normalizedCity);
      if (parsedAnchor) anchor = parsedAnchor;
    } catch (error) {
      console.warn('Falha ao obter âncora da cidade', error);
    }
  }

  for (const q of queries) {
    try {
      const params = new URLSearchParams({ q, format: 'json', limit: '1', countrycodes: 'br' });
      if (anchor) {
        params.set('viewbox', `${anchor.lng - 0.35},${anchor.lat + 0.35},${anchor.lng + 0.35},${anchor.lat - 0.35}`);
        params.set('bounded', '1');
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'User-Agent': 'GardenGestao/1.0' },
      });
      const results = await res.json();
      const parsed = pickValidResult(results?.[0], anchor, normalizedCity);
      if (parsed) return parsed;
    } catch (error) {
      console.warn('Falha ao geocodificar endereço', error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  if (anchor) {
    for (const q of queries) {
      try {
        const params = new URLSearchParams({ q, format: 'json', limit: '1', countrycodes: 'br' });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { 'User-Agent': 'GardenGestao/1.0' },
        });
        const results = await res.json();
        const parsed = pickValidResult(results?.[0], anchor, normalizedCity);
        if (parsed) return parsed;
      } catch (error) {
        console.warn('Falha ao geocodificar endereço (fallback)', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }

  return null;
}

interface Props {
  deliveries: Delivery[];
  unitName?: string;
  onStatusChange: (id: string, status: DeliveryStatus) => void;
  onRefresh?: () => void;
}

export interface DeliveryMapHandle {
  focusDelivery: (deliveryId: string) => void;
}

export const DeliveryMap = forwardRef<DeliveryMapHandle, Props>(function DeliveryMap(
  { deliveries, unitName, onStatusChange, onRefresh },
  ref,
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const geocodeRunningRef = useRef(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useImperativeHandle(ref, () => ({
    focusDelivery(deliveryId: string) {
      const marker = markersRef.current[deliveryId];
      const map = mapInstanceRef.current;
      if (!marker || !map) return;

      // Scroll map container into view on mobile
      mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        map.flyTo(marker.getLatLng(), 16, { duration: 0.6 });
        marker.openPopup();
      }, 300);
    },
  }));

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

      // Clean, minimal map tiles (CartoDB Positron)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};

      const bounds: [number, number][] = [];

      withCoords.forEach((delivery) => {
        const lat = delivery.address!.lat!;
        const lng = delivery.address!.lng!;
        const color = STATUS_COLORS[delivery.status];
        bounds.push([lat, lng]);

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:32px;height:42px;">
              <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z" fill="${color}"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
                <circle cx="16" cy="16" r="5" fill="${color}"/>
              </svg>
            </div>`,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -36],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(buildPopup(delivery), { maxWidth: 250, minWidth: 170 });
        markersRef.current[delivery.id] = marker;
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }

      // ── Current location as motorcycle SVG ──
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled || !mapInstanceRef.current) return;
            const { latitude, longitude } = pos.coords;
            const motoIcon = L.divIcon({
              className: '',
              html: `
                <div style="position:relative;width:48px;height:48px;">
                  <div style="width:44px;height:44px;background:rgba(59,130,246,0.12);border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div>
                  <div style="width:36px;height:36px;background:white;border-radius:50%;box-shadow:0 2px 12px rgba(0,0,0,0.15);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="5" cy="17" r="3"/>
                      <circle cx="19" cy="17" r="3"/>
                      <path d="M9 17h6"/>
                      <path d="M19 17l-2-5h-4l-4 5"/>
                      <path d="M13 12V7h2l3 5"/>
                      <path d="M5 17l2-5"/>
                    </svg>
                  </div>
                </div>`,
              iconSize: [48, 48],
              iconAnchor: [24, 24],
            });
            const myMarker = L.marker([latitude, longitude], { icon: motoIcon, zIndexOffset: 1000 }).addTo(map);
            myMarker.bindPopup('<div style="font-family:system-ui;font-size:12px;font-weight:600;text-align:center;padding:4px 0;">🏍️ Você está aqui</div>');

            if (bounds.length > 0) {
              bounds.push([latitude, longitude]);
              map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
            } else {
              map.setView([latitude, longitude], 14);
            }
          },
          (err) => { console.warn('Geolocation error:', err.message); },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        );
      }
    });

    return () => {
      cancelled = true;
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [withCoords, buildPopup]);

  /* ── Geocoding ── */
  const handleGeocode = useCallback(async (toGeocode: Delivery[]) => {
    if (toGeocode.length === 0 || geocodeRunningRef.current) return;

    geocodeRunningRef.current = true;
    setIsGeocoding(true);
    let success = 0;

    try {
      for (const delivery of toGeocode) {
        const addr = delivery.address;
        if (!addr) continue;

        const normalizedCity = addr.city?.trim() || unitName?.trim() || '';
        const coords = await geocodeAddress(
          addr.full_address,
          addr.neighborhood,
          normalizedCity,
          unitName || '',
        );

        if (coords) {
          const { error } = await supabase
            .from('delivery_addresses')
            .update({ lat: coords.lat, lng: coords.lng })
            .eq('id', addr.id);

          if (error) {
            toast.error('Erro ao salvar localização no mapa');
            continue;
          }

          success++;
        }
      }

      if (success > 0) {
        toast.success(`${success} endereço(s) localizado(s) no mapa`);
        onRefresh?.();
      }
    } finally {
      geocodeRunningRef.current = false;
      setIsGeocoding(false);
    }
  }, [onRefresh, unitName]);

  // Auto-geocode on load and retry every 20s while there are pending addresses
  const withoutCoordsIds = useMemo(() => withoutCoords.map((d) => d.id).join(','), [withoutCoords]);
  useEffect(() => {
    if (withoutCoords.length === 0) return;

    handleGeocode(withoutCoords);
    const retryTimer = window.setInterval(() => {
      handleGeocode(withoutCoords);
    }, 20000);

    return () => {
      window.clearInterval(retryTimer);
    };
  }, [withoutCoordsIds, handleGeocode]);

  /* ── Render ── */
  return (
    <div className="space-y-2">
      {/* Geocode banner */}
      {isGeocoding && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border/30 bg-card/50">
          <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
          <p className="text-[11px] text-muted-foreground">Localizando endereços no mapa…</p>
        </div>
      )}

      {/* Map container */}
      <div className="relative z-0 isolate rounded-2xl overflow-hidden border border-border/30 shadow-sm">
        <div
          ref={mapRef}
          style={{ height: 260 }}
          className="w-full relative z-0"
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
});
