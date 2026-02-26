import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';

import { useInventoryDB } from '@/hooks/useInventoryDB';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/inventory/StatsCard';
import { ItemCard } from '@/components/inventory/ItemCardNew';
import { SearchBar } from '@/components/inventory/SearchBar';
import { QuickMovementSheetNew } from '@/components/inventory/QuickMovementSheetNew';
import { ItemFormSheetNew } from '@/components/inventory/ItemFormSheetNew';
import { MovementHistoryNew } from '@/components/inventory/MovementHistoryNew';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import { AppLayout } from '@/components/layout/AppLayout';
import { InventoryItem } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type View = 'items' | 'history';

export default function InventoryPage() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const {
    items, movements, isLoading,
    addItem, updateItem, deleteItem,
    registerMovement, deleteMovement,
    getLowStockItems, getOutOfStockItems, getRecentMovements,
  } = useInventoryDB();

  const { categories } = useCategories();
  const { suppliers } = useSuppliers();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('items');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementSheetOpen, setMovementSheetOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'zero' | null>(null);

  // Handle navigation state from Dashboard
  useEffect(() => {
    const state = location.state as { stockFilter?: string } | null;
    if (state?.stockFilter === 'critical') { setStockFilter('zero'); setView('items'); }
    if (state?.stockFilter === 'zero') { setStockFilter('zero'); setView('items'); }
    if (state?.stockFilter === 'low') { setStockFilter('low'); setView('items'); }
    if (state) window.history.replaceState({}, document.title);
  }, [location.state, isAdmin]);

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();
  const recentMovements = getRecentMovements(7);

  const getFilteredByStock = () => {
    if (stockFilter === 'zero') return outOfStockItems;
    if (stockFilter === 'low') return lowStockItems;
    return items;
  };

  const filteredItems = getFilteredByStock().filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStockFilterClick = (filter: 'all' | 'low' | 'zero') => {
    if (stockFilter === filter) setStockFilter(null);
    else { setStockFilter(filter); setView('items'); }
  };

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) newSet.delete(categoryName);
      else newSet.add(categoryName);
      return newSet;
    });
  };

  const handleItemClick = (item: InventoryItem) => { setSelectedItem(item); setMovementSheetOpen(true); };
  const handleEditItem = (item: InventoryItem) => { setEditingItem(item); setItemFormOpen(true); };
  const handleAddItem = () => { setEditingItem(null); setItemFormOpen(true); };

  const handleSaveItem = async (data: {
    name: string; category_id: string | null; supplier_id: string | null;
    unit_type: 'unidade' | 'kg' | 'litro'; current_stock: number; min_stock: number;
  }) => {
    try {
      if (editingItem) await updateItem(editingItem.id, data);
      else await addItem(data);
    } catch { toast.error('Erro ao salvar item'); }
  };

  const handleDeleteItem = async (id: string) => {
    try { await deleteItem(id); } catch { toast.error('Erro ao excluir item'); }
  };

  const handleMovement = async (itemId: string, type: 'entrada' | 'saida', quantity: number, notes?: string) => {
    try { await registerMovement(itemId, type, quantity, notes); } catch { toast.error('Erro ao registrar movimentação'); }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background pb-24">
          <header className="page-header-bar">
            <div className="page-header-content flex items-center justify-between">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </header>
          <div className="px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-xl" />
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Group filtered items by category
  const filteredByCategory: Record<string, InventoryItem[]> = {};
  filteredItems.forEach(item => {
    const categoryName = item.category?.name || 'Sem Categoria';
    if (!filteredByCategory[categoryName]) filteredByCategory[categoryName] = [];
    filteredByCategory[categoryName].push(item);
  });

  const sortedCategories = Object.keys(filteredByCategory).sort((a, b) => {
    const catA = categories.find(c => c.name === a);
    const catB = categories.find(c => c.name === b);
    return (catA?.sort_order ?? 999) - (catB?.sort_order ?? 999);
  });

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
        {/* Header */}
        <header className="page-header-bar">
          <div className="page-header-content flex items-center justify-between">
            <h1 className="page-title">Estoque</h1>
            {isAdmin && (
              <button onClick={handleAddItem} className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform">
                <AppIcon name="Plus" size={20} />
              </button>
            )}
          </div>
        </header>

        <div className="px-4 py-4 lg:px-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatsCard title="Total de Itens" value={items.length} icon="Package" variant="default" onClick={() => handleStockFilterClick('all')} />
            <StatsCard title="Estoque Baixo" value={lowStockItems.length} icon="AlertTriangle" variant={lowStockItems.length > 0 ? 'warning' : 'default'} onClick={() => handleStockFilterClick('low')} />
            <StatsCard title="Zerados" value={outOfStockItems.length} icon="PackageX" variant={outOfStockItems.length > 0 ? 'destructive' : 'default'} onClick={() => handleStockFilterClick('zero')} />
            <StatsCard title="Movimentações (7d)" value={recentMovements.length} icon="ArrowRightLeft" variant="success" onClick={() => { setView('history'); setStockFilter(null); }} />
          </div>

          {/* Active Filter */}
          {stockFilter && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-xl">
              <span className="text-sm text-primary font-medium">
                Filtro ativo: {stockFilter === 'zero' ? 'Itens zerados' : stockFilter === 'low' ? 'Estoque baixo' : 'Todos os itens'}
              </span>
              <button onClick={() => setStockFilter(null)} className="text-xs text-primary underline">Limpar filtro</button>
            </div>
          )}

          {/* Animated Tabs */}
          <AnimatedTabs
            tabs={[
              { key: 'items', label: 'Itens', icon: <AppIcon name="ClipboardList" size={16} /> },
              { key: 'history', label: 'Histórico', icon: <AppIcon name="History" size={16} /> },
            ]}
            activeTab={view}
            onTabChange={(key) => { setView(key as View); if (key === 'history') setStockFilter(null); }}
          />

          {/* Search */}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={view === 'items' ? 'Buscar itens...' : 'Buscar movimentações...'}
          />

          {/* Content with fade transition */}
          <div className="animate-fade-in" key={view}>
            {view === 'items' ? (
              <div className="space-y-4">
                {filteredItems.length === 0 ? (
                  items.length === 0 ? (
                    <EmptyState
                      icon="Package"
                      title="Seu estoque está vazio"
                      subtitle="Cadastre o primeiro item para começar a controlar entradas e saídas."
                      actionLabel={isAdmin ? "Cadastrar item" : undefined}
                      actionIcon="Plus"
                      onAction={isAdmin ? handleAddItem : undefined}
                      accent="primary"
                    />
                  ) : (
                    <EmptyState icon="Search" title="Nenhum item encontrado" subtitle="Tente buscar com outro termo." variant="compact" />
                  )
                ) : (
                  sortedCategories.map((categoryName, catIndex) => {
                    const categoryItems = filteredByCategory[categoryName];
                    const isCollapsed = collapsedCategories.has(categoryName);
                    const category = categories.find(c => c.name === categoryName);
                    const categoryColor = category?.color || '#6b7280';

                    return (
                      <div
                        key={categoryName}
                        className="space-y-2 animate-fade-in"
                        style={{ animationDelay: `${catIndex * 40}ms` }}
                      >
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(categoryName)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
                            <span className="font-semibold text-foreground">{categoryName}</span>
                            <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
                          </div>
                          <AppIcon
                            name="ChevronDown"
                            size={16}
                            className={cn(
                              "text-muted-foreground transition-transform duration-200",
                              !isCollapsed && "rotate-180"
                            )}
                          />
                        </button>

                        {/* Category Items with collapse animation */}
                        <div
                          className={cn(
                            "space-y-2 pl-2 overflow-hidden transition-all duration-300 ease-out",
                            isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                          )}
                        >
                          {categoryItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className="animate-fade-in"
                              style={{ animationDelay: `${idx * 30}ms` }}
                            >
                              <ItemCard
                                item={item}
                                onClick={() => handleItemClick(item)}
                                onEdit={isAdmin ? () => handleEditItem(item) : undefined}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <MovementHistoryNew
                movements={movements.filter(m => {
                  if (!search) return true;
                  const item = items.find(i => i.id === m.item_id);
                  return item?.name.toLowerCase().includes(search.toLowerCase());
                })}
                items={items}
                showItemName
                onDeleteMovement={deleteMovement}
              />
            )}
          </div>
        </div>

        <QuickMovementSheetNew
          item={selectedItem}
          open={movementSheetOpen}
          onOpenChange={setMovementSheetOpen}
          onConfirm={handleMovement}
        />

        <ItemFormSheetNew
          open={itemFormOpen}
          onOpenChange={setItemFormOpen}
          item={editingItem}
          categories={categories}
          suppliers={suppliers}
          onSave={handleSaveItem}
          onDelete={editingItem ? () => handleDeleteItem(editingItem.id) : undefined}
          isAdmin={isAdmin}
        />
      </div>
    </AppLayout>
  );
}
