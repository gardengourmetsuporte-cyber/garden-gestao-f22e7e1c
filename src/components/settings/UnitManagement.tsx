import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit, Unit } from '@/contexts/UnitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { AppIcon } from '@/components/ui/app-icon';

interface UserUnitAssignment {
  user_id: string;
  full_name: string;
  is_assigned: boolean;
  is_default: boolean;
}

const CLONE_OPTIONS = [
  { key: 'categories', label: 'Categorias de Estoque', description: 'Grupos de organização do inventário' },
  { key: 'inventory', label: 'Itens de Estoque', description: 'Catálogo de produtos (estoque zerado)' },
  { key: 'suppliers', label: 'Fornecedores', description: 'Lista de fornecedores cadastrados' },
  { key: 'checklists', label: 'Checklists', description: 'Setores, subcategorias e itens' },
  { key: 'finance_categories', label: 'Categorias Financeiras', description: 'Estrutura de receitas e despesas' },
] as const;

type CloneKey = (typeof CLONE_OPTIONS)[number]['key'];

// ─── Clone Logic ────────────────────────────────────────────

async function cloneTemplates(sourceUnitId: string, targetUnitId: string, options: Set<CloneKey>) {
  const results: string[] = [];

  if (options.has('categories')) {
    const { data: cats } = await supabase.from('categories').select('name, color, icon, sort_order').eq('unit_id', sourceUnitId);
    if (cats && cats.length > 0) {
      const { error } = await supabase.from('categories').insert(cats.map(c => ({ ...c, unit_id: targetUnitId })));
      if (error) console.error('Clone categories error:', error.message);
      else results.push(`${cats.length} categorias`);
    }
  }

  if (options.has('suppliers')) {
    const { data: supps } = await supabase.from('suppliers').select('name, phone, email, notes').eq('unit_id', sourceUnitId);
    if (supps && supps.length > 0) {
      const { error } = await supabase.from('suppliers').insert(supps.map(s => ({ ...s, unit_id: targetUnitId })));
      if (error) console.error('Clone suppliers error:', error.message);
      else results.push(`${supps.length} fornecedores`);
    }
  }

  if (options.has('inventory')) {
    let categoryMap = new Map<string, string>();
    if (options.has('categories')) {
      const [{ data: srcCats }, { data: tgtCats }] = await Promise.all([
        supabase.from('categories').select('id, name').eq('unit_id', sourceUnitId),
        supabase.from('categories').select('id, name').eq('unit_id', targetUnitId),
      ]);
      if (srcCats && tgtCats) {
        const tgtByName = new Map(tgtCats.map(c => [c.name, c.id]));
        srcCats.forEach(c => { const t = tgtByName.get(c.name); if (t) categoryMap.set(c.id, t); });
      }
    }
    let supplierMap = new Map<string, string>();
    if (options.has('suppliers')) {
      const [{ data: srcS }, { data: tgtS }] = await Promise.all([
        supabase.from('suppliers').select('id, name').eq('unit_id', sourceUnitId),
        supabase.from('suppliers').select('id, name').eq('unit_id', targetUnitId),
      ]);
      if (srcS && tgtS) {
        const tgtByName = new Map(tgtS.map(s => [s.name, s.id]));
        srcS.forEach(s => { const t = tgtByName.get(s.name); if (t) supplierMap.set(s.id, t); });
      }
    }
    const { data: items } = await supabase.from('inventory_items')
      .select('name, category_id, supplier_id, unit_type, unit_price, min_stock, recipe_unit_type, recipe_unit_price')
      .eq('unit_id', sourceUnitId);
    if (items && items.length > 0) {
      const { error } = await supabase.from('inventory_items').insert(
        items.map(item => ({
          name: item.name,
          category_id: item.category_id ? categoryMap.get(item.category_id) || null : null,
          supplier_id: item.supplier_id ? supplierMap.get(item.supplier_id) || null : null,
          unit_type: item.unit_type, unit_price: item.unit_price, min_stock: item.min_stock,
          recipe_unit_type: item.recipe_unit_type, recipe_unit_price: item.recipe_unit_price,
          current_stock: 0, unit_id: targetUnitId,
        }))
      );
      if (!error) results.push(`${items.length} itens`);
    }
  }

  if (options.has('checklists')) {
    const { data: sectors } = await supabase.from('checklist_sectors').select('id, name, color, icon, sort_order').eq('unit_id', sourceUnitId);
    if (sectors && sectors.length > 0) {
      let totalItems = 0;
      for (const sector of sectors) {
        const { data: newSector } = await supabase.from('checklist_sectors')
          .insert({ name: sector.name, color: sector.color, icon: sector.icon, sort_order: sector.sort_order, unit_id: targetUnitId })
          .select('id').single();
        if (!newSector) continue;
        const { data: subcats } = await supabase.from('checklist_subcategories').select('id, name, sort_order').eq('sector_id', sector.id).eq('unit_id', sourceUnitId);
        if (!subcats) continue;
        for (const subcat of subcats) {
          const { data: newSubcat } = await supabase.from('checklist_subcategories')
            .insert({ name: subcat.name, sort_order: subcat.sort_order, sector_id: newSector.id, unit_id: targetUnitId })
            .select('id').single();
          if (!newSubcat) continue;
          const { data: checkItems } = await supabase.from('checklist_items')
            .select('name, description, frequency, checklist_type, sort_order, is_active, points')
            .eq('subcategory_id', subcat.id).eq('unit_id', sourceUnitId).is('deleted_at', null);
          if (checkItems && checkItems.length > 0) {
            await supabase.from('checklist_items').insert(checkItems.map(ci => ({ ...ci, subcategory_id: newSubcat.id, unit_id: targetUnitId })));
            totalItems += checkItems.length;
          }
        }
      }
      results.push(`${sectors.length} setores, ${totalItems} itens checklist`);
    }
  }

  if (options.has('finance_categories')) {
    const { data: finCats } = await supabase.from('finance_categories')
      .select('name, type, color, icon, sort_order, is_system, user_id, parent_id')
      .eq('unit_id', sourceUnitId).is('parent_id', null);
    if (finCats && finCats.length > 0) {
      for (const cat of finCats) {
        const { data: newParent } = await supabase.from('finance_categories')
          .insert({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon, sort_order: cat.sort_order, is_system: cat.is_system, user_id: cat.user_id, unit_id: targetUnitId })
          .select('id').single();
        if (newParent) {
          const { data: srcParent } = await supabase.from('finance_categories').select('id')
            .eq('unit_id', sourceUnitId).eq('name', cat.name).eq('type', cat.type).is('parent_id', null).single();
          if (srcParent) {
            const { data: children } = await supabase.from('finance_categories')
              .select('name, type, color, icon, sort_order, is_system, user_id').eq('parent_id', srcParent.id).eq('unit_id', sourceUnitId);
            if (children && children.length > 0) {
              await supabase.from('finance_categories').insert(children.map(ch => ({ ...ch, parent_id: newParent.id, unit_id: targetUnitId })));
            }
          }
        }
      }
      results.push(`${finCats.length} cat. financeiras`);
    }
  }

  return results;
}

