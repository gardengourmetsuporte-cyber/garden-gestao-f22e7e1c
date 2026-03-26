import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { ObligationChecklistCard } from '@/components/compliance/ObligationChecklistCard';
import { ObligationSheet } from '@/components/compliance/ObligationSheet';
import { CompanyProfileSheet } from '@/components/compliance/CompanyProfileSheet';
import { useObligations, getObligationStatus, OBLIGATION_TEMPLATES, OBLIGATION_CATEGORIES, getCategoryConfig } from '@/hooks/useObligations';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'expired', label: 'Vencidos' },
  { key: 'warning', label: 'A vencer' },
  { key: 'ok', label: 'Em dia' },
];

export default function Compliance() {
  const { obligations, isLoading, createObligation, updateObligation, deleteObligation } = useObligations();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<typeof OBLIGATION_TEMPLATES[number] | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Map obligations by title for matching with templates
  const obligationsByTitle = useMemo(() => {
    const map = new Map<string, typeof obligations[number]>();
    obligations.forEach(o => map.set(o.title, o));
    return map;
  }, [obligations]);

  // Count stats
  const filledCount = OBLIGATION_TEMPLATES.filter(t => obligationsByTitle.has(t.title)).length;
  const totalCount = OBLIGATION_TEMPLATES.length;
  const expiredCount = obligations.filter(o => getObligationStatus(o).variant === 'destructive').length;
  const warningCount = obligations.filter(o => getObligationStatus(o).variant === 'warning').length;

  // Filter templates
  const filtered = useMemo(() => {
    let list = [...OBLIGATION_TEMPLATES];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      list = list.filter(t => t.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter(t => {
        const ob = obligationsByTitle.get(t.title);
        if (statusFilter === 'pending') return !ob || !ob.expiry_date;
        if (!ob) return false;
        const s = getObligationStatus(ob);
        if (statusFilter === 'expired') return s.variant === 'destructive';
        if (statusFilter === 'warning') return s.variant === 'warning';
        return s.variant === 'success';
      });
    }
    return list;
  }, [search, statusFilter, categoryFilter, obligationsByTitle]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filtered]);

  function handleCardClick(template: typeof OBLIGATION_TEMPLATES[number]) {
    const existing = obligationsByTitle.get(template.title);
    setEditingTemplate(template);
    setEditing(existing || null);
    setSheetOpen(true);
  }

  // Unique categories present in filtered results
  const categoryKeys = useMemo(() => {
    const cats = new Set<string>();
    OBLIGATION_TEMPLATES.forEach(t => cats.add(t.category));
    return Array.from(cats);
  }, []);

  return (
    <AppLayout>
      {/* Progress bar */}
      <div className="px-4 mb-3">
        <div className="bg-card rounded-2xl border border-border/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso</span>
            <span className="text-sm font-bold text-primary">{filledCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (filledCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          {(expiredCount > 0 || warningCount > 0) && (
            <div className="flex gap-2 mt-3">
              {expiredCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium" style={{ backgroundColor: '#ef444418', color: '#ef4444' }}>
                  <AppIcon name="AlertTriangle" size={13} /> {expiredCount} vencido{expiredCount > 1 ? 's' : ''}
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium" style={{ backgroundColor: '#f59e0b18', color: '#f59e0b' }}>
                  <AppIcon name="Clock" size={13} /> {warningCount} a vencer
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search + Filters */}
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
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
              categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
            )}
          >
            Todas categorias
          </button>
          {categoryKeys.map(key => {
            const cat = getCategoryConfig(key);
            return (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
                  categoryFilter === key ? 'text-white' : 'text-muted-foreground'
                )}
                style={categoryFilter === key ? { backgroundColor: cat.color } : { backgroundColor: 'hsl(var(--secondary) / 0.5)' }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Checklist cards */}
      <div className="px-4 space-y-5 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          Object.entries(grouped).map(([catKey, templates]) => {
            const cat = getCategoryConfig(catKey);
            const catFilled = templates.filter(t => obligationsByTitle.has(t.title)).length;
            return (
              <div key={catKey}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</h2>
                  <span className="text-[11px] text-muted-foreground ml-auto">{catFilled}/{templates.length}</span>
                </div>
                <div className="space-y-2">
                  {templates.map(t => (
                    <ObligationChecklistCard
                      key={t.title}
                      template={t}
                      obligation={obligationsByTitle.get(t.title) || null}
                      onClick={() => handleCardClick(t)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ObligationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        obligation={editing}
        template={editingTemplate}
        onSave={async (data) => {
          if (data.id) await updateObligation(data);
          else await createObligation(data);
        }}
        onDelete={deleteObligation}
      />
    </AppLayout>
  );
}
