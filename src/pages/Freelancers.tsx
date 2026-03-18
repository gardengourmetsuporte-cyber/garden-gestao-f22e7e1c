import { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Megaphone } from 'lucide-react';
import { FreelancerCard } from '@/components/freelancers/FreelancerCard';
import { FreelancerSheet } from '@/components/freelancers/FreelancerSheet';
import { FreelancerBroadcastSheet } from '@/components/freelancers/FreelancerBroadcastSheet';
import { useFreelancers, SECTORS, type Freelancer } from '@/hooks/useFreelancers';
import { EmptyState } from '@/components/ui/empty-state';
import { useFabAction } from '@/contexts/FabActionContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Freelancers() {
  const { freelancers, isLoading, create, update, remove } = useFreelancers();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Freelancer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const openNew = useCallback(() => { setEditing(null); setSheetOpen(true); }, []);
  useFabAction({ icon: 'Plus', label: 'Novo Freelancer', onClick: openNew }, [openNew]);

  const filtered = useMemo(() => {
    let list = freelancers;
    if (sectorFilter) list = list.filter(f => f.sector === sectorFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q) || f.phone.includes(q));
    }
    return list;
  }, [freelancers, sectorFilter, search]);

  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    freelancers.forEach(f => { counts[f.sector] = (counts[f.sector] || 0) + 1; });
    return counts;
  }, [freelancers]);

  const handleSave = async (data: any) => {
    if (data.id) {
      await update(data);
    } else {
      const { id, ...rest } = data;
      await create(rest);
    }
  };

  return (
    <AppLayout title="Freelancers" subtitle={`${freelancers.length} cadastrados`}>
      <div className="space-y-4 pb-24">
        {/* Search + broadcast */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setBroadcastOpen(true)}
            title="Enviar mensagem em massa"
          >
            <Megaphone className="h-4 w-4" />
          </Button>
        </div>

        {/* Sector chips */}
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={sectorFilter === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSectorFilter(null)}
          >
            Todos ({freelancers.length})
          </Badge>
          {SECTORS.map(s => (
            <Badge
              key={s.value}
              variant={sectorFilter === s.value ? 'default' : 'outline'}
              className="cursor-pointer"
              style={sectorFilter === s.value ? { backgroundColor: s.color, color: 'white' } : {}}
              onClick={() => setSectorFilter(s.value)}
            >
              {s.label} ({sectorCounts[s.value] || 0})
            </Badge>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="Users"
            title="Nenhum freelancer"
            description={search || sectorFilter ? 'Nenhum resultado para este filtro.' : 'Cadastre freelancers para acessar rapidamente quando precisar de reforço.'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(f => (
              <FreelancerCard
                key={f.id}
                freelancer={f}
                onEdit={fl => { setEditing(fl); setSheetOpen(true); }}
                onDelete={id => setDeletingId(id)}
              />
            ))}
          </div>
        )}
      </div>

      <FreelancerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        freelancer={editing}
        onSave={handleSave}
      />

      <FreelancerBroadcastSheet
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        freelancers={freelancers}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir freelancer?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deletingId) { remove(deletingId); setDeletingId(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
