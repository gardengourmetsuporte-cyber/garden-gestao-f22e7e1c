import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DesktopActionBar } from '@/components/layout/DesktopActionBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomerSheet } from '@/components/customers/CustomerSheet';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { CustomerImportCSV } from '@/components/customers/CustomerImportCSV';
import { MessageCampaignSheet } from '@/components/customers/MessageCampaignSheet';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerCRM, useCustomerEvents } from '@/hooks/useCustomerCRM';
import { EmptyState } from '@/components/ui/empty-state';
import type { Customer, CustomerSegment } from '@/types/customer';
import { SEGMENT_CONFIG } from '@/types/customer';
import { BirthdayAlerts } from '@/components/customers/BirthdayAlerts';
import { useFabAction } from '@/contexts/FabActionContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SEGMENTS: CustomerSegment[] = ['vip', 'frequent', 'occasional', 'inactive', 'new'];
const PAGE_SIZE = 30;

export default function Customers() {
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer, importCSV } = useCustomers();
  const { stats, addEvent, loyaltyRules } = useCustomerCRM(customers);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedForMessage, setSelectedForMessage] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const { data: detailEvents = [], isLoading: eventsLoading } = useCustomerEvents(detailCustomer?.id || null);

  const openNewSheet = useCallback(() => {
    setEditing(null);
    setSheetOpen(true);
  }, []);

  useFabAction({ icon: 'Plus', label: 'Novo cliente', onClick: openNewSheet }, [openNewSheet]);

  const filtered = useMemo(() => {
    let list = customers;
    if (segmentFilter) list = list.filter(c => c.segment === segmentFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [customers, search, segmentFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, segmentFilter]);

  const visibleCustomers = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const segCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SEGMENTS.forEach(s => { counts[s] = customers.filter(c => c.segment === s).length; });
    return counts;
  }, [customers]);

  const handleSave = async (data: Partial<Customer>) => {
    if (data.id) {
      updateCustomer.mutate(data as any, {
        onSuccess: () => { setSheetOpen(false); setEditing(null); },
      });
    } else {
      createCustomer.mutateAsync(data).then(() => setSheetOpen(false)).catch(() => {});
    }
  };

  // Toggle selection for messaging
  const toggleSelect = (id: string) => {
    setSelectedForMessage(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const withPhone = filtered.filter(c => c.phone?.trim());
    setSelectedForMessage(new Set(withPhone.map(c => c.id)));
  };

  const campaignRecipients = useMemo(() => {
    if (selectMode && selectedForMessage.size > 0) {
      return customers.filter(c => selectedForMessage.has(c.id));
    }
    return filtered;
  }, [selectMode, selectedForMessage, customers, filtered]);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedForMessage(new Set());
  };

  return (
    <AppLayout>
      <div className="px-4 py-3 lg:px-8 lg:max-w-6xl lg:mx-auto space-y-4 pb-24 lg:pb-12">
        <DesktopActionBar label="Novo Cliente" onClick={openNewSheet} />

        {/* Compact stats row */}
        <div className="flex items-center gap-4 lg:gap-6 text-xs text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground">{stats.total} clientes</span>
          <span>{stats.activeThisMonth} ativos</span>
          <span>{stats.inactive} inativos</span>
          <span>Ticket R${stats.avgTicket.toFixed(0)}</span>
          <span>Retorno {stats.returnRate.toFixed(0)}%</span>
        </div>

        {/* Birthday alerts */}
        <BirthdayAlerts customers={customers} />

        {/* Select mode bar */}
        {selectMode && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <AppIcon name="CheckSquare" size={16} className="text-primary" />
            <span className="text-sm font-medium text-primary flex-1">
              {selectedForMessage.size} selecionado{selectedForMessage.size !== 1 ? 's' : ''}
            </span>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={selectAll}>
              Selecionar todos com telefone
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={exitSelectMode}>
              Cancelar
            </Button>
            {selectedForMessage.size > 0 && (
              <Button size="sm" className="text-xs h-7" onClick={() => setCampaignOpen(true)}>
                <AppIcon name="Send" size={14} className="mr-1" />
                Enviar
              </Button>
            )}
          </div>
        )}

        {/* Search + Segment filter + Actions */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: 18 }}>
              search
            </span>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-10 h-11 border-border/50 bg-card"
            />
          </div>
          <Select
            value={segmentFilter || 'all'}
            onValueChange={v => setSegmentFilter(v === 'all' ? null : v as CustomerSegment)}
          >
            <SelectTrigger className="h-11 min-w-[130px] rounded-xl text-xs font-semibold border-border/50 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({customers.length})</SelectItem>
              {SEGMENTS.map(seg => {
                const cfg = SEGMENT_CONFIG[seg];
                return (
                  <SelectItem key={seg} value={seg}>
                    {cfg.label} ({segCounts[seg] || 0})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {/* Message campaign button - always visible */}
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11 shrink-0 border-border/50"
            onClick={() => {
              if (selectMode) {
                setCampaignOpen(true);
              } else {
                setSelectMode(true);
              }
            }}
            title="Enviar mensagem"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>campaign</span>
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11 shrink-0 border-border/50"
            onClick={() => setCsvOpen(true)}
            title="Importar clientes"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upload_file</span>
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-[88px] rounded-xl bg-secondary/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="Users"
            title="Nenhum cliente"
            subtitle={search || segmentFilter ? 'Nenhum resultado para os filtros.' : 'Cadastre seu primeiro cliente ou importe um CSV.'}
            actionLabel="Cadastrar cliente"
            actionIcon="Plus"
            onAction={openNewSheet}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {visibleCustomers.map(c => (
                <div key={c.id} className="relative">
                  {selectMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(c.id); }}
                      className={cn(
                        "absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                        selectedForMessage.has(c.id)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/40 bg-background/80"
                      )}
                    >
                      {selectedForMessage.has(c.id) && (
                        <AppIcon name="Check" size={14} className="text-primary-foreground" />
                      )}
                    </button>
                  )}
                  <div className={cn(selectMode && "pl-8")}>
                    <CustomerCard
                      customer={c}
                      onEdit={() => { if (!selectMode) setDetailCustomer(c); else toggleSelect(c.id); }}
                      onDelete={() => setDeletingId(c.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < filtered.length && (
              <Button
                variant="outline"
                className="w-full mt-3 rounded-xl border-border/50"
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              >
                Mostrar mais ({filtered.length - visibleCount} restantes)
              </Button>
            )}
          </>
        )}
      </div>

      <CustomerDetail
        open={!!detailCustomer}
        onOpenChange={(v) => { if (!v) setDetailCustomer(null); }}
        customer={detailCustomer}
        events={detailEvents}
        eventsLoading={eventsLoading}
        loyaltyRules={loyaltyRules}
        onEdit={() => {
          setEditing(detailCustomer);
          setDetailCustomer(null);
          setSheetOpen(true);
        }}
        onAddPoints={(customerId) => {
          addEvent.mutate({ customer_id: customerId, type: 'earn', points: 10, description: 'Pontos manuais' });
        }}
      />

      <CustomerSheet
        open={sheetOpen}
        onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditing(null); }}
        customer={editing}
        onSave={handleSave}
        isSaving={createCustomer.isPending || updateCustomer.isPending}
      />

      <MessageCampaignSheet
        open={campaignOpen}
        onOpenChange={(v) => { setCampaignOpen(v); if (!v) exitSelectMode(); }}
        customers={campaignRecipients}
        segment={segmentFilter}
      />

      <CustomerImportCSV
        open={csvOpen}
        onOpenChange={setCsvOpen}
        onImport={(rows) => importCSV.mutate(rows, { onSuccess: () => setCsvOpen(false) })}
        isImporting={importCSV.isPending}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletingId) deleteCustomer.mutate(deletingId); setDeletingId(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
