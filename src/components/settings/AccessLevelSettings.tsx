import { useState, useCallback, useMemo } from 'react';
import { useAccessLevels, AccessLevel } from '@/hooks/useAccessLevels';
import { useUsers } from '@/hooks/useUsers';
import { ALL_MODULES, getSubModuleKeys, isSubModuleKey, getParentModuleKey } from '@/lib/modules';
import { MODULE_REQUIRED_PLAN } from '@/lib/plans';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ListPicker } from '@/components/ui/list-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Build grouped module tree (exclude dashboard which is always accessible)
const moduleGroups = (() => {
  const groups: { label: string; modules: typeof ALL_MODULES }[] = [];
  const seen = new Set<string>();
  ALL_MODULES.forEach(m => {
    if (m.key === 'dashboard') return; // always accessible
    if (!seen.has(m.group)) {
      seen.add(m.group);
      groups.push({
        label: m.group,
        modules: ALL_MODULES.filter(mod => mod.group === m.group && mod.key !== 'dashboard'),
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
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
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

  // All module keys that have children — used to auto-expand
  const allExpandableKeys = useMemo(() => {
    const keys = new Set<string>();
    ALL_MODULES.forEach(m => { if (m.children && m.children.length > 0) keys.add(m.key); });
    return keys;
  }, []);

  const openCreate = () => {
    setEditingLevel(null);
    setIsCreating(true);
    setFormName('');
    setFormDescription('');
    setFormModules([]);
    setExpandedModules(new Set(allExpandableKeys));
  };

  const openEdit = (level: AccessLevel) => {
    setEditingLevel(level);
    setIsCreating(true);
    setFormName(level.name);
    setFormDescription(level.description || '');
    setFormModules([...level.modules]);
    // Auto-expand all modules with children for full visibility
    setExpandedModules(new Set(allExpandableKeys));
  };

  const toggleExpand = useCallback((key: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Toggle a parent module — also toggles all its children
  const toggleParentModule = useCallback((parentKey: string) => {
    setFormModules(prev => {
      const subKeys = getSubModuleKeys(parentKey);
      const isSelected = prev.includes(parentKey);
      if (isSelected) {
        // Remove parent + all children
        return prev.filter(m => m !== parentKey && !subKeys.includes(m));
      } else {
        // Add parent + all children
        return [...new Set([...prev, parentKey, ...subKeys])];
      }
    });
  }, []);

  // Toggle a single child module
  const toggleChildModule = useCallback((childKey: string) => {
    setFormModules(prev => {
      const parentKey = getParentModuleKey(childKey);
      const subKeys = getSubModuleKeys(parentKey);
      const isSelected = prev.includes(childKey);

      let next: string[];
      if (isSelected) {
        // Remove this child
        next = prev.filter(m => m !== childKey);
        // If no children remain, remove parent too
        const remainingChildren = next.filter(m => subKeys.includes(m));
        if (remainingChildren.length === 0) {
          next = next.filter(m => m !== parentKey);
        }
      } else {
        // Add this child + ensure parent is added
        next = [...new Set([...prev, childKey, parentKey])];
      }
      return next;
    });
  }, []);

  // Toggle all modules in a group
  const toggleAllInGroup = useCallback((groupModules: typeof ALL_MODULES) => {
    setFormModules(prev => {
      const allKeys: string[] = [];
      groupModules.forEach(m => {
        allKeys.push(m.key);
        if (m.children) m.children.forEach(c => allKeys.push(c.key));
      });
      const allSelected = allKeys.every(k => prev.includes(k));
      if (allSelected) {
        return prev.filter(m => !allKeys.includes(m));
      } else {
        return [...new Set([...prev, ...allKeys])];
      }
    });
  }, []);

  // Check parent state based on children
  const getParentCheckState = useCallback((parentKey: string): boolean | 'indeterminate' => {
    const subKeys = getSubModuleKeys(parentKey);
    if (subKeys.length === 0) return formModules.includes(parentKey);
    const selectedCount = subKeys.filter(k => formModules.includes(k)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === subKeys.length) return true;
    return 'indeterminate';
  }, [formModules]);

  // Count selected modules in a group
  const getGroupCheckState = useCallback((groupModules: typeof ALL_MODULES): boolean | 'indeterminate' => {
    const allKeys: string[] = [];
    groupModules.forEach(m => {
      allKeys.push(m.key);
      if (m.children) m.children.forEach(c => allKeys.push(c.key));
    });
    const selectedCount = allKeys.filter(k => formModules.includes(k)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === allKeys.length) return true;
    return 'indeterminate';
  }, [formModules]);

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    // At least one parent module
    const parentModules = formModules.filter(m => !isSubModuleKey(m));
    if (parentModules.length === 0) {
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

  // Count only parent-level modules for display
  const countParentModules = (modules: string[]) => modules.filter(m => !isSubModuleKey(m)).length;
  const countSubModules = (modules: string[]) => modules.filter(m => isSubModuleKey(m)).length;

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
              const parentCount = countParentModules(level.modules);
              const subCount = countSubModules(level.modules);
              return (
                <div key={level.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
                    <AppIcon name="Shield" size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{level.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {parentCount} módulo{parentCount !== 1 ? 's' : ''}
                      {subCount > 0 && ` · ${subCount} sub-permiss${subCount !== 1 ? 'ões' : 'ão'}`}
                      {' · '}{assignedCount} usuário{assignedCount !== 1 ? 's' : ''}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-full rounded-2xl p-4 sm:p-6 left-1/2 -translate-x-1/2">
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
              <div className="flex items-center justify-between">
                <Label>Módulos e permissões</Label>
                <span className="text-[10px] text-muted-foreground">
                  {countParentModules(formModules)} módulos · {countSubModules(formModules)} sub-permissões
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Dashboard está sempre acessível. Clique na seta para expandir sub-permissões.
              </p>

              {moduleGroups.map(group => {
                const groupCheck = getGroupCheckState(group.modules);

                return (
                  <div key={group.label} className="space-y-1">
                    {/* Group header */}
                    <button
                      onClick={() => toggleAllInGroup(group.modules)}
                      className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors w-full"
                    >
                      <Checkbox
                        checked={groupCheck === true ? true : groupCheck === 'indeterminate' ? 'indeterminate' : false}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      {group.label}
                    </button>

                    {/* Module items */}
                    <div className="space-y-1 pl-0.5">
                      {group.modules.map(mod => {
                        const hasChildren = mod.children && mod.children.length > 0;
                        const isExpanded = expandedModules.has(mod.key);
                        const parentState = getParentCheckState(mod.key);
                        const isSelected = hasChildren ? parentState === true : formModules.includes(mod.key);

                        return (
                          <div key={mod.key}>
                            {/* Parent module row */}
                            <div
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg transition-all text-xs",
                                isSelected || parentState === 'indeterminate'
                                  ? "bg-primary/10 border border-primary/30"
                                  : "bg-secondary/40 border border-border/20"
                              )}
                            >
                              {/* Expand arrow */}
                              {hasChildren ? (
                                <button
                                  onClick={() => toggleExpand(mod.key)}
                                  className="p-0.5 rounded hover:bg-secondary transition-colors shrink-0"
                                >
                                  <AppIcon
                                    name="ChevronRight"
                                    size={14}
                                    className={cn(
                                      "text-muted-foreground transition-transform duration-200",
                                      isExpanded && "rotate-90"
                                    )}
                                  />
                                </button>
                              ) : (
                                <div className="w-[22px] shrink-0" />
                              )}

                              {/* Checkbox */}
                              <button
                                onClick={() => hasChildren ? toggleParentModule(mod.key) : toggleParentModule(mod.key)}
                                className="flex items-center gap-2 flex-1 min-w-0"
                              >
                                <Checkbox
                                  checked={parentState === true ? true : parentState === 'indeterminate' ? 'indeterminate' : false}
                                  className="h-3.5 w-3.5 pointer-events-none shrink-0"
                                />
                                <AppIcon name={mod.icon} size={15} className="shrink-0" />
                                <span className={cn(
                                  "truncate flex-1 text-left font-medium",
                                  isSelected || parentState === 'indeterminate' ? "text-foreground" : "text-muted-foreground"
                                )}>
                                  {mod.label}
                                </span>
                              </button>

                              {/* Plan badge */}
                              {MODULE_REQUIRED_PLAN[mod.key] && (
                                <span className="text-[8px] font-bold uppercase tracking-wider shrink-0" style={{ color: 'hsl(45 90% 55%)' }}>
                                  {MODULE_REQUIRED_PLAN[mod.key] === 'business' ? 'BIZ' : 'PRO'}
                                </span>
                              )}

                              {/* Children count */}
                              {hasChildren && (
                                <span className="text-[9px] text-muted-foreground/60 shrink-0">
                                  {mod.children!.filter(c => formModules.includes(c.key)).length}/{mod.children!.length}
                                </span>
                              )}
                            </div>

                            {/* Children (sub-modules) */}
                            {hasChildren && isExpanded && (
                              <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-primary/10 pl-2">
                                {mod.children!.map(child => {
                                  const childSelected = formModules.includes(child.key);
                                  return (
                                    <button
                                      key={child.key}
                                      onClick={() => toggleChildModule(child.key)}
                                      className={cn(
                                        "flex items-center gap-2 p-1.5 rounded-md transition-all text-[11px] w-full",
                                        childSelected
                                          ? "bg-primary/8 text-foreground"
                                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                                      )}
                                    >
                                      <Checkbox
                                        checked={childSelected}
                                        className="h-3 w-3 pointer-events-none shrink-0"
                                      />
                                      <AppIcon name={child.icon} size={12} className="shrink-0 opacity-70" />
                                      <span className="truncate flex-1 text-left">{child.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingLevel ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Level Picker */}
      <ListPicker
        open={!!pickerUserId}
        onOpenChange={(open) => { if (!open) setPickerUserId(null); }}
        title="Nível de Acesso"
        items={[
          { id: '_full', label: 'Acesso completo' },
          ...accessLevels.map(l => ({
            id: l.id,
            label: `${l.name} (${countParentModules(l.modules)} módulos)`,
          })),
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
