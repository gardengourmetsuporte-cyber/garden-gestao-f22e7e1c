import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export interface UserWithRole extends Profile {
  role: AppRole;
  unitRole?: string; // role within the active unit (owner/admin/member)
}

export function useUsers() {
  const { isAdmin } = useAuth();
  const { activeUnitId } = useUnit();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin && activeUnitId) {
      fetchUsers();
    } else if (isAdmin && !activeUnitId) {
      setIsLoading(false);
    }
  }, [isAdmin, activeUnitId]);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      // 1. Get user_ids belonging to the active unit
      const { data: unitMembers, error: unitError } = await supabase
        .from('user_units')
        .select('user_id, role')
        .eq('unit_id', activeUnitId!);

      if (unitError) throw unitError;
      if (!unitMembers || unitMembers.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = unitMembers.map(m => m.user_id);

      // 2. Fetch profiles and global roles in parallel
      const [profilesResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds)
          .order('full_name'),
        supabase
          .from('user_roles')
          .select('*')
          .in('user_id', userIds),
      ]);

      if (profilesResult.error) throw profilesResult.error;

      // 3. Combine
      const usersWithRoles: UserWithRole[] = (profilesResult.data || []).map(profile => {
        const globalRole = rolesResult.data?.find(r => r.user_id === profile.user_id);
        const unitMember = unitMembers.find(m => m.user_id === profile.user_id);
        return {
          ...profile,
          role: (globalRole?.role as AppRole) || 'funcionario',
          unitRole: unitMember?.role || 'member',
        };
      });

      setUsers(usersWithRoles);
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: AppRole) {
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      await fetchUsers();
    } catch {
      throw new Error('Erro ao atualizar função do usuário');
    }
  }

  async function updateUserProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);
      if (error) throw error;
      await fetchUsers();
    } catch {
      throw new Error('Erro ao atualizar perfil');
    }
  }

  return {
    users,
    isLoading,
    updateUserRole,
    updateUserProfile,
    refetch: fetchUsers,
  };
}
