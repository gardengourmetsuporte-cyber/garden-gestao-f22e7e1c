import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit, Unit } from '@/contexts/UnitContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Building2, Plus, Pencil, Users, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface UserUnitAssignment {
  user_id: string;
  full_name: string;
  is_assigned: boolean;
  is_default: boolean;
}

export function UnitManagement() {
  const { isSuperAdmin } = useAuth();
  const { units, refetchUnits } = useUnit();
  const [isLoading, setIsLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [usersSheetOpen, setUsersSheetOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userAssignments, setUserAssignments] = useState<UserUnitAssignment[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUsers, setSavingUsers] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const openCreateSheet = () => {
    setEditingUnit(null);
    setFormName('');
    setFormSlug('');
    setFormActive(true);
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
    if (!formName.trim()) {
      toast.error('Nome da unidade é obrigatório');
      return;
    }
    const slug = formSlug.trim() || generateSlug(formName);
    setSaving(true);
    try {
      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update({ name: formName.trim(), slug, is_active: formActive })
          .eq('id', editingUnit.id);
        if (error) throw error;
        toast.success('Unidade atualizada');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');
        const { error } = await supabase
          .from('units')
          .insert({ name: formName.trim(), slug, is_active: formActive, created_by: user.id });
        if (error) throw error;
        toast.success('Unidade criada');
      }
      setSheetOpen(false);
      await refetchUnits();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar unidade');
    } finally {
      setSaving(false);
    }
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

      setUserAssignments(
        profiles.map(p => ({
          user_id: p.user_id,
          full_name: p.full_name,
          is_assigned: assignmentMap.has(p.user_id),
          is_default: assignmentMap.get(p.user_id)?.is_default || false,
        }))
      );
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserAssignment = (userId: string) => {
    setUserAssignments(prev =>
      prev.map(u =>
        u.user_id === userId
          ? { ...u, is_assigned: !u.is_assigned, is_default: !u.is_assigned ? u.is_default : false }
          : u
      )
    );
  };

  const toggleDefault = (userId: string) => {
    setUserAssignments(prev =>
      prev.map(u =>
        u.user_id === userId && u.is_assigned
          ? { ...u, is_default: !u.is_default }
          : u
      )
    );
  };

  const saveUserAssignments = async () => {
    if (!selectedUnit) return;
    setSavingUsers(true);
    try {
      // Delete all existing assignments for this unit
      await supabase.from('user_units').delete().eq('unit_id', selectedUnit.id);

      // Insert new assignments
      const toInsert = userAssignments
        .filter(u => u.is_assigned)
        .map(u => ({
          user_id: u.user_id,
          unit_id: selectedUnit.id,
          is_default: u.is_default,
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from('user_units').insert(toInsert);
        if (error) throw error;
      }

      toast.success('Usuários atualizados');
      setUsersSheetOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSavingUsers(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Apenas Super Admins podem gerenciar unidades.
      </div>
    );
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
        Crie e gerencie as unidades operacionais do sistema.
      </p>

      <div className="space-y-2">
        {units.map(unit => (
          <div
            key={unit.id}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-medium block">{unit.name}</span>
                <span className="text-xs text-muted-foreground">{unit.slug}</span>
              </div>
              {!unit.is_active && (
                <Badge variant="secondary" className="text-xs">Inativa</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => openUsersSheet(unit)}>
                <Users className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditSheet(unit)}>
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {units.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma unidade cadastrada
          </p>
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
                onChange={e => {
                  setFormName(e.target.value);
                  if (!editingUnit) setFormSlug(generateSlug(e.target.value));
                }}
                placeholder="Ex: Filial Centro"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (identificador)</Label>
              <Input
                value={formSlug}
                onChange={e => setFormSlug(e.target.value)}
                placeholder="filial-centro"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativa</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingUnit ? 'Salvar' : 'Criar Unidade'}
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
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              userAssignments.map(u => (
                <div
                  key={u.user_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleUserAssignment(u.user_id)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        u.is_assigned
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
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
                        u.is_default
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-secondary'
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
