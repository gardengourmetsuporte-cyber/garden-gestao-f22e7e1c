import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomerSheet } from '@/components/customers/CustomerSheet';
import { CustomerImportCSV } from '@/components/customers/CustomerImportCSV';
import { useCustomers } from '@/hooks/useCustomers';
import { EmptyState } from '@/components/ui/empty-state';
import { startOfMonth } from 'date-fns';
import type { Customer } from '@/types/customer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Customers() {
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer, importCSV } = useCustomers();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const monthStart = startOfMonth(new Date()).toISOString();
  const newThisMonth = customers.filter(c => c.created_at >= monthStart).length;

  const handleSave = (data: Partial<Customer>) => {
    if (data.id) {
      updateCustomer.mutate(data as any, { onSuccess: () => { setSheetOpen(false); setEditing(null); } });
    } else {
      createCustomer.mutate(data, { onSuccess: () => { setSheetOpen(false); } });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card border p-3 text-center">
            <p className="text-2xl font-bold">{customers.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="rounded-xl bg-card border p-3 text-center">
            <p className="text-2xl font-bold">{newThisMonth}</p>
            <p className="text-[10px] text-muted-foreground">Novos este mês</p>
          </div>
          <div className="rounded-xl bg-card border p-3 text-center">
            <p className="text-2xl font-bold">{new Set(customers.map(c => c.origin)).size}</p>
            <p className="text-[10px] text-muted-foreground">Origens</p>
          </div>
        </div>

        {/* Search + Actions */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="pl-9" />
          </div>
          <Button size="icon" variant="outline" onClick={() => setCsvOpen(true)}>
            <AppIcon name="Upload" size={16} />
          </Button>
          <Button size="icon" onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <AppIcon name="Plus" size={16} />
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="Users"
            title="Nenhum cliente"
            subtitle={search ? 'Nenhum resultado para a busca.' : 'Cadastre seu primeiro cliente ou importe um CSV.'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                onEdit={() => { setEditing(c); setSheetOpen(true); }}
                onDelete={() => setDeletingId(c.id)}
              />
            ))}
          </div>
        )}
      </div>

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
