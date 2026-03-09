import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePOS, type POSProduct, type CartItem, type PaymentLine, type PendingOrder } from '@/hooks/usePOS';
import { PaymentSheet } from '@/components/pdv/PaymentSheet';
import { SalesHistorySheet } from '@/components/pdv/SalesHistorySheet';
import { PendingOrdersSheet } from '@/components/pdv/PendingOrdersSheet';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';

export default function PDV() {
  const pos = usePOS();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    let list = pos.products;
    if (selectedCategory) list = list.filter(p => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.codigo_pdv?.includes(q));
    }
    return list;
  }, [pos.products, selectedCategory, search]);

  const handleFinalize = async (payments: PaymentLine[], options: { emitInvoice: boolean; notes: string }) => {
    if (options.notes) pos.setSaleNotes(options.notes);
    const saleId = await pos.finalizeSale(payments, activeOrderId || undefined);
    if (saleId) {
      setPaymentOpen(false);
      setActiveOrderId(null);
    }
  };

  const handleLoadOrder = (order: PendingOrder) => {
    pos.loadOrderIntoCart(order);
    setActiveOrderId(order.id);
    setOrdersOpen(false);
  };


  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0">
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
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setHistoryOpen(true)}>
            <AppIcon name="Receipt" size={18} />
          </Button>
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
                  <span className="text-xs font-bold text-primary">{formatCurrency(product.price)}</span>
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
                  <span className="text-xs font-medium shrink-0">{formatCurrency(item.quantity * item.unit_price)}</span>
                </div>
              ))}
            </div>

            {/* Source selector */}
            <div className="flex gap-1.5">
              {([
                { key: 'balcao', label: 'Balcão', icon: 'Store' },
                { key: 'mesa', label: 'Mesa', icon: 'UtensilsCrossed' },
                { key: 'delivery', label: 'Delivery', icon: 'Bike' },
              ] as const).map(s => (
                <button
                  key={s.key}
                  onClick={() => pos.setSaleSource(s.key)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    pos.saleSource === s.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  <AppIcon name={s.icon} size={12} />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Conditional fields based on source */}
            {pos.saleSource === 'balcao' && (
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
            )}
            {pos.saleSource === 'mesa' && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Nº da mesa"
                  value={pos.tableNumber ?? ''}
                  onChange={e => pos.setTableNumber(e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-xs w-24"
                  inputMode="numeric"
                />
                <Input
                  placeholder="Nome do cliente (opcional)"
                  value={pos.customerName}
                  onChange={e => pos.setCustomerName(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            )}
            {pos.saleSource === 'delivery' && (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do cliente"
                    value={pos.customerName}
                    onChange={e => pos.setCustomerName(e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    placeholder="Telefone"
                    value={pos.deliveryPhone}
                    onChange={e => pos.setDeliveryPhone(e.target.value)}
                    className="h-8 text-xs w-32"
                  />
                </div>
                <Input
                  placeholder="Endereço de entrega"
                  value={pos.deliveryAddress}
                  onChange={e => pos.setDeliveryAddress(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}

            {/* Totals and actions */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{pos.cart.reduce((s, i) => s + i.quantity, 0)} itens</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(pos.total)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={pos.clearCart}>
                  <AppIcon name="Trash2" size={14} className="mr-1" />
                  Limpar
                </Button>
                {pos.saleSource === 'balcao' ? (
                  <Button size="sm" onClick={() => setPaymentOpen(true)}>
                    <AppIcon name="Banknote" size={14} className="mr-1" />
                    Cobrar
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => pos.sendOrder()} disabled={pos.savingSale}>
                    <AppIcon name="Send" size={14} className="mr-1" />
                    Enviar Pedido
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Sheet */}
      <PaymentSheet
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={pos.total}
        subtotal={pos.subtotal}
        discount={pos.discount}
        itemCount={pos.cart.reduce((s, i) => s + i.quantity, 0)}
        savingSale={pos.savingSale}
        onFinalize={handleFinalize}
        saleSource={pos.saleSource}
        customerName={pos.customerName}
        tableNumber={pos.tableNumber}
      />

      {/* Pending Orders Sheet */}
      <PendingOrdersSheet
        open={ordersOpen}
        onOpenChange={setOrdersOpen}
        orders={pos.pendingOrders}
        loading={pos.loadingOrders}
        onLoadOrder={handleLoadOrder}
      />

      {/* Sales History Sheet */}
      <SalesHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
    </AppLayout>
  );
}
