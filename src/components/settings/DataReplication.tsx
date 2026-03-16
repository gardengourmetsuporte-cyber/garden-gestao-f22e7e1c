import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoadingButton } from '@/components/ui/loading-button';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReplicationModule {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  destructive?: boolean;
}

const MODULES: ReplicationModule[] = [
  { key: 'inventory', label: 'Estoque', description: 'Categorias e produtos (saldo zerado)', icon: 'Package', color: '#22c55e' },
  { key: 'suppliers', label: 'Fornecedores', description: 'Cadastro de fornecedores', icon: 'Truck', color: '#3b82f6' },
  { key: 'checklists', label: 'Checklists', description: 'Setores, subcategorias e itens', icon: 'ClipboardCheck', color: '#f59e0b' },
  { key: 'finance', label: 'Categorias Financeiras', description: 'Árvore de receitas e despesas', icon: 'Wallet', color: '#8b5cf6' },
  { key: 'menu', label: 'Cardápio Digital', description: 'Categorias, grupos e produtos', icon: 'UtensilsCrossed', color: '#ef4444', destructive: true },
];

interface ModuleResult {
  key: string;
  count: number;
  detail: string;
}

export function DataReplication() {
  const { activeUnitId, units } = useUnit();
  const [sourceUnitId, setSourceUnitId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ModuleResult[]>([]);

  const otherUnits = units.filter(u => u.id !== activeUnitId);
  const targetUnit = units.find(u => u.id === activeUnitId);

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const hasDestructive = [...selected].some(k => MODULES.find(m => m.key === k)?.destructive);

  // ── Replication functions ──

  async function replicateInventory(source: string, target: string): Promise<ModuleResult> {
    const [catRes, itemRes] = await Promise.all([
      supabase.from('categories').select('*').eq('unit_id', source).order('sort_order'),
      supabase.from('inventory_items').select('*').eq('unit_id', source).is('deleted_at' as any, null).order('name'),
    ]);
    const cats = catRes.data || [];
    const items = itemRes.data || [];

    const { data: existingCats } = await supabase.from('categories').select('id, name').eq('unit_id', target);
    const existingCatNames = new Set((existingCats || []).map(c => c.name.toLowerCase()));
    const catIdMap: Record<string, string> = {};

    for (const cat of cats) {
      if (existingCatNames.has(cat.name.toLowerCase())) {
        const existing = (existingCats || []).find(c => c.name.toLowerCase() === cat.name.toLowerCase());
        if (existing) catIdMap[cat.id] = existing.id;
        continue;
      }
      const { data: newCat } = await supabase.from('categories').insert({
        unit_id: target, name: cat.name, color: cat.color, icon: cat.icon, sort_order: cat.sort_order,
      }).select('id').single();
      if (newCat) catIdMap[cat.id] = newCat.id;
    }

    const { data: existingItems } = await supabase.from('inventory_items').select('name').eq('unit_id', target).is('deleted_at' as any, null);
    const existingItemNames = new Set((existingItems || []).map(i => (i as any).name?.toLowerCase()));
    let inserted = 0;

    for (const item of items) {
      if (existingItemNames.has(item.name?.toLowerCase())) continue;
      await supabase.from('inventory_items').insert({
        unit_id: target, name: item.name, category_id: item.category_id ? catIdMap[item.category_id] || null : null,
        supplier_id: null, unit_type: item.unit_type, current_stock: 0, min_stock: item.min_stock, unit_price: item.unit_price || 0,
      } as any);
      inserted++;
    }

    return { key: 'inventory', count: inserted + Object.keys(catIdMap).length, detail: `${Object.keys(catIdMap).length} categorias, ${inserted} produtos` };
  }

  async function replicateSuppliers(source: string, target: string): Promise<ModuleResult> {
    const { data: srcSuppliers } = await supabase.from('suppliers').select('*').eq('unit_id', source).order('name');
    const { data: existingSuppliers } = await supabase.from('suppliers').select('name').eq('unit_id', target);
    const existingNames = new Set((existingSuppliers || []).map(s => s.name.toLowerCase()));
    let inserted = 0;

    for (const s of srcSuppliers || []) {
      if (existingNames.has(s.name.toLowerCase())) continue;
      await supabase.from('suppliers').insert({ unit_id: target, name: s.name, phone: s.phone, email: s.email, notes: s.notes } as any);
      inserted++;
    }

    return { key: 'suppliers', count: inserted, detail: `${inserted} fornecedores` };
  }

  async function replicateChecklists(source: string, target: string): Promise<ModuleResult> {
    const { data: srcSectors } = await supabase.from('checklist_sectors').select('*').eq('unit_id', source).order('sort_order');
    if (!srcSectors?.length) return { key: 'checklists', count: 0, detail: 'Nenhum setor encontrado' };

    let totalItems = 0;
    for (const sector of srcSectors) {
      const { data: newSector } = await supabase.from('checklist_sectors')
        .insert({ name: sector.name, color: sector.color, icon: sector.icon, sort_order: sector.sort_order, unit_id: target })
        .select().single();
      if (!newSector) continue;

      const { data: srcSubs } = await supabase.from('checklist_subcategories').select('*').eq('sector_id', sector.id).eq('unit_id', source).order('sort_order');
      for (const sub of srcSubs || []) {
        const { data: newSub } = await supabase.from('checklist_subcategories')
          .insert({ sector_id: newSector.id, name: sub.name, sort_order: sub.sort_order, unit_id: target })
          .select().single();
        if (!newSub) continue;

        const { data: srcItems } = await supabase.from('checklist_items').select('*').eq('subcategory_id', sub.id).eq('unit_id', source).is('deleted_at', null).order('sort_order');
        if (srcItems?.length) {
          await supabase.from('checklist_items').insert(srcItems.map(item => ({
            subcategory_id: newSub.id, name: item.name, description: item.description, frequency: item.frequency,
            checklist_type: item.checklist_type, sort_order: item.sort_order, points: item.points, is_active: item.is_active, unit_id: target,
          })));
          totalItems += srcItems.length;
        }
      }
    }

    return { key: 'checklists', count: srcSectors.length + totalItems, detail: `${srcSectors.length} setores, ${totalItems} itens` };
  }

  async function replicateFinanceCategories(source: string, target: string): Promise<ModuleResult> {
    const { data: srcCats } = await supabase.from('finance_categories').select('*').eq('unit_id', source).is('parent_id', null).order('sort_order');
    const { data: existingCats } = await supabase.from('finance_categories').select('id, name, type').eq('unit_id', target).is('parent_id', null);
    const existingMap = new Map((existingCats || []).map(c => [`${c.name.toLowerCase()}_${c.type}`, c.id]));

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error('Não autenticado');

    let inserted = 0;
    for (const cat of srcCats || []) {
      const key = `${cat.name.toLowerCase()}_${cat.type}`;
      let parentId: string;

      if (existingMap.has(key)) {
        parentId = existingMap.get(key)!;
      } else {
        const { data: newCat } = await supabase.from('finance_categories').insert({
          user_id: userId, unit_id: target, name: cat.name, type: cat.type, icon: cat.icon, color: cat.color,
          is_system: cat.is_system, sort_order: cat.sort_order,
        }).select('id').single();
        if (!newCat) continue;
        parentId = newCat.id;
        inserted++;
      }

      // Subcategories
      const { data: srcSubs } = await supabase.from('finance_categories').select('*').eq('parent_id', cat.id).eq('unit_id', source).order('sort_order');
      const { data: existingSubs } = await supabase.from('finance_categories').select('name, type').eq('parent_id', parentId).eq('unit_id', target);
      const existingSubNames = new Set((existingSubs || []).map(s => `${s.name.toLowerCase()}_${s.type}`));

      for (const sub of srcSubs || []) {
        const subKey = `${sub.name.toLowerCase()}_${sub.type}`;
        if (existingSubNames.has(subKey)) continue;
        await supabase.from('finance_categories').insert({
          user_id: userId, unit_id: target, name: sub.name, type: sub.type, icon: sub.icon, color: sub.color,
          is_system: sub.is_system, sort_order: sub.sort_order, parent_id: parentId,
        });
        inserted++;
      }
    }

    return { key: 'finance', count: inserted, detail: `${inserted} categorias` };
  }

  async function replicateMenu(source: string, target: string): Promise<ModuleResult> {
    const [catRes, grpRes, prodRes] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('unit_id', source),
      supabase.from('menu_groups').select('*').eq('unit_id', source),
      supabase.from('tablet_products').select('*').eq('unit_id', source),
    ]);
    const cats = catRes.data || [];
    const grps = grpRes.data || [];
    const prods = prodRes.data || [];

    await supabase.from('tablet_products').delete().eq('unit_id', target);
    await supabase.from('menu_groups').delete().eq('unit_id', target);
    await supabase.from('menu_categories').delete().eq('unit_id', target);

    const catIdMap: Record<string, string> = {};
    for (const cat of cats) {
      const { data: newCat } = await supabase.from('menu_categories').insert({
        unit_id: target, name: cat.name, icon: cat.icon, color: cat.color, sort_order: cat.sort_order, is_active: cat.is_active,
      }).select('id').single();
      if (newCat) catIdMap[cat.id] = newCat.id;
    }

    const grpIdMap: Record<string, string> = {};
    for (const grp of grps) {
      const newCatId = catIdMap[grp.category_id];
      if (!newCatId) continue;
      const { data: newGrp } = await supabase.from('menu_groups').insert({
        unit_id: target, name: grp.name, category_id: newCatId, description: grp.description,
        availability: grp.availability, sort_order: grp.sort_order, is_active: grp.is_active,
      }).select('id').single();
      if (newGrp) grpIdMap[grp.id] = newGrp.id;
    }

    for (const prod of prods) {
      await supabase.from('tablet_products').insert({
        unit_id: target, name: prod.name, price: prod.price, coin_price: prod.coin_price, codigo_pdv: prod.codigo_pdv,
        category: prod.category, description: prod.description, sort_order: prod.sort_order, is_active: prod.is_active,
        group_id: prod.group_id ? grpIdMap[prod.group_id] || null : null, is_highlighted: prod.is_highlighted,
        is_18_plus: prod.is_18_plus, availability: prod.availability, price_type: prod.price_type, custom_prices: prod.custom_prices,
      });
    }

    return { key: 'menu', count: cats.length + grps.length + prods.length, detail: `${cats.length} categorias, ${grps.length} grupos, ${prods.length} produtos` };
  }

  // ── Execute ──

  const handleReplicate = async () => {
    if (!activeUnitId || !sourceUnitId || selected.size === 0) return;
    setLoading(true);
    setResults([]);

    const moduleResults: ModuleResult[] = [];

    try {
      const runners: Record<string, () => Promise<ModuleResult>> = {
        inventory: () => replicateInventory(sourceUnitId, activeUnitId),
        suppliers: () => replicateSuppliers(sourceUnitId, activeUnitId),
        checklists: () => replicateChecklists(sourceUnitId, activeUnitId),
        finance: () => replicateFinanceCategories(sourceUnitId, activeUnitId),
        menu: () => replicateMenu(sourceUnitId, activeUnitId),
      };

      for (const key of selected) {
        if (runners[key]) {
          const r = await runners[key]();
          moduleResults.push(r);
        }
      }

      setResults(moduleResults);
      toast.success('Replicação concluída com sucesso!');
    } catch (err: any) {
      toast.error('Erro na replicação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (otherUnits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <AppIcon name="Copy" size={40} className="text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Você precisa ter mais de uma loja para replicar dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">Replicar Dados</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Copie dados de uma loja para <strong>{targetUnit?.name || 'a loja atual'}</strong>.
        </p>
      </div>

      {/* Source selector */}
      <div className="card-surface rounded-2xl p-4 space-y-3">
        <label className="section-label">Origem</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select value={sourceUnitId} onValueChange={setSourceUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loja de origem" />
              </SelectTrigger>
              <SelectContent>
                {otherUnits.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AppIcon name="ArrowRight" size={18} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate max-w-[120px]">{targetUnit?.name}</span>
        </div>
      </div>

      {/* Module grid */}
      <div className="space-y-2">
        <label className="section-label">Módulos</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULES.map(mod => {
            const isSelected = selected.has(mod.key);
            return (
              <button
                key={mod.key}
                onClick={() => toggle(mod.key)}
                className={cn(
                  "card-surface rounded-2xl p-4 flex items-start gap-3 text-left transition-all border-2",
                  isSelected ? "border-primary bg-primary/5" : "border-transparent hover:bg-secondary/30"
                )}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: mod.color }}
                >
                  <AppIcon name={mod.icon} size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{mod.label}</span>
                    {mod.destructive && (
                      <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">SUBSTITUI</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                </div>
                <Checkbox checked={isSelected} className="mt-1 pointer-events-none" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Action */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <LoadingButton
            loading={loading}
            disabled={!sourceUnitId || selected.size === 0}
            className="w-full"
            loadingText="Replicando..."
          >
            <AppIcon name="Copy" size={16} />
            Replicar {selected.size} módulo{selected.size !== 1 ? 's' : ''}
          </LoadingButton>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Replicação</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>Os seguintes módulos serão copiados:</span>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {[...selected].map(k => {
                  const mod = MODULES.find(m => m.key === k);
                  return mod ? <li key={k}><strong>{mod.label}</strong> — {mod.description}</li> : null;
                })}
              </ul>
              {hasDestructive && (
                <p className="text-destructive font-medium mt-3">
                  ⚠️ Módulos marcados como "SUBSTITUI" irão apagar os dados existentes na loja destino.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReplicate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Results */}
      {results.length > 0 && (
        <div className="card-surface rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <AppIcon name="CheckCircle2" size={16} />
            Replicação concluída
          </div>
          {results.map(r => {
            const mod = MODULES.find(m => m.key === r.key);
            return (
              <div key={r.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{mod?.label}:</span>
                {r.detail}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
