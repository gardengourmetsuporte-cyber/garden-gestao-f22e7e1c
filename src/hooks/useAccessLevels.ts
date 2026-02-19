import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface AccessLevel {
  id: string;
  unit_id: string;
  name: string;
  description: string | null;
  modules: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccessLevelInput {
  name: string;
  description?: string;
  modules: string[];
  is_default?: boolean;
}

// Fetch access levels for current unit
async function fetchAccessLevels(unitId: string): Promise<AccessLevel[]> {
  const { data, error } = await supabase
    .from('access_levels')
    .select('*')
    .eq('unit_id', unitId)
    .order('name');
  if (error) throw error;
  return (data || []) as AccessLevel[];
}

// Fetch current user's allowed modules
async function fetchUserModules(userId: string, unitId: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from('user_units')
    .select('access_level_id')
    .eq('user_id', userId)
    .eq('unit_id', unitId)
    .maybeSingle();

  if (error || !data?.access_level_id) return null; // null = no restriction (full access)

  const { data: level } = await supabase
    .from('access_levels')
    .select('modules')
    .eq('id', data.access_level_id)
    .single();

  return (level?.modules as string[]) || null;
}

export function useAccessLevels() {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const { data: accessLevels = [], isLoading } = useQuery({
    queryKey: ['access-levels', activeUnitId],
    queryFn: () => fetchAccessLevels(activeUnitId!),
    enabled: !!activeUnitId,
    staleTime: 2 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (input: AccessLevelInput) => {
      const { error } = await supabase.from('access_levels').insert({
        unit_id: activeUnitId!,
        name: input.name,
        description: input.description || null,
        modules: input.modules,
        is_default: input.is_default || false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-levels', activeUnitId] });
      toast.success('Nível de acesso criado');
    },
    onError: () => toast.error('Erro ao criar nível de acesso'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: AccessLevelInput & { id: string }) => {
      const { error } = await supabase.from('access_levels').update({
        name: input.name,
        description: input.description || null,
        modules: input.modules,
        is_default: input.is_default || false,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-levels', activeUnitId] });
      queryClient.invalidateQueries({ queryKey: ['user-modules'] });
      toast.success('Nível de acesso atualizado');
    },
    onError: () => toast.error('Erro ao atualizar nível de acesso'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('access_levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-levels', activeUnitId] });
      toast.success('Nível de acesso removido');
    },
    onError: () => toast.error('Erro ao remover nível de acesso'),
  });

  const assignToUser = useMutation({
    mutationFn: async ({ userId, accessLevelId }: { userId: string; accessLevelId: string | null }) => {
      const { error } = await supabase
        .from('user_units')
        .update({ access_level_id: accessLevelId })
        .eq('user_id', userId)
        .eq('unit_id', activeUnitId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-levels'] });
      queryClient.invalidateQueries({ queryKey: ['user-modules'] });
      toast.success('Nível de acesso atribuído');
    },
    onError: () => toast.error('Erro ao atribuir nível de acesso'),
  });

  return {
    accessLevels,
    isLoading,
    addAccessLevel: addMutation.mutateAsync,
    updateAccessLevel: updateMutation.mutateAsync,
    deleteAccessLevel: deleteMutation.mutateAsync,
    assignToUser: assignToUser.mutateAsync,
  };
}

/** Hook to check current user's allowed modules */
export function useUserModules() {
  const { user, isSuperAdmin } = useAuth();
  const { activeUnitId } = useUnit();

  const { data: allowedModules, isLoading } = useQuery({
    queryKey: ['user-modules', user?.id, activeUnitId],
    queryFn: () => fetchUserModules(user!.id, activeUnitId!),
    enabled: !!user && !!activeUnitId,
    staleTime: 2 * 60 * 1000,
  });

  const hasAccess = (moduleKey: string): boolean => {
    // Super admins always have full access
    if (isSuperAdmin) return true;
    // During loading, hide restricted modules to avoid flash
    if (isLoading) return moduleKey === 'dashboard' || moduleKey === 'settings';
    // If no access level assigned (null), user has full access
    if (allowedModules === null) return true;
    // If query hasn't returned yet but loading is done, default to full access
    if (allowedModules === undefined) return true;
    // Dashboard and settings always accessible
    if (moduleKey === 'dashboard' || moduleKey === 'settings') return true;
    return allowedModules.includes(moduleKey);
  };

  return { allowedModules, isLoading, hasAccess };
}
