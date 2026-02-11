import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit, Unit } from '@/contexts/UnitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Plus, Pencil, Users, Loader2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface UserUnitAssignment {
  user_id: string;
  full_name: string;
  is_assigned: boolean;
  is_default: boolean;
}

const CLONE_OPTIONS = [
  { key: 'categories', label: 'Categorias de Estoque' },
  { key: 'inventory', label: 'Itens de Estoque (estoque zerado)' },
  { key: 'suppliers', label: 'Fornecedores' },
  { key: 'checklists', label: 'Estrutura de Checklists' },
  { key: 'finance_categories', label: 'Categorias Financeiras' },
] as const;

type CloneKey = (typeof CLONE_OPTIONS)[number]['key'];

async function cloneTemplates(sourceUnitId: string, targetUnitId: string, options: Set<CloneKey>) {
  const results: string[] = [];

  // Clone categories
  if (options.has('categories')) {
    const { data: cats } = await supabase
      .from('categories')
      .select('name, color, icon, sort_order')
      .eq('unit_id', sourceUnitId);
    if (cats && cats.length > 0) {
      const { error } = await supabase.from('categories').insert(
        cats.map(c => ({ ...c, unit_id: targetUnitId }))
      );
      if (!error) results.push(`${cats.length} categorias`);
    }
  }

  // Clone suppliers
  if (options.has('suppliers')) {
    const { data: supps } = await supabase
      .from('suppliers')
      .select('name, phone, email, notes')
      .eq('unit_id', sourceUnitId);
    if (supps && supps.length > 0) {
      const { error } = await supabase.from('suppliers').insert(
        supps.map(s => ({ ...s, unit_id: targetUnitId }))
      );
      if (!error) results.push(`${supps.length} fornecedores`);
    }
  }

  // Clone inventory items (with 0 stock)
  if (options.has('inventory')) {
    // First we need the new category mapping if categories were cloned
    let categoryMap = new Map<string, string>();
    if (options.has('categories')) {
      const [{ data: srcCats }, { data: tgtCats }] = await Promise.all([
        supabase.from('categories').select('id, name').eq('unit_id', sourceUnitId),
        supabase.from('categories').select('id, name').eq('unit_id', targetUnitId),
      ]);
      if (srcCats && tgtCats) {
        const tgtByName = new Map(tgtCats.map(c => [c.name, c.id]));
        srcCats.forEach(c => {
          const tgtId = tgtByName.get(c.name);
          if (tgtId) categoryMap.set(c.id, tgtId);
        });
      }
    }

    // Same for suppliers
    let supplierMap = new Map<string, string>();
    if (options.has('suppliers')) {
      const [{ data: srcSupps }, { data: tgtSupps }] = await Promise.all([
        supabase.from('suppliers').select('id, name').eq('unit_id', sourceUnitId),
        supabase.from('suppliers').select('id, name').eq('unit_id', targetUnitId),
      ]);
      if (srcSupps && tgtSupps) {
        const tgtByName = new Map(tgtSupps.map(s => [s.name, s.id]));
        srcSupps.forEach(s => {
          const tgtId = tgtByName.get(s.name);
          if (tgtId) supplierMap.set(s.id, tgtId);
        });
      }
    }

    const { data: items } = await supabase
      .from('inventory_items')
      .select('name, category_id, supplier_id, unit_type, unit_price, min_stock, recipe_unit_type, recipe_unit_price')
      .eq('unit_id', sourceUnitId);
    if (items && items.length > 0) {
      const { error } = await supabase.from('inventory_items').insert(
        items.map(item => ({
          name: item.name,
          category_id: item.category_id ? categoryMap.get(item.category_id) || null : null,
          supplier_id: item.supplier_id ? supplierMap.get(item.supplier_id) || null : null,
          unit_type: item.unit_type,
          unit_price: item.unit_price,
          min_stock: item.min_stock,
          recipe_unit_type: item.recipe_unit_type,
          recipe_unit_price: item.recipe_unit_price,
          current_stock: 0,
          unit_id: targetUnitId,
        }))
      );
      if (!error) results.push(`${items.length} itens de estoque`);
    }
  }

  // Clone checklist structure (sectors → subcategories → items)
  if (options.has('checklists')) {
    const { data: sectors } = await supabase
      .from('checklist_sectors')
      .select('id, name, color, icon, sort_order')
      .eq('unit_id', sourceUnitId);

    if (sectors && sectors.length > 0) {
      let totalItems = 0;

      for (const sector of sectors) {
        // Create sector in target
        const { data: newSector, error: sErr } = await supabase
          .from('checklist_sectors')
          .insert({ name: sector.name, color: sector.color, icon: sector.icon, sort_order: sector.sort_order, unit_id: targetUnitId })
          .select('id')
          .single();

        if (sErr || !newSector) continue;

        // Get subcategories
        const { data: subcats } = await supabase
          .from('checklist_subcategories')
          .select('id, name, sort_order')
          .eq('sector_id', sector.id)
          .eq('unit_id', sourceUnitId);

        if (!subcats) continue;

        for (const subcat of subcats) {
          const { data: newSubcat, error: scErr } = await supabase
            .from('checklist_subcategories')
            .insert({ name: subcat.name, sort_order: subcat.sort_order, sector_id: newSector.id, unit_id: targetUnitId })
            .select('id')
            .single();

          if (scErr || !newSubcat) continue;

          // Get items
          const { data: checkItems } = await supabase
            .from('checklist_items')
            .select('name, description, frequency, checklist_type, sort_order, is_active, points')
            .eq('subcategory_id', subcat.id)
            .eq('unit_id', sourceUnitId)
            .is('deleted_at', null);

          if (checkItems && checkItems.length > 0) {
            await supabase.from('checklist_items').insert(
              checkItems.map(ci => ({ ...ci, subcategory_id: newSubcat.id, unit_id: targetUnitId }))
            );
            totalItems += checkItems.length;
          }
        }
      }
      results.push(`${sectors.length} setores, ${totalItems} itens de checklist`);
    }
  }

  // Clone finance categories
  if (options.has('finance_categories')) {
    const { data: finCats } = await supabase
      .from('finance_categories')
      .select('name, type, color, icon, sort_order, is_system, user_id, parent_id')
      .eq('unit_id', sourceUnitId)
      .is('parent_id', null);

    if (finCats && finCats.length > 0) {
      // Insert parent categories first
      for (const cat of finCats) {
        const { data: newParent } = await supabase
          .from('finance_categories')
          .insert({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon, sort_order: cat.sort_order, is_system: cat.is_system, user_id: cat.user_id, unit_id: targetUnitId })
          .select('id')
          .single();

        // Now clone children of this parent from original unit
        if (newParent) {
          const { data: srcParent } = await supabase
            .from('finance_categories')
            .select('id')
            .eq('unit_id', sourceUnitId)
            .eq('name', cat.name)
            .eq('type', cat.type)
            .is('parent_id', null)
            .single();

          if (srcParent) {
            const { data: children } = await supabase
              .from('finance_categories')
              .select('name, type, color, icon, sort_order, is_system, user_id')
              .eq('parent_id', srcParent.id)
              .eq('unit_id', sourceUnitId);

            if (children && children.length > 0) {
              await supabase.from('finance_categories').insert(
                children.map(ch => ({ ...ch, parent_id: newParent.id, unit_id: targetUnitId }))
              );
            }
          }
        }
      }
      results.push(`${finCats.length} categorias financeiras`);
    }
  }

  return results;
}

