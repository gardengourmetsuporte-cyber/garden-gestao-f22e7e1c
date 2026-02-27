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
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
          <AppIcon name="Check" size={32} className="text-[hsl(var(--success))]" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Pedido enviado!</h2>
        <p className="text-muted-foreground text-sm">
          Pedido #{orderSent} • Mesa {tableNumber || 'Balcão'}
        </p>
        <Button variant="outline" onClick={() => { setOrderSent(null); onClear(); }}>
          Novo pedido
        </Button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center gap-3">
        <AppIcon name="ShoppingBag" size={48} className="text-muted-foreground/30" />
        <p className="text-muted-foreground">Seu pedido está vazio</p>
        <p className="text-xs text-muted-foreground/60">Adicione itens do cardápio</p>
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

      toast.success('Pedido enviado!');
      setOrderSent((order as any).id.slice(0, 8));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 pb-20 space-y-4">
      <h2 className="text-lg font-bold text-foreground">Seu Pedido</h2>

      <div className="space-y-2">
        {cart.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.product.name}</p>
              {item.selectedOptions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.selectedOptions.map(o => o.name).join(', ')}
                </p>
              )}
              {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => onUpdateQuantity(i, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                <AppIcon name="Minus" size={14} />
              </button>
              <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
              <button onClick={() => onUpdateQuantity(i, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                <AppIcon name="Plus" size={14} />
              </button>
            </div>
            <p className="text-sm font-bold text-foreground w-16 text-right">
              {formatPrice((item.product.price + item.selectedOptions.reduce((s, o) => s + o.price, 0)) * item.quantity)}
            </p>
            <button onClick={() => onRemove(i)} className="text-destructive">
              <AppIcon name="Trash2" size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between py-3 border-t border-border">
        <span className="font-semibold text-foreground">Total</span>
        <span className="text-xl font-bold text-primary">{formatPrice(cartTotal)}</span>
      </div>

      {!mesa && (
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Número da mesa</label>
          <Input
            placeholder="Ex: 5"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value)}
            className="text-center h-12 text-lg"
            type="number"
            inputMode="numeric"
          />
        </div>
      )}

      <Button className="w-full h-12 text-base" onClick={handleSend} disabled={sending}>
        {sending ? (
          <AppIcon name="Loader2" size={20} className="animate-spin mr-2" />
        ) : (
          <AppIcon name="Send" size={20} className="mr-2" />
        )}
        Enviar Pedido
      </Button>
    </div>
  );
}
