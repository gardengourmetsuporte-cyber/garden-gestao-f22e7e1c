import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { ObligationCard } from '@/components/compliance/ObligationCard';
import { ObligationSheet } from '@/components/compliance/ObligationSheet';
import { useObligations, getObligationStatus } from '@/hooks/useObligations';
import { useFabAction } from '@/contexts/FabActionContext';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'expired', label: 'Vencidos' },
  { key: 'warning', label: 'A vencer' },
  { key: 'ok', label: 'Em dia' },
];

export default function Compliance() {
  const { obligations, isLoading, createObligation, updateObligation, deleteObligation } = useObligations();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useFabAction({ icon: 'Plus', label: 'Nova Obrigação', onClick: () => { setEditing(null); setSheetOpen(true); } }, []);

  const filtered = useMemo(() => {
    let list = obligations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.title.toLowerCase().includes(q) || o.category.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      list = list.filter(o => {
        const s = getObligationStatus(o);
        if (statusFilter === 'expired') return s.variant === 'destructive';
        if (statusFilter === 'warning') return s.variant === 'warning';
        return s.variant === 'success';
      });
    }
    return list;
  }, [obligations, search, statusFilter]);

  const expiredCount = obligations.filter(o => getObligationStatus(o).variant === 'destructive').length;
  const warningCount = obligations.filter(o => getObligationStatus(o).variant === 'warning').length;

  return (
    <AppLayout>
      {/* Summary badges */}
      {obligations.length > 0 && (expiredCount > 0 || warningCount > 0) && (
        <div className="flex gap-2 px-4 mb-3">
          {expiredCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ backgroundColor: '#ef444418', color: '#ef4444' }}>
              <AppIcon name="AlertTriangle" size={14} /> {expiredCount} vencido{expiredCount > 1 ? 's' : ''}
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ backgroundColor: '#f59e0b18', color: '#f59e0b' }}>
              <AppIcon name="Clock" size={14} /> {warningCount} a vencer
            </div>
          )}
        </div>
      )}

      {/* Search + Filter */}
      <div className="px-4 mb-3 space-y-2">
        <Input
          placeholder="Buscar obrigação..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-xl"
        />
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
                statusFilter === f.key ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="ShieldCheck"
            title="Nenhuma obrigação cadastrada"
            subtitle="Cadastre alvarás, laudos, licenças e outros documentos obrigatórios."
            actionLabel="Nova Obrigação"
            actionIcon="Plus"
            onAction={() => { setEditing(null); setSheetOpen(true); }}
          />
        ) : (
          filtered.map(o => (
            <ObligationCard
              key={o.id}
              obligation={o}
              onClick={() => { setEditing(o); setSheetOpen(true); }}
            />
          ))
        )}
      </div>

      <ObligationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        obligation={editing}
        onSave={async (data) => {
          if (data.id) await updateObligation(data);
          else await createObligation(data);
        }}
        onDelete={deleteObligation}
      />
    </AppLayout>
  );
}
