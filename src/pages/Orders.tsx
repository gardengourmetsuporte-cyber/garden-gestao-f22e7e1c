import { useState, useMemo } from 'react';
import { ShoppingCart, Package, Plus, Trash2, MessageCircle, Clock, PackageCheck, FileText, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InventoryItem, Supplier, Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInventoryDB } from '@/hooks/useInventoryDB';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useOrders } from '@/hooks/useOrders';
import { useSupplierInvoices } from '@/hooks/useSupplierInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiveOrderSheet } from '@/components/inventory/ReceiveOrderSheet';
import { RegisterInvoiceAfterReceive } from '@/components/inventory/RegisterInvoiceAfterReceive';
import { SmartReceivingSheet } from '@/components/inventory/SmartReceivingSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { isAdmin } = useAuth();
  const { items, registerMovement } = useInventoryDB();
  const { suppliers } = useSuppliers();
  const { orders, createOrder, updateOrderStatus, deleteOrder, refetch: refetchOrders } = useOrders();
  const { addInvoice } = useSupplierInvoices();

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiveOrderOpen, setReceiveOrderOpen] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<Order | null>(null);
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);
  const [orderForInvoice, setOrderForInvoice] = useState<Order | null>(null);
  const [smartReceivingOpen, setSmartReceivingOpen] = useState(false);
  const [smartReceivingOrder, setSmartReceivingOrder] = useState<Order | null>(null);
  const [orderTab, setOrderTab] = useState<'to-order' | 'orders'>('to-order');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});

  const lowStockItems = useMemo(() => items.filter(item => item.current_stock <= item.min_stock), [items]);

  const itemsBySupplier = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    lowStockItems.forEach(item => {
      if (item.supplier_id) {
        if (!grouped[item.supplier_id]) grouped[item.supplier_id] = [];
        grouped[item.supplier_id].push(item);
      }
    });
    const noSupplier = lowStockItems.filter(item => !item.supplier_id);
    if (noSupplier.length > 0) grouped['no-supplier'] = noSupplier;
    return grouped;
  }, [lowStockItems]);

  const handleOpenOrder = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    const supplierItems = itemsBySupplier[supplier.id] || [];
    const initialQuantities: Record<string, number> = {};
    supplierItems.forEach(item => {
      initialQuantities[item.id] = Math.max(0, item.min_stock - item.current_stock);
    });
    setQuantities(initialQuantities);
    setSheetOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedSupplier) return;
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([item_id, quantity]) => ({ item_id, quantity }));
    if (orderItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await createOrder(selectedSupplier.id, orderItems);
      setSheetOpen(false);
      setSelectedSupplier(null);
      setQuantities({});
    } catch {
      toast.error('Erro ao criar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55') && cleaned.length >= 12) return cleaned;
    return `55${cleaned}`;
  };

  const hasValidWhatsApp = (phone: string | null): boolean => {
    if (!phone) return false;
    return phone.replace(/\D/g, '').length >= 10;
  };

  const handleSendWhatsApp = (order: Order) => {
    if (!order.supplier?.phone || !hasValidWhatsApp(order.supplier.phone)) {
      toast.error('Fornecedor sem WhatsApp cadastrado');
      return;
    }
    const itemsList = order.order_items?.map(oi => {
      const unit = oi.item?.unit_type === 'kg' ? 'kg' : oi.item?.unit_type === 'litro' ? 'L' : 'un';
      return `• ${oi.item?.name}: ${oi.quantity} ${unit}`;
    }).join('\n');
    const message = `*Pedido de Compra*\n\nOlá! Gostaria de fazer o seguinte pedido:\n\n${itemsList}\n\n${order.notes ? `Obs: ${order.notes}` : ''}`;
    const phone = formatPhoneForWhatsApp(order.supplier.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    updateOrderStatus(order.id, 'sent');
  };

  const handleReceiveOrder = async (orderId: string, receivedItems: { itemId: string; quantity: number }[]) => {
    try {
      for (const item of receivedItems) {
        await registerMovement(item.itemId, 'entrada', item.quantity, 'Recebimento de pedido');
      }
      await updateOrderStatus(orderId, 'received');
    } catch {
      toast.error('Erro ao receber pedido');
      throw new Error();
    }
  };

  const handleRegisterInvoice = async (data: {
    orderId: string; supplierId: string; amount: number; dueDate: string; description: string; invoiceNumber?: string;
  }): Promise<string> => {
    const invoiceId = await addInvoice({
      supplier_id: data.supplierId, amount: data.amount, due_date: data.dueDate,
      description: data.description, invoice_number: data.invoiceNumber,
    });
    if (invoiceId) {
      await supabase.from('orders').update({ supplier_invoice_id: invoiceId }).eq('id', data.orderId);
      await refetchOrders();
    }
    return invoiceId || '';
  };

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'draft': return { label: 'Rascunho', bg: 'bg-muted', text: 'text-muted-foreground' };
      case 'sent': return { label: 'Enviado', bg: 'bg-primary/10', text: 'text-primary' };
      case 'received': return { label: 'Recebido', bg: 'bg-success/10', text: 'text-success' };
      case 'cancelled': return { label: 'Cancelado', bg: 'bg-destructive/10', text: 'text-destructive' };
      default: return { label: status, bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'draft' || o.status === 'sent');
  const completedOrders = orders.filter(o => o.status === 'received' || o.status === 'cancelled');

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="page-header-bar">
          <div className="page-header-content">
            <h1 className="page-title">Pedidos</h1>
          </div>
        </header>

        <div className="px-4 py-4 lg:px-6 space-y-4">
          {/* Animated Tabs */}
          <AnimatedTabs
            tabs={[
              { key: 'to-order', label: 'Sugestões', icon: <Package className="w-4 h-4" />, badge: lowStockItems.length },
              { key: 'orders', label: 'Histórico', icon: <Clock className="w-4 h-4" />, badge: pendingOrders.length },
            ]}
            activeTab={orderTab}
            onTabChange={(key) => setOrderTab(key as 'to-order' | 'orders')}
          />

          <div className="animate-fade-in" key={orderTab}>
          {orderTab === 'to-order' && (
            Object.keys(itemsBySupplier).length === 0 ? (
              <EmptyState
                icon="PackageCheck"
                title="Estoque em dia!"
                subtitle="Todos os itens estão acima do mínimo"
              />
            ) : (
              <div className="space-y-3">
                {Object.entries(itemsBySupplier).map(([supplierId, supplierItems], index) => {
                  const supplier = suppliers.find(s => s.id === supplierId);
                  const isNoSupplier = supplierId === 'no-supplier';
                  const isExpanded = expandedSuppliers[supplierId] ?? false;

                  return (
                    <div
                      key={supplierId}
                      className="bg-card rounded-2xl border border-border overflow-hidden transition-all hover:border-primary/20 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Collapsible open={isExpanded} onOpenChange={(open) => setExpandedSuppliers(prev => ({ ...prev, [supplierId]: open }))}>
                        {/* Card header - always visible */}
                        <div className="flex items-center justify-between p-4">
                          <CollapsibleTrigger className="flex items-center gap-3 min-w-0 flex-1 text-left">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              isNoSupplier ? "bg-muted" : "bg-primary/10"
                            )}>
                              <Package className={cn("w-5 h-5", isNoSupplier ? "text-muted-foreground" : "text-primary")} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate">
                                {isNoSupplier ? 'Sem Fornecedor' : supplier?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {supplierItems.length} ite{supplierItems.length !== 1 ? 'ns' : 'm'} abaixo do mínimo
                              </p>
                            </div>
                            <ChevronDown className={cn(
                              "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 mr-2",
                              isExpanded && "rotate-180"
                            )} />
                          </CollapsibleTrigger>
                          {!isNoSupplier && supplier && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenOrder(supplier)}
                              className="gap-1.5 rounded-xl shadow-lg shadow-primary/20 shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                              Pedir
                            </Button>
                          )}
                        </div>

                        {/* Items list - collapsible */}
                        <CollapsibleContent>
                          <div className="border-t border-border/50">
                            {supplierItems.map((item, i) => (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-center justify-between px-4 py-2.5 transition-colors",
                                  i < supplierItems.length - 1 && "border-b border-border/30"
                                )}
                              >
                                <span className="text-sm text-foreground">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                                    item.current_stock === 0
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-warning/10 text-warning"
                                  )}>
                                    {item.current_stock}/{item.min_stock}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{item.unit_type}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Histórico Tab */}
          {orderTab === 'orders' && (
            orders.length === 0 ? (
              <EmptyState
                icon="Clock"
                title="Nenhum pedido"
                subtitle="Crie um pedido a partir das sugestões"
              />
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Pending orders */}
                {pendingOrders.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Pendentes</p>
                    {pendingOrders.map((order, index) => {
                      const status = getStatusConfig(order.status);
                      return (
                        <Collapsible key={order.id}>
                          <div
                            className="bg-card rounded-2xl border border-border overflow-hidden transition-all hover:border-primary/20 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <CollapsibleTrigger className="w-full text-left">
                              <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <ShoppingCart className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate">{order.supplier?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(order.created_at).toLocaleDateString('pt-BR')} · {order.order_items?.length || 0} itens
                                    </p>
                                  </div>
                                </div>
                                <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full shrink-0", status.bg, status.text)}>
                                  {status.label}
                                </span>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="border-t border-border/50 px-4 py-3 space-y-3">
                                {/* Items */}
                                <div className="space-y-1.5">
                                  {order.order_items?.map(oi => (
                                    <div key={oi.id} className="flex items-center justify-between py-1.5">
                                      <span className="text-sm text-foreground">{oi.item?.name}</span>
                                      <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                        ×{oi.quantity} {oi.item?.unit_type}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                  {order.status === 'draft' && (
                                    hasValidWhatsApp(order.supplier?.phone || null) ? (
                                      <Button
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(order); }}
                                        className="gap-1.5 rounded-xl bg-[hsl(142,70%,35%)] hover:bg-[hsl(142,70%,30%)] shadow-lg"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                        WhatsApp
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-warning flex items-center gap-1 px-2 py-1 bg-warning/10 rounded-lg">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        Sem WhatsApp
                                      </span>
                                    )
                                  )}
                                  {order.status === 'sent' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => { e.stopPropagation(); setOrderToReceive(order); setReceiveOrderOpen(true); }}
                                      className="gap-1.5 rounded-xl bg-success/10 hover:bg-success/20 text-success border-success/30"
                                    >
                                      <PackageCheck className="w-4 h-4" />
                                      Receber
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                                    className="text-destructive hover:text-destructive rounded-xl ml-auto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}

                {/* Completed orders */}
                {completedOrders.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Concluídos</p>
                    {completedOrders.map((order, index) => {
                      const status = getStatusConfig(order.status);
                      return (
                        <Collapsible key={order.id}>
                          <div
                            className="bg-card rounded-2xl border border-border overflow-hidden transition-all hover:border-primary/20 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <CollapsibleTrigger className="w-full text-left">
                              <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    order.status === 'received' ? "bg-success/10" : "bg-destructive/10"
                                  )}>
                                    {order.status === 'received'
                                      ? <PackageCheck className="w-5 h-5 text-success" />
                                      : <ShoppingCart className="w-5 h-5 text-destructive" />
                                    }
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-foreground truncate">{order.supplier?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(order.created_at).toLocaleDateString('pt-BR')} · {order.order_items?.length || 0} itens
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {order.status === 'received' && order.supplier_invoice_id && (
                                    <FileText className="w-4 h-4 text-success" />
                                  )}
                                  <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", status.bg, status.text)}>
                                    {status.label}
                                  </span>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="border-t border-border/50 px-4 py-3 space-y-3">
                                <div className="space-y-1.5">
                                  {order.order_items?.map(oi => (
                                    <div key={oi.id} className="flex items-center justify-between py-1.5">
                                      <span className="text-sm text-foreground">{oi.item?.name}</span>
                                      <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                        ×{oi.quantity} {oi.item?.unit_type}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                  {order.status === 'received' && !order.supplier_invoice_id && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => { e.stopPropagation(); setOrderForInvoice(order); setInvoiceSheetOpen(true); }}
                                      className="gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                                    >
                                      <FileText className="w-4 h-4" />
                                      Despesa
                                    </Button>
                                  )}
                                  {order.status === 'received' && order.supplier_invoice_id && (
                                    <span className="text-xs text-success flex items-center gap-1 px-2 py-1 bg-success/10 rounded-lg">
                                      <FileText className="w-3.5 h-3.5" />
                                      Despesa registrada
                                    </span>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                                    className="text-destructive hover:text-destructive rounded-xl ml-auto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}
          </div>
        </div>

        {/* Sheets */}
        <ReceiveOrderSheet
          order={orderToReceive}
          open={receiveOrderOpen}
          onOpenChange={setReceiveOrderOpen}
          onConfirmReceive={handleReceiveOrder}
          onSmartReceive={() => { setSmartReceivingOrder(orderToReceive); setSmartReceivingOpen(true); }}
        />

        <SmartReceivingSheet
          open={smartReceivingOpen}
          onOpenChange={setSmartReceivingOpen}
          order={smartReceivingOrder}
          inventoryItems={items}
          onComplete={() => setSmartReceivingOpen(false)}
        />

        <RegisterInvoiceAfterReceive
          order={orderForInvoice}
          open={invoiceSheetOpen}
          onOpenChange={setInvoiceSheetOpen}
          onRegisterInvoice={handleRegisterInvoice}
          onSkip={() => setOrderForInvoice(null)}
        />

        {/* Create Order Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[80vh] overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle>Novo Pedido — {selectedSupplier?.name}</SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              {selectedSupplier && itemsBySupplier[selectedSupplier.id]?.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Atual: {item.current_stock} · Mín: {item.min_stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      value={quantities[item.id] || 0}
                      onChange={(e) => setQuantities(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="w-20 h-10 text-center rounded-xl"
                    />
                    <span className="text-xs text-muted-foreground w-6">{item.unit_type}</span>
                  </div>
                </div>
              ))}
              <Button
                onClick={handleCreateOrder}
                disabled={isSubmitting || Object.values(quantities).every(q => q === 0)}
                className="w-full h-12 rounded-xl shadow-lg shadow-primary/20"
              >
                {isSubmitting ? 'Criando...' : 'Criar Pedido'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
