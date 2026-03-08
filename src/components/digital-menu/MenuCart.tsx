import { useState, useEffect } from 'react';
import { CartItem } from '@/hooks/useDigitalMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency as formatPrice } from '@/lib/format';
import type { User } from '@supabase/supabase-js';

interface Props {
  cart: CartItem[];
  cartTotal: number;
  unitId: string;
  customerUser?: User | null;
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}

export function MenuCart({ cart, cartTotal, unitId, customerUser, onUpdateQuantity, onRemove, onClear }: Props) {
  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState<string | null>(null);

  // Delivery fields — pre-fill from logged-in user + saved customer data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);

  useEffect(() => {
    if (customerUser) {
      const name = customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || '';
      const phone = customerUser.phone || '';
      setCustomerName(prev => prev || name);
      setCustomerPhone(prev => prev || phone);

      // Load saved address from customer record
      const email = customerUser.email;
      if (email) {
        supabase
          .from('customers')
          .select('phone, notes')
          .eq('unit_id', unitId)
          .eq('email', email)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              if (data.phone) setCustomerPhone(prev => prev || formatPhone(data.phone!));
              // Use notes field to store saved address
              if (data.notes) setCustomerAddress(prev => prev || data.notes!);
            }
          });
      }
    }
  }, [customerUser, unitId]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

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
            {customerName || 'Delivery'} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 p-4 w-full max-w-xs mt-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center shrink-0">
              <AppIcon name="Schedule" size={20} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Aguardando confirmação</p>
              <p className="text-xs text-muted-foreground">O estabelecimento confirmará seu pedido em breve</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="lg" className="rounded-xl mt-2" onClick={() => { setOrderSent(null); onClear(); }}>
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

  const handleSend = async () => {
    if (!customerName.trim()) { toast.error('Informe seu nome'); return; }
    if (!customerPhone.trim()) { toast.error('Informe seu telefone'); return; }
    if (!customerAddress.trim()) { toast.error('Informe seu endereço de entrega'); return; }

    setSending(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('tablet_orders')
        .insert({
          unit_id: unitId,
          table_number: 0,
          status: 'awaiting_confirmation',
          total: cartTotal,
          source: 'delivery',
          customer_name: customerName.trim(),
          customer_phone: customerPhone.replace(/\D/g, ''),
          customer_address: customerAddress.trim(),
        })
        .select('id')
        .single();

      if (orderError || !order) throw new Error(orderError?.message || 'Erro');

      const items = cart.map(c => ({
        order_id: (order as any).id,
        product_id: c.product.id,
        quantity: c.quantity,
        notes: [c.notes, c.selectedOptions.map(o => o.name).join(', ')].filter(Boolean).join(' | ') || null,
        unit_price: c.product.price + c.selectedOptions.reduce((s, o) => s + o.price, 0),
      }));

      const { error: itemsError } = await supabase.from('tablet_order_items').insert(items);
      if (itemsError) throw new Error(itemsError.message);

      // Save address to customer record for next time
      if (saveAddress && customerUser?.email && customerAddress.trim()) {
        await supabase
          .from('customers')
          .update({
            notes: customerAddress.trim(),
            phone: customerPhone.replace(/\D/g, ''),
          })
          .eq('unit_id', unitId)
          .eq('email', customerUser.email);
      }

      toast.success('Pedido enviado com sucesso!');
      setOrderSent((order as any).id.slice(0, 8));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 pb-28 space-y-4">
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
          <span className="text-xl font-bold text-primary">{formatPrice(cartTotal)}</span>
        </div>
      </div>

      {/* Logged-in user indicator */}
      {customerUser && (
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

      {/* Delivery fields */}
      <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <AppIcon name="Bike" size={16} className="text-primary" />
          Dados para entrega
        </h3>
        <Input
          placeholder="Seu nome *"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          className="h-12 rounded-xl"
        />
        <Input
          placeholder="Telefone *"
          value={customerPhone}
          onChange={e => setCustomerPhone(formatPhone(e.target.value))}
          className="h-12 rounded-xl"
          inputMode="tel"
        />
        <Textarea
          placeholder="Endereço completo *"
          value={customerAddress}
          onChange={e => setCustomerAddress(e.target.value)}
          className="rounded-xl resize-none"
          rows={2}
        />
        {customerUser && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={e => setSaveAddress(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-xs text-muted-foreground">Salvar endereço para próximos pedidos</span>
          </label>
        )}
      </div>

      <Button className="w-full h-14 text-base font-bold rounded-xl" onClick={handleSend} disabled={sending}>
        {sending ? (
          <AppIcon name="Loader2" size={20} className="animate-spin mr-2" />
        ) : (
          <AppIcon name="Send" size={20} className="mr-2" />
        )}
        Finalizar Pedido • {formatPrice(cartTotal)}
      </Button>
    </div>
  );
}

// Extracted cart items list (shared visual)
export function CartItemsList({ cart, onUpdateQuantity }: { cart: CartItem[]; onUpdateQuantity: (i: number, qty: number) => void }) {
  return (
    <div className="space-y-2">
      {cart.map((item, i) => {
        const unitPrice = item.product.price + item.selectedOptions.reduce((s, o) => s + o.price, 0);
        return (
          <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border/30">
            {item.product.image_url ? (
              <img src={item.product.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                <AppIcon name="Package" size={18} className="text-muted-foreground/30" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
              {item.selectedOptions.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {item.selectedOptions.map(o => o.name).join(', ')}
                </p>
              )}
              {item.notes && <p className="text-[11px] text-muted-foreground/70 italic truncate">{item.notes}</p>}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(i, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <AppIcon name={item.quantity === 1 ? 'Trash2' : 'Minus'} size={13} className={item.quantity === 1 ? 'text-destructive' : ''} />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(i, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <AppIcon name="Plus" size={13} />
                  </button>
                </div>
                <p className="text-sm font-bold text-foreground">{formatPrice(unitPrice * item.quantity)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
