import { useState } from 'react';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { AppRole } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
import { useUnit } from '@/contexts/UnitContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
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
  const { users, isLoading, updateUserRole, refetch } = useUsers();
  const { user } = useAuth();
  const { activeUnit, activeUnitId, units } = useUnit();
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<UserWithRole | null>(null);
  const [passwordDialogUser, setPasswordDialogUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Action menu
  const [actionUser, setActionUser] = useState<UserWithRole | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Confirm dialogs
  const [confirmRemove, setConfirmRemove] = useState<UserWithRole | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserWithRole | null>(null);
  const [transferUser, setTransferUser] = useState<UserWithRole | null>(null);
  const [targetUnitId, setTargetUnitId] = useState<string>('');
  const [processing, setProcessing] = useState(false);

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

  const handleRemoveFromUnit = async () => {
    if (!confirmRemove || !activeUnitId) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'remove_from_unit', target_user_id: confirmRemove.user_id, unit_id: activeUnitId },
      });
      if (error || data?.error) throw new Error(data?.error || 'Erro');
      toast.success(`${confirmRemove.full_name} removido da unidade`);
      setConfirmRemove(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover usuário');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferUser || !activeUnitId || !targetUnitId) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'transfer_to_unit', target_user_id: transferUser.user_id, unit_id: activeUnitId, target_unit_id: targetUnitId },
      });
      if (error || data?.error) throw new Error(data?.error || 'Erro');
      const targetName = units.find(u => u.id === targetUnitId)?.name || 'outra unidade';
      toast.success(`${transferUser.full_name} transferido para ${targetName}`);
      setTransferUser(null);
      setTargetUnitId('');
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao transferir usuário');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'delete_account', target_user_id: confirmDelete.user_id },
      });
      if (error || data?.error) throw new Error(data?.error || 'Erro');
      toast.success(`Conta de ${confirmDelete.full_name} excluída permanentemente`);
      setConfirmDelete(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir conta');
    } finally {
      setProcessing(false);
    }
  };

  const openActionMenu = (u: UserWithRole) => {
    setActionUser(u);
    setShowActionMenu(true);
  };

  const getRoleLabel = (role: AppRole) => ROLES.find(r => r.value === role)?.label || role;

  const otherUnits = units.filter(u => u.id !== activeUnitId);

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
        Usuários vinculados a esta unidade. Altere funções, transfira ou remova.
      </p>

      <div className="space-y-2">
        {users.map((u) => {
          const isSelf = u.user_id === user?.id;
          return (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {u.role === 'admin' || u.role === 'super_admin' ? (
                  <AppIcon name="Shield" size={20} className="text-primary" />
                ) : (
                  <AppIcon name="User" size={20} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium block truncate">{u.full_name}</span>
                <div className="flex items-center gap-2">
                  {u.unitRole && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {UNIT_ROLE_LABELS[u.unitRole] || u.unitRole}
                    </span>
                  )}
                  {isSelf && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">Você</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setPasswordDialogUser(u); setNewPassword(''); setShowPassword(true); }}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  title="Redefinir senha"
                >
                  <AppIcon name="Lock" size={16} className="text-muted-foreground" />
                </button>
                {updatingUser === u.user_id ? (
                  <AppIcon name="progress_activity" size={16} className="animate-spin" />
                ) : (
                  <button
                    onClick={() => setRoleDialogUser(u)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-medium hover:bg-secondary transition-colors"
                  >
                    {getRoleLabel(u.role)}
                    <AppIcon name="ChevronDown" size={14} className="text-muted-foreground" />
                  </button>
                )}
                {!isSelf && (
                  <button
                    onClick={() => openActionMenu(u)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    title="Mais ações"
                  >
                    <AppIcon name="MoreVertical" size={16} className="text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <AppIcon name="Users" size={32} className="mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum usuário vinculado a esta unidade
            </p>
          </div>
        )}
      </div>

      {/* Action Menu Dialog */}
      <Dialog open={showActionMenu} onOpenChange={(open) => { if (!open) setShowActionMenu(false); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">{actionUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 pt-2">
            <button
              onClick={() => {
                setShowActionMenu(false);
                if (actionUser) setConfirmRemove(actionUser);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
            >
              <AppIcon name="UserMinus" size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Remover da unidade</p>
                <p className="text-xs text-muted-foreground">Desvincula da {activeUnit?.name}</p>
              </div>
            </button>
            {otherUnits.length > 0 && (
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  if (actionUser) setTransferUser(actionUser);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <AppIcon name="ArrowRightLeft" size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Transferir para outra unidade</p>
                  <p className="text-xs text-muted-foreground">Move para outro negócio</p>
                </div>
              </button>
            )}
            <button
              onClick={() => {
                setShowActionMenu(false);
                if (actionUser) setConfirmDelete(actionUser);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 transition-colors text-left"
            >
              <AppIcon name="Trash2" size={18} className="text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Excluir conta</p>
                <p className="text-xs text-muted-foreground">Remove permanentemente do sistema</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
              <p className="text-[11px] text-muted-foreground mt-1">
                Use letras maiúsculas, minúsculas, números e caracteres especiais (ex: Garden@2026)
              </p>
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

      {/* Confirm Remove from Unit */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {confirmRemove?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário será desvinculado de <strong>{activeUnit?.name}</strong> e perderá acesso a esta unidade. A conta continuará existindo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFromUnit} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processing ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Account */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta de {confirmDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong>. A conta será excluída permanentemente do sistema, incluindo todas as unidades e dados de perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processing ? 'Excluindo...' : 'Excluir permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferUser} onOpenChange={(open) => { if (!open) { setTransferUser(null); setTargetUnitId(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Transferir {transferUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Selecione a unidade de destino. O usuário será removido de <strong>{activeUnit?.name}</strong>.
            </p>
            <div className="space-y-2">
              {otherUnits.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => setTargetUnitId(unit.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                    targetUnitId === unit.id
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "bg-secondary/50 hover:bg-secondary border border-transparent"
                  )}
                >
                  <AppIcon name="Building2" size={18} />
                  <span className="font-medium text-sm">{unit.name}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferUser(null)}>Cancelar</Button>
            <Button onClick={handleTransfer} disabled={processing || !targetUnitId}>
              {processing ? 'Transferindo...' : 'Transferir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
