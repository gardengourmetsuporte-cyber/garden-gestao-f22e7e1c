import { useState } from 'react';
import { Package, AlertTriangle, PackageX, ArrowRightLeft, Plus, History, ClipboardList } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { StatsCard } from '@/components/inventory/StatsCard';
import { ItemCard } from '@/components/inventory/ItemCard';
import { SearchBar } from '@/components/inventory/SearchBar';
import { QuickMovementSheet } from '@/components/inventory/QuickMovementSheet';
import { ItemFormSheet } from '@/components/inventory/ItemFormSheet';
import { MovementHistory } from '@/components/inventory/MovementHistory';
import { InventoryItem } from '@/types/inventory';
import { toast } from 'sonner';

type View = 'items' | 'history';

export default function Dashboard() {
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
  } = useInventory();

  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('items');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementSheetOpen, setMovementSheetOpen] = useState(false);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const lowStockItems = getLowStockItems();
  const outOfStockItems = getOutOfStockItems();
  const recentMovements = getRecentMovements(7);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleSaveItem = (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingItem) {
      updateItem(editingItem.id, data);
    } else {
      addItem(data);
    }
  };

  const handleDeleteItem = (id: string) => {
    deleteItem(id);
  };

  const handleMovement = (itemId: string, type: 'entrada' | 'saida', quantity: number, notes?: string) => {
    registerMovement(itemId, type, quantity, notes);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Estoque</h1>
            <p className="text-sm text-muted-foreground">Hamburgueria</p>
          </div>
          <button
            onClick={handleAddItem}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
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




        {/* View Toggle */}
        <div className="flex gap-2 bg-secondary p-1 rounded-xl">
          <button
            onClick={() => setView('items')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              view === 'items' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Itens
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              view === 'history' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
        </div>

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={view === 'items' ? 'Buscar itens...' : 'Buscar movimentações...'}
        />

        {/* Content */}
        {view === 'items' ? (
          <div className="space-y-3">
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
              filteredItems.map((item) => (
                <div key={item.id} className="relative">
                  <ItemCard item={item} onClick={() => handleItemClick(item)} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditItem(item);
                    }}
                    className="absolute top-2 right-12 p-2 text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-xs font-medium">Editar</span>
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <MovementHistory
            movements={movements.filter(m => {
              if (!search) return true;
              const item = items.find(i => i.id === m.itemId);
              return item?.name.toLowerCase().includes(search.toLowerCase());
            })}
            items={items}
            showItemName
          />
        )}
      </div>

      {/* Quick Movement Sheet */}
      <QuickMovementSheet
        item={selectedItem}
        open={movementSheetOpen}
        onOpenChange={setMovementSheetOpen}
        onConfirm={handleMovement}
      />

      {/* Item Form Sheet */}
      <ItemFormSheet
        item={editingItem}
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}
