import { useState, useMemo } from 'react';
import { Plus, LayoutDashboard, CreditCard, Building2, Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscriptions, Subscription } from '@/hooks/useSubscriptions';
import { SubscriptionDashboard } from '@/components/subscriptions/SubscriptionDashboard';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { SubscriptionSheet } from '@/components/subscriptions/SubscriptionSheet';
import { SubscriptionFilters } from '@/components/subscriptions/SubscriptionFilters';
import { SubscriptionAlerts } from '@/components/subscriptions/SubscriptionAlerts';
import { CancelSubscriptionDialog } from '@/components/subscriptions/CancelSubscriptionDialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/PageLoader';

type Tab = 'dashboard' | 'assinaturas' | 'contas' | 'alertas';

const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'assinaturas', label: 'Assinaturas', icon: CreditCard },
  { key: 'contas', label: 'Contas', icon: Building2 },
  { key: 'alertas', label: 'Alertas', icon: Bell },
];

export default function Subscriptions() {
  const { subscriptions, isLoading, totalMonthly, activeCount, upcomingBills, alerts, create, update, remove, isCreating, isUpdating } = useSubscriptions();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<Subscription | null>(null);
  const [cancelItem, setCancelItem] = useState<Subscription | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filterItems = (items: Subscription[]) => {
    return items.filter(s => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      return true;
    });
  };

  const assinaturas = useMemo(() => filterItems(subscriptions.filter(s => s.type === 'assinatura')), [subscriptions, search, statusFilter, categoryFilter]);
  const contas = useMemo(() => filterItems(subscriptions.filter(s => s.type === 'conta_fixa')), [subscriptions, search, statusFilter, categoryFilter]);

  const handleEdit = (item: Subscription) => { setEditItem(item); setSheetOpen(true); };
  const handlePause = async (item: Subscription) => {
    await update({ id: item.id, status: item.status === 'pausado' ? 'ativo' : 'pausado' } as any);
  };
  const handleCancel = (item: Subscription) => setCancelItem(item);
  const handleConfirmCancel = async () => {
    if (!cancelItem) return;
    await update({ id: cancelItem.id, status: 'cancelado' } as any);
    setCancelItem(null);
  };

  if (isLoading) return <AppLayout title="Central Recorrente"><PageLoader /></AppLayout>;

  return (
    <AppLayout
      title="Central Recorrente"
      actions={
        <Button size="sm" onClick={() => { setEditItem(null); setSheetOpen(true); }} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      }
    >
      <div className="pb-4">
        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-4 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.key === 'alertas' && alerts.length > 0 && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1 border-0">{alerts.length}</Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <SubscriptionDashboard
            totalMonthly={totalMonthly}
            activeCount={activeCount}
            upcomingBills={upcomingBills}
            subscriptions={subscriptions}
          />
        )}

        {activeTab === 'assinaturas' && (
          <div className="space-y-4">
            <SubscriptionFilters
              search={search} onSearchChange={setSearch}
              statusFilter={statusFilter} onStatusChange={setStatusFilter}
              categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
            />
            <SubscriptionList items={assinaturas} onEdit={handleEdit} onPause={handlePause} onCancel={handleCancel} emptyMessage="Nenhuma assinatura encontrada" />
          </div>
        )}

        {activeTab === 'contas' && (
          <div className="space-y-4">
            <SubscriptionFilters
              search={search} onSearchChange={setSearch}
              statusFilter={statusFilter} onStatusChange={setStatusFilter}
              categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
            />
            <SubscriptionList items={contas} onEdit={handleEdit} onPause={handlePause} onCancel={handleCancel} emptyMessage="Nenhuma conta fixa encontrada" />
          </div>
        )}

        {activeTab === 'alertas' && <SubscriptionAlerts alerts={alerts} />}
      </div>

      <SubscriptionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editItem={editItem}
        onSave={create}
        onUpdate={update}
        isSaving={isCreating || isUpdating}
      />

      <CancelSubscriptionDialog
        open={!!cancelItem}
        onOpenChange={(open) => !open && setCancelItem(null)}
        item={cancelItem}
        onConfirm={handleConfirmCancel}
      />
    </AppLayout>
  );
}
