import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
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
import { useFabAction } from '@/contexts/FabActionContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SEGMENTS: CustomerSegment[] = ['vip', 'frequent', 'occasional', 'inactive', 'new'];


export default function Customers() {
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer, importCSV } = useCustomers();
  const { activeUnit } = useUnit();
  const qc = useQueryClient();
  const { stats, addEvent } = useCustomerCRM(customers);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [campaignOpen, setCampaignOpen] = useState(false);

  const { data: detailEvents = [], isLoading: eventsLoading } = useCustomerEvents(detailCustomer?.id || null);

  const openNewSheet = useCallback(() => {
    setEditing(null);
    setSheetOpen(true);
  }, []);

  useFabAction({ icon: 'Plus', label: 'Novo cliente', onClick: openNewSheet }, [openNewSheet]);

  // One-time auto-import of Goomer customers CSV
  useEffect(() => {
    const IMPORT_KEY = 'goomer_customers_imported_v1';
    if (localStorage.getItem(IMPORT_KEY) || !activeUnit) return;
    
    const doImport = async () => {
      try {
        const res = await fetch('/data/goomer-customers.csv');
        if (!res.ok) return;
        const csvText = await res.text();
        if (!csvText.includes('"Nome"') || !csvText.includes(';')) return;
        
        localStorage.setItem(IMPORT_KEY, 'pending');
        const { error, data } = await supabase.functions.invoke('import-customers-csv', {
          body: { csvText, unitId: activeUnit.id },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        localStorage.setItem(IMPORT_KEY, 'done');
        toast.success(`${data.inserted} clientes importados do Goomer!`);
        qc.invalidateQueries({ queryKey: ['customers'] });
      } catch (err: any) {
        console.error('Auto-import failed:', err);
        localStorage.removeItem(IMPORT_KEY);
      }
    };
    
    doImport();
  }, [activeUnit, qc]);

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
      <div className="px-4 py-3 lg:px-6 space-y-4 pb-24">
        {/* Compact stats row */}
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{stats.total} clientes</span>
          <span>{stats.activeThisMonth} ativos</span>
          <span>{stats.inactive} inativos</span>
          <span>Ticket R${stats.avgTicket.toFixed(0)}</span>
          <span>Retorno {stats.returnRate.toFixed(0)}%</span>
        </div>

        {/* Search + Segment filter inline */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: 18 }}>
              search
            </span>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-10 h-11" />
          </div>
          <select
            value={segmentFilter || ''}
            onChange={e => setSegmentFilter((e.target.value || null) as CustomerSegment | null)}
            className="h-11 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground appearance-none cursor-pointer min-w-[120px]"
          >
            <option value="">Todos ({customers.length})</option>
            {SEGMENTS.map(seg => {
              const cfg = SEGMENT_CONFIG[seg];
              return (
                <option key={seg} value={seg}>
                  {cfg.label} ({segCounts[seg] || 0})
                </option>
              );
            })}
          </select>
          {segmentFilter && (
            <Button size="icon" variant="outline" className="h-11 w-11 shrink-0" onClick={() => setCampaignOpen(true)} title="Enviar mensagem em massa">
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>campaign</span>
            </Button>
          )}
          <Button size="icon" variant="outline" className="h-11 w-11 shrink-0" onClick={() => setCsvOpen(true)}>
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
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
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

      <MessageCampaignSheet
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        customers={filtered}
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
