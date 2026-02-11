import { useState } from 'react';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { AppRole } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Shield, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function UserManagement() {
  const { users, isLoading, updateUserRole } = useUsers();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingUser(userId);
    try {
      await updateUserRole(userId, newRole);
    } catch (error) {
      toast.error('Erro ao atualizar função');
    } finally {
      setUpdatingUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Gerenciar Usuários</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Altere as funções dos usuários entre Administrador e Funcionário.
      </p>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {user.role === 'admin' ? (
                  <Shield className="w-5 h-5 text-primary" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <span className="font-medium block">{user.full_name}</span>
                {user.job_title && (
                  <span className="text-xs text-muted-foreground">{user.job_title}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {updatingUser === user.user_id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Select
                  value={user.role}
                  onValueChange={(value: AppRole) => handleRoleChange(user.user_id, value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Super Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="funcionario">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Funcionário
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum usuário cadastrado
          </p>
        )}
      </div>
    </div>
  );
}
