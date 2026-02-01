import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole, UserRole } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export interface UserWithRole extends Profile {
  role: AppRole;
}

export function useUsers() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role as AppRole) || 'funcionario',
        };
      });

      setUsers(usersWithRoles);
    } catch {
      // Error handled silently - user sees empty state
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: AppRole) {
    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      await fetchUsers();
    } catch (error) {
      // Re-throw for caller to handle with generic message
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
    } catch (error) {
      // Re-throw for caller to handle with generic message
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
