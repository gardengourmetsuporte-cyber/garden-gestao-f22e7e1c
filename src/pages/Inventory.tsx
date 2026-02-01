import { useState } from 'react';
import { Package, AlertTriangle, PackageX, ArrowRightLeft, Plus, History, ClipboardList, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import { useInventoryDB } from '@/hooks/useInventoryDB';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/inventory/StatsCard';
import { ItemCard } from '@/components/inventory/ItemCardNew';
import { SearchBar } from '@/components/inventory/SearchBar';
import { QuickMovementSheetNew } from '@/components/inventory/QuickMovementSheetNew';
import { ItemFormSheetNew } from '@/components/inventory/ItemFormSheetNew';
import { MovementHistoryNew } from '@/components/inventory/MovementHistoryNew';
import { OrdersTab } from '@/components/inventory/OrdersTab';
import { AppLayout } from '@/components/layout/AppLayout';
import { InventoryItem } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type View = 'items' | 'history' | 'orders';

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const {
    items,
    movements,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    registerMovement,
    getLowStockItems,
    getOutOfStockItems,
    getRecentMovements,
  } = useInventoryDB();

  const { categories } = useCategories();
  const { suppliers } = useSuppliers();
  const { orders, createOrder, updateOrderStatus, deleteOrder } = useOrders();

  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('items');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementSheetOpen, setMovementSheetOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();
  const recentMovements = getRecentMovements(7);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setMovementSheetOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormOpen(true);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setItemFormOpen(true);
  };

  const handleSaveItem = async (data: {
    name: string;
    category_id: string | null;
    supplier_id: string | null;
    unit_type: 'unidade' | 'kg' | 'litro';
    current_stock: number;
    min_stock: number;
  }) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
        toast.success('Item atualizado!');
      } else {
        await addItem(data);
        toast.success('Item adicionado!');
      }
    } catch (error) {
      toast.error('Erro ao salvar item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      toast.success('Item excluído!');
    } catch (error) {
      toast.error('Erro ao excluir item');
    }
  };

  const handleMovement = async (itemId: string, type: 'entrada' | 'saida', quantity: number, notes?: string) => {
    try {
      await registerMovement(itemId, type, quantity, notes);
      toast.success(type === 'entrada' ? 'Entrada registrada!' : 'Saída registrada!');
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    }
  };

  const handleCreateOrder = async (supplierId: string, orderItems: { item_id: string; quantity: number }[]) => {
    try {
      await createOrder(supplierId, orderItems);
      toast.success('Pedido criado!');
    } catch (error) {
      toast.error('Erro ao criar pedido');
    }
  };

  const handleSendOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (order?.status === 'draft') {
        await updateOrderStatus(orderId, 'sent');
        toast.success('Pedido marcado como enviado!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar pedido');
    }
  };

  const handleReceiveOrder = async (orderId: string, receivedItems: { itemId: string; quantity: number }[]) => {
    try {
      // Register stock entries for each received item
      for (const item of receivedItems) {
        await registerMovement(item.itemId, 'entrada', item.quantity, `Recebimento de pedido`);
      }
      // Update order status to received
      await updateOrderStatus(orderId, 'received');
    } catch (error) {
      toast.error('Erro ao receber pedido');
      throw error;
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      toast.success('Pedido excluído!');
    } catch (error) {
      toast.error('Erro ao excluir pedido');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  // Group filtered items by category for display
  const filteredByCategory: Record<string, InventoryItem[]> = {};
  filteredItems.forEach(item => {
    const categoryName = item.category?.name || 'Sem Categoria';
    if (!filteredByCategory[categoryName]) {
      filteredByCategory[categoryName] = [];
    }
    filteredByCategory[categoryName].push(item);
  });

  // Sort categories alphabetically
  const sortedCategories = Object.keys(filteredByCategory).sort();

  // Count items needing orders
  const itemsNeedingOrder = items.filter(i => i.current_stock <= i.min_stock).length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="bg-card border-b sticky top-0 lg:top-0 z-40">
          <div className="px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">Controle de Estoque</h1>
                <p className="text-sm text-muted-foreground">{items.length} itens cadastrados</p>
              </div>
              <button
                onClick={handleAddItem}
                className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 py-4 lg:px-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              title="Total de Itens"
              value={items.length}
              icon={Package}
              variant="default"
            />
            <StatsCard
              title="Estoque Baixo"
              value={lowStockItems.length}
              icon={AlertTriangle}
              variant={lowStockItems.length > 0 ? 'warning' : 'default'}
            />
            <StatsCard
              title="Zerados"
              value={outOfStockItems.length}
              icon={PackageX}
              variant={outOfStockItems.length > 0 ? 'destructive' : 'default'}
            />
            <StatsCard
              title="Movimentações (7d)"
              value={recentMovements.length}
              icon={ArrowRightLeft}
              variant="success"
            />
          </div>

          {/* Alerts */}
          {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
            <div className="stock-card border-warning/50 bg-warning/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Atenção ao Estoque</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {outOfStockItems.length > 0 && (
                      <span className="text-destructive font-medium">
                        {outOfStockItems.length} item(ns) zerado(s).{' '}
                      </span>
                    )}
                    {lowStockItems.length > 0 && (
                      <span className="text-warning font-medium">
                        {lowStockItems.length} item(ns) com estoque baixo.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex gap-2 bg-secondary p-1 rounded-xl">
            <button
              onClick={() => setView('items')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                view === 'items' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              <ClipboardList className="w-4 h-4" />
              Itens
            </button>
            <button
              onClick={() => setView('orders')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all relative",
                view === 'orders' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              Pedidos
              {itemsNeedingOrder > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {itemsNeedingOrder}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('history')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all",
                view === 'history' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
          </div>

          {/* Search */}
          {view !== 'orders' && (
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={view === 'items' ? 'Buscar itens...' : 'Buscar movimentações...'}
            />
          )}

          {/* Content */}
          {view === 'items' ? (
            <div className="space-y-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {items.length === 0 ? (
                    <>
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Nenhum item cadastrado</p>
                      <p className="text-sm mt-1">Toque no + para adicionar</p>
                    </>
                  ) : (
                    <p>Nenhum item encontrado</p>
                  )}
                </div>
              ) : (
                sortedCategories.map((categoryName) => {
                  const categoryItems = filteredByCategory[categoryName];
                  const isCollapsed = collapsedCategories.has(categoryName);
                  const category = categories.find(c => c.name === categoryName);
                  const categoryColor = category?.color || '#6b7280';

                  return (
                    <div key={categoryName} className="space-y-2">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(categoryName)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <span className="font-semibold text-foreground">{categoryName}</span>
                          <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
                        </div>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      {/* Category Items */}
                      {!isCollapsed && (
                        <div className="space-y-2 pl-2">
                          {categoryItems.map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              onClick={() => handleItemClick(item)}
                              onEdit={() => handleEditItem(item)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : view === 'orders' ? (
            <OrdersTab
              items={items}
              suppliers={suppliers}
              orders={orders}
              onCreateOrder={handleCreateOrder}
              onSendOrder={handleSendOrder}
              onDeleteOrder={handleDeleteOrder}
              onReceiveOrder={handleReceiveOrder}
            />
          ) : (
            <MovementHistoryNew
              movements={movements.filter(m => {
                if (!search) return true;
                const item = items.find(i => i.id === m.item_id);
                return item?.name.toLowerCase().includes(search.toLowerCase());
              })}
              items={items}
              showItemName
            />
          )}
        </div>

        {/* Quick Movement Sheet */}
        <QuickMovementSheetNew
          item={selectedItem}
          open={movementSheetOpen}
          onOpenChange={setMovementSheetOpen}
          onConfirm={handleMovement}
        />

        {/* Item Form Sheet */}
        <ItemFormSheetNew
          item={editingItem}
          categories={categories}
          suppliers={suppliers}
          open={itemFormOpen}
          onOpenChange={setItemFormOpen}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          isAdmin={isAdmin}
        />
      </div>
    </AppLayout>
  );
}
