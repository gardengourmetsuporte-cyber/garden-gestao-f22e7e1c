import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Clock, X, UtensilsCrossed, Truck, Hash, User, ShoppingBag, Layers, Undo2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────
type KDSOrderItem = {
  id: string;
  quantity: number;
  notes: string | null;
  tablet_products: {
    name: string;
    codigo_pdv: string | null;
    recipes?: {
      recipe_ingredients?: {
        quantity: number;
        unit_type: string;
        kds_station_id: string | null;
        kds_stations: { name: string; color: string } | null;
        inventory_items: { name: string } | null;
      }[];
    } | null;
  } | null;
};

type KDSOrder = {
  id: string;
  unit_id: string;
  table_number: number;
  status: string;
  total: number;
  created_at: string;
  source: string;
  customer_name: string | null;
  tablet_order_items?: KDSOrderItem[];
};

const STATUS_CFG: Record<string, {
  label: string; accent: string; next: string | null; nextLabel: string; prev: string | null; prevLabel: string;
}> = {
  awaiting_confirmation: { label: 'Aguardando', accent: 'amber', next: 'confirmed', nextLabel: 'Aceitar', prev: null, prevLabel: '' },
  confirmed:             { label: 'Confirmado', accent: 'sky', next: 'preparing', nextLabel: 'Preparar', prev: 'awaiting_confirmation', prevLabel: 'Voltar para Aguardando' },
  preparing:             { label: 'Preparando', accent: 'violet', next: 'ready', nextLabel: 'Pronto', prev: 'confirmed', prevLabel: 'Voltar para Confirmado' },
  ready:                 { label: 'Pronto',     accent: 'emerald', next: 'delivered', nextLabel: 'Entregue', prev: 'preparing', prevLabel: 'Voltar para Preparando' },
};

const ACCENT_STYLES: Record<string, { text: string; bg: string; ring: string; btn: string }> = {
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'ring-amber-500/30', btn: 'bg-amber-400 hover:bg-amber-300' },
  sky:     { text: 'text-sky-400',     bg: 'bg-sky-500/10',     ring: 'ring-sky-500/30',   btn: 'bg-sky-400 hover:bg-sky-300' },
  violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  ring: 'ring-violet-500/30', btn: 'bg-violet-400 hover:bg-violet-300' },
  emerald: { text: 'text-success', bg: 'bg-success/10', ring: 'ring-success/30', btn: 'bg-success hover:bg-success/80' },
};

// ─── Sector grouping logic ─────────────────────────────────────────
type SectorItem = { ingredientName: string; quantity: number; unitType: string; productName: string; productQty: number };
type SectorGroup = { stationName: string; stationColor: string; items: SectorItem[] };

function groupBySector(items: KDSOrderItem[]): SectorGroup[] {
  const map = new Map<string, SectorGroup>();
  for (const item of items) {
    const productName = item.tablet_products?.name || 'Item';
    const ingredients = item.tablet_products?.recipes?.recipe_ingredients || [];
    for (const ing of ingredients) {
      if (!ing.kds_station_id || !ing.kds_stations) continue;
      const key = ing.kds_station_id;
      if (!map.has(key)) map.set(key, { stationName: ing.kds_stations.name, stationColor: ing.kds_stations.color, items: [] });
      map.get(key)!.items.push({ ingredientName: ing.inventory_items?.name || 'Ingrediente', quantity: ing.quantity, unitType: ing.unit_type, productName, productQty: item.quantity });
    }
  }
  return Array.from(map.values());
}