export function UnitManagement() {
  const { isSuperAdmin } = useAuth();
  const { units, refetchUnits } = useUnit();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [usersSheetOpen, setUsersSheetOpen] = useState(false);
  const [cloneSheetOpen, setCloneSheetOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [sourceUnitId, setSourceUnitId] = useState('');
  const [cloneOptions, setCloneOptions] = useState<Set<CloneKey>>(new Set(['categories', 'inventory', 'suppliers', 'checklists', 'finance_categories']));
  const [saving, setSaving] = useState(false);
  const [userAssignments, setUserAssignments] = useState<UserUnitAssignment[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUsers, setSavingUsers] = useState(false);
  const [cloning, setCloning] = useState(false);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openCreateSheet = () => {
    setEditingUnit(null);
    setFormName('');
    setFormSlug('');
    setFormActive(true);
    setSourceUnitId('');
    setSheetOpen(true);
  };

  const openEditSheet = (unit: Unit) => {
    setEditingUnit(unit);
    setFormName(unit.name);
    setFormSlug(unit.slug);
    setFormActive(unit.is_active);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Nome é obrigatório'); return; }
    const slug = formSlug.trim() || generateSlug(formName);
    setSaving(true);
    try {
      if (editingUnit) {
        const { error } = await supabase.from('units').update({ name: formName.trim(), slug, is_active: formActive }).eq('id', editingUnit.id);
        if (error) throw error;
        toast.success('Unidade atualizada');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');
        const { data: newUnit, error } = await supabase
          .from('units')
          .insert({ name: formName.trim(), slug, is_active: formActive, created_by: user.id })
          .select('id')
          .single();
        if (error) throw error;

        // Auto-clone if source selected
        if (sourceUnitId && newUnit && cloneOptions.size > 0) {
          const results = await cloneTemplates(sourceUnitId, newUnit.id, cloneOptions);
          if (results.length > 0) {
            toast.success(`Unidade criada com: ${results.join(', ')}`);
          } else {
            toast.success('Unidade criada (nenhum template encontrado)');
          }
        } else {
          toast.success('Unidade criada');
        }
      }
      setSheetOpen(false);
      await refetchUnits();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const openCloneSheet = (unit: Unit) => {
    setSelectedUnit(unit);
    setSourceUnitId('');
    setCloneOptions(new Set(['categories', 'inventory', 'suppliers', 'checklists', 'finance_categories']));
    setCloneSheetOpen(true);
  };

  const handleClone = async () => {
    if (!selectedUnit || !sourceUnitId || cloneOptions.size === 0) return;
    setCloning(true);
    try {
      const results = await cloneTemplates(sourceUnitId, selectedUnit.id, cloneOptions);
      if (results.length > 0) {
        toast.success(`Copiado: ${results.join(', ')}`);
      } else {
        toast.info('Nenhum template encontrado na unidade de origem');
      }
      setCloneSheetOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao clonar');
    } finally {
      setCloning(false);
    }
  };

  const toggleCloneOption = (key: CloneKey) => {
    setCloneOptions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const openUsersSheet = async (unit: Unit) => {
    setSelectedUnit(unit);
    setUsersSheetOpen(true);
    setLoadingUsers(true);
    try {
      const [profilesRes, assignmentsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').order('full_name'),
        supabase.from('user_units').select('user_id, is_default').eq('unit_id', unit.id),
      ]);
      const profiles = profilesRes.data || [];
      const assignments = assignmentsRes.data || [];
      const assignmentMap = new Map(assignments.map(a => [a.user_id, a]));
      setUserAssignments(profiles.map(p => ({
        user_id: p.user_id, full_name: p.full_name,
        is_assigned: assignmentMap.has(p.user_id),
        is_default: assignmentMap.get(p.user_id)?.is_default || false,
      })));
    } catch { toast.error('Erro ao carregar usuários'); }
    finally { setLoadingUsers(false); }
  };

  const toggleUserAssignment = (userId: string) => {
    setUserAssignments(prev => prev.map(u =>
      u.user_id === userId ? { ...u, is_assigned: !u.is_assigned, is_default: !u.is_assigned ? u.is_default : false } : u
    ));
  };

  const toggleDefault = (userId: string) => {
    setUserAssignments(prev => prev.map(u =>
      u.user_id === userId && u.is_assigned ? { ...u, is_default: !u.is_default } : u
    ));
  };

  const saveUserAssignments = async () => {
    if (!selectedUnit) return;
    setSavingUsers(true);
    try {
      await supabase.from('user_units').delete().eq('unit_id', selectedUnit.id);
      const toInsert = userAssignments.filter(u => u.is_assigned).map(u => ({
        user_id: u.user_id, unit_id: selectedUnit.id, is_default: u.is_default,
      }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from('user_units').insert(toInsert);
        if (error) throw error;
      }
      toast.success('Usuários atualizados');
      setUsersSheetOpen(false);
    } catch (err: any) { toast.error(err.message || 'Erro ao salvar'); }
    finally { setSavingUsers(false); }
  };

  if (!isSuperAdmin) {
    return <div className="text-center py-8 text-muted-foreground text-sm">Apenas Super Admins podem gerenciar unidades.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Gerenciar Unidades</h3>
        </div>
        <Button size="sm" onClick={openCreateSheet}>
          <Plus className="w-4 h-4 mr-1" /> Nova
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Crie e gerencie as unidades operacionais. Ao criar, clone templates de outra unidade.
      </p>

      <div className="space-y-2">
        {units.map(unit => (
          <div key={unit.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-medium block">{unit.name}</span>
                <span className="text-xs text-muted-foreground">{unit.slug}</span>
              </div>
              {!unit.is_active && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => openCloneSheet(unit)} title="Copiar templates">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openUsersSheet(unit)} title="Usuários">
                <Users className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditSheet(unit)} title="Editar">
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {units.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma unidade cadastrada</p>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formName}
                onChange={e => { setFormName(e.target.value); if (!editingUnit) setFormSlug(generateSlug(e.target.value)); }}
                placeholder="Ex: Filial Centro"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (identificador)</Label>
              <Input value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="filial-centro" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativa</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>

            {/* Clone source on creation */}
            {!editingUnit && units.length > 0 && (
              <>
                <div className="h-px bg-border/50" />
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Copiar templates de outra unidade</Label>
                  <Select value={sourceUnitId} onValueChange={setSourceUnitId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma (começar vazio)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (começar vazio)</SelectItem>
                      {units.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {sourceUnitId && sourceUnitId !== 'none' && (
                    <div className="space-y-2 pl-1">
                      {CLONE_OPTIONS.map(opt => (
                        <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={cloneOptions.has(opt.key)}
                            onCheckedChange={() => toggleCloneOption(opt.key)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingUnit ? 'Salvar' : 'Criar Unidade'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Clone Templates Sheet */}
      <Sheet open={cloneSheetOpen} onOpenChange={setCloneSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Copiar Templates → {selectedUnit?.name}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Copiar de</Label>
              <Select value={sourceUnitId} onValueChange={setSourceUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade de origem" />
                </SelectTrigger>
                <SelectContent>
                  {units.filter(u => u.id !== selectedUnit?.id).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">O que copiar</Label>
              {CLONE_OPTIONS.map(opt => (
                <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={cloneOptions.has(opt.key)}
                    onCheckedChange={() => toggleCloneOption(opt.key)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Templates existentes não serão duplicados. Itens de estoque serão criados com estoque zerado.
            </p>

            <Button onClick={handleClone} disabled={cloning || !sourceUnitId || cloneOptions.size === 0} className="w-full">
              {cloning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copiar Templates
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Users Assignment Sheet */}
      <Sheet open={usersSheetOpen} onOpenChange={setUsersSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>Usuários — {selectedUnit?.name}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {loadingUsers ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              userAssignments.map(u => (
                <div key={u.user_id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleUserAssignment(u.user_id)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        u.is_assigned ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
                      }`}
                    >
                      {u.is_assigned && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className="font-medium text-sm">{u.full_name}</span>
                  </div>
                  {u.is_assigned && (
                    <button
                      onClick={() => toggleDefault(u.user_id)}
                      className={`text-xs px-2 py-1 rounded-md transition-all ${
                        u.is_default ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {u.is_default ? '★ Padrão' : 'Definir padrão'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="shrink-0 pt-2 pb-4">
            <Button onClick={saveUserAssignments} disabled={savingUsers} className="w-full">
              {savingUsers ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Atribuições
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
