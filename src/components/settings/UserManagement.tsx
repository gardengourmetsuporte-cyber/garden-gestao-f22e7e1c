import { useState } from 'react';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { AppRole } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const ROLES: { value: AppRole; label: string; icon: string }[] = [
  { value: 'super_admin', label: 'Super Admin', icon: 'Shield' },
  { value: 'admin', label: 'Admin', icon: 'Shield' },
  { value: 'funcionario', label: 'Funcionário', icon: 'User' },
];

export function UserManagement() {
  const { users, isLoading, updateUserRole } = useUsers();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<UserWithRole | null>(null);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setRoleDialogUser(null);
    setUpdatingUser(userId);
    try {
      await updateUserRole(userId, newRole);
    } catch (error) {
      toast.error('Erro ao atualizar função');
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleLabel = (role: AppRole) => ROLES.find(r => r.value === role)?.label || role;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <AppIcon name="progress_activity" size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AppIcon name="Users" size={20} className="text-primary" />
        <h3 className="font-semibold text-foreground">Gerenciar Usuários</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Altere as funções dos usuários entre Administrador e Funcionário.
      </p>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {user.role === 'admin' || user.role === 'super_admin' ? (
                  <AppIcon name="Shield" size={20} className="text-primary" />
                ) : (
                  <AppIcon name="User" size={20} className="text-muted-foreground" />
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
                <AppIcon name="progress_activity" size={16} className="animate-spin" />
              ) : (
                <button
                  onClick={() => setRoleDialogUser(user)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border text-sm font-medium hover:bg-secondary transition-colors"
                >
                  {getRoleLabel(user.role)}
                  <AppIcon name="ChevronDown" size={16} className="text-muted-foreground" />
                </button>
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

      <Dialog open={!!roleDialogUser} onOpenChange={(open) => !open && setRoleDialogUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar função de {roleDialogUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {ROLES.map((role) => {
              const isActive = roleDialogUser?.role === role.value;
              return (
                <button
                  key={role.value}
                  onClick={() => roleDialogUser && handleRoleChange(roleDialogUser.user_id, role.value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                    isActive
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "bg-secondary/50 hover:bg-secondary border border-transparent"
                  )}
                >
                  <AppIcon name={role.icon} size={20} />
                  <span className="font-medium text-sm">{role.label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
