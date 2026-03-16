import { useState, useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
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
import { useQuotations } from '@/hooks/useQuotations';
import { ReceiveOrderSheet } from '@/components/inventory/ReceiveOrderSheet';
import { RegisterInvoiceAfterReceive } from '@/components/inventory/RegisterInvoiceAfterReceive';
import { SmartReceivingSheet } from '@/components/inventory/SmartReceivingSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QuotationList } from '@/components/orders/QuotationList';
import { PriceSurveyList } from '@/components/orders/PriceSurveyList';
import { useShoppingList } from '@/hooks/useShoppingList';
import { SupplierProfileSheet } from '@/components/orders/SupplierProfileSheet';
import { ProductionTab } from '@/components/orders/ProductionTab';
import { useFabAction } from '@/contexts/FabActionContext';
import { normalizePhone } from '@/lib/normalizePhone';

export default function OrdersPage() {
  const { isAdmin } = useAuth();
  const { items, registerMovement } = useInventoryDB();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { orders, createOrder, updateOrderStatus, deleteOrder, refetch: refetchOrders } = useOrders();
  const { addInvoice, invoices } = useSupplierInvoices();
  const { createQuotation } = useQuotations();
  const { items: shoppingListItems, removeFromList, clearList, isLoading: shoppingListLoading } = useShoppingList();

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
  const [orderTab, setOrderTab] = useState<'to-order' | 'orders' | 'quotations' | 'price-survey' | 'shopping-list' | 'suppliers' | 'production'>('to-order');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});
  const [cotationStep, setCotationStep] = useState(false);
  const [extraSuppliers, setExtraSuppliers] = useState<string[]>([]);
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);

  // Supplier profile states
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [profileSupplier, setProfileSupplier] = useState<Supplier | null>(null);
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  const handleOpenProfile = (supplier: Supplier) => {
    setProfileSupplier(supplier);
    setIsNewSupplier(false);
    setProfileSheetOpen(true);
  };

  const handleNewSupplier = () => {
    setProfileSupplier(null);
    setIsNewSupplier(true);
    setProfileSheetOpen(true);
  };

  const handleSaveProfile = async (data: { name: string; phone?: string; email?: string; delivery_frequency?: string }) => {
    if (isNewSupplier) {
      const created = await addSupplier(data as any);
      setProfileSupplier(created);
      setIsNewSupplier(false);
    } else if (profileSupplier) {
      await updateSupplier(profileSupplier.id, data as any);
      setProfileSupplier({ ...profileSupplier, ...data } as Supplier);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    await deleteSupplier(id);
    setProfileSheetOpen(false);
  };

  useFabAction(orderTab === 'suppliers' ? { icon: 'Plus', label: 'Novo Fornecedor', onClick: handleNewSupplier } : null, [orderTab]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(s => s.name.toLowerCase().includes(q) || s.phone?.includes(q) || s.email?.toLowerCase().includes(q));
  }, [suppliers, supplierSearch]);

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
    setCotationStep(false);
    setExtraSuppliers([]);
    setSheetOpen(true);
  };

  const handleStartQuotation = async () => {
    if (!selectedSupplier || extraSuppliers.length === 0) return;
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([item_id, quantity]) => ({ item_id, quantity }));
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos 1 item com quantidade');
      return;
    }
    setIsCreatingQuotation(true);
    try {
      await createQuotation({
        title: `Cotação — ${selectedSupplier.name}`,
        supplierIds: [selectedSupplier.id, ...extraSuppliers],
        items: orderItems,
      });
      setSheetOpen(false);
      setSelectedSupplier(null);
      setQuantities({});
      setCotationStep(false);
      setExtraSuppliers([]);
      setOrderTab('quotations');
    } catch {
      toast.error('Erro ao criar cotação');
    } finally {
      setIsCreatingQuotation(false);
    }
  };

  const otherSuppliers = useMemo(() => {
    if (!selectedSupplier) return [];
    return suppliers.filter(s => s.id !== selectedSupplier.id);
  }, [suppliers, selectedSupplier]);

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

  const openWhatsApp = (order: Order) => {
    const itemsList = order.order_items?.map(oi => {
      const unit = oi.item?.unit_type === 'kg' ? 'kg' : oi.item?.unit_type === 'litro' ? 'L' : 'un';
      return `• ${oi.item?.name}: ${oi.quantity} ${unit}`;
    }).join('\n');
    const message = `*Pedido de Compra*\n\nOlá! Gostaria de fazer o seguinte pedido:\n\n${itemsList}\n\n${order.notes ? `Obs: ${order.notes}` : ''}`;
    const phone = formatPhoneForWhatsApp(order.supplier!.phone);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  const handleSendWhatsApp = async (order: Order) => {
    if (!order.supplier?.phone || !hasValidWhatsApp(order.supplier.phone)) {
      toast.error('Fornecedor sem WhatsApp cadastrado');
      return;
    }

    // Update status BEFORE opening WhatsApp to avoid losing state on iOS
    try {
      await updateOrderStatus(order.id, 'sent');
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      toast.error('Pedido enviado mas houve erro ao atualizar o status');
    }

    openWhatsApp(order);
  };

  const handleResendWhatsApp = (order: Order) => {
    if (!order.supplier?.phone || !hasValidWhatsApp(order.supplier.phone)) {
      toast.error('Fornecedor sem WhatsApp cadastrado');
      return;
    }
    openWhatsApp(order);
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
      <div className="min-h-screen bg-background pb-24 lg:pb-12">
        <div className="px-4 py-3 lg:px-8 lg:max-w-6xl lg:mx-auto space-y-4">
          {/* Navigation Grid 2x3 */}
          {(() => {
            const tabs = [
              { key: 'to-order' as const, label: 'Sugestões', icon: 'Package', badge: lowStockItems.length || undefined, gradient: 'linear-gradient(135deg, #22C55E, #10B981)' },
              { key: 'shopping-list' as const, label: 'Lista', icon: 'ShoppingCart', badge: shoppingListItems.length || undefined, gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)' },
              { key: 'orders' as const, label: 'Pedidos', icon: 'ClipboardList', badge: pendingOrders.length || undefined, gradient: 'linear-gradient(135deg, #F59E0B, #F97316)' },
              { key: 'quotations' as const, label: 'Cotações', icon: 'Scale', badge: undefined, gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)' },
              { key: 'price-survey' as const, label: 'Pesquisa', icon: 'SearchCheck', badge: undefined, gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)' },
              { key: 'suppliers' as const, label: 'Fornecedores', icon: 'Truck', badge: undefined, gradient: 'linear-gradient(135deg, #14B8A6, #0EA5E9)' },
              { key: 'production' as const, label: 'Produção', icon: 'ChefHat', badge: undefined, gradient: 'linear-gradient(135deg, #EF4444, #F472B6)' },
            ];

            return (
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-6 lg:gap-3">
                {tabs.map(tab => {
                  const isActive = orderTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setOrderTab(tab.key as any)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl transition-all duration-200 active:scale-[0.96] touch-manipulation",
                        isActive
                          ? "bg-primary/10"
                          : "bg-secondary/50 hover:bg-secondary/70"
                      )}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-opacity"
                        style={{
                          background: tab.gradient,
                          opacity: isActive ? 1 : 0.45,
                        }}
                      >
                        <AppIcon name={tab.icon} size={20} className="text-white" />
                      </div>
                      <span className={cn(
                        "text-[11px] font-semibold leading-tight text-center",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {tab.label}
                      </span>
                      {tab.badge != null && tab.badge > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

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
                        className="bg-card rounded-2xl overflow-hidden transition-all animate-fade-in"
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
                                 <AppIcon name="Package" size={20} className={cn(isNoSupplier ? "text-muted-foreground" : "text-primary")} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold font-display text-foreground truncate">
                                  {isNoSupplier ? 'Sem Fornecedor' : supplier?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {supplierItems.length} ite{supplierItems.length !== 1 ? 'ns' : 'm'} abaixo do mínimo
                                </p>
                              </div>
                              <AppIcon name="ChevronDown" size={16} className={cn(
                                "text-muted-foreground transition-transform duration-200 shrink-0 mr-2",
                                isExpanded && "rotate-180"
                              )} />
                            </CollapsibleTrigger>
                            {!isNoSupplier && supplier && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenOrder(supplier)}
                                className="gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                              >
                                <AppIcon name="Plus" size={16} />
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
                                    i < supplierItems.length - 1 && "border-b border-border/50"
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

            {/* Lista de Compras Rápida Tab */}
            {orderTab === 'shopping-list' && (
              shoppingListItems.length === 0 ? (
                <EmptyState
                  icon="ShoppingCart"
                  title="Lista de compras vazia"
                  subtitle="Adicione itens pelo estoque usando o botão de carrinho"
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {shoppingListItems.length} ite{shoppingListItems.length !== 1 ? 'ns' : 'm'} na lista
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearList()}
                      className="text-destructive hover:text-destructive"
                    >
                      <AppIcon name="Trash2" size={14} className="mr-1" />
                      Limpar
                    </Button>
                  </div>
                  {shoppingListItems.map((sli, index) => {
                    const inv = sli.inventory_item;
                    const unitLabel = inv?.unit_type === 'unidade' ? 'un' : inv?.unit_type === 'kg' ? 'kg' : 'L';
                    return (
                      <div
                        key={sli.id}
                        className="bg-card rounded-2xl p-4 flex items-center justify-between animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{inv?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Qtd sugerida: <span className="font-semibold text-foreground">{sli.quantity} {unitLabel}</span>
                            </span>
                            {inv?.supplier?.name && (
                              <span className="text-xs text-muted-foreground">
                                · {inv.supplier.name}
                              </span>
                            )}
                          </div>
                          {sli.profile?.full_name && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Adicionado por {sli.profile.full_name}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromList(sli.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <AppIcon name="X" size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Cotações Tab */}
            {orderTab === 'quotations' && <QuotationList />}

            {/* Pesquisa de Preços Tab */}
            {orderTab === 'price-survey' && <PriceSurveyList suppliers={suppliers} />}

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
                               className="bg-card rounded-2xl overflow-hidden transition-all animate-fade-in"
                               style={{ animationDelay: `${index * 50}ms` }}
                             >
                               <CollapsibleTrigger className="w-full text-left">
                                 <div className="flex items-center justify-between p-4">
                                   <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <AppIcon name="ShoppingCart" size={20} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold font-display text-foreground truncate">{order.supplier?.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('pt-BR')} · {Array.isArray(order.order_items) ? order.order_items.length : 0} itens
                                        {(() => {
                                          const t = (order.order_items || []).reduce((s: number, oi: any) => s + (oi.unit_price || 0) * oi.quantity, 0);
                                          return t > 0 ? ` · R$ ${t.toFixed(2)}` : '';
                                        })()}
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
                                     {order.order_items?.map((oi: any) => {
                                       const price = oi.unit_price || 0;
                                       const total = price * oi.quantity;
                                       return (
                                        <div key={oi.id} className="flex items-center justify-between py-1.5">
                                         <span className="text-sm text-foreground">{oi.item?.name}</span>
                                         <div className="flex items-center gap-2">
                                           <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                             ×{oi.quantity} {oi.item?.unit_type}
                                           </span>
                                           {price > 0 && (
                                             <span className="text-xs font-semibold text-foreground">
                                               R$ {total.toFixed(2)}
                                             </span>
                                           )}
                                         </div>
                                       </div>
                                       );
                                     })}
                                     {(() => {
                                       const orderTotal = (order.order_items || []).reduce((sum: number, oi: any) => sum + (oi.unit_price || 0) * oi.quantity, 0);
                                       return orderTotal > 0 ? (
                                         <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                           <span className="text-sm font-bold text-foreground">Total</span>
                                           <span className="text-sm font-bold text-primary">R$ {orderTotal.toFixed(2)}</span>
                                         </div>
                                       ) : null;
                                     })()}
                                   </div>

                                  {/* Actions */}
                                   <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                     {order.status === 'draft' && (
                                      hasValidWhatsApp(order.supplier?.phone || null) ? (
                                         <Button
                                          size="sm"
                                          onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(order); }}
                                          className="gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white shadow-lg"
                                        >
                                          <img src="/icons/whatsapp.png" alt="" className="w-4 h-4" />
                                          WhatsApp
                                        </Button>
                                      ) : (
                                        <span className="text-xs text-warning flex items-center gap-1 px-2 py-1 bg-warning/10 rounded-lg">
                                          <AppIcon name="MessageCircle" className="w-3.5 h-3.5" />
                                          Sem WhatsApp
                                        </span>
                                      )
                                    )}
                                    {order.status === 'sent' && (
                                      <>
                                        {hasValidWhatsApp(order.supplier?.phone || null) && (
                                          <Button
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); handleResendWhatsApp(order); }}
                                            className="gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white"
                                          >
                                            <img src="/icons/whatsapp.png" alt="" className="w-4 h-4" />
                                            Reenviar
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => { e.stopPropagation(); setOrderToReceive(order); setReceiveOrderOpen(true); }}
                                          className="gap-1.5 rounded-xl bg-success/10 hover:bg-success/20 text-success border-success/30"
                                        >
                                          <AppIcon name="PackageCheck" size={16} />
                                          Receber
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                                      className="text-destructive hover:text-destructive rounded-xl ml-auto"
                                    >
                                      <AppIcon name="Trash2" size={16} />
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
                               className="bg-card rounded-2xl border border-border overflow-hidden transition-all hover:border-primary/25 animate-fade-in"
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
                                        ? <AppIcon name="PackageCheck" size={20} className="text-success" />
                                        : <AppIcon name="ShoppingCart" size={20} className="text-destructive" />
                                      }
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-foreground truncate">{order.supplier?.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('pt-BR')} · {Array.isArray(order.order_items) ? order.order_items.length : 0} itens
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {order.status === 'received' && order.supplier_invoice_id && (
                                      <AppIcon name="FileText" size={16} className="text-success" />
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
                                     {order.order_items?.map((oi: any) => {
                                       const price = oi.unit_price || 0;
                                       const total = price * oi.quantity;
                                       return (
                                        <div key={oi.id} className="flex items-center justify-between py-1.5">
                                         <span className="text-sm text-foreground">{oi.item?.name}</span>
                                         <div className="flex items-center gap-2">
                                           <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                             ×{oi.quantity} {oi.item?.unit_type}
                                           </span>
                                           {price > 0 && (
                                             <span className="text-xs font-semibold text-foreground">
                                               R$ {total.toFixed(2)}
                                             </span>
                                           )}
                                         </div>
                                       </div>
                                       );
                                     })}
                                     {(() => {
                                       const orderTotal = (order.order_items || []).reduce((sum: number, oi: any) => sum + (oi.unit_price || 0) * oi.quantity, 0);
                                       return orderTotal > 0 ? (
                                         <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                           <span className="text-sm font-bold text-foreground">Total</span>
                                           <span className="text-sm font-bold text-primary">R$ {orderTotal.toFixed(2)}</span>
                                         </div>
                                       ) : null;
                                     })()}
                                   </div>

                                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                    {order.status === 'received' && !order.supplier_invoice_id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => { e.stopPropagation(); setOrderForInvoice(order); setInvoiceSheetOpen(true); }}
                                        className="gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                                      >
                                        <AppIcon name="FileText" size={16} />
                                        Despesa
                                      </Button>
                                    )}
                                    {order.status === 'received' && order.supplier_invoice_id && (
                                      <span className="text-xs text-success flex items-center gap-1 px-2 py-1 bg-success/10 rounded-lg">
                                        <AppIcon name="FileText" size={14} />
                                        Despesa registrada
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                                      className="text-destructive hover:text-destructive rounded-xl ml-auto"
                                    >
                                      <AppIcon name="Trash2" size={16} />
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

            {/* Fornecedores Tab */}
            {orderTab === 'suppliers' && (
              <div className="space-y-3">
                <Input
                  value={supplierSearch}
                  onChange={e => setSupplierSearch(e.target.value)}
                  placeholder="Buscar fornecedor..."
                  className="h-11"
                />
                {filteredSuppliers.length === 0 ? (
                  <EmptyState
                    icon="Truck"
                    title="Nenhum fornecedor"
                    subtitle="Cadastre fornecedores para gerenciar pedidos"
                  />
                ) : (
                  <div className="space-y-2">
                    {filteredSuppliers.map((supplier, index) => {
                      const supplierOrderCount = orders.filter(o => o.supplier_id === supplier.id).length;
                      const hasWa = supplier.phone ? !!normalizePhone(supplier.phone) : false;
                      return (
                        <button
                          key={supplier.id}
                          onClick={() => handleOpenProfile(supplier)}
                          className="w-full text-left bg-card rounded-2xl border border-border p-4 flex items-center gap-3 transition-all hover:border-primary/25 active:scale-[0.98] animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                            (supplier as any).delivery_frequency === 'daily' ? "bg-primary/15" : "bg-secondary"
                          )}>
                            <AppIcon name="Truck" size={20} className={cn(
                              (supplier as any).delivery_frequency === 'daily' ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground truncate">{supplier.name}</span>
                              {(supplier as any).delivery_frequency === 'daily' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold shrink-0">Diário</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {supplier.phone && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <AppIcon name="Phone" size={11} />
                                  {supplier.phone}
                                  {hasWa && <span className="text-success">✓</span>}
                                </span>
                              )}
                              {supplierOrderCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {supplierOrderCount} pedido{supplierOrderCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Produção Tab */}
            {orderTab === 'production' && <ProductionTab />}
          </div>
        </div>

        {/* Supplier Profile Sheet */}
        <SupplierProfileSheet
          open={profileSheetOpen}
          onOpenChange={setProfileSheetOpen}
          supplier={profileSupplier}
          orders={orders}
          invoices={invoices}
          onSave={handleSaveProfile}
          onDelete={handleDeleteProfile}
          isNew={isNewSupplier}
        />

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
        <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { setCotationStep(false); setExtraSuppliers([]); } }}>
          <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[80vh] overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle>
                {cotationStep
                  ? `Cotação — ${selectedSupplier?.name} + ?`
                  : `Novo Pedido — ${selectedSupplier?.name}`}
              </SheetTitle>
            </SheetHeader>

            {!cotationStep ? (
              <div className="space-y-3">
                {selectedSupplier && itemsBySupplier[selectedSupplier.id]?.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Atual: {item.current_stock} · Mín: {item.min_stock}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={quantities[item.id] || 0}
                      onChange={(e) => setQuantities(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="w-16 h-10 text-center rounded-xl shrink-0"
                    />
                    <span className="text-xs text-muted-foreground w-14 text-right shrink-0">{item.unit_type}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateOrder}
                    disabled={isSubmitting || Object.values(quantities).every(q => q === 0)}
                    className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Pedido'}
                  </Button>
                  {otherSuppliers.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCotationStep(true)}
                      disabled={Object.values(quantities).every(q => q === 0)}
                      className="h-12 rounded-xl gap-2"
                    >
                      <AppIcon name="Scale" size={16} />
                      Cotar
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione fornecedores adicionais para comparar preços:
                </p>
                <div className="flex flex-wrap gap-2">
                  {otherSuppliers.map(s => {
                    const isSelected = extraSuppliers.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setExtraSuppliers(prev =>
                          isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        )}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                           isSelected
                             ? "bg-primary/15 border-primary/30 text-primary"
                             : "bg-primary/5 border-primary/10 text-foreground hover:border-primary/20"
                        )}
                      >
                        {isSelected && <AppIcon name="Check" size={14} />}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {otherSuppliers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum outro fornecedor cadastrado.
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setCotationStep(false)}
                    className="h-12 rounded-xl gap-2"
                  >
                    <AppIcon name="ArrowLeft" size={16} />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleStartQuotation}
                    disabled={extraSuppliers.length === 0 || isCreatingQuotation}
                    className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20 gap-2"
                  >
                    <AppIcon name="Scale" size={16} />
                    {isCreatingQuotation ? 'Criando...' : 'Iniciar Cotação'}
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
