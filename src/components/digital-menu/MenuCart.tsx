import { useState } from 'react';
import { CartItem } from '@/hooks/useDigitalMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  cart: CartItem[];
  cartTotal: number;
  unitId: string;
  mesa: string | null;
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function MenuCart({ cart, cartTotal, unitId, mesa, onUpdateQuantity, onRemove, onClear }: Props) {
  const [tableNumber, setTableNumber] = useState(mesa || '');
  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState<string | null>(null);

  if (orderSent) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--neon-green)/0.12)] flex items-center justify-center">
          <AppIcon name="CheckCircle2" size={40} className="text-[hsl(var(--neon-green))]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pedido enviado!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Pedido <span className="font-mono font-bold text-foreground">#{orderSent}</span>
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Mesa {tableNumber || 'Balcão'} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
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
    if (!tableNumber.trim()) {
      toast.error('Informe o número da mesa');
      return;
    }
    setSending(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('tablet_orders')
        .insert({
          unit_id: unitId,
          table_number: parseInt(tableNumber) || 0,
          status: 'awaiting_confirmation',
          total: cartTotal,
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
        <button onClick={onClear} className="text-xs text-destructive font-medium">
          Limpar
        </button>
      </div>

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

      {/* Table input */}
      {!mesa && (
        <div className="rounded-2xl bg-card border border-border/30 p-4">
          <label className="text-sm font-semibold text-foreground mb-2 block">Número da mesa</label>
          <Input
            placeholder="Ex: 5"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            className="text-center h-14 text-xl font-bold rounded-xl"
            type="number"
            inputMode="numeric"
          />
        </div>
      )}

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
