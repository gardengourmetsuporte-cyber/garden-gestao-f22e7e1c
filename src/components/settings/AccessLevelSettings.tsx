import { useState } from 'react';
import { useAccessLevels, AccessLevel } from '@/hooks/useAccessLevels';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { ALL_MODULES } from '@/lib/modules';
import { MODULE_REQUIRED_PLAN } from '@/lib/plans';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ListPicker, ListPickerItem } from '@/components/ui/list-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Group modules for better UI
const moduleGroups = (() => {
  const groups: { label: string; modules: typeof ALL_MODULES }[] = [];
  const seen = new Set<string>();
  ALL_MODULES.forEach(m => {
    if (m.key === 'dashboard' || m.key === 'settings') return; // always accessible
    if (!seen.has(m.group)) {
      seen.add(m.group);
      groups.push({
        label: m.group,
        modules: ALL_MODULES.filter(mod => mod.group === m.group && mod.key !== 'dashboard' && mod.key !== 'settings'),
      });
    }
  });
  return groups;
})();

export function AccessLevelSettings() {
  const { accessLevels, isLoading, addAccessLevel, updateAccessLevel, deleteAccessLevel, assignToUser } = useAccessLevels();
  const { users, isLoading: usersLoading } = useUsers();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const [editingLevel, setEditingLevel] = useState<AccessLevel | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formModules, setFormModules] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [pickerUserId, setPickerUserId] = useState<string | null>(null);

  // Fetch user assignments for current unit
  const { data: userAssignments = [] } = useQuery({
    queryKey: ['user-unit-assignments', activeUnitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_units')
        .select('user_id, access_level_id')
        .eq('unit_id', activeUnitId!);
      return data || [];
    },
    enabled: !!activeUnitId,
    staleTime: 60 * 1000,
  });

  const openCreate = () => {
    setEditingLevel(null);
    setIsCreating(true);
    setFormName('');
    setFormDescription('');
    setFormModules([]);
  };

  const openEdit = (level: AccessLevel) => {
    setEditingLevel(level);
    setIsCreating(true);
    setFormName(level.name);
    setFormDescription(level.description || '');
    setFormModules([...level.modules]);
  };

  const toggleModule = (key: string) => {
    setFormModules(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  const toggleAllInGroup = (groupModules: typeof ALL_MODULES) => {
    const keys = groupModules.map(m => m.key);
    const allSelected = keys.every(k => formModules.includes(k));
    if (allSelected) {
      setFormModules(prev => prev.filter(m => !keys.includes(m)));
    } else {
      setFormModules(prev => [...new Set([...prev, ...keys])]);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (formModules.length === 0) {
      toast.error('Selecione pelo menos um módulo');
      return;
    }

    try {
      if (editingLevel) {
        await updateAccessLevel({ id: editingLevel.id, name: formName, description: formDescription, modules: formModules });
      } else {
        await addAccessLevel({ name: formName, description: formDescription, modules: formModules });
      }
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to save access level:', err);
      toast.error('Erro ao salvar nível de acesso');
    }
  };

  const handleDelete = async (level: AccessLevel) => {
    if (!confirm(`Remover o nível "${level.name}"? Usuários com este nível terão acesso completo.`)) return;
    await deleteAccessLevel(level.id);
  };

  const handleAssign = async (userId: string, levelId: string | null) => {
    await assignToUser({ userId, accessLevelId: levelId });
    queryClient.invalidateQueries({ queryKey: ['user-unit-assignments', activeUnitId] });
  };

  const getUserAccessLevel = (userId: string) => {
    return userAssignments.find(a => a.user_id === userId)?.access_level_id || null;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Access Levels List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Níveis de Acesso</h3>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <AppIcon name="Plus" size={14} />
            Criar nível
          </Button>
        </div>

        {accessLevels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AppIcon name="Shield" size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum nível criado</p>
            <p className="text-xs mt-1">Todos os usuários têm acesso completo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accessLevels.map(level => {
              const assignedCount = userAssignments.filter(a => a.access_level_id === level.id).length;
              return (
                <div key={level.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
                    <AppIcon name="Shield" size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{level.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {level.modules.length} módulo{level.modules.length !== 1 ? 's' : ''} · {assignedCount} usuário{assignedCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button onClick={() => openEdit(level)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(level)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <AppIcon name="Trash2" size={14} className="text-destructive/70" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Assignments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Atribuir a Usuários</h3>
        </div>

        {usersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(user => {
              const currentLevel = getUserAccessLevel(user.user_id);
              const isInUnit = userAssignments.some(a => a.user_id === user.user_id);
              if (!isInUnit) return null;

              return (
                <div key={user.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={() => setPickerUserId(user.user_id)}
                    className="px-3 py-1.5 rounded-lg bg-secondary border border-border/30 text-xs font-medium truncate max-w-[160px]"
                  >
                    {currentLevel
                      ? accessLevels.find(l => l.id === currentLevel)?.name || 'Acesso completo'
                      : 'Acesso completo'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto w-[calc(100%-2rem)] sm:w-full rounded-2xl mx-auto">
          <DialogHeader>
            <DialogTitle>{editingLevel ? 'Editar Nível' : 'Novo Nível de Acesso'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ex: Gerente Operacional"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Ex: Acesso a operação sem financeiro"
              />
            </div>

            <div className="space-y-3">
              <Label>Módulos permitidos</Label>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Dashboard e Configurações estão sempre acessíveis
              </p>

              {moduleGroups.map(group => {
                const allSelected = group.modules.every(m => formModules.includes(m.key));
                const someSelected = group.modules.some(m => formModules.includes(m.key));

                return (
                  <div key={group.label} className="space-y-1.5">
                    <button
                      onClick={() => toggleAllInGroup(group.modules)}
                      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                    >
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        className="h-3.5 w-3.5"
                      />
                      {group.label}
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
                      {group.modules.map(mod => (
                        <button
                          key={mod.key}
                          onClick={() => toggleModule(mod.key)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg text-left transition-all text-xs w-full",
                            formModules.includes(mod.key)
                              ? "bg-primary/10 border border-primary/30 text-foreground"
                              : "bg-secondary/40 border border-border/20 text-muted-foreground"
                          )}
                        >
                          <Checkbox checked={formModules.includes(mod.key)} className="h-3.5 w-3.5 pointer-events-none shrink-0" />
                          <AppIcon name={mod.icon} size={14} className="shrink-0" />
                          <span className="truncate flex-1">{mod.label}</span>
                          {MODULE_REQUIRED_PLAN[mod.key] && (
                            <span className="text-[8px] font-bold uppercase tracking-wider ml-auto shrink-0" style={{ color: 'hsl(45 90% 55%)' }}>
                              {MODULE_REQUIRED_PLAN[mod.key] === 'business' ? 'BIZ' : 'PRO'}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingLevel ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Level Picker (mobile-friendly) */}
      <ListPicker
        open={!!pickerUserId}
        onOpenChange={(open) => { if (!open) setPickerUserId(null); }}
        title="Nível de Acesso"
        items={[
          { id: '_full', label: 'Acesso completo' },
          ...accessLevels.map(l => ({ id: l.id, label: `${l.name} (${l.modules.length} módulos)` })),
        ]}
        selectedId={pickerUserId ? (getUserAccessLevel(pickerUserId) || '_full') : null}
        onSelect={(id) => {
          if (pickerUserId) {
            if (id === '_create_new') {
              setPickerUserId(null);
              openCreate();
              return;
            }
            handleAssign(pickerUserId, id === '_full' ? null : id);
            setPickerUserId(null);
          }
        }}
        onCreateNew={async () => {
          setPickerUserId(null);
          openCreate();
          return null;
        }}
        createLabel="Criar nível"
        createPlaceholder="Nome do nível..."
      />
    </div>
  );
}
