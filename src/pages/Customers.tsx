import { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomerSheet } from '@/components/customers/CustomerSheet';
import { CustomerDetail } from '@/components/customers/CustomerDetail';
import { CustomerImportCSV } from '@/components/customers/CustomerImportCSV';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerCRM, useCustomerEvents } from '@/hooks/useCustomerCRM';
import { EmptyState } from '@/components/ui/empty-state';
import type { Customer, CustomerSegment } from '@/types/customer';
import { SEGMENT_CONFIG } from '@/types/customer';
import { useFabAction } from '@/contexts/FabActionContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SEGMENTS: CustomerSegment[] = ['vip', 'frequent', 'occasional', 'inactive', 'new'];

export default function Customers() {
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer, importCSV } = useCustomers();
  const { stats, addEvent } = useCustomerCRM(customers);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    return list;
  }, [customers, search, segmentFilter]);

  // Segment counts
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

  return (
    <AppLayout>
      <div className="space-y-4 pb-24">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { label: 'Total', value: stats.total, icon: 'Users' },
            { label: 'Ativos', value: stats.activeThisMonth, icon: 'UserCheck' },
            { label: 'Inativos', value: stats.inactive, icon: 'UserX' },
            { label: 'Ticket', value: `R$${stats.avgTicket.toFixed(0)}`, icon: 'Receipt' },
            { label: 'Retorno', value: `${stats.returnRate.toFixed(0)}%`, icon: 'RefreshCw' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-card border p-2.5 text-center">
              <AppIcon name={s.icon} size={14} className="mx-auto text-muted-foreground mb-0.5" />
              <p className="text-lg font-bold leading-tight">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Segment chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSegmentFilter(null)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              !segmentFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            Todos ({customers.length})
          </button>
          {SEGMENTS.map(seg => {
            const cfg = SEGMENT_CONFIG[seg];
            return (
              <button
                key={seg}
                onClick={() => setSegmentFilter(segmentFilter === seg ? null : seg)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1',
                  segmentFilter === seg ? cn(cfg.bg, cfg.color, 'ring-1 ring-current') : 'bg-secondary text-muted-foreground'
                )}
              >
                <AppIcon name={cfg.icon} size={10} />
                {cfg.label} ({segCounts[seg] || 0})
              </button>
            );
          })}
        </div>

        {/* Search + Import */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9" />
          </div>
          <Button size="icon" variant="outline" onClick={() => setCsvOpen(true)}>
            <AppIcon name="Upload" size={16} />
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-secondary/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="Users"
            title="Nenhum cliente"
            subtitle={search || segmentFilter ? 'Nenhum resultado para os filtros.' : 'Cadastre seu primeiro cliente ou importe um CSV.'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                onEdit={() => setDetailCustomer(c)}
                onDelete={() => setDeletingId(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      <CustomerDetail
        open={!!detailCustomer}
        onOpenChange={(v) => { if (!v) setDetailCustomer(null); }}
        customer={detailCustomer}
        events={detailEvents}
        eventsLoading={eventsLoading}
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
