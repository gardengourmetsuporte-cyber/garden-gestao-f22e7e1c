import { useState } from 'react';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { AppRole } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ROLES: { value: AppRole; label: string; icon: string }[] = [
  { value: 'super_admin', label: 'Super Admin', icon: 'Shield' },
  { value: 'admin', label: 'Admin', icon: 'Shield' },
  { value: 'funcionario', label: 'Funcionário', icon: 'User' },
];

const UNIT_ROLE_LABELS: Record<string, string> = {
  owner: 'Dono',
  admin: 'Gerente',
  member: 'Funcionário',
};

export function UserManagement() {
  const { users, isLoading, updateUserRole } = useUsers();
  const { activeUnit } = useUnit();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<UserWithRole | null>(null);
  const [passwordDialogUser, setPasswordDialogUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

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

  const handleResetPassword = async () => {
    if (!passwordDialogUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: passwordDialogUser.user_id, new_password: newPassword },
      });
      if (error) throw new Error(data?.error || 'Erro ao redefinir senha');
      if (data?.error) throw new Error(data.error);
      toast.success(`Senha de ${passwordDialogUser.full_name} alterada com sucesso`);
      setPasswordDialogUser(null);
      setNewPassword('');
      setShowPassword(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao redefinir senha');
    } finally {
      setResettingPassword(false);
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
        <div>
          <h3 className="font-semibold text-foreground">Gerenciar Usuários</h3>
          {activeUnit && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AppIcon name="Building2" size={12} />
              {activeUnit.name}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Usuários vinculados a esta unidade. Altere funções ou redefina senhas.
      </p>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {user.role === 'admin' || user.role === 'super_admin' ? (
                <AppIcon name="Shield" size={20} className="text-primary" />
              ) : (
                <AppIcon name="User" size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium block truncate">{user.full_name}</span>
              <div className="flex items-center gap-2">
                {user.unitRole && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {UNIT_ROLE_LABELS[user.unitRole] || user.unitRole}
                  </span>
                )}
                {user.job_title && (
                  <span className="text-xs text-muted-foreground truncate">{user.job_title}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => { setPasswordDialogUser(user); setNewPassword(''); setShowPassword(false); }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Redefinir senha"
              >
                <AppIcon name="Lock" size={16} className="text-muted-foreground" />
              </button>
              {updatingUser === user.user_id ? (
                <AppIcon name="progress_activity" size={16} className="animate-spin" />
              ) : (
                <button
                  onClick={() => setRoleDialogUser(user)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-medium hover:bg-secondary transition-colors"
                >
                  {getRoleLabel(user.role)}
                  <AppIcon name="ChevronDown" size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <AppIcon name="Users" size={32} className="mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum usuário vinculado a esta unidade
            </p>
          </div>
        )}
      </div>

      {/* Role Dialog */}
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

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordDialogUser} onOpenChange={(open) => { if (!open) { setPasswordDialogUser(null); setNewPassword(''); setShowPassword(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Definir nova senha para <strong>{passwordDialogUser?.full_name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <AppIcon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
              {showPassword && newPassword && (
                <p className="text-xs text-muted-foreground mt-1">
                  Senha: <span className="font-mono font-medium text-foreground">{newPassword}</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogUser(null)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resettingPassword || newPassword.length < 6}>
              {resettingPassword ? 'Salvando...' : 'Salvar senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
