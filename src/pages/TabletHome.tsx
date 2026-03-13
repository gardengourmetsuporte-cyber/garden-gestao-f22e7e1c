import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { formatCurrency } from '@/lib/format';
import { MenuLoadingScreen } from '@/components/digital-menu/MenuLoadingScreen';
import { SnakeGame } from '@/components/games/SnakeGame';
import { MemoryGame } from '@/components/games/MemoryGame';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import gardenLogo from '@/assets/logo.png';
import tabletHero from '@/assets/tablet-hero.jpg';

interface StoreInfo {
  logo_url?: string;
  banner_url?: string;
  name?: string;
  pix_key?: string;
  pix_key_type?: string;
}

interface RodizioSettings {
  is_active: boolean;
  price: number;
  description: string;
  time_limit_minutes: number;
}

const TABLET_MESA_KEY = 'tablet_mesa_config';
const TABLET_PIN_KEY = 'tablet_admin_pin';
const TABLET_UNIT_KEY = 'tablet_unit_id';

function getStoredMesa(): string | null {
  try { return localStorage.getItem(TABLET_MESA_KEY); } catch { return null; }
}
function setStoredMesa(mesa: string) {
  try { localStorage.setItem(TABLET_MESA_KEY, mesa); } catch {}
}
function getStoredPin(): string | null {
  try { return localStorage.getItem(TABLET_PIN_KEY); } catch { return null; }
}
function setStoredPin(pin: string) {
  try { localStorage.setItem(TABLET_PIN_KEY, pin); } catch {}
}

