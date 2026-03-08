import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { cn } from '@/lib/utils';
import { usePOS, type POSProduct, type CartItem, type PaymentLine, type PendingOrder } from '@/hooks/usePOS';
import { format } from 'date-fns';

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Dinheiro', icon: 'Banknote' },
  { key: 'debit', label: 'Débito', icon: 'CreditCard' },
  { key: 'credit', label: 'Crédito', icon: 'CreditCard' },
  { key: 'pix', label: 'Pix', icon: 'QrCode' },
  { key: 'meal_voucher', label: 'Vale Refeição', icon: 'Ticket' },
] as const;

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PDV() {
  const pos = usePOS();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [payMethod, setPayMethod] = useState('pix');
  const [payAmount, setPayAmount] = useState('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState('catalogo');

  const filteredProducts = useMemo(() => {
    let list = pos.products;
    if (selectedCategory) list = list.filter(p => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.codigo_pdv?.includes(q));
    }
    return list;
  }, [pos.products, selectedCategory, search]);

  const paymentTotal = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, pos.total - paymentTotal);
  const change = Math.max(0, paymentTotal - pos.total);

  const addPayment = () => {
    const amt = parseFloat(payAmount) || pos.total - paymentTotal;
    if (amt <= 0) return;
    setPayments(prev => [...prev, { method: payMethod, amount: amt, change_amount: 0 }]);
    setPayAmount('');
  };

  const removePayment = (idx: number) => {
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinalize = async () => {
    if (paymentTotal < pos.total) return;
    // Adjust last payment for change
    const adjusted = [...payments];
    if (change > 0 && adjusted.length > 0) {
      adjusted[adjusted.length - 1] = { ...adjusted[adjusted.length - 1], change_amount: change };
    }
    const saleId = await pos.finalizeSale(adjusted, activeOrderId || undefined);
    if (saleId) {
      setPaymentOpen(false);
      setPayments([]);
      setActiveOrderId(null);
    }
  };

  const handleLoadOrder = (order: PendingOrder) => {
    pos.loadOrderIntoCart(order);
    setActiveOrderId(order.id);
    setOrdersOpen(false);
    setMainTab('catalogo');
  };

  const statusLabel: Record<string, string> = {
    pending: 'Aguardando',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    new: 'Novo',
    accepted: 'Aceito',
  };

  const sourceIcon: Record<string, string> = {
    mesa: 'UtensilsCrossed',
    delivery: 'Truck',
    ifood: 'Truck',
    balcao: 'Store',
    whatsapp: 'MessageCircle',
  };

  return (
    <AppLayout title="PDV" showBack>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {/* Top bar */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <div className="relative flex-1">
            <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produto ou código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 relative" onClick={() => setOrdersOpen(true)}>
            <AppIcon name="ClipboardList" size={18} />
            {pos.pendingOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                {pos.pendingOrders.length}
              </span>
            )}
          </Button>
        </div>

        {/* Category chips */}
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            Todos
          </button>
          {pos.categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                cat === selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {pos.loadingProducts ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Carregando...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Nenhum produto encontrado</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => pos.addToCart(product)}
                  className="bg-card border border-border/50 rounded-xl p-3 text-left hover:border-primary/40 transition-all active:scale-[0.97] flex flex-col gap-1"
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-16 object-cover rounded-lg mb-1" />
                  ) : (
                    <div className="w-full h-16 bg-secondary/50 rounded-lg mb-1 flex items-center justify-center">
                      <AppIcon name="Package" size={20} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{product.name}</span>
                  {product.codigo_pdv && <span className="text-[10px] text-muted-foreground">#{product.codigo_pdv}</span>}
                  <span className="text-xs font-bold text-primary">{formatPrice(product.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart summary bar */}
        {pos.cart.length > 0 && (
          <div className="border-t border-border bg-card px-4 py-3 space-y-2">
            {/* Cart items */}
            <div className="max-h-32 overflow-y-auto space-y-1.5">
              {pos.cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => item.quantity <= 1 ? pos.removeFromCart(item.id) : pos.updateCartItem(item.id, { quantity: item.quantity - 1 })}
                      className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center"
                    >
                      <AppIcon name={item.quantity <= 1 ? 'Trash2' : 'Minus'} size={12} className={item.quantity <= 1 ? 'text-destructive' : ''} />
                    </button>
                    <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => pos.updateCartItem(item.id, { quantity: item.quantity + 1 })}
                      className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center"
                    >
                      <AppIcon name="Plus" size={12} />
                    </button>
                  </div>
                  <span className="flex-1 truncate text-xs">{item.product.name}</span>
                  <span className="text-xs font-medium shrink-0">{formatPrice(item.quantity * item.unit_price)}</span>
                </div>
              ))}
            </div>

            {/* Customer / discount row */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome do cliente"
                value={pos.customerName}
                onChange={e => pos.setCustomerName(e.target.value)}
                className="h-8 text-xs flex-1"
              />
              <Input
                placeholder="CPF"
                value={pos.customerDocument}
                onChange={e => pos.setCustomerDocument(e.target.value)}
                className="h-8 text-xs w-32"
              />
            </div>

            {/* Totals and actions */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{pos.cart.reduce((s, i) => s + i.quantity, 0)} itens</p>
                <p className="text-lg font-bold text-foreground">{formatPrice(pos.total)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={pos.clearCart}>
                  <AppIcon name="Trash2" size={14} className="mr-1" />
                  Limpar
                </Button>
                <Button size="sm" onClick={() => { setPayments([]); setPaymentOpen(true); }}>
                  <AppIcon name="Banknote" size={14} className="mr-1" />
                  Cobrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Sheet */}
      <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle>Pagamento — {formatPrice(pos.total)}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-4 mt-4 pb-4">
            {/* Payments added */}
            {payments.length > 0 && (
              <div className="space-y-1.5">
                {payments.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2">
                    <AppIcon name={PAYMENT_METHODS.find(m => m.key === p.method)?.icon || 'CreditCard'} size={16} className="text-muted-foreground" />
                    <span className="text-sm flex-1">{PAYMENT_METHODS.find(m => m.key === p.method)?.label || p.method}</span>
                    <span className="text-sm font-bold">{formatPrice(p.amount)}</span>
                    <button onClick={() => removePayment(i)} className="text-destructive">
                      <AppIcon name="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Remaining */}
            {remaining > 0 && (
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">Falta</p>
                <p className="text-2xl font-bold text-foreground">{formatPrice(remaining)}</p>
              </div>
            )}

            {change > 0 && (
              <div className="text-center py-2 bg-primary/10 rounded-xl">
                <p className="text-xs text-muted-foreground">Troco</p>
                <p className="text-2xl font-bold text-primary">{formatPrice(change)}</p>
              </div>
            )}

            {/* Method selector */}
            {remaining > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setPayMethod(m.key)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all',
                        payMethod === m.key ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground'
                      )}
                    >
                      <AppIcon name={m.icon} size={20} />
                      <span className="text-[10px] font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={`Valor (${formatPrice(remaining)})`}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="flex-1"
                    inputMode="decimal"
                  />
                  <Button onClick={addPayment} variant="outline">
                    <AppIcon name="Plus" size={14} className="mr-1" />
                    Adicionar
                  </Button>
                </div>

                {/* Quick amount buttons for cash */}
                {payMethod === 'cash' && (
                  <div className="flex gap-2 flex-wrap">
                    {[remaining, 10, 20, 50, 100, 200].filter(v => v >= remaining || v >= 10).slice(0, 5).map(v => (
                      <button
                        key={v}
                        onClick={() => { setPayAmount(String(v)); }}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium"
                      >
                        {formatPrice(v)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Finalize */}
            <Button
              className="w-full"
              size="lg"
              disabled={paymentTotal < pos.total || pos.savingSale}
              onClick={handleFinalize}
            >
              {pos.savingSale ? 'Finalizando...' : `Finalizar Venda — ${formatPrice(pos.total)}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Pending Orders Sheet */}
      <Sheet open={ordersOpen} onOpenChange={setOrdersOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle>Pedidos Pendentes ({pos.pendingOrders.length})</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-2 mt-4 pb-4">
            {pos.loadingOrders ? (
              <p className="text-center text-muted-foreground text-sm py-8">Carregando...</p>
            ) : pos.pendingOrders.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhum pedido pendente</p>
            ) : (
              pos.pendingOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => handleLoadOrder(order)}
                  className="w-full bg-card border border-border/50 rounded-xl p-3 text-left hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <AppIcon name={sourceIcon[order.source] || 'ShoppingBag'} size={14} className="text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {order.source === 'mesa' && order.table_number ? `Mesa ${order.table_number}` : order.source}
                      </span>
                      {order.customer_name && <span className="text-xs text-muted-foreground">• {order.customer_name}</span>}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {statusLabel[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), 'HH:mm')}</span>
                    <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                  </div>
                  {order.items.length > 0 && (
                    <div className="mt-1.5 text-[10px] text-muted-foreground space-y-0.5">
                      {order.items.slice(0, 3).map((item, i) => (
                        <p key={i}>{item.quantity}x {item.name}</p>
                      ))}
                      {order.items.length > 3 && <p>+{order.items.length - 3} itens</p>}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
