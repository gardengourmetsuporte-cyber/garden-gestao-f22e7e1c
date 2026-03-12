import { useState, useRef, useMemo, useCallback } from 'react';
import { useFabActions } from '@/contexts/FabActionContext';
import { useIfoodScanner } from '@/hooks/useIfoodScanner';
import { IfoodScannerSheet } from '@/components/pdv/IfoodScannerSheet';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePOS, type POSProduct, type PaymentLine, type PendingOrder } from '@/hooks/usePOS';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useCashRegister } from '@/hooks/useCashRegister';
import { PaymentSheet } from '@/components/pdv/PaymentSheet';
import { DeliveryPaymentSheet } from '@/components/pdv/DeliveryPaymentSheet';
import { SaleSourceSheet } from '@/components/pdv/SaleSourceSheet';
import { InvoiceSheet } from '@/components/pdv/InvoiceSheet';
import { SalesHistorySheet } from '@/components/pdv/SalesHistorySheet';
import { PendingOrdersSheet } from '@/components/pdv/PendingOrdersSheet';
import { CashRegisterOpenDialog } from '@/components/pdv/CashRegisterOpenDialog';
import { CashRegisterCloseSheet } from '@/components/pdv/CashRegisterCloseSheet';
import { PinDialog } from '@/components/checklists/PinDialog';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function PDV() {
  const pos = usePOS();
  const { activeUnitId } = useUnit();
  const cashRegister = useCashRegister();
  const ifoodScanner = useIfoodScanner();
  const ifoodCameraRef = useRef<HTMLInputElement>(null);
  const [ifoodScannerOpen, setIfoodScannerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [originalCartSize, setOriginalCartSize] = useState(0);
  const [cancelPinOpen, setCancelPinOpen] = useState(false);
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
  const [closeRegisterSheet, setCloseRegisterSheet] = useState(false);
  const [deliveryPaymentOpen, setDeliveryPaymentOpen] = useState(false);
  const [saleSourceOpen, setSaleSourceOpen] = useState(false);
  const [saleSourceAction, setSaleSourceAction] = useState<'send' | 'charge'>('send');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [invoiceData, setInvoiceData] = useState<{
    saleId: string;
    total: number;
    payments: { method: string; amount: number }[];
    items: { name: string; quantity: number; unit_price: number }[];
  } | null>(null);

  const handleIfoodFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIfoodScannerOpen(true);
    ifoodScanner.scanImage(file);
    e.target.value = '';
  };

  const filteredProducts = useMemo(() => {
    let list = pos.products;
    if (selectedCategory) list = list.filter(p => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.codigo_pdv?.includes(q));
    }
    return list;
  }, [pos.products, selectedCategory, search]);

  const handleFinalize = async (payments: PaymentLine[], options: { emitInvoice: boolean; notes: string; customerDocument?: string }) => {
    if (options.notes) pos.setSaleNotes(options.notes);
    if (options.customerDocument) pos.setCustomerDocument(options.customerDocument);
    // Capture cart before finalize clears it
    const cartSnapshot = pos.cart.map(i => ({
      name: i.product.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));
    const totalSnapshot = pos.total;
    const saleId = await pos.finalizeSale(payments, activeOrderId || undefined);
    if (saleId) {
      setPaymentOpen(false);
      setActiveOrderId(null);

      // Emit NFC-e if requested
      if (options.emitInvoice) {
        try {
          const { data, error } = await supabase.functions.invoke('fiscal-nfce', {
            body: { action: 'emit-nfce', sale_id: saleId, unit_id: activeUnitId },
          });
          // unit_id is validated server-side from user access
          if (error) {
            console.error('Fiscal error:', error);
            toast.error('Erro ao emitir NFC-e. Verifique no histórico.');
          } else if (data?.success) {
            toast.success('NFC-e emitida com sucesso!');
          } else if (data?.error) {
            toast.error(data.error);
          }
        } catch (err) {
          console.error('Fiscal invocation error:', err);
        }
      }

      // Open invoice sheet for customer linking
      setInvoiceData({
        saleId,
        total: totalSnapshot,
        payments: payments.map(p => ({ method: p.method, amount: p.amount })),
        items: cartSnapshot,
      });
    }
  };

  const handleChargeOrder = (order: PendingOrder) => {
    pos.loadOrderIntoCart(order);
    setActiveOrderId(order.id);
    setOriginalCartSize(order.items.length);
    setOrdersOpen(false);
    // Directly open payment flow
    setSaleSourceAction('charge');
    setSaleSourceOpen(true);
  };

  const handleLoadOrder = (order: PendingOrder) => {
    pos.loadOrderIntoCart(order);
    setActiveOrderId(order.id);
    setOriginalCartSize(order.items.length);
    setCartExpanded(true);
    setOrdersOpen(false);
  };

  const handleCancelClick = () => {
    if (!activeOrderId) {
      pos.clearCart();
      return;
    }
    setCancelPinOpen(true);
  };

  const handleCancelPinSubmit = async (pin: string): Promise<boolean> => {
    if (!activeOrderId) return false;
    const { authorized, userName } = await pos.validatePinWithPermission(pin, 'menu-admin.pdv');
    if (!authorized) {
      if (!userName) toast.error('PIN inválido');
      else toast.error(`${userName} não tem permissão para cancelar pedidos`);
      return false;
    }
    const success = await pos.cancelOrder(activeOrderId);
    if (success) {
      setActiveOrderId(null);
      setOriginalCartSize(0);
      setCancelPinOpen(false);
    }
    return success;
  };

  const hasNewItems = activeOrderId ? pos.cart.length > originalCartSize : false;
  const itemCount = pos.cart.reduce((s, i) => s + i.quantity, 0);

  // FAB quick actions
  useFabActions(
    cashRegister.isOpen
      ? [
          { icon: 'Camera', label: 'Scanner iFood', onClick: () => ifoodCameraRef.current?.click(), color: 'hsl(var(--primary))' },
          { icon: 'History', label: 'Vendas', onClick: () => setHistoryOpen(true), color: 'hsl(210 60% 50%)' },
          { icon: 'LockKeyhole', label: 'Fechar Caixa', onClick: () => setCloseRegisterSheet(true), color: 'hsl(var(--color-expense, 0 70% 50%))' },
        ]
      : [],
    [cashRegister.isOpen]
  );

  // Loading
  if (cashRegister.loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100dvh-env(safe-area-inset-top)-3.5rem)]">
          <AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  // Cash register closed
  if (!cashRegister.isOpen) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100dvh-env(safe-area-inset-top)-3.5rem)] px-6 text-center pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <AppIcon name="LockKeyhole" size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Caixa Fechado</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Para registrar vendas, abra o caixa informando o valor inicial em dinheiro.
          </p>
          <Button onClick={() => setOpenRegisterDialog(true)} size="lg" className="h-12 px-8">
            <AppIcon name="Unlock" size={18} className="mr-2" />
            Abrir Caixa
          </Button>
          <CashRegisterOpenDialog
            open={openRegisterDialog}
            onOpenChange={setOpenRegisterDialog}
            saving={cashRegister.saving}
            onOpen={async (value) => {
              const success = await cashRegister.openRegister(value);
              if (success) setOpenRegisterDialog(false);
              return success;
            }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-env(safe-area-inset-top)-3.5rem)] overflow-hidden pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0">

        {/* ─── Header ─── */}
        <div className="shrink-0 px-3 pt-2.5 pb-2 space-y-2">
          {/* Search + actions */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <AppIcon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produto ou código..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm rounded-xl bg-secondary/50 border-border/30"
              />
            </div>
            <button onClick={() => setHistoryOpen(true)} className="w-9 h-9 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center shrink-0">
              <AppIcon name="Receipt" size={16} className="text-muted-foreground" />
            </button>
            <button onClick={() => setOrdersOpen(true)} className="relative w-9 h-9 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center shrink-0">
              <AppIcon name="ClipboardList" size={16} className="text-muted-foreground" />
              {pos.pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                  {pos.pendingOrders.length}
                </span>
              )}
            </button>
            <button onClick={() => setCloseRegisterSheet(true)} className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
              <AppIcon name="LockKeyhole" size={15} className="text-destructive" />
            </button>
           <SyncStatusIndicator />
          </div>

          {/* Categories - Compact horizontal pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-3 px-3 pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 touch-manipulation',
                !selectedCategory
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground active:scale-95'
              )}
            >
              Todos
            </button>
            {pos.categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 whitespace-nowrap touch-manipulation',
                  cat === selectedCategory
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/40 text-muted-foreground active:scale-95'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Products ─── */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {pos.loadingProducts ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Nenhum produto encontrado</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => pos.addToCart(product)}
                  className="bg-card border border-border/30 rounded-2xl p-3 text-left hover:border-primary/30 transition-all active:scale-[0.97] flex flex-col gap-0.5"
                >
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full aspect-[4/3] object-cover rounded-xl mb-1" />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-secondary/40 rounded-xl mb-1 flex items-center justify-center">
                      <AppIcon name="Package" size={20} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{product.name}</span>
                  {product.codigo_pdv && <span className="text-[10px] text-muted-foreground">#{product.codigo_pdv}</span>}
                  <span className="text-xs font-bold text-primary mt-auto">{formatCurrency(product.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Cart ─── */}
        {pos.cart.length > 0 && (
          <div className="shrink-0 border-t border-border/50 bg-card/95 backdrop-blur-sm">
            {/* Collapsed */}
            {!cartExpanded ? (
              <button
                onClick={() => setCartExpanded(true)}
                className="w-full flex items-center justify-between px-4 py-3 active:bg-secondary/30"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">{itemCount}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {pos.cart.map(i => i.product.name).join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{formatCurrency(pos.total)}</span>
                  <AppIcon name="ChevronUp" size={16} className="text-muted-foreground" />
                </div>
              </button>
            ) : (
              /* Expanded */
              <div className="px-3 pt-1 pb-3 space-y-2.5">
                {/* Collapse handle */}
                <button onClick={() => setCartExpanded(false)} className="w-full flex justify-center py-1">
                  <div className="w-8 h-1 rounded-full bg-border" />
                </button>

                {/* Items */}
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {pos.cart.map(item => (
                    <div key={item.id} className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => item.quantity <= 1 ? pos.removeFromCart(item.id) : pos.updateCartItem(item.id, { quantity: item.quantity - 1 })}
                            className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center active:scale-95"
                          >
                            <AppIcon name={item.quantity <= 1 ? 'Trash2' : 'Minus'} size={12} className={item.quantity <= 1 ? 'text-destructive' : 'text-muted-foreground'} />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => pos.updateCartItem(item.id, { quantity: item.quantity + 1 })}
                            className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center active:scale-95"
                          >
                            <AppIcon name="Plus" size={12} className="text-muted-foreground" />
                          </button>
                        </div>
                        <button
                          className="flex-1 truncate text-xs text-foreground text-left"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditingNotes(item.notes || '');
                          }}
                        >
                          {item.product.name}
                        </button>
                        <span className="text-xs font-semibold text-foreground shrink-0">{formatCurrency(item.quantity * item.unit_price)}</span>
                      </div>
                      {/* Notes display */}
                      {item.notes && (
                        <button
                          onClick={() => { setEditingItemId(item.id); setEditingNotes(item.notes); }}
                          className="ml-[72px] text-[10px] text-muted-foreground italic truncate block text-left"
                        >
                          📝 {item.notes}
                        </button>
                      )}
                      {/* Inline notes editor */}
                      {editingItemId === item.id && (
                        <div className="ml-[72px] flex gap-1 items-center mt-0.5">
                          <Input
                            autoFocus
                            placeholder="Ex: sem cebola, bem passado..."
                            value={editingNotes}
                            onChange={e => setEditingNotes(e.target.value)}
                            className="h-7 text-[11px] flex-1"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                pos.updateCartItem(item.id, { notes: editingNotes.trim() });
                                setEditingItemId(null);
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              pos.updateCartItem(item.id, { notes: editingNotes.trim() });
                              setEditingItemId(null);
                            }}
                            className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0"
                          >
                            <AppIcon name="Check" size={12} className="text-primary" />
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0"
                          >
                            <AppIcon name="X" size={12} className="text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer: total + actions */}
                <div className="space-y-2 pt-0.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
                      <p className="text-xl font-black text-foreground leading-tight">{formatCurrency(pos.total)}</p>
                    </div>
                    {/* Finalize / Cobrar */}
                    <button
                      onClick={() => { setSaleSourceAction('charge'); setSaleSourceOpen(true); }}
                      className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5 active:scale-95 shadow-sm shrink-0"
                    >
                      <AppIcon name="Banknote" size={16} />
                      Cobrar
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Close loaded order */}
                    {activeOrderId && (
                      <button
                        onClick={() => { pos.clearCart(); setActiveOrderId(null); }}
                        className="h-8 px-3 rounded-xl bg-secondary/60 text-muted-foreground text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                      >
                        <AppIcon name="X" size={12} />
                        Fechar
                      </button>
                    )}
                    {/* Cancel existing order */}
                    {activeOrderId && (
                      <button onClick={handleCancelClick} className="h-8 px-3 rounded-xl bg-destructive/10 text-destructive text-[11px] font-semibold flex items-center gap-1 active:scale-95">
                        <AppIcon name="Ban" size={12} />
                        Cancelar
                      </button>
                    )}
                    {/* Clear cart */}
                    {!activeOrderId && (
                      <button onClick={() => pos.clearCart()} className="h-8 px-3 rounded-xl bg-secondary/60 text-muted-foreground text-[11px] font-semibold flex items-center gap-1 active:scale-95">
                        <AppIcon name="X" size={12} />
                        Limpar
                      </button>
                    )}
                    {/* Send order */}
                    <button
                      onClick={() => { setSaleSourceAction('send'); setSaleSourceOpen(true); }}
                      disabled={pos.savingSale || pos.cart.length === 0 || (!!activeOrderId && pos.cart.length <= originalCartSize)}
                      className="h-8 px-3 rounded-xl bg-secondary/60 border border-border/30 text-foreground text-[11px] font-semibold flex items-center gap-1 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ml-auto"
                    >
                      <AppIcon name="Send" size={12} />
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheets & Dialogs */}
      <PaymentSheet
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={pos.total}
        subtotal={pos.subtotal}
        discount={pos.discount}
        itemCount={itemCount}
        savingSale={pos.savingSale}
        onFinalize={handleFinalize}
        saleSource={pos.saleSource}
        customerName={pos.customerName}
        tableNumber={pos.tableNumber}
        initialCustomerDocument={pos.customerDocument}
      />

      <PendingOrdersSheet
        open={ordersOpen}
        onOpenChange={setOrdersOpen}
        orders={pos.pendingOrders}
        loading={pos.loadingOrders}
        onLoadOrder={handleLoadOrder}
        onChargeOrder={handleChargeOrder}
      />

      <SalesHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />

      <DeliveryPaymentSheet
        open={deliveryPaymentOpen}
        onOpenChange={setDeliveryPaymentOpen}
        total={pos.total}
        customerName={pos.customerName}
        sending={pos.savingSale}
        onConfirm={async (method, change) => {
          const orderId = await pos.sendOrder({ method, change });
          if (orderId) setDeliveryPaymentOpen(false);
        }}
      />

      {invoiceData && (
        <InvoiceSheet
          open={!!invoiceData}
          onOpenChange={(open) => { if (!open) setInvoiceData(null); }}
          saleId={invoiceData.saleId}
          total={invoiceData.total}
          customerName={pos.customerName}
          payments={invoiceData.payments}
          items={invoiceData.items}
        />
      )}

      <PinDialog
        open={cancelPinOpen}
        onOpenChange={setCancelPinOpen}
        title="Cancelar pedido"
        subtitle="Digite o PIN de um admin autorizado"
        onSubmit={handleCancelPinSubmit}
      />

      {cashRegister.currentRegister && (
        <CashRegisterCloseSheet
          open={closeRegisterSheet}
          onOpenChange={setCloseRegisterSheet}
          register={cashRegister.currentRegister}
          saving={cashRegister.saving}
          onClose={cashRegister.closeRegister}
          fetchSummary={cashRegister.fetchSalesSummary}
        />
      )}

      <SaleSourceSheet
        open={saleSourceOpen}
        onOpenChange={setSaleSourceOpen}
        initialSource={pos.saleSource}
        initialCustomerName={pos.customerName}
        initialTableNumber={pos.tableNumber}
        onConfirm={(data) => {
          // Apply selections to POS state
          pos.setSaleSource(data.source);
          pos.setCustomerName(data.customerName);
          pos.setCustomerDocument(data.customerDocument);
          pos.setTableNumber(data.tableNumber);
          pos.setDeliveryPhone(data.deliveryPhone);
          pos.setDeliveryAddress(data.deliveryAddress);
          setSaleSourceOpen(false);

          if (saleSourceAction === 'charge') {
            setPaymentOpen(true);
          } else {
            // Send order
            if (data.source === 'delivery') {
              if (!data.customerName.trim() || !data.deliveryPhone.trim() || !data.deliveryAddress.trim()) {
                pos.sendOrder();
              } else {
                setDeliveryPaymentOpen(true);
              }
            } else {
              pos.sendOrder();
            }
          }
        }}
      />

      {/* iFood Scanner */}
      <input ref={ifoodCameraRef} type="file" accept="image/*" className="hidden" onChange={handleIfoodFileChange} />
      <IfoodScannerSheet
        open={ifoodScannerOpen}
        onOpenChange={(v) => { if (!v) { ifoodScanner.reset(); } setIfoodScannerOpen(v); }}
        state={ifoodScanner.state}
        result={ifoodScanner.result}
        error={ifoodScanner.error}
        onScan={(file) => ifoodScanner.scanImage(file)}
        onConfirm={async (data) => {
          const ok = await ifoodScanner.confirmOrder(data);
          if (ok) setTimeout(() => { setIfoodScannerOpen(false); ifoodScanner.reset(); }, 2000);
        }}
        onReset={ifoodScanner.reset}
        onUpdateResult={(data) => ifoodScanner.setResult(data)}
      />
    </AppLayout>
  );
}
