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

      // 3. Combine — pick highest role if duplicates exist
      const rolePriority: Record<string, number> = { super_admin: 3, admin: 2, funcionario: 1 };
      const usersWithRoles: UserWithRole[] = (profilesResult.data || []).map(profile => {
        const userRoles = rolesResult.data?.filter(r => r.user_id === profile.user_id) || [];
        const bestRole = userRoles.sort((a, b) => (rolePriority[b.role] || 0) - (rolePriority[a.role] || 0))[0];
        const unitMember = unitMembers.find(m => m.user_id === profile.user_id);
        return {
          ...profile,
          role: (bestRole?.role as AppRole) || 'funcionario',
          unitRole: unitMember?.role || 'member',
        };
      });

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: AppRole) {
    try {
      // Delete ALL existing roles first to prevent duplicates
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert the single new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });
      if (error) throw error;

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
