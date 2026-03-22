import { useState, useEffect, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CartItem } from '@/hooks/useDigitalMenu';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { CartItemsList } from '@/components/digital-menu/MenuCart';
import { TabletQrLoginBanner } from '@/components/digital-menu/TabletQrLoginBanner';
import { ComandaScanner } from '@/components/digital-menu/ComandaScanner';
import { paymentOptionToBillingType } from '@/components/digital-menu/PaymentMethodSelector';
import { OnlinePaymentSheet } from '@/components/digital-menu/OnlinePaymentSheet';
import { useAsaasConfig } from '@/hooks/useAsaasConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency as formatPrice } from '@/lib/format';
import type { User } from '@supabase/supabase-js';

function buildPixPayload(pixKey: string, _pixKeyType: string, merchantName: string, amount: number): string {
  const tlv = (id: string, val: string) => `${id}${val.length.toString().padStart(2, '0')}${val}`;
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', pixKey);
  const mai = tlv('26', gui + key);
  const mcc = tlv('52', '0000');
  const cur = tlv('53', '986');
  const amt = tlv('54', amount.toFixed(2));
  const country = tlv('58', 'BR');
  const name = tlv('59', merchantName.slice(0, 25));
  const city = tlv('60', 'SAO PAULO');
  const payload = '000201' + mai + mcc + cur + amt + country + name + city + '6304';
  // CRC16 CCITT
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return payload + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

interface Props {
  cart: CartItem[];
  cartTotal: number;
  unitId: string;
  autoConfirm?: boolean;
  customerUser?: User | null;
  signupBonusPoints?: number;
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onClose: () => void;
  onLoginClick?: () => void;
}

export function TabletMenuCart({ cart, cartTotal, unitId, autoConfirm = false, customerUser, signupBonusPoints = 0, onUpdateQuantity, onRemove, onClear, onClose, onLoginClick }: Props) {
  // Auto-pull mesa number from tablet config (localStorage)
  const savedMesa = localStorage.getItem('tablet_mesa_config');
  const configuredTableNumber = savedMesa ? parseInt(savedMesa) || 0 : 0;

  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout'>('dine-in');
  const [payWithCoins, setPayWithCoins] = useState(false);
  const [customerCoins, setCustomerCoins] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [comandaNumber, setComandaNumber] = useState<number | null>(null);
  const paymentTiming = 'later' as const;
  const [showManualPix, setShowManualPix] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null);

  // Load unit's PIX key for manual PIX
  const [unitPixKey, setUnitPixKey] = useState<string | null>(null);
  const [unitName, setUnitName] = useState('');
  useEffect(() => {
    supabase.from('units').select('name, store_info').eq('id', unitId).maybeSingle().then(({ data }) => {
      if (data) {
        setUnitName(data.name || 'Loja');
        setUnitPixKey((data.store_info as any)?.pix_key || null);
      }
    });
  }, [unitId]);

  const manualPixPayload = useMemo(() => {
    if (!unitPixKey || cartTotal <= 0) return null;
    return buildPixPayload(unitPixKey, '', unitName, cartTotal);
  }, [unitPixKey, unitName, cartTotal]);

  // Check customer coin balance
  const coinTotal = cart.reduce((sum, item) => {
    const cp = item.product.coin_price;
    if (cp == null || cp <= 0) return sum + 999999;
    return sum + cp * item.quantity;
  }, 0);
  const allProductsHaveCoinPrice = cart.every(i => i.product.coin_price != null && i.product.coin_price > 0);
  const canPayWithCoins = allProductsHaveCoinPrice && customerCoins !== null && customerCoins >= coinTotal;

  // Fetch customer coins when logged in
  useEffect(() => {
    if (!customerUser) return;
    const email = customerUser.email;
    if (!email) return;
    supabase
      .from('customers')
      .select('loyalty_points')
      .eq('unit_id', unitId)
      .eq('email', email)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCustomerCoins(data.loyalty_points ?? 0);
      });
  }, [customerUser, unitId]);

  if (orderSent) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-emerald-500/12 flex items-center justify-center animate-in zoom-in-50 duration-300">
          <AppIcon name="CheckCircle2" size={40} className="text-emerald-500" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-foreground">Pedido enviado!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Pedido <span className="font-mono font-bold text-foreground">#{orderSent}</span>
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            {comandaNumber ? `Comanda #${comandaNumber}` : `Mesa ${configuredTableNumber}`} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 p-4 w-full max-w-xs mt-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}>
              <AppIcon name="Schedule" size={22} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Aguardando preparo</p>
              <p className="text-xs text-muted-foreground">Seu pedido está sendo preparado</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="lg" className="rounded-xl mt-2" onClick={() => { setOrderSent(null); onClear(); onClose(); }}>
          <AppIcon name="Plus" size={18} className="mr-2" />
          Fazer novo pedido
        </Button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center">
          <AppIcon name="ShoppingBag" size={32} className="text-muted-foreground/30" />
        </div>
        <div>
          <p className="text-foreground font-semibold">Seu pedido está vazio</p>
          <p className="text-xs text-muted-foreground mt-1">Volte ao cardápio e adicione itens</p>
        </div>
      </div>
    );
  }

  const withTimeout = async <T,>(promiseLike: PromiseLike<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(`timeout:${label}`)), ms);
    });
    try {
      const wrapped = Promise.resolve(promiseLike as any) as Promise<T>;
      return await Promise.race([wrapped, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const handleSendClick = () => {
    if (!comandaNumber) {
      setShowScanner(true);
      return;
    }
    handleSend(comandaNumber);
  };

  const handleSend = async (finalComanda?: number | null) => {
    const comanda = finalComanda ?? comandaNumber;
    if (!comanda && !configuredTableNumber) {
      toast.error('Escaneie uma comanda para identificar o pedido');
      return;
    }

    const finalName = customerUser
      ? (customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || customerUser.email || 'Cliente')
      : 'Cliente';

    setSending(true);

    const requestTimeoutMs = 20000;
    const maxRetries = 3;

    let shouldAutoConfirm = autoConfirm;
    try {
      const { data: unitRow } = await withTimeout(
        supabase.from('units').select('store_info').eq('id', unitId).maybeSingle(),
        requestTimeoutMs,
        'get_store_info'
      );
      const live = (unitRow as any)?.store_info?.auto_confirm?.mesa;
      if (typeof live === 'boolean') shouldAutoConfirm = live;
    } catch {
      // keep prop fallback
    }

    const isOnlinePayment = paymentTiming === 'now' && asaasActive;
    const isPixManual = paymentTiming === 'now' && !asaasActive;
    const paymentOption = (isOnlinePayment || isPixManual) ? 'pix' as const : 'presencial' as const;

    let lastError: any = null;

    try {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const orderNotes = payWithCoins ? `[PAGO_COM_MOEDAS:${coinTotal}]` : null;
          const { data: order, error: orderError } = await withTimeout(
            supabase
              .from('tablet_orders')
              .insert({
                unit_id: unitId,
                table_number: configuredTableNumber,
                comanda_number: comanda || null,
                status: isOnlinePayment ? 'awaiting_payment' : isPixManual ? 'confirmed' : (shouldAutoConfirm ? 'confirmed' : 'awaiting_confirmation'),
                total: payWithCoins ? 0 : cartTotal,
                source: comanda ? 'qrcode' : (orderType === 'takeout' ? 'mesa_levar' : 'mesa'),
                customer_name: finalName,
                customer_email: customerUser?.email || null,
                notes: orderNotes,
                payment_method: paymentOption,
                payment_status: isOnlinePayment ? 'pending' : null,
              } as any)
              .select('id, order_number')
              .single(),
            requestTimeoutMs,
            'create_order'
          );

          if (orderError || !order) throw new Error(orderError?.message || 'Erro ao criar pedido');

          const items = cart.map(c => ({
            order_id: (order as any).id,
            product_id: c.product.id,
            quantity: c.quantity,
            notes: [c.notes, c.selectedOptions.map(o => o.name).join(', ')].filter(Boolean).join(' | ') || null,
            unit_price: c.product.price + c.selectedOptions.reduce((s, o) => s + o.price, 0),
          }));

          const { error: itemsError } = await withTimeout(
            supabase.from('tablet_order_items').insert(items),
            requestTimeoutMs,
            'create_items'
          );
          if (itemsError) throw new Error(itemsError.message);

          // If online payment via ASAAS, show ASAAS PIX QR code
          if (isOnlinePayment) {
            const orderNum = (order as any).order_number ? `${(order as any).order_number}` : (order as any).id.slice(0, 8);
            setPendingOrderId((order as any).id);
            setPendingOrderNumber(orderNum);
            setShowOnlinePayment(true);
            setSending(false);
            return;
          }

          // If manual PIX (no ASAAS), show unit's own PIX key QR
          if (isPixManual) {
            const orderNum = (order as any).order_number ? `${(order as any).order_number}` : (order as any).id.slice(0, 8);
            setPendingOrderId((order as any).id);
            setPendingOrderNumber(orderNum);
            setShowManualPix(true);
            setSending(false);
            return;
          }

          if (shouldAutoConfirm) {
            try {
              await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tablet-order?action=send-to-pdv`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                  body: JSON.stringify({ order_id: (order as any).id }),
                }
              );
            } catch (e) {
              console.warn('[TabletMenuCart] send-to-pdv failed:', e);
            }
          }

          // Deduct coins if paying with coins
          if (payWithCoins && customerUser?.email) {
            try {
              const { data: cust } = await supabase
                .from('customers')
                .select('id, loyalty_points')
                .eq('unit_id', unitId)
                .eq('email', customerUser.email)
                .maybeSingle();
              if (cust) {
                await supabase
                  .from('customers')
                  .update({ loyalty_points: Math.max(0, (cust.loyalty_points ?? 0) - coinTotal) })
                  .eq('id', cust.id);
                await supabase.from('loyalty_events').insert({
                  customer_id: cust.id,
                  unit_id: unitId,
                  type: 'redeemed',
                  points: -coinTotal,
                  description: 'Pedido #' + ((order as any).order_number || (order as any).id.slice(0, 8)) + ' pago com moedas',
                });
                setCustomerCoins(Math.max(0, (cust.loyalty_points ?? 0) - coinTotal));
              }
            } catch (e) {
              console.warn('[TabletMenuCart] coin deduction failed:', e);
            }
          }

          toast.success(payWithCoins ? 'Pedido enviado! Moedas debitadas ✨' : 'Pedido enviado com sucesso!');
          setOrderSent((order as any).order_number ? `${(order as any).order_number}` : (order as any).id.slice(0, 8));
          return;
        } catch (err: any) {
          lastError = err;
          console.error(`[TabletMenuCart] Attempt ${attempt + 1} failed:`, err?.message || err);
          const msg = String(err?.message || '');
          const isTimeout = msg.startsWith('timeout:');
          const isAbort = err?.name === 'AbortError' || msg.toLowerCase().includes('abort');
          const isNetwork = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network');
          if ((isTimeout || isAbort || isNetwork) && attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 900 * (attempt + 1)));
            continue;
          }
          break;
        }
      }

      const errorMsg = lastError?.message || 'Erro desconhecido';
      const isTimeoutError = errorMsg.startsWith('timeout:') || errorMsg.toLowerCase().includes('abort');
      toast.error(isTimeoutError ? 'Conexão lenta. Tente novamente.' : `Erro ao enviar pedido: ${errorMsg}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cart items */}
        <div className="divide-y divide-border/15">
          {cart.map((item, idx) => {
            const optionsPrice = item.selectedOptions.reduce((s, o) => s + o.price, 0);
            const lineTotal = (item.product.price + optionsPrice) * item.quantity;
            return (
              <div key={idx} className="flex gap-3 p-4">
                {item.product.image_url ? (
                  <img src={item.product.image_url} alt={item.product.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                    <AppIcon name="Image" size={20} className="text-muted-foreground/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {item.quantity}x {item.product.name}
                      </p>
                      {item.selectedOptions.length > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {item.selectedOptions.map(o => o.name).join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic truncate">{item.notes}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-foreground shrink-0">{formatPrice(lineTotal)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center bg-secondary/60 rounded-lg">
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-foreground active:scale-90 transition-transform"
                      >
                        <AppIcon name="Minus" size={12} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-foreground active:scale-90 transition-transform"
                      >
                        <AppIcon name="Plus" size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemove(idx)}
                      className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <AppIcon name="Trash2" size={13} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="px-4 py-3 space-y-2 border-t border-border/15">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{cart.reduce((s, i) => s + i.quantity, 0)} item(ns) no pedido</span>
            <span className="text-xs text-muted-foreground">Subtotal: {formatPrice(cartTotal)}</span>
          </div>
        </div>

        {/* Auth banner */}
        <div className="px-4 pb-3">
          {!customerUser ? (
            <TabletQrLoginBanner
              unitId={unitId}
              bonusPoints={signupBonusPoints}
              onLoginComplete={(email, name, userId) => {
                // The auth state change listener in the parent will handle this
                // Force reload to pick up the new session
                window.location.reload();
              }}
              onSkip={() => {}}
            />
          ) : (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name="Person" size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || customerUser.email}
                </p>
              </div>
              <AppIcon name="Check" size={14} className="text-primary shrink-0" />
            </div>
          )}
        </div>

        {/* Comanda result (shown after scan) */}
        {comandaNumber && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
              <span className="text-sm font-black text-primary">#{comandaNumber}</span>
              <span className="flex-1 text-xs text-muted-foreground">Comanda escaneada</span>
              <button onClick={() => setComandaNumber(null)} className="p-1 rounded hover:bg-secondary/50">
                <AppIcon name="X" size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Coin option */}
        {customerUser && allProductsHaveCoinPrice && customerCoins !== null && (
          <div className="px-4 pb-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🪙</span>
                <div>
                  <p className="text-xs font-bold text-foreground">Moedas</p>
                  <p className="text-[10px] text-muted-foreground">Saldo: {customerCoins}</p>
                </div>
              </div>
              <button
                onClick={() => setPayWithCoins(!payWithCoins)}
                className={`w-10 h-6 rounded-full transition-all relative ${payWithCoins ? 'bg-amber-500' : 'bg-secondary'}`}
                disabled={!canPayWithCoins && !payWithCoins}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${payWithCoins ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Payment timing: Pagar agora vs Pagar depois */}
        {!payWithCoins && (
          <div className="px-4 pb-3 space-y-2">
            <h3 className="text-sm font-bold text-foreground">Quando pagar?</h3>
            <div className="space-y-1.5">
              {/* Pagar depois */}
              <button
                onClick={() => setPaymentTiming('later')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] text-left ${
                  paymentTiming === 'later' ? 'border-primary bg-primary/5' : 'border-border/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  paymentTiming === 'later' ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <AppIcon name="Banknote" size={18} className={paymentTiming === 'later' ? 'text-primary' : 'text-muted-foreground'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Pagar depois</p>
                  <p className="text-[11px] text-muted-foreground">Pague no caixa ao final</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  paymentTiming === 'later' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {paymentTiming === 'later' && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
              </button>

              {/* Pagar agora (PIX) */}
              <button
                onClick={() => setPaymentTiming('now')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] text-left ${
                  paymentTiming === 'now' ? 'border-primary bg-primary/5' : 'border-border/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  paymentTiming === 'now' ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <AppIcon name="QrCode" size={18} className={paymentTiming === 'now' ? 'text-primary' : 'text-muted-foreground'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Pagar agora (PIX)</p>
                  <p className="text-[11px] text-muted-foreground">QR Code instantâneo</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  paymentTiming === 'now' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {paymentTiming === 'now' && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Sticky Bottom Actions ─── */}
      <div className="shrink-0 border-t border-border/20 p-4 space-y-2 bg-card">
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl text-sm font-semibold"
          onClick={onClose}
        >
          Adicionar mais itens
        </Button>
        <Button
          className={`w-full h-12 rounded-xl text-sm font-bold ${payWithCoins ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
          onClick={handleSendClick}
          disabled={sending || (payWithCoins && !canPayWithCoins)}
        >
          {sending ? (
            <AppIcon name="Loader2" size={18} className="animate-spin mr-2" />
          ) : (
            <AppIcon name="Send" size={18} className="mr-2" />
          )}
          {payWithCoins
            ? `Pagar com ${coinTotal} moedas`
            : paymentTiming === 'now'
              ? `Pagar ${formatPrice(cartTotal)} via PIX`
              : 'Enviar pedido'}
        </Button>
      </div>

      {/* Comanda Scanner Modal */}
      {showScanner && (
        <ComandaScanner
          unitId={unitId}
          onScan={async (num) => {
            setComandaNumber(num);
            setShowScanner(false);
            toast.success(`Comanda #${num} escaneada!`);
            try {
              await handleSend(num);
            } catch (err: any) {
              toast.error('Erro ao enviar pedido: ' + (err?.message || 'tente novamente'));
            }
          }}
          onCancel={() => setShowScanner(false)}
        />
      )}

      {/* Online Payment Sheet (PIX QR Code) */}
      {showOnlinePayment && pendingOrderId && pendingOrderNumber && (
        <OnlinePaymentSheet
          orderId={pendingOrderId}
          orderNumber={pendingOrderNumber}
          total={cartTotal}
          unitId={unitId}
          billingType="PIX"
          onPaymentConfirmed={() => {
            setShowOnlinePayment(false);
            setOrderSent(pendingOrderNumber);
          }}
          onCancel={() => {
            setShowOnlinePayment(false);
            setPendingOrderId(null);
            setPendingOrderNumber(null);
          }}
        />
      )}

      {/* Manual PIX QR Code (unit's own PIX key) */}
      {showManualPix && pendingOrderNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowManualPix(false); setOrderSent(pendingOrderNumber); }}>
          <div
            className="bg-card rounded-3xl p-6 shadow-2xl border border-border/30 flex flex-col items-center gap-4 max-w-sm w-full mx-4 animate-in zoom-in-95 fade-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-foreground">Pagar via PIX</p>
            <p className="text-xs text-muted-foreground text-center">Pedido #{pendingOrderNumber}</p>
            {manualPixPayload ? (
              <>
                <div className="bg-white p-4 rounded-2xl">
                  <QRCodeSVG value={manualPixPayload} size={180} />
                </div>
                <p className="text-xl font-black text-primary">{formatPrice(cartTotal)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(unitPixKey || '');
                    toast.success('Chave Pix copiada!');
                  }}
                >
                  <AppIcon name="Copy" size={14} className="mr-1" /> Copiar chave
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Chave PIX não configurada. Pague no caixa.</p>
            )}
            <Button
              className="w-full"
              onClick={() => {
                setShowManualPix(false);
                setOrderSent(pendingOrderNumber);
              }}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
