import { useState, useEffect } from 'react';
import { CartItem } from '@/hooks/useDigitalMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { CartItemsList } from '@/components/digital-menu/MenuCart';
import { CustomerAuthBanner } from '@/components/digital-menu/CustomerAuthBanner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency as formatPrice } from '@/lib/format';
import type { User } from '@supabase/supabase-js';

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
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout'>('dine-in');
  const [payWithCoins, setPayWithCoins] = useState(false);
  const [customerCoins, setCustomerCoins] = useState<number | null>(null);

  // Check customer coin balance
  const coinTotal = cart.reduce((sum, item) => {
    const cp = item.product.coin_price;
    if (cp == null || cp <= 0) return sum + 999999; // product not available for coins
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
            Mesa {tableNumber} • {customerName} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 p-4 w-full max-w-xs mt-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center shrink-0">
              <AppIcon name="Schedule" size={20} className="text-amber-500" />
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
      // Postgrest builders are PromiseLike (thenable), not real Promises.
      const wrapped = Promise.resolve(promiseLike as any) as Promise<T>;
      return await Promise.race([wrapped, timeoutPromise]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const handleSend = async () => {
    if (!tableNumber.trim()) {
      toast.error('Informe o número da mesa');
      return;
    }
    // Use logged-in user name or manual input
    const finalName = customerUser
      ? (customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || customerUser.email || 'Cliente')
      : customerName.trim();
    if (!finalName) {
      toast.error('Informe seu nome');
      return;
    }

    setSending(true);

    const requestTimeoutMs = 12000;
    const maxRetries = 3;

    // Resolve live auto-confirm from unit store_info (avoid stale cache on long-open tablets)
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
                table_number: parseInt(tableNumber) || 0,
                status: shouldAutoConfirm ? 'confirmed' : 'awaiting_confirmation',
                total: payWithCoins ? 0 : cartTotal,
                source: orderType === 'takeout' ? 'mesa_levar' : 'mesa',
                customer_name: finalName,
                customer_email: customerUser?.email || null,
                notes: orderNotes,
              } as any)
              .select('id')
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
                 // Log redemption event
                 await supabase.from('loyalty_events').insert({
                   customer_id: cust.id,
                   unit_id: unitId,
                   type: 'redeemed',
                   points: -coinTotal,
                   description: 'Pedido #' + (order as any).id.slice(0, 8) + ' pago com moedas',
                 });
                 setCustomerCoins(Math.max(0, (cust.loyalty_points ?? 0) - coinTotal));
               }
             } catch (e) {
               console.warn('[TabletMenuCart] coin deduction failed:', e);
             }
           }

           toast.success(payWithCoins ? 'Pedido enviado! Moedas debitadas ✨' : 'Pedido enviado com sucesso!');
           setOrderSent((order as any).id.slice(0, 8));
           return; // Success — exit
        } catch (err: any) {
          lastError = err;

          const msg = String(err?.message || '');
          const isTimeout = msg.startsWith('timeout:');
          const isAbort = err?.name === 'AbortError' || msg.toLowerCase().includes('abort');
          const isNetwork = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network');

          if ((isTimeout || isAbort || isNetwork) && attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 900 * (attempt + 1)));
            continue; // Retry
          }

          break; // Non-retryable error
        }
      }

      toast.error('Conexão lenta. Tente novamente.');
      console.error('[TabletMenuCart] Order send failed:', lastError);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Seu Pedido
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({cart.reduce((s, i) => s + i.quantity, 0)} itens)
          </span>
        </h2>
        <button onClick={onClear} className="text-xs text-destructive font-medium">Limpar</button>
      </div>

      <CartItemsList cart={cart} onUpdateQuantity={onUpdateQuantity} />

      {/* Summary */}
      <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-sm font-semibold text-foreground">{formatPrice(cartTotal)}</span>
        </div>
        <div className="border-t border-border/30" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">Total</span>
          {payWithCoins ? (
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🪙</span>
              <span className="text-xl font-bold text-amber-500 tabular-nums">{coinTotal} moedas</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-primary">{formatPrice(cartTotal)}</span>
          )}
        </div>
      </div>

      {/* Coin payment option */}
      {customerUser && allProductsHaveCoinPrice && customerCoins !== null && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <span className="text-lg">🪙</span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Pagar com Moedas</p>
                <p className="text-[11px] text-muted-foreground">Saldo: <span className="font-bold text-amber-600">{customerCoins}</span> moedas</p>
              </div>
            </div>
            <button
              onClick={() => setPayWithCoins(!payWithCoins)}
              className={`w-12 h-7 rounded-full transition-all relative ${payWithCoins ? 'bg-amber-500' : 'bg-secondary'}`}
              disabled={!canPayWithCoins && !payWithCoins}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${payWithCoins ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
          {!canPayWithCoins && (
            <p className="text-[11px] text-destructive font-medium">
              {customerCoins < coinTotal
                ? `Saldo insuficiente (faltam ${coinTotal - customerCoins} moedas)`
                : 'Alguns produtos não possuem preço em moedas'}
            </p>
          )}
        </div>
      )}

      {/* Auth banner or logged-in indicator */}
      {!customerUser ? (
        <CustomerAuthBanner
          bonusPoints={signupBonusPoints}
          onEmailLogin={onLoginClick}
          onSkip={() => {}}
        />
      ) : (
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <AppIcon name="Person" size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || customerUser.email}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{customerUser.email}</p>
          </div>
          <AppIcon name="Check" size={16} className="text-primary shrink-0" />
        </div>
      )}

      {/* Order type selector */}
      <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <AppIcon name="UtensilsCrossed" size={16} className="text-primary" />
          Tipo do pedido
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setOrderType('dine-in')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border ${
              orderType === 'dine-in'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/50 text-muted-foreground border-border/30'
            }`}
          >
            <AppIcon name="UtensilsCrossed" size={18} />
            Comer aqui
          </button>
          <button
            onClick={() => setOrderType('takeout')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border ${
              orderType === 'takeout'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/50 text-muted-foreground border-border/30'
            }`}
          >
            <AppIcon name="ShoppingBag" size={18} />
            Levar
          </button>
        </div>
      </div>

      {/* Mesa + Name fields */}
      <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <AppIcon name="TableRestaurant" size={16} className="text-primary" />
          Identificação
        </h3>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Número da mesa</label>
          <Input
            placeholder="Ex: 5"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            className="text-center h-14 text-xl font-bold rounded-xl"
            type="number"
            inputMode="numeric"
          />
        </div>
        {!customerUser && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Seu nome</label>
            <Input
              placeholder="Como deseja ser chamado?"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
        )}
      </div>

      <Button
        className={`w-full h-14 text-base font-bold rounded-xl ${payWithCoins ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
        onClick={handleSend}
        disabled={sending || (payWithCoins && !canPayWithCoins)}
      >
        {sending ? (
          <AppIcon name="Loader2" size={20} className="animate-spin mr-2" />
        ) : payWithCoins ? (
          <span className="mr-2 text-lg">🪙</span>
        ) : (
          <AppIcon name="Send" size={20} className="mr-2" />
        )}
        {payWithCoins ? `Pagar com ${coinTotal} moedas` : `Enviar Pedido • ${formatPrice(cartTotal)}`}
      </Button>
    </div>
  );
}
