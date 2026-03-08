import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/types/recipe';
import type { SyncableRecipe } from '@/hooks/useRecipeMenuSync';
import type { MenuGroup } from '@/hooks/useMenuAdmin';

interface Props {
  recipes: SyncableRecipe[];
  groups: MenuGroup[];
  syncing: boolean;
  alreadySyncedCount: number;
  onSync: (recipeIds: string[], groupId: string, margin: number, overrideExisting: boolean) => void;
  onRefreshCosts: () => void;
}

export function RecipeSyncPanel({ recipes, groups, syncing, alreadySyncedCount, onSync, onRefreshCosts }: Props) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [margin, setMargin] = useState(300);
  const [overrideExisting, setOverrideExisting] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return recipes;
    const q = search.toLowerCase();
    return recipes.filter(r => r.name.toLowerCase().includes(q) || r.category?.name?.toLowerCase().includes(q));
  }, [recipes, search]);

  const unlinked = filtered.filter(r => !r.linkedProductId);
  const linked = filtered.filter(r => r.linkedProductId);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const ids = unlinked.map(r => r.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const handleSync = () => {
    if (!targetGroupId) return;
    onSync(Array.from(selectedIds), targetGroupId, margin, overrideExisting);
    setSelectedIds(new Set());
  };

  if (recipes.length === 0) {
    return (
      <EmptyState
        icon="ChefHat"
        title="Nenhuma receita ativa"
        subtitle="Crie fichas técnicas no módulo de Receitas para espelhar no cardápio."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="card-base p-4">
        <div className="flex items-center gap-3">
          <div className="icon-glow icon-glow-md icon-glow-primary">
            <AppIcon name="RefreshCw" size={18} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground">Sincronizar Receitas → Cardápio</h2>
            <p className="text-xs text-muted-foreground">
              {alreadySyncedCount} de {recipes.length} receitas já vinculadas
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefreshCosts} disabled={syncing || alreadySyncedCount === 0}>
            <AppIcon name="RefreshCw" size={14} className={syncing ? 'animate-spin' : ''} />
            <span className="ml-1.5">Atualizar custos</span>
          </Button>
        </div>
      </div>

      {/* Configuration */}
      <div className="card-base p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuração de Sincronização</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Grupo destino</label>
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Margem de lucro (%)</label>
            <Input
              type="number"
              value={margin}
              onChange={e => setMargin(Number(e.target.value))}
              className="h-9"
              min={0}
              step={10}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={overrideExisting}
            onCheckedChange={(v) => setOverrideExisting(!!v)}
          />
          <span className="text-xs text-muted-foreground">Atualizar produtos já vinculados</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar receitas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Unlinked recipes */}
      {unlinked.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Não vinculadas ({unlinked.length})
            </p>
            <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
              {unlinked.every(r => selectedIds.has(r.id)) ? 'Desmarcar' : 'Selecionar'} todas
            </Button>
          </div>
          {unlinked.map(r => (
            <RecipeRow key={r.id} recipe={r} selected={selectedIds.has(r.id)} onToggle={() => toggle(r.id)} margin={margin} />
          ))}
        </div>
      )}

      {/* Linked recipes */}
      {linked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Já vinculadas ({linked.length})
          </p>
          {linked.map(r => (
            <RecipeRow key={r.id} recipe={r} linked margin={margin} />
          ))}
        </div>
      )}

      {/* Sync button */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-20 z-10">
          <Button
            className="w-full gap-2"
            onClick={handleSync}
            disabled={syncing || !targetGroupId}
          >
            <AppIcon name="Zap" size={16} />
            Sincronizar {selectedIds.size} receita{selectedIds.size > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}

function RecipeRow({ recipe, selected, onToggle, linked, margin }: {
  recipe: SyncableRecipe;
  selected?: boolean;
  onToggle?: () => void;
  linked?: boolean;
  margin: number;
}) {
  const suggestedPrice = Math.round(recipe.fullCost * (1 + margin / 100) * 100) / 100;

  return (
    <div
      className={`card-base p-3 flex items-center gap-3 transition-colors ${
        selected ? 'ring-1 ring-primary/50 bg-primary/5' : ''
      } ${linked ? 'opacity-70' : 'cursor-pointer'}`}
      onClick={!linked ? onToggle : undefined}
    >
      {!linked && (
        <Checkbox checked={selected} onCheckedChange={onToggle} onClick={e => e.stopPropagation()} />
      )}
      {linked && (
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
          <AppIcon name="Link" size={12} className="text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{recipe.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {recipe.category && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0" style={{ borderColor: recipe.category.color, color: recipe.category.color }}>
              {recipe.category.name}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            Custo: {formatCurrency(recipe.fullCost)}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {linked && recipe.currentMenuPrice != null ? (
          <>
            <p className="text-sm font-bold text-foreground">{formatCurrency(recipe.currentMenuPrice)}</p>
            <p className="text-[10px] text-muted-foreground">
              {recipe.currentMargin != null ? `${recipe.currentMargin.toFixed(0)}% margem` : ''}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-primary">{formatCurrency(suggestedPrice)}</p>
            <p className="text-[10px] text-muted-foreground">{margin}% margem</p>
          </>
        )}
      </div>
    </div>
  );
}