// ─── Component ────────────────────────────────────────────────────
export function KDSOrderDetail({
  order, onClose, onBump,
}: {
  order: KDSOrder;
  onClose: () => void;
  onBump: (id: string, next: string) => void;
}) {
  const [view, setView] = useState<'items' | 'sectors'>('items');
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.confirmed;
  const a = ACCENT_STYLES[cfg.accent] || ACCENT_STYLES.sky;
  const source = order.source || 'mesa';
  const items = order.tablet_order_items || [];
  const shortId = (order as any).order_number ? `${(order as any).order_number}` : order.id.slice(0, 4).toUpperCase();
  const mins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60_000);
  const sectorGroups = useMemo(() => groupBySector(items), [items]);
  const hasSectors = sectorGroups.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(225,15%,6%)] animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* ── Header ── */}
      <header className={cn('flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0', a.bg)}>
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', a.bg, 'ring-2', a.ring)}>
            <span className={cn('text-xl font-black', a.text)}>#{shortId}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg', a.bg, a.text, 'ring-1', a.ring)}>
                {cfg.label}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg',
                mins >= 15 ? 'bg-red-500/20 text-red-400 animate-pulse' :
                mins >= 10 ? 'bg-orange-500/15 text-orange-400' :
                'bg-white/[0.06] text-white/40',
              )}>
                <Clock className="w-3.5 h-3.5" />
                {mins} min
              </span>
            </div>
            <p className="text-[10px] text-white/30 mt-1">
              Criado {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/10 transition-colors active:scale-95">
          <X className="w-6 h-6 text-white/50" />
        </button>
      </header>

      {/* ── Info bar ── */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.015] shrink-0 text-sm">
        <div className="flex items-center gap-1.5">
          {source === 'delivery' ? <Truck className="w-4 h-4 text-blue-400" /> : source === 'qrcode' ? <Hash className="w-4 h-4 text-purple-400" /> : <UtensilsCrossed className="w-4 h-4 text-emerald-400" />}
          <span className="font-bold text-white/80">
            {source === 'delivery' ? 'Delivery' : source === 'qrcode' ? `QR Code · Mesa ${order.table_number}` : `Mesa ${order.table_number}`}
          </span>
        </div>
        {order.customer_name && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-white/30" />
            <span className="text-white/50 font-medium">{order.customer_name}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <ShoppingBag className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs text-white/40 font-semibold">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>

      {/* ── View toggle ── */}
      {hasSectors && (
        <div className="flex items-center gap-1 px-5 py-2 border-b border-white/[0.06] shrink-0">
          <button onClick={() => setView('items')}
            className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all', view === 'items' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50')}>
            <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5" />Pedido
          </button>
          <button onClick={() => setView('sectors')}
            className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all', view === 'sectors' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50')}>
            <Layers className="w-3.5 h-3.5 inline mr-1.5" />Por Setor
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {view === 'items' ? (
          <div className="grid gap-2 max-w-3xl mx-auto">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3.5 rounded-xl p-3.5 border bg-white/[0.025] border-white/[0.06]">
                <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0', a.bg, a.text, 'ring-1', a.ring)}>
                  {item.quantity}x
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white/90">{item.tablet_products?.name || 'Item'}</p>
                  {item.tablet_products?.codigo_pdv && (
                    <p className="text-[10px] text-white/25 font-mono mt-0.5">COD PDV: {item.tablet_products.codigo_pdv}</p>
                  )}
                  {item.notes && (
                    <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-400/90 font-medium">⚠ {item.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-white/15">
                <ShoppingBag className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">Nenhum item</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-3 max-w-3xl mx-auto">
            {sectorGroups.map(sector => (
              <div key={sector.stationName} className="rounded-2xl border overflow-hidden" style={{ borderColor: `${sector.stationColor}30` }}>
                <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ backgroundColor: `${sector.stationColor}12` }}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sector.stationColor }} />
                  <span className="text-sm font-black uppercase tracking-wider" style={{ color: sector.stationColor }}>{sector.stationName}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-auto" style={{ backgroundColor: `${sector.stationColor}18`, color: sector.stationColor }}>
                    {sector.items.length} {sector.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {sector.items.map((si, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.015]">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                        style={{ backgroundColor: `${sector.stationColor}12`, color: sector.stationColor }}>
                        {si.productQty > 1 ? `${si.productQty}x` : '1x'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white/90">{si.ingredientName}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{si.quantity} {si.unitType} · <span className="text-white/20">{si.productName}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer with actions ── */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[hsl(225,15%,7%)] px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={onClose}
            className="px-5 py-3 rounded-xl text-sm font-bold text-white/50 bg-white/[0.04] hover:bg-white/[0.08] transition-colors active:scale-[0.97]">
            Voltar
          </button>

          {cfg.prev && (
            <button
              onClick={() => { onBump(order.id, cfg.prev!); onClose(); }}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold text-white/50 bg-white/[0.04] hover:bg-white/[0.08] transition-colors active:scale-[0.97]"
            >
              <Undo2 className="w-4 h-4" />
              {cfg.prevLabel}
            </button>
          )}

          <div className="flex-1" />

          {cfg.next && (
            <button
              onClick={() => { onBump(order.id, cfg.next!); onClose(); }}
              className={cn(
                'px-8 py-3 rounded-xl text-base font-black text-black tracking-wide transition-all active:scale-[0.97] shadow-lg',
                a.btn,
              )}
            >
              {cfg.nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
