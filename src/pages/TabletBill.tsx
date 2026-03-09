import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import gardenLogo from '@/assets/logo.png';

type PaymentOption = 'pix' | 'waiter' | 'coins' | null;

// CRC16-CCITT for Pix EMV
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

function buildPixPayload(pixKey: string, pixKeyType: string, merchantName: string, amount: number): string {
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

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  tablet_products: { name: string } | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  tablet_order_items: OrderItem[];
}

export default function TabletBill() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mesa = searchParams.get('mesa') || '1';
  const mesaNum = parseInt(mesa, 10);

  const [selectedPayment, setSelectedPayment] = useState<PaymentOption>(null);

  // Fetch unit info (store_info for pix, name)
  const { data: unitData } = useQuery({
    queryKey: ['tablet-bill-unit', unitId],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('name, store_info').eq('id', unitId!).single();
      if (error) throw error;
      return data as { name: string; store_info: Record<string, any> | null };
    },
    enabled: !!unitId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch open orders for this table
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['tablet-bill-orders', unitId, mesaNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tablet_orders')
        .select('id, status, total, created_at, customer_name, tablet_order_items(id, quantity, unit_price, notes, tablet_products(name))')
        .eq('unit_id', unitId!)
        .eq('table_number', mesaNum)
        .in('status', ['confirmed', 'preparing', 'ready', 'pending'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
    enabled: !!unitId,
    refetchInterval: 10000,
  });

  // Aggregate all items
  const { items, grandTotal } = useMemo(() => {
    if (!orders?.length) return { items: [], grandTotal: 0 };
    const map = new Map<string, { name: string; qty: number; unitPrice: number; total: number }>();
    let total = 0;
    for (const order of orders) {
      for (const item of order.tablet_order_items) {
        const name = item.tablet_products?.name || 'Item';
        const key = `${name}-${item.unit_price}`;
        const existing = map.get(key);
        if (existing) {
          existing.qty += item.quantity;
          existing.total += item.quantity * item.unit_price;
        } else {
          map.set(key, { name, qty: item.quantity, unitPrice: item.unit_price, total: item.quantity * item.unit_price });
        }
      }
      total += order.total;
    }
    return { items: Array.from(map.values()), grandTotal: total };
  }, [orders]);

  // Call waiter mutation
  const callWaiter = useMutation({
    mutationFn: async () => {
      // Create or update a bill record with status waiting_payment
      const { error } = await supabase.from('table_bills').insert({
        unit_id: unitId!,
        table_number: mesaNum,
        status: 'waiting_payment',
        total: grandTotal,
        payment_method: 'waiter',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Garçom chamado! Aguarde na mesa.');
      setSelectedPayment(null);
    },
    onError: () => toast.error('Erro ao chamar garçom.'),
  });

  const pixKey = unitData?.store_info?.pix_key as string | undefined;
  const pixKeyType = (unitData?.store_info?.pix_key_type as string) || 'aleatoria';
  const storeName = unitData?.name || 'Loja';

  const pixPayload = useMemo(() => {
    if (!pixKey || grandTotal <= 0) return null;
    return buildPixPayload(pixKey, pixKeyType, storeName, grandTotal);
  }, [pixKey, pixKeyType, storeName, grandTotal]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <AppIcon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)} className="p-2 -ml-2 rounded-xl hover:bg-secondary/50">
          <AppIcon name="ChevronLeft" size={20} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Conta da Mesa {mesa}</h1>
          <p className="text-xs text-muted-foreground">{hasOrders ? `${orders.length} pedido(s)` : 'Sem pedidos'}</p>
        </div>
      </header>

      {!hasOrders ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center">
            <AppIcon name="Receipt" size={28} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum pedido aberto nesta mesa.</p>
          <Button variant="outline" onClick={() => navigate(`/tablet/${unitId}/menu?mesa=${mesa}`)}>
            <AppIcon name="UtensilsCrossed" size={16} className="mr-2" /> Ver Cardápio
          </Button>
        </div>
      ) : (
        <main className="flex-1 px-4 pb-6 space-y-4 overflow-y-auto">
          {/* Items summary */}
          <div className="card-base rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30">
              <p className="text-sm font-bold text-foreground">Resumo dos Pedidos</p>
            </div>
            <div className="divide-y divide-border/20">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.qty}x {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground ml-3">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-t border-border/30">
              <p className="text-sm font-bold text-foreground">Total</p>
              <p className="text-lg font-black text-primary">{formatCurrency(grandTotal)}</p>
            </div>
          </div>

          {/* Payment options */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">Como deseja pagar?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPayment(selectedPayment === 'pix' ? null : 'pix')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  selectedPayment === 'pix'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/30 bg-card hover:border-primary/30'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <AppIcon name="QrCode" size={24} className="text-emerald-500" />
                </div>
                <span className="text-sm font-bold text-foreground">Pix</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">QR Code na tela</span>
              </button>

              <button
                onClick={() => setSelectedPayment(selectedPayment === 'waiter' ? null : 'waiter')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  selectedPayment === 'waiter'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/30 bg-card hover:border-primary/30'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <AppIcon name="HandCoins" size={24} className="text-blue-500" />
                </div>
                <span className="text-sm font-bold text-foreground">Garçom</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">Receber na mesa</span>
              </button>
            </div>
          </div>

          {/* Pix QR */}
          {selectedPayment === 'pix' && (
            <div className="card-base rounded-2xl p-6 flex flex-col items-center gap-4">
              {pixPayload ? (
                <>
                  <p className="text-sm font-bold text-foreground">Escaneie o QR Code</p>
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG value={pixPayload} size={200} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-primary">{formatCurrency(grandTotal)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Abra o app do banco e escaneie</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(pixKey || '');
                      toast.success('Chave Pix copiada!');
                    }}
                  >
                    <AppIcon name="Copy" size={14} className="mr-1" /> Copiar chave Pix
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <AppIcon name="AlertCircle" size={28} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Pix não configurado pelo estabelecimento.</p>
                </div>
              )}
            </div>
          )}

          {/* Waiter */}
          {selectedPayment === 'waiter' && (
            <div className="card-base rounded-2xl p-6 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <AppIcon name="Bell" size={32} className="text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">Chamar garçom para a mesa</p>
                <p className="text-[11px] text-muted-foreground mt-1">O garçom virá receber o pagamento (dinheiro, cartão, etc.)</p>
              </div>
              <Button
                className="w-full"
                onClick={() => callWaiter.mutate()}
                disabled={callWaiter.isPending}
              >
                {callWaiter.isPending ? (
                  <AppIcon name="Loader2" size={16} className="animate-spin mr-2" />
                ) : (
                  <AppIcon name="Bell" size={16} className="mr-2" />
                )}
                Chamar Garçom
              </Button>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
