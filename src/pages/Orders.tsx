import { useState, useMemo } from 'react';
import { ShoppingCart, Package, Plus, Trash2, MessageCircle, Clock, PackageCheck, FileText, Sparkles, ChevronRight } from 'lucide-react';
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="page-header-icon bg-primary/10">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="page-title">Pedidos</h1>
                  <p className="page-subtitle">
                    {pendingOrders.length} pendente{pendingOrders.length !== 1 ? 's' : ''} · {lowStockItems.length} itens baixos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-4 space-y-4">
          {/* Tab Toggle */}
          <div className="tab-command">
            <button
              onClick={() => setOrderTab('to-order')}
              className={cn("tab-command-item", orderTab === 'to-order' ? 'tab-command-active' : 'tab-command-inactive')}
            >
              <Package className="w-4 h-4" />
              Sugestões
              {lowStockItems.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-warning/10 text-warning">
                  {lowStockItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setOrderTab('orders')}
              className={cn("tab-command-item", orderTab === 'orders' ? 'tab-command-active' : 'tab-command-inactive')}
            >
              <Clock className="w-4 h-4" />
              Histórico
              {pendingOrders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Sugestões Tab */}
          {orderTab === 'to-order' && (
            Object.keys(itemsBySupplier).length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <PackageCheck className="w-8 h-8 text-success" />
                </div>
                <p className="font-semibold text-foreground">Estoque em dia!</p>
                <p className="text-sm text-muted-foreground mt-1">Todos os itens estão acima do mínimo</p>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                {Object.entries(itemsBySupplier).map(([supplierId, supplierItems], index) => {
                  const supplier = suppliers.find(s => s.id === supplierId);
                  const isNoSupplier = supplierId === 'no-supplier';

                  return (
                    <div
                      key={supplierId}
                      className="bg-card rounded-2xl border border-border overflow-hidden transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            isNoSupplier ? "bg-muted" : "bg-primary/10"
                          )}>
                            <Package className={cn("w-5 h-5", isNoSupplier ? "text-muted-foreground" : "text-primary")} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {isNoSupplier ? 'Sem Fornecedor' : supplier?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {supplierItems.length} ite{supplierItems.length !== 1 ? 'ns' : 'm'} abaixo do mínimo
                            </p>
                          </div>
                        </div>
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

                      {/* Items list */}
                      <div className="border-t border-border/50">
                        {supplierItems.slice(0, 4).map((item, i) => (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-center justify-between px-4 py-2.5",
                              i < supplierItems.length - 1 && i < 3 && "border-b border-border/30"
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
                        {supplierItems.length > 4 && (
                          <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-1">
                            +{supplierItems.length - 4} mais
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Histórico Tab */}
          {orderTab === 'orders' && (
            orders.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">Nenhum pedido</p>
                <p className="text-sm text-muted-foreground mt-1">Crie um pedido a partir das sugestões</p>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                {orders.map((order, index) => {
                  const status = getStatusConfig(order.status);
                  return (
                    <div
                      key={order.id}
                      className="bg-card rounded-2xl border border-border overflow-hidden transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Order header */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <ShoppingCart className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{order.supplier?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", status.bg, status.text)}>
                            {status.label}
                          </span>
                        </div>

                        {/* Order items as tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {order.order_items?.slice(0, 5).map(oi => (
                            <span key={oi.id} className="text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground">
                              {oi.item?.name} <span className="font-semibold text-foreground">×{oi.quantity}</span>
                            </span>
                          ))}
                          {(order.order_items?.length || 0) > 5 && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-secondary text-muted-foreground">
                              +{(order.order_items?.length || 0) - 5}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.status === 'draft' && (
                            hasValidWhatsApp(order.supplier?.phone || null) ? (
                              <Button
                                size="sm"
                                onClick={() => handleSendWhatsApp(order)}
                                className="gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
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
                              onClick={() => { setOrderToReceive(order); setReceiveOrderOpen(true); }}
                              className="gap-1.5 rounded-xl bg-success/10 hover:bg-success/20 text-success border-success/30"
                            >
                              <PackageCheck className="w-4 h-4" />
                              Receber
                            </Button>
                          )}
                          {order.status === 'received' && !order.supplier_invoice_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setOrderForInvoice(order); setInvoiceSheetOpen(true); }}
                              className="gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                            >
                              <FileText className="w-4 h-4" />
                              Despesa
                            </Button>
                          )}
                          {order.status === 'received' && order.supplier_invoice_id && (
                            <span className="text-xs text-success flex items-center gap-1 px-2 py-1 bg-success/10 rounded-lg">
                              <FileText className="w-3.5 h-3.5" />
                              Despesa ok
                            </span>
                          )}
                          {(order.status === 'draft' || order.status === 'sent' || order.status === 'received') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteOrder(order.id)}
                              className="text-destructive hover:text-destructive rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
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