// ─── Wizard Steps ───────────────────────────────────────────

type WizardStep = 'info' | 'templates' | 'users' | 'done';
const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'info', label: 'Dados' },
  { key: 'templates', label: 'Templates' },
  { key: 'users', label: 'Equipe' },
  { key: 'done', label: 'Pronto' },
];

export function UnitManagement() {
  const { isSuperAdmin, user } = useAuth();
  const { units, refetchUnits, setActiveUnitId } = useUnit();

  // List state
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Clone sheet state
  const [cloneSheetOpen, setCloneSheetOpen] = useState(false);
  const [cloneTargetUnit, setCloneTargetUnit] = useState<Unit | null>(null);
  const [cloneSourceId, setCloneSourceId] = useState('');
  const [cloneOpts, setCloneOpts] = useState<Set<CloneKey>>(new Set(CLONE_OPTIONS.map(o => o.key)));
  const [cloning, setCloning] = useState(false);

  // Users sheet state
  const [usersSheetOpen, setUsersSheetOpen] = useState(false);
  const [usersUnit, setUsersUnit] = useState<Unit | null>(null);
  const [userAssignments, setUserAssignments] = useState<UserUnitAssignment[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUsers, setSavingUsers] = useState(false);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('info');
  const [wName, setWName] = useState('');
  const [wSlug, setWSlug] = useState('');
  const [wSourceId, setWSourceId] = useState('');
  const [wCloneOpts, setWCloneOpts] = useState<Set<CloneKey>>(new Set(CLONE_OPTIONS.map(o => o.key)));
  const [wUsers, setWUsers] = useState<UserUnitAssignment[]>([]);
  const [wLoadingUsers, setWLoadingUsers] = useState(false);
  const [wSaving, setWSaving] = useState(false);
  const [wCreatedUnitId, setWCreatedUnitId] = useState<string | null>(null);
  const [wResults, setWResults] = useState<string[]>([]);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // ─── Wizard ──────────────────────────────────────────────

  const openWizard = async () => {
    setWName(''); setWSlug(''); setWSourceId(''); setWCreatedUnitId(null); setWResults([]);
    setWCloneOpts(new Set(CLONE_OPTIONS.map(o => o.key)));
    setWUsers([]);
    setWizardStep('info');
    setWizardOpen(true);
    // Pre-load users list
    setWLoadingUsers(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').order('full_name');
      setWUsers((profiles || []).map(p => ({
        user_id: p.user_id, full_name: p.full_name,
        is_assigned: p.user_id === user!.id, // pre-select creator
        is_default: false,
      })));
    } catch { /* silent */ }
    finally { setWLoadingUsers(false); }
  };

  const wizardStepIndex = WIZARD_STEPS.findIndex(s => s.key === wizardStep);
  const wizardProgress = ((wizardStepIndex + 1) / WIZARD_STEPS.length) * 100;

  const wizardNext = async () => {
    if (wizardStep === 'info') {
      if (!wName.trim()) { toast.error('Nome é obrigatório'); return; }
      setWizardStep('templates');
    } else if (wizardStep === 'templates') {
      setWizardStep('users');
    } else if (wizardStep === 'users') {
      // CREATE unit + clone + assign users all at once
      setWSaving(true);
      try {
        const slug = wSlug.trim() || generateSlug(wName);
        const { data: newUnit, error } = await supabase.from('units')
          .insert({ name: wName.trim(), slug, is_active: true, created_by: user!.id })
          .select('id').single();
        if (error) throw error;
        setWCreatedUnitId(newUnit.id);

        // Clone templates if selected
        if (wSourceId && wSourceId !== 'none' && wCloneOpts.size > 0) {
          const results = await cloneTemplates(wSourceId, newUnit.id, wCloneOpts);
          setWResults(results);
        }

        // Save user assignments
        const toInsert = wUsers.filter(u => u.is_assigned).map(u => ({
          user_id: u.user_id, unit_id: newUnit.id, is_default: u.is_default,
        }));
        if (toInsert.length > 0) {
          await supabase.from('user_units').insert(toInsert);
        }

        await refetchUnits();
        setWizardStep('done');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao criar loja');
      } finally {
        setWSaving(false);
      }
    }
  };

  const wizardFinish = () => {
    if (wCreatedUnitId) {
      setActiveUnitId(wCreatedUnitId);
      toast.success('Loja ativa alterada!');
    }
    setWizardOpen(false);
  };

  // ─── Edit Sheet ──────────────────────────────────────────

  const openEditSheet = (unit: Unit) => {
    setEditingUnit(unit); setEditName(unit.name); setEditSlug(unit.slug);
    setEditSheetOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingUnit || !editName.trim()) return;
    setEditSaving(true);
    try {
      const { error } = await supabase.from('units')
        .update({ name: editName.trim(), slug: editSlug.trim() || generateSlug(editName) })
        .eq('id', editingUnit.id);
      if (error) throw error;
      toast.success('Loja atualizada');
      setEditSheetOpen(false);
      await refetchUnits();
    } catch (err: any) { toast.error(err.message || 'Erro'); }
    finally { setEditSaving(false); }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_unit_cascade', { p_unit_id: deletingUnit.id });
      if (error) throw error;
      toast.success(`Loja "${deletingUnit.name}" excluída`);
      setDeleteConfirmOpen(false);
      setDeletingUnit(null);
      await refetchUnits();
    } catch (err: any) { toast.error(err.message || 'Erro ao excluir'); }
    finally { setDeleting(false); }
  };

  // ─── Clone Sheet ─────────────────────────────────────────

  const openCloneSheet = (unit: Unit) => {
    setCloneTargetUnit(unit); setCloneSourceId('');
    setCloneOpts(new Set(CLONE_OPTIONS.map(o => o.key)));
    setCloneSheetOpen(true);
  };

  const handleClone = async () => {
    if (!cloneTargetUnit || !cloneSourceId || cloneOpts.size === 0) return;
    setCloning(true);
    try {
      const results = await cloneTemplates(cloneSourceId, cloneTargetUnit.id, cloneOpts);
      toast.success(results.length > 0 ? `Copiado: ${results.join(', ')}` : 'Nenhum template encontrado');
      setCloneSheetOpen(false);
    } catch (err: any) { toast.error(err.message || 'Erro'); }
    finally { setCloning(false); }
  };

  // ─── Users Sheet ─────────────────────────────────────────

  const openUsersSheet = async (unit: Unit) => {
    setUsersUnit(unit); setUsersSheetOpen(true); setLoadingUsers(true);
    try {
      const [profilesRes, assignmentsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').order('full_name'),
        supabase.from('user_units').select('user_id, is_default').eq('unit_id', unit.id),
      ]);
      const profiles = profilesRes.data || [];
      const assignments = assignmentsRes.data || [];
      const assignMap = new Map(assignments.map(a => [a.user_id, a]));
      setUserAssignments(profiles.map(p => ({
        user_id: p.user_id, full_name: p.full_name,
        is_assigned: assignMap.has(p.user_id),
        is_default: assignMap.get(p.user_id)?.is_default || false,
      })));
    } catch { toast.error('Erro ao carregar'); }
    finally { setLoadingUsers(false); }
  };

  const saveUserAssignments = async () => {
    if (!usersUnit) return;
    setSavingUsers(true);
    try {
      await supabase.from('user_units').delete().eq('unit_id', usersUnit.id);
      const toInsert = userAssignments.filter(u => u.is_assigned).map(u => ({
        user_id: u.user_id, unit_id: usersUnit.id, is_default: u.is_default,
      }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from('user_units').insert(toInsert);
        if (error) throw error;
      }
      toast.success('Usuários atualizados'); setUsersSheetOpen(false);
    } catch (err: any) { toast.error(err.message || 'Erro'); }
    finally { setSavingUsers(false); }
  };

  // ─── User Toggle Helpers ─────────────────────────────────

  const toggleAssignment = (list: UserUnitAssignment[], setList: React.Dispatch<React.SetStateAction<UserUnitAssignment[]>>, userId: string) => {
    setList(prev => prev.map(u =>
      u.user_id === userId ? { ...u, is_assigned: !u.is_assigned, is_default: !u.is_assigned ? u.is_default : false } : u
    ));
  };

  const toggleDef = (list: UserUnitAssignment[], setList: React.Dispatch<React.SetStateAction<UserUnitAssignment[]>>, userId: string) => {
    setList(prev => prev.map(u =>
      u.user_id === userId && u.is_assigned ? { ...u, is_default: !u.is_default } : u
    ));
  };

  // ─── Render ──────────────────────────────────────────────

  if (!isSuperAdmin) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Apenas Super Admins podem gerenciar lojas.</div>;
  }

  const UserList = ({ items, setItems }: { items: UserUnitAssignment[]; setItems: React.Dispatch<React.SetStateAction<UserUnitAssignment[]>> }) => (
    <div className="space-y-2">
      {items.map(u => (
        <div key={u.user_id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleAssignment(items, setItems, u.user_id)}
              className={cn("w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                u.is_assigned ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
              )}
            >
              {u.is_assigned && <AppIcon name="Check" className="w-3.5 h-3.5" />}
            </button>
            <span className="font-medium text-sm">{u.full_name}</span>
          </div>
          {u.is_assigned && (
            <button
              onClick={() => toggleDef(items, setItems, u.user_id)}
              className={cn("text-xs px-2 py-1 rounded-md transition-all",
                u.is_default ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              {u.is_default ? '★ Padrão' : 'Definir padrão'}
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const CloneOptionsUI = ({ opts, setOpts }: { opts: Set<CloneKey>; setOpts: React.Dispatch<React.SetStateAction<Set<CloneKey>>> }) => (
    <div className="space-y-2">
      {CLONE_OPTIONS.map(opt => (
        <label key={opt.key} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 cursor-pointer transition-colors">
          <Checkbox
            checked={opts.has(opt.key)}
            onCheckedChange={() => setOpts(prev => {
              const next = new Set(prev);
              if (next.has(opt.key)) next.delete(opt.key); else next.add(opt.key);
              return next;
            })}
            className="mt-0.5"
          />
          <div>
            <span className="text-sm font-medium">{opt.label}</span>
            <p className="text-xs text-muted-foreground">{opt.description}</p>
          </div>
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppIcon name="Store" className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Gerenciar Lojas</h3>
        </div>
        <Button size="sm" onClick={openWizard}>
          <AppIcon name="Plus" className="w-4 h-4 mr-1" /> Nova Loja
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Crie e gerencie as lojas do sistema.
      </p>

      <div className="space-y-2">
        {units.map(unit => (
          <div key={unit.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name="Store" className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="font-medium block truncate">{unit.name}</span>
                <span className="text-xs text-muted-foreground">{unit.slug}</span>
              </div>
              {!unit.is_active && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {units.length > 1 && (
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setDeletingUnit(unit); setDeleteConfirmOpen(true); }} title="Excluir">
                  <AppIcon name="Trash2" className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => openCloneSheet(unit)} title="Copiar templates">
                <AppIcon name="Copy" className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openUsersSheet(unit)} title="Usuários">
                <AppIcon name="Users" className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditSheet(unit)} title="Editar">
                <AppIcon name="Pencil" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {units.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma loja cadastrada</p>
        )}
      </div>

      {/* ═══ Onboarding Wizard ═══ */}
      <Sheet open={wizardOpen} onOpenChange={setWizardOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="Sparkles" className="w-5 h-5 text-primary" />
              Nova Loja
            </SheetTitle>
          </SheetHeader>

          {/* Progress */}
          <div className="shrink-0 pt-2 pb-1">
            <div className="flex justify-between mb-2">
              {WIZARD_STEPS.map((step, i) => (
                <span key={step.key} className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  i <= wizardStepIndex ? "text-primary" : "text-muted-foreground/40"
                )}>
                  {step.label}
                </span>
              ))}
            </div>
            <Progress value={wizardProgress} className="h-1" />
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Step 1: Info */}
            {wizardStep === 'info' && (
              <>
                <div className="space-y-2">
                  <Label>Nome da loja</Label>
                  <Input
                    value={wName}
                    onChange={e => { setWName(e.target.value); setWSlug(generateSlug(e.target.value)); }}
                    placeholder="Ex: Loja Centro"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (identificador)</Label>
                  <Input value={wSlug} onChange={e => setWSlug(e.target.value)} placeholder="filial-centro" />
                </div>
              </>
            )}

            {/* Step 2: Templates */}
            {wizardStep === 'templates' && (
              <>
                {units.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Selecione uma loja existente para copiar seus templates, ou comece do zero.
                    </p>
                    <Select value={wSourceId} onValueChange={setWSourceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Começar do zero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Começar do zero</SelectItem>
                        {units.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {wSourceId && wSourceId !== 'none' && (
                      <CloneOptionsUI opts={wCloneOpts} setOpts={setWCloneOpts} />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma loja existente para copiar templates. A loja será criada vazia.
                  </p>
                )}
              </>
            )}

            {/* Step 3: Users */}
            {wizardStep === 'users' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Selecione os usuários que terão acesso a esta loja.
                </p>
                {wLoadingUsers ? (
                  <div className="flex justify-center py-8"><AppIcon name="Loader2" className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <UserList items={wUsers} setItems={setWUsers} />
                )}
              </>
            )}

            {/* Step 4: Done */}
            {wizardStep === 'done' && (
              <div className="text-center space-y-4 py-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <AppIcon name="Sparkles" className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Tudo pronto! 🎉</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    A loja <strong>{wName}</strong> está configurada e pronta para uso.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {wUsers.filter(u => u.is_assigned).length} usuário(s) com acesso.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 pt-2 pb-4 flex gap-2">
            {wizardStep === 'done' ? (
              <Button onClick={wizardFinish} className="w-full">
                <AppIcon name="Store" className="w-4 h-4 mr-2" />
                Ativar Loja
              </Button>
            ) : (
              <>
                {(wizardStep === 'templates' || wizardStep === 'users') && (
                  <Button variant="outline" onClick={() => setWizardStep(wizardStep === 'users' ? 'templates' : 'info')} className="shrink-0">
                    <AppIcon name="ChevronLeft" className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={wizardNext} disabled={wSaving} className="flex-1">
                  {wSaving ? <AppIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" /> : null}
                  {wizardStep === 'info' ? 'Próximo' : wizardStep === 'templates' ? 'Próximo' : 'Criar Loja'}
                  <AppIcon name="ChevronRight" className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ Edit Sheet ═══ */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>Editar Loja</SheetTitle></SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} />
            </div>
            <Button onClick={handleEditSave} disabled={editSaving} className="w-full">
              {editSaving ? <AppIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ Clone Sheet ═══ */}
      <Sheet open={cloneSheetOpen} onOpenChange={setCloneSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>Copiar Templates → {cloneTargetUnit?.name}</SheetTitle></SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Copiar de</Label>
              <Select value={cloneSourceId} onValueChange={setCloneSourceId}>
                <SelectTrigger><SelectValue placeholder="Selecione a origem" /></SelectTrigger>
                <SelectContent>
                  {units.filter(u => u.id !== cloneTargetUnit?.id).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CloneOptionsUI opts={cloneOpts} setOpts={setCloneOpts} />
            <p className="text-xs text-muted-foreground">⚠️ Itens de estoque serão criados com estoque zerado.</p>
            <Button onClick={handleClone} disabled={cloning || !cloneSourceId || cloneOpts.size === 0} className="w-full">
              {cloning ? <AppIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" /> : <AppIcon name="Copy" className="w-4 h-4 mr-2" />}
              Copiar Templates
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ Users Sheet ═══ */}
      <Sheet open={usersSheetOpen} onOpenChange={setUsersSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] flex flex-col">
          <SheetHeader><SheetTitle>Usuários — {usersUnit?.name}</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {loadingUsers ? (
              <div className="flex justify-center py-8"><AppIcon name="Loader2" className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <UserList items={userAssignments} setItems={setUserAssignments} />
            )}
          </div>
          <div className="shrink-0 pt-2 pb-4">
            <Button onClick={saveUserAssignments} disabled={savingUsers} className="w-full">
              {savingUsers ? <AppIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Atribuições
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ Delete Confirmation ═══ */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir loja "{deletingUnit?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados da loja serão excluídos permanentemente: estoque, categorias, fornecedores, checklists, financeiro, funcionários e mais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnit} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <AppIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" /> : <AppIcon name="Trash2" className="w-4 h-4 mr-2" />}
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
