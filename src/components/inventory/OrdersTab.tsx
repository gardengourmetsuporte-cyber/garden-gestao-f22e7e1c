import { useState, useMemo } from 'react';
import { Package, Send, Plus, Trash2, MessageCircle, Check, Clock, X } from 'lucide-react';
import { InventoryItem, Supplier, Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface OrdersTabProps {
  items: InventoryItem[];
  suppliers: Supplier[];
  orders: Order[];
  onCreateOrder: (supplierId: string, items: { item_id: string; quantity: number }[]) => Promise<void>;
  onSendOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

export function OrdersTab({
  items,
  suppliers,
  orders,
  onCreateOrder,
  onSendOrder,
  onDeleteOrder,
}: OrdersTabProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get items that need to be ordered (below minimum stock)
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.current_stock <= item.min_stock);
  }, [items]);

  // Group low stock items by supplier
  const itemsBySupplier = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    
    // Group items with suppliers
    lowStockItems.forEach(item => {
      if (item.supplier_id) {
        if (!grouped[item.supplier_id]) {
          grouped[item.supplier_id] = [];
        }
        grouped[item.supplier_id].push(item);
      }
    });

    // Items without supplier
    const noSupplier = lowStockItems.filter(item => !item.supplier_id);
    if (noSupplier.length > 0) {
      grouped['no-supplier'] = noSupplier;
    }

    return grouped;
  }, [lowStockItems]);

  const handleOpenOrder = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    // Initialize quantities with suggested amounts (min_stock - current_stock)
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
      await onCreateOrder(selectedSupplier.id, orderItems);
      setSheetOpen(false);
      setSelectedSupplier(null);
      setQuantities({});
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    // Se já começa com 55, usa direto
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }
    // Adiciona 55 se não tiver
    return `55${cleaned}`;
  };

  const hasValidWhatsApp = (phone: string | null): boolean => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const handleSendWhatsApp = (order: Order) => {
    if (!order.supplier?.phone || !hasValidWhatsApp(order.supplier.phone)) {
      alert('Este fornecedor não tem telefone válido cadastrado. Cadastre um número de WhatsApp nas configurações.');
      return;
    }

    const itemsList = order.order_items?.map(oi => {
      const unit = oi.item?.unit_type === 'kg' ? 'kg' : oi.item?.unit_type === 'litro' ? 'L' : 'un';
      return `• ${oi.item?.name}: ${oi.quantity} ${unit}`;
    }).join('\n');

    const message = `*Pedido de Compra*\n\nOlá! Gostaria de fazer o seguinte pedido:\n\n${itemsList}\n\n${order.notes ? `Obs: ${order.notes}` : ''}`;
    
    const phone = formatPhoneForWhatsApp(order.supplier.phone);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    onSendOrder(order.id);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded-full bg-secondary text-muted-foreground">Rascunho</span>;
      case 'sent':
        return <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">Enviado</span>;
      case 'received':
        return <span className="px-2 py-1 text-xs rounded-full bg-success/10 text-success">Recebido</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-destructive/10 text-destructive">Cancelado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Low Stock Summary by Supplier */}
      {Object.keys(itemsBySupplier).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum item precisa de reposição</p>
          <p className="text-sm mt-1">Todos os itens estão acima do estoque mínimo</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4" />
            Itens para Pedido
          </h3>
          
          {Object.entries(itemsBySupplier).map(([supplierId, supplierItems]) => {
            const supplier = suppliers.find(s => s.id === supplierId);
            const isNoSupplier = supplierId === 'no-supplier';

            return (
              <div key={supplierId} className="bg-card rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {isNoSupplier ? 'Sem Fornecedor' : supplier?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {supplierItems.length} item(ns) abaixo do mínimo
                    </p>
                  </div>
                  {!isNoSupplier && supplier && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenOrder(supplier)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Pedido
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {supplierItems.slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-t border-border/50 first:border-t-0"
                    >
                      <span className="text-sm">{item.name}</span>
                      <span className={cn(
                        "text-sm font-medium",
                        item.current_stock === 0 ? "text-destructive" : "text-warning"
                      )}>
                        {item.current_stock} / {item.min_stock} {item.unit_type}
                      </span>
                    </div>
                  ))}
                  {supplierItems.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{supplierItems.length - 3} mais item(ns)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pedidos Recentes
          </h3>

          {orders.slice(0, 10).map(order => (
            <div key={order.id} className="bg-card rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-foreground">{order.supplier?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="text-sm text-muted-foreground mb-3">
                {order.order_items?.map(oi => (
                  <span key={oi.id} className="inline-block mr-2">
                    {oi.item?.name} ({oi.quantity})
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                {order.status === 'draft' && (
                  <>
                    {hasValidWhatsApp(order.supplier?.phone || null) ? (
                      <Button
                        size="sm"
                        onClick={() => handleSendWhatsApp(order)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Enviar WhatsApp
                      </Button>
                    ) : (
                      <span className="text-xs text-warning flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        Sem WhatsApp
                      </span>
                    )}
                  </>
                )}
                {order.status === 'sent' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSendOrder(order.id)}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Marcar Recebido
                  </Button>
                )}
                {(order.status === 'draft' || order.status === 'sent') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteOrder(order.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Order Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8 max-h-[80vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>
              Novo Pedido - {selectedSupplier?.name}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {selectedSupplier && itemsBySupplier[selectedSupplier.id]?.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Estoque: {item.current_stock} / Mínimo: {item.min_stock}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={quantities[item.id] || 0}
                    onChange={(e) => setQuantities(prev => ({
                      ...prev,
                      [item.id]: Number(e.target.value)
                    }))}
                    className="w-20 h-10 text-center"
                  />
                  <span className="text-sm text-muted-foreground w-8">
                    {item.unit_type}
                  </span>
                </div>
              </div>
            ))}

            <Button
              onClick={handleCreateOrder}
              disabled={isSubmitting || Object.values(quantities).every(q => q === 0)}
              className="w-full h-12"
            >
              {isSubmitting ? 'Criando...' : 'Criar Pedido'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
