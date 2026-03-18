import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { GradientIcon, GradientIconColor } from '@/components/ui/gradient-icon';
import { useSubscriptions, Subscription } from '@/hooks/useSubscriptions';
import { SubscriptionDashboard } from '@/components/subscriptions/SubscriptionDashboard';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { SubscriptionSheet } from '@/components/subscriptions/SubscriptionSheet';
import { SubscriptionFilters } from '@/components/subscriptions/SubscriptionFilters';
import { SubscriptionAlerts } from '@/components/subscriptions/SubscriptionAlerts';
import { CancelSubscriptionDialog } from '@/components/subscriptions/CancelSubscriptionDialog';
import { RecurringSuggestions } from '@/components/subscriptions/RecurringSuggestions';
import { RecurringSuggestion } from '@/hooks/useRecurringSuggestions';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/PageLoader';
import { useFabAction } from '@/contexts/FabActionContext';

type Tab = 'dashboard' | 'assinaturas' | 'contas' | 'alertas';

const tabs: { key: Tab; label: string; iconName: string; color: GradientIconColor }[] = [
  { key: 'dashboard', label: 'Dashboard', iconName: 'LayoutDashboard', color: 'primary' },
  { key: 'assinaturas', label: 'Assinaturas', iconName: 'CreditCard', color: 'blue' },
  { key: 'contas', label: 'Contas', iconName: 'Building2', color: 'purple' },
  { key: 'alertas', label: 'Alertas', iconName: 'Bell', color: 'amber' },
];

export default function Subscriptions() {
  const { subscriptions, isLoading, totalMonthly, activeCount, upcomingBills, alerts, create, update, remove, isCreating, isUpdating } = useSubscriptions();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<Subscription | null>(null);
  const [cancelItem, setCancelItem] = useState<Subscription | null>(null);
  const [deleteItem, setDeleteItem] = useState<Subscription | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Prefill from suggestion for edit-before-add
  const [prefillData, setPrefillData] = useState<Partial<Subscription> | null>(null);

  // Receive prefill from Finance module via navigation state
  useEffect(() => {
    const state = location.state as { prefill?: { name: string; price: number; category: string } } | null;
    if (state?.prefill) {
      setEditItem(null);
      setPrefillData({
        name: state.prefill.name || '',
        price: state.prefill.price || 0,
        status: 'ativo',
        billing_cycle: 'mensal',
      } as Partial<Subscription>);
      setSheetOpen(true);
      // Clear the state so it doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // FAB para criação
  useFabAction({ icon: 'Plus', label: 'Novo', onClick: () => { setEditItem(null); setPrefillData(null); setSheetOpen(true); } }, []);

  const handleEditBeforeAdd = (suggestion: RecurringSuggestion) => {
    setEditItem(null);
    setPrefillData({
      name: suggestion.name,
      category: suggestion.category,
      type: suggestion.type,
      price: suggestion.price,
      billing_cycle: suggestion.billing_cycle,
      management_url: suggestion.management_url || null,
      status: 'ativo',
    } as Partial<Subscription>);
    setSheetOpen(true);
  };

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
  const handleDelete = (item: Subscription) => setDeleteItem(item);
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    await remove(deleteItem.id);
    setDeleteItem(null);
  };
  const handleReactivate = async (item: Subscription) => {
    await update({ id: item.id, status: 'ativo' } as any);
  };

  if (isLoading) return <AppLayout><PageLoader /></AppLayout>;

  return (
    <AppLayout>
      <div className="px-4 py-4 pb-36 lg:pb-12 space-y-4 overflow-hidden">
        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center gap-1.5 flex-1 min-w-[72px] py-3 rounded-2xl text-[10px] font-medium whitespace-nowrap transition-all active:scale-[0.96] ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <GradientIcon
                  name={tab.iconName}
                  color={isActive ? tab.color : 'muted'}
                  size="sm"
                />
                {tab.label}
                {tab.key === 'alertas' && alerts.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 text-[9px] h-4 min-w-4 px-1 border-0">{alerts.length}</Badge>
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
          <div className="space-y-3">
            <RecurringSuggestions typeFilter="assinatura" onEditBeforeAdd={handleEditBeforeAdd} />
            <SubscriptionFilters
              search={search} onSearchChange={setSearch}
              statusFilter={statusFilter} onStatusChange={setStatusFilter}
              categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
            />
            <SubscriptionList items={assinaturas} onEdit={handleEdit} onPause={handlePause} onCancel={handleCancel} onDelete={handleDelete} onReactivate={handleReactivate} emptyMessage="Nenhuma assinatura encontrada" />
          </div>
        )}

        {activeTab === 'contas' && (
          <div className="space-y-3">
            <RecurringSuggestions typeFilter="conta_fixa" onEditBeforeAdd={handleEditBeforeAdd} />
            <SubscriptionFilters
              search={search} onSearchChange={setSearch}
              statusFilter={statusFilter} onStatusChange={setStatusFilter}
              categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
            />
            <SubscriptionList items={contas} onEdit={handleEdit} onPause={handlePause} onCancel={handleCancel} onDelete={handleDelete} onReactivate={handleReactivate} emptyMessage="Nenhuma conta fixa encontrada" />
          </div>
        )}

        {activeTab === 'alertas' && <SubscriptionAlerts alerts={alerts} />}
      </div>

      <SubscriptionSheet
        open={sheetOpen}
        onOpenChange={(open) => { setSheetOpen(open); if (!open) setPrefillData(null); }}
        editItem={editItem}
        prefillData={prefillData}
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

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              O item "{deleteItem?.name}" será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