// ─── Table Config Dialog ───
function TableConfigDialog({
  currentMesa,
  onConfirm,
  onCancel,
  unitId,
}: {
  currentMesa: string;
  onConfirm: (mesa: string, pin: string) => void;
  onCancel?: () => void;
  unitId?: string;
}) {
  const [mesa, setMesa] = useState(currentMesa);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleConfirm = async () => {
    const normalizedPin = pin.replace(/\D/g, '');

    if (!mesa || Number(mesa) < 1) { setError('Informe o número da mesa'); return; }
    if (!normalizedPin || normalizedPin.length < 4) { setError('Informe a senha de 4 dígitos'); return; }
    if (!unitId) { setError('Unidade não identificada'); return; }

    setChecking(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .rpc('validate_tablet_pin', { p_unit_id: unitId, p_pin: normalizedPin });

      if (dbError) throw dbError;
      if (!data) {
        setError('Senha incorreta. Use o PIN cadastrado em Funcionários.');
        setChecking(false);
        return;
      }

      onConfirm(mesa, normalizedPin);
    } catch {
      setError('Erro ao validar senha. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card rounded-3xl shadow-2xl border border-border/30 w-full max-w-md mx-6 p-8 animate-in zoom-in-95 fade-in duration-200">
        <h2 className="text-xl font-bold text-foreground text-center mb-6">Configurar Mesa</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Número da Mesa</label>
            <input
              type="number"
              min={1}
              value={mesa}
              onChange={e => { setMesa(e.target.value); setError(''); }}
              className="w-full h-12 rounded-xl bg-secondary/50 border border-border/40 px-4 text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Senha do funcionário
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setError(''); }}
              placeholder="••••"
              className="w-full h-12 rounded-xl bg-secondary/50 border border-border/40 px-4 text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive text-center mb-4 font-medium">{error}</p>
        )}

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 h-12 rounded-xl border border-border/40 text-foreground font-semibold text-sm hover:bg-secondary/50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={checking}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {checking ? 'Verificando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CRC16 for Pix ───
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildPixPayload(pixKey: string, _pixKeyType: string, merchantName: string, amount: number): string {
  const tlv = (id: string, val: string) => `${id}${val.length.toString().padStart(2, '0')}${val}`;
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', pixKey);
  const mai = tlv('26', gui + key);
  const mcc = tlv('52', '0000');
  const currency = tlv('53', '986');
  const amountStr = amount > 0 ? tlv('54', amount.toFixed(2)) : '';
  const country = tlv('58', 'BR');
  const name = tlv('59', merchantName.substring(0, 25));
  const city = tlv('60', 'SAO PAULO');
  const payload = tlv('00', '01') + mai + mcc + currency + amountStr + country + name + city + '6304';
  return payload + crc16(payload);
}

// ─── Bill Panel (Minha Conta) ───
function BillPanel({ unitId, mesa, storeInfo, storeName, onClose }: {
  unitId: string; mesa: string; storeInfo: Record<string, any> | null; storeName: string; onClose: () => void;
}) {
  const mesaNum = parseInt(mesa, 10);
  const [selectedPayment, setSelectedPayment] = useState<'pix' | 'waiter' | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['tablet-bill-orders', unitId, mesaNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tablet_orders')
        .select('id, status, total, created_at, customer_name, comanda_number, tablet_order_items(id, quantity, unit_price, notes, tablet_products(name))')
        .eq('unit_id', unitId)
        .eq('table_number', mesaNum)
        .in('status', ['confirmed', 'preparing', 'ready', 'pending'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    refetchInterval: 10000,
  });

  const { items, grandTotal } = useMemo(() => {
    if (!orders?.length) return { items: [] as any[], grandTotal: 0 };
    const map = new Map<string, { name: string; qty: number; unitPrice: number; total: number }>();
    let total = 0;
    for (const order of orders) {
      for (const item of order.tablet_order_items) {
        const name = item.tablet_products?.name || 'Item';
        const key = `${name}-${item.unit_price}`;
        const existing = map.get(key);
        if (existing) { existing.qty += item.quantity; existing.total += item.quantity * item.unit_price; }
        else map.set(key, { name, qty: item.quantity, unitPrice: item.unit_price, total: item.quantity * item.unit_price });
      }
      total += order.total;
    }
    return { items: Array.from(map.values()), grandTotal: total };
  }, [orders]);

  const callWaiter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('table_bills').insert({
        unit_id: unitId,
        table_number: mesaNum,
        status: 'waiting_payment',
        total: grandTotal,
        payment_method: 'waiter',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Garçom chamado! Aguarde na mesa.'); setSelectedPayment(null); },
    onError: () => toast.error('Erro ao chamar garçom.'),
  });

  const pixKey = storeInfo?.pix_key as string | undefined;
  const pixKeyType = (storeInfo?.pix_key_type as string) || 'aleatoria';
  const pixPayload = useMemo(() => {
    if (!pixKey || grandTotal <= 0) return null;
    return buildPixPayload(pixKey, pixKeyType, storeName, grandTotal);
  }, [pixKey, pixKeyType, storeName, grandTotal]);

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20">
        <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-secondary/50 flex items-center justify-center">
          <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-base font-bold text-foreground">Minha Conta</h2>
          <p className="text-[11px] text-muted-foreground">Mesa {mesa} • {hasOrders ? `${orders.length} pedido(s)` : 'Sem pedidos'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isLoading && <div className="flex items-center justify-center py-16"><AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" /></div>}

        {!isLoading && !hasOrders && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <AppIcon name="Receipt" size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum pedido aberto nesta mesa.</p>
          </div>
        )}

        {hasOrders && (
          <>
            {/* Items */}
            <div className="rounded-2xl bg-card border border-border/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/20">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Itens</p>
              </div>
              <div className="divide-y divide-border/10">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.qty}x {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground ml-3">{formatCurrency(item.total)}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-t border-border/20">
                <p className="text-sm font-bold text-foreground">Total</p>
                <p className="text-lg font-black text-primary">{formatCurrency(grandTotal)}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pagamento</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setSelectedPayment(selectedPayment === 'pix' ? null : 'pix')}
                  className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                    selectedPayment === 'pix' ? 'border-primary bg-primary/10' : 'border-border/20 bg-card hover:border-primary/30'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <AppIcon name="QrCode" size={20} className="text-primary" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Pix</span>
                </button>
                <button
                  onClick={() => setSelectedPayment(selectedPayment === 'waiter' ? null : 'waiter')}
                  className={cn('flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                    selectedPayment === 'waiter' ? 'border-primary bg-primary/10' : 'border-border/20 bg-card hover:border-primary/30'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <AppIcon name="HandCoins" size={20} className="text-primary" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Garçom</span>
                </button>
              </div>
            </div>

            {selectedPayment === 'pix' && (
              <div className="rounded-2xl bg-card border border-border/20 p-5 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
                {pixPayload ? (
                  <>
                    <p className="text-sm font-bold text-foreground">Escaneie o QR Code</p>
                    <div className="bg-white p-3 rounded-xl"><QRCodeSVG value={pixPayload} size={160} /></div>
                    <p className="text-lg font-black text-primary">{formatCurrency(grandTotal)}</p>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(pixKey || ''); toast.success('Chave Pix copiada!'); }}>
                      <AppIcon name="Copy" size={14} className="mr-1" /> Copiar chave
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4">Pix não configurado.</p>
                )}
              </div>
            )}

            {selectedPayment === 'waiter' && (
              <div className="rounded-2xl bg-card border border-border/20 p-5 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                   <AppIcon name="Bell" size={24} className="text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">Chamar garçom para a mesa</p>
                <Button className="w-full" onClick={() => callWaiter.mutate()} disabled={callWaiter.isPending}>
                  {callWaiter.isPending ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Bell" size={16} className="mr-2" />}
                  Chamar Garçom
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Orders Panel (Pedido) ───
function OrdersPanel({ unitId, mesa, onClose }: { unitId: string; mesa: string; onClose: () => void }) {
  const mesaNum = parseInt(mesa, 10);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['tablet-orders-panel', unitId, mesaNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tablet_orders')
        .select('id, status, total, created_at, comanda_number, tablet_order_items(id, quantity, unit_price, notes, tablet_products(name))')
        .eq('unit_id', unitId)
        .eq('table_number', mesaNum)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    refetchInterval: 8000,
  });

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-amber-500/15 text-amber-500' },
    confirmed: { label: 'Confirmado', color: 'bg-blue-500/15 text-blue-500' },
    preparing: { label: 'Preparando', color: 'bg-orange-500/15 text-orange-500' },
    ready: { label: 'Pronto', color: 'bg-success/15 text-success' },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20">
        <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-secondary/50 flex items-center justify-center">
          <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-base font-bold text-foreground">Meus Pedidos</h2>
          <p className="text-[11px] text-muted-foreground">Mesa {mesa}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {isLoading && <div className="flex items-center justify-center py-16"><AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" /></div>}

        {!isLoading && (!orders || orders.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <AppIcon name="ShoppingBag" size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum pedido ativo.</p>
          </div>
        )}

        {orders?.map(order => {
          const status = statusMap[order.status] || { label: order.status, color: 'bg-secondary text-muted-foreground' };
          return (
            <div key={order.id} className="rounded-2xl bg-card border border-border/20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
                <div className="flex items-center gap-2">
                  {order.comanda_number && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Comanda #{order.comanda_number}
                    </span>
                  )}
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', status.color)}>
                    {status.label}
                  </span>
                </div>
                <span className="text-sm font-black text-primary">{formatCurrency(order.total)}</span>
              </div>
              <div className="divide-y divide-border/10">
                {order.tablet_order_items?.map((item: any) => (
                  <div key={item.id} className="px-4 py-2 flex justify-between">
                    <span className="text-xs text-foreground">{item.quantity}x {item.tablet_products?.name || 'Item'}</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Game Selection Panel ───
const GAMES = [
  { id: 'snake', emoji: '🐍', title: 'Snake Garden', description: 'Coma lanches e fique enorme!', gradient: 'from-emerald-600/25 to-emerald-900/40', border: 'border-emerald-500/30' },
  { id: 'memory', emoji: '🧠', title: 'Memory Garden', description: 'Encontre os pares de lanches!', gradient: 'from-amber-600/25 to-amber-900/40', border: 'border-amber-500/30' },
];

type ActivePanel = 'bill' | 'orders' | 'games' | null;

export default function TabletHome() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mesaParam = searchParams.get('mesa');
  const storedMesa = getStoredMesa();

  const initialMesa = mesaParam || storedMesa || null;
  const [mesa, setMesa] = useState<string | null>(initialMesa);
  const [showConfig, setShowConfig] = useState(!initialMesa);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  useEffect(() => {
    if (unitId) { try { localStorage.setItem(TABLET_UNIT_KEY, unitId); } catch {} }
    if (mesaParam && !storedMesa) { setStoredMesa(mesaParam); setMesa(mesaParam); }
  }, [mesaParam, storedMesa]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tablet-home', unitId],
    queryFn: async () => {
      if (!unitId) return { unit: null, rodizio: null as RodizioSettings | null };
      const withTimeout = <T,>(promise: Promise<T>, ms = 12000) =>
        Promise.race<T>([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))]);

      const [unitRes, rodizioRes] = await withTimeout(Promise.all([
        Promise.resolve(supabase.from('units').select('name, store_info').eq('id', unitId).single()),
        Promise.resolve(supabase.from('rodizio_settings').select('is_active, price, description, time_limit_minutes').eq('unit_id', unitId).eq('is_active', true).maybeSingle()),
      ]));
      if (unitRes.error) throw unitRes.error;
      return { unit: (unitRes.data as { name: string; store_info: StoreInfo | null }) ?? null, rodizio: (rodizioRes.data as RodizioSettings | null) ?? null };
    },
    enabled: !!unitId,
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const unit = data?.unit ?? null;
  const rodizio = data?.rodizio ?? null;

  const menuItems = useMemo(() => {
    if (!mesa) return [];
    return [
      ...(rodizio?.is_active ? [{
        id: 'rodizio', icon: 'AllInclusive', label: 'Rodízio',
        subtitle: `${formatCurrency(rodizio.price)} • ${rodizio.time_limit_minutes}min`,
        onClick: () => navigate(`/tablet/${unitId}/rodizio?mesa=${mesa}`),
      }] : []),
      { id: 'cardapio', icon: 'Restaurant', label: 'Cardápio', subtitle: 'Menu completo', onClick: () => navigate(`/tablet/${unitId}/menu?mesa=${mesa}`) },
      { id: 'jogos', icon: 'SportsEsports', label: 'Jogos', subtitle: 'Diversão na mesa', onClick: () => setActivePanel('games') },
      { id: 'mural', icon: 'Newspaper', label: 'Mural da Casa', subtitle: 'Novidades e avisos', onClick: () => navigate(`/tablet/${unitId}/mural?mesa=${mesa}`) },
      { id: 'avalie', icon: 'Star', label: 'Avalie o Local', subtitle: 'Deixe sua opinião', onClick: () => navigate(`/tablet/${unitId}/review?mesa=${mesa}`) },
    ];
  }, [mesa, navigate, rodizio, unitId]);

  const handleConfigConfirm = (newMesa: string) => {
    setStoredMesa(newMesa);
    setMesa(newMesa);
    setShowConfig(false);
    setSearchParams({ mesa: newMesa }, { replace: true });
  };

  if (isLoading) return <MenuLoadingScreen message="Carregando..." />;

  if (isError) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AppIcon name="WifiOff" size={34} className="text-destructive" />
        <div>
          <p className="text-base font-bold text-foreground">Falha ao abrir o tablet</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Erro de conexão'}</p>
        </div>
        <button onClick={() => refetch()} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Tentar novamente</button>
      </div>
    );
  }

  const logoUrl = unit?.store_info?.logo_url;
  const bannerUrl = unit?.store_info?.banner_url;

  // ─── Fullscreen Game ───
  if (activeGame === 'snake') return <SnakeGame onBack={() => setActiveGame(null)} unitId={unitId} />;
  if (activeGame === 'memory') return <MemoryGame onBack={() => setActiveGame(null)} unitId={unitId} />;

  // Check if a right panel is active
  const hasRightPanel = activePanel !== null;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none flex">
      {/* ─── Left Sidebar ─── */}
      <aside className="relative z-20 w-full md:w-[400px] lg:w-[420px] h-full flex flex-col bg-background/95 backdrop-blur-xl border-r border-border/20">
        {/* Mesa badge */}
        <div className="px-6 pt-[max(env(safe-area-inset-top,12px),16px)] pb-3 flex justify-center">
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-sm hover:bg-card transition-colors"
          >
            <AppIcon name="TableBar" size={15} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Mesa {mesa || '?'}</span>
            <AppIcon name="ChevronDown" size={13} className="text-muted-foreground" />
          </button>
        </div>

        {/* Mobile quick actions */}
        <div className="px-6 pb-2 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActivePanel(activePanel === 'bill' ? null : 'bill')}
              className={cn(
                'h-10 rounded-full border text-xs font-bold transition-colors',
                activePanel === 'bill'
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-card/60 border-border/30 text-foreground'
              )}
            >
              Minha Conta
            </button>
            <button
              onClick={() => setActivePanel(activePanel === 'orders' ? null : 'orders')}
              className={cn(
                'h-10 rounded-full border text-xs font-bold transition-colors',
                activePanel === 'orders'
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-card/60 border-border/30 text-foreground'
              )}
            >
              Pedido
            </button>
          </div>
        </div>

        {/* Logo & Brand */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden border-2 border-primary/20 bg-white shadow-lg flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={unit?.name} className="w-full h-full object-cover" />
            ) : (
              <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain p-2" />
            )}
          </div>
          <h1 className="text-base md:text-lg font-bold text-foreground leading-tight text-center mt-2">{unit?.name || 'Bem-vindo'}</h1>
        </div>

        <div className="mx-6 h-px bg-border/30" />

        {/* Menu items */}
        <div className="flex-1 flex items-center justify-center px-5 overflow-hidden">
          <div className="grid grid-cols-2 gap-3 w-full max-w-[360px]">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-card/50 border border-border/20 hover:bg-card hover:border-primary/20 active:scale-[0.97] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <AppIcon name={item.icon} size={24} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground/50 text-center font-medium tracking-wide">
            uma experiência <span className="font-bold text-muted-foreground/70">Garden</span>
          </p>
        </div>
      </aside>

      {/* ─── Right Area: Hero ─── */}
      <div className="hidden md:block flex-1 relative">
        {/* Hero Image (always behind) */}
        <img src={bannerUrl || tabletHero} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top right buttons */}
        <div className="absolute top-0 right-0 z-10 pr-5 pt-[max(env(safe-area-inset-top,12px),16px)] flex items-center gap-2">
          <button
            onClick={() => setActivePanel(activePanel === 'bill' ? null : 'bill')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full border backdrop-blur-xl transition-colors',
              activePanel === 'bill'
                ? 'bg-primary/20 border-primary/40 text-white'
                : 'bg-black/40 border-white/20 hover:bg-white/10 text-white'
            )}
          >
            <AppIcon name="Receipt" size={16} />
            <span className="text-sm font-bold">Minha Conta</span>
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'orders' ? null : 'orders')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full border backdrop-blur-xl transition-colors',
              activePanel === 'orders'
                ? 'bg-primary/20 border-primary/40 text-white'
                : 'bg-black/40 border-white/20 hover:bg-white/10 text-white'
            )}
          >
            <AppIcon name="ShoppingBag" size={16} />
            <span className="text-sm font-bold">Pedido</span>
          </button>
        </div>
      </div>

      {/* Panel overlay */}
      {hasRightPanel && (
        <div className="absolute inset-0 z-30 md:left-[400px] lg:left-[420px] bg-background/98 backdrop-blur-2xl animate-in fade-in slide-in-from-right-5 duration-300">
          {activePanel === 'bill' && unitId && mesa && (
            <BillPanel
              unitId={unitId}
              mesa={mesa}
              storeInfo={unit?.store_info as Record<string, any> | null}
              storeName={unit?.name || 'Loja'}
              onClose={() => setActivePanel(null)}
            />
          )}
          {activePanel === 'orders' && unitId && mesa && (
            <OrdersPanel unitId={unitId} mesa={mesa} onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'games' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20">
                <button onClick={() => setActivePanel(null)} className="w-9 h-9 rounded-xl hover:bg-secondary/50 flex items-center justify-center">
                  <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
                </button>
                <h2 className="text-base font-bold text-foreground">Jogos</h2>
              </div>
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="w-full max-w-md space-y-4">
                  {GAMES.map(game => (
                    <button
                      key={game.id}
                      onClick={() => { setActivePanel(null); setActiveGame(game.id); }}
                      className={`w-full flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br ${game.gradient} border ${game.border} hover:scale-[1.01] active:scale-[0.98] transition-all`}
                    >
                      <span className="text-5xl">{game.emoji}</span>
                      <div className="text-left flex-1">
                        <p className="text-base font-bold text-foreground">{game.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{game.description}</p>
                      </div>
                      <AppIcon name="ChevronRight" size={20} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Table Config Dialog ─── */}
      {showConfig && (
        <TableConfigDialog
          currentMesa={mesa || '1'}
          onConfirm={handleConfigConfirm}
          onCancel={mesa ? () => setShowConfig(false) : undefined}
          unitId={unitId}
        />
      )}
    </div>
  );
}
