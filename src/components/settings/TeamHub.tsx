import { useState } from 'react';
import { useUsers, UserWithRole } from '@/hooks/useUsers';
import { useAccessLevels, AccessLevel } from '@/hooks/useAccessLevels';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';
import { ALL_MODULES } from '@/lib/modules';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ListPicker } from '@/components/ui/list-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Module groups for access level editor ───
const moduleGroups = (() => {
  const groups: { label: string; modules: typeof ALL_MODULES }[] = [];
  const seen = new Set<string>();
  ALL_MODULES.forEach(m => {
    if (m.key === 'dashboard' || m.key === 'settings') return;
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

const UNIT_ROLE_LABELS: Record<string, string> = {
  owner: 'Dono',
  admin: 'Gerente',
  member: 'Funcionário',
};

export function TeamHub() {
  const [activeTab, setActiveTab] = useState('members');

  return (
    <div className="space-y-4">
      <AnimatedTabs
        tabs={[
          { key: 'members', label: 'Membros' },
          { key: 'invites', label: 'Convites' },
          { key: 'levels', label: 'Níveis' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'members' && <MembersTab />}
      {activeTab === 'invites' && <InvitesTab />}
      {activeTab === 'levels' && <LevelsTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: MEMBROS
// ═══════════════════════════════════════════════════════════════
function MembersTab() {
  const { users, isLoading, updateUserRole, refetch } = useUsers();
  const { accessLevels, isLoading: levelsLoading, assignToUser } = useAccessLevels();
  const { user } = useAuth();
  const { activeUnit, activeUnitId, units } = useUnit();
  const queryClient = useQueryClient();

  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
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

  // Access level picker
  const [pickerUserId, setPickerUserId] = useState<string | null>(null);

  // Fetch user assignments for current unit
  const { data: userAssignments = [] } = useQuery({
    queryKey: ['user-unit-assignments', activeUnitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_units')
        .select('user_id, access_level_id, role')
        .eq('unit_id', activeUnitId!);
      return data || [];
    },
    enabled: !!activeUnitId,
    staleTime: 60 * 1000,
  });

  const getUserAccessLevel = (userId: string) =>
    userAssignments.find(a => a.user_id === userId)?.access_level_id || null;

  const getAccessLevelLabel = (userId: string) => {
    const levelId = getUserAccessLevel(userId);
    if (!levelId) return 'Acesso completo';
    return accessLevels.find(l => l.id === levelId)?.name || 'Acesso completo';
  };

  const handleAssignLevel = async (userId: string, levelId: string | null) => {
    try {
      await assignToUser({ userId, accessLevelId: levelId });
      queryClient.invalidateQueries({ queryKey: ['user-unit-assignments', activeUnitId] });
    } catch {
      toast.error('Erro ao atribuir nível');
    }
  };

  const handleResetPassword = async () => {
    if (!passwordDialogUser || !newPassword) return;
    if (newPassword.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { target_user_id: passwordDialogUser.user_id, new_password: newPassword },
      });
      if (error) throw new Error(data?.error || 'Erro ao redefinir senha');
      if (data?.error) throw new Error(data.error);
      toast.success(`Senha de ${passwordDialogUser.full_name} alterada com sucesso`);
      setPasswordDialogUser(null); setNewPassword(''); setShowPassword(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao redefinir senha');
    } finally { setResettingPassword(false); }
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
      setConfirmRemove(null); refetch();
    } catch (err: any) { toast.error(err?.message || 'Erro ao remover usuário'); }
    finally { setProcessing(false); }
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
      setTransferUser(null); setTargetUnitId(''); refetch();
    } catch (err: any) { toast.error(err?.message || 'Erro ao transferir'); }
    finally { setProcessing(false); }
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
      setConfirmDelete(null); refetch();
    } catch (err: any) { toast.error(err?.message || 'Erro ao excluir conta'); }
    finally { setProcessing(false); }
  };

  const otherUnits = units.filter(u => u.id !== activeUnitId);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><AppIcon name="progress_activity" size={24} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-2">
      {users.map((u) => {
        const isSelf = u.user_id === user?.id;
        const unitRole = u.unitRole || 'member';
        return (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {unitRole === 'owner' ? (
                <AppIcon name="Crown" size={20} className="text-primary" />
              ) : u.role === 'admin' || u.role === 'super_admin' ? (
                <AppIcon name="Shield" size={20} className="text-primary" />
              ) : (
                <AppIcon name="User" size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium block truncate">{u.full_name}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {UNIT_ROLE_LABELS[unitRole] || unitRole}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {getAccessLevelLabel(u.user_id)}
                </span>
                {isSelf && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">Você</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Access level picker button */}
              <button
                onClick={() => setPickerUserId(u.user_id)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-background border border-border text-[11px] font-medium hover:bg-secondary transition-colors max-w-[100px] truncate"
                title="Nível de acesso"
              >
                <AppIcon name="Shield" size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">{getAccessLevelLabel(u.user_id)}</span>
              </button>
              <button
                onClick={() => { setPasswordDialogUser(u); setNewPassword(''); setShowPassword(true); }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Redefinir senha"
              >
                <AppIcon name="Lock" size={16} className="text-muted-foreground" />
              </button>
              {!isSelf && (
                <button
                  onClick={() => { setActionUser(u); setShowActionMenu(true); }}
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
          <p className="text-sm text-muted-foreground">Nenhum membro nesta unidade</p>
        </div>
      )}

      {/* Access Level Picker */}
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
            handleAssignLevel(pickerUserId, id === '_full' ? null : id);
            setPickerUserId(null);
          }
        }}
      />

      {/* Action Menu Dialog */}
      <Dialog open={showActionMenu} onOpenChange={(open) => { if (!open) setShowActionMenu(false); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-base">{actionUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-1 pt-2">
            <button onClick={() => { setShowActionMenu(false); if (actionUser) setConfirmRemove(actionUser); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
              <AppIcon name="UserMinus" size={18} className="text-muted-foreground" />
              <div><p className="text-sm font-medium">Remover da unidade</p><p className="text-xs text-muted-foreground">Desvincula da {activeUnit?.name}</p></div>
            </button>
            {otherUnits.length > 0 && (
              <button onClick={() => { setShowActionMenu(false); if (actionUser) setTransferUser(actionUser); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                <AppIcon name="ArrowRightLeft" size={18} className="text-muted-foreground" />
                <div><p className="text-sm font-medium">Transferir para outra unidade</p><p className="text-xs text-muted-foreground">Move para outro negócio</p></div>
              </button>
            )}
            <button onClick={() => { setShowActionMenu(false); if (actionUser) setConfirmDelete(actionUser); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 transition-colors text-left">
              <AppIcon name="Trash2" size={18} className="text-destructive" />
              <div><p className="text-sm font-medium text-destructive">Excluir conta</p><p className="text-xs text-muted-foreground">Remove permanentemente do sistema</p></div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordDialogUser} onOpenChange={(open) => { if (!open) { setPasswordDialogUser(null); setNewPassword(''); setShowPassword(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Redefinir senha</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Definir nova senha para <strong>{passwordDialogUser?.full_name}</strong></p>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <AppIcon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Use letras maiúsculas, minúsculas, números e caracteres especiais (ex: Garden@2026)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogUser(null)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resettingPassword || newPassword.length < 6}>{resettingPassword ? 'Salvando...' : 'Salvar senha'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove */}
      <AlertDialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {confirmRemove?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>O usuário será desvinculado de <strong>{activeUnit?.name}</strong> e perderá acesso a esta unidade.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFromUnit} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{processing ? 'Removendo...' : 'Remover'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta de {confirmDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é <strong>irreversível</strong>. A conta será excluída permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{processing ? 'Excluindo...' : 'Excluir permanentemente'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferUser} onOpenChange={(open) => { if (!open) { setTransferUser(null); setTargetUnitId(''); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Transferir {transferUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Selecione a unidade de destino.</p>
            <div className="space-y-2">
              {otherUnits.map((unit) => (
                <button key={unit.id} onClick={() => setTargetUnitId(unit.id)}
                  className={cn("w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                    targetUnitId === unit.id ? "bg-primary/10 border border-primary/30 text-primary" : "bg-secondary/50 hover:bg-secondary border border-transparent")}>
                  <AppIcon name="Building2" size={18} /><span className="font-medium text-sm">{unit.name}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferUser(null)}>Cancelar</Button>
            <Button onClick={handleTransfer} disabled={processing || !targetUnitId}>{processing ? 'Transferindo...' : 'Transferir'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: CONVITES
// ═══════════════════════════════════════════════════════════════
function InvitesTab() {
  const { user } = useAuth();
  const { activeUnitId, activeUnit } = useUnit();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [lastInviteEmail, setLastInviteEmail] = useState<string | null>(null);

  const { data: invites = [] } = useQuery({
    queryKey: ['invites', activeUnitId],
    queryFn: async () => {
      if (!activeUnitId) return [];
      const { data, error } = await supabase.from('invites').select('*').eq('unit_id', activeUnitId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeUnitId,
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!user || !activeUnitId || !email.trim()) throw new Error('Dados inválidos');
      const { data, error } = await supabase.from('invites').insert({ email: email.trim().toLowerCase(), unit_id: activeUnitId, role, invited_by: user.id }).select('token').single();
      if (error) throw error;
      return data.token;
    },
    onSuccess: (token: string) => {
      const link = `https://garden-gestao.lovable.app/invite?token=${token}`;
      setLastInviteLink(link);
      setLastInviteEmail(email.trim().toLowerCase());
      navigator.clipboard.writeText(link);
      toast.success('Link gerado e copiado!');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['invites', activeUnitId] });
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar convite'),
  });

  const deleteInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Convite removido'); queryClient.invalidateQueries({ queryKey: ['invites', activeUnitId] }); },
  });

  const pendingInvites = invites.filter((i: any) => !i.accepted_at);

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`https://garden-gestao.lovable.app/invite?token=${token}`);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Convidar Funcionário</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Email do funcionário</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cargo</Label>
            <div className="flex gap-2 mt-1">
              {[{ value: 'member', label: 'Funcionário' }, { value: 'admin', label: 'Gerente' }].map(r => (
                <button key={r.value} onClick={() => setRole(r.value)}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                    role === r.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary')}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => sendInvite.mutate()} disabled={!email.trim() || sendInvite.isPending} className="w-full">
            <AppIcon name="Link" size={16} className="mr-2" />
            {sendInvite.isPending ? 'Gerando...' : 'Gerar Link de Convite'}
          </Button>

          {lastInviteLink && (
            <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs font-medium text-foreground text-center">Enviar convite para {lastInviteEmail}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => {
                  const subject = encodeURIComponent(`Convite para ${activeUnit?.name || 'a equipe'}`);
                  const body = encodeURIComponent(`Olá! Você foi convidado para se juntar ao ${activeUnit?.name || 'nosso time'}.\n\nClique no link para criar sua conta:\n${lastInviteLink}`);
                  window.open(`mailto:${lastInviteEmail}?subject=${subject}&body=${body}`, '_blank');
                }}>
                  <AppIcon name="Mail" size={16} />Email
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => {
                  const text = encodeURIComponent(`Olá! Você foi convidado para se juntar ao *${activeUnit?.name || 'nosso time'}* no Garden Gestão.\n\nCrie sua conta pelo link:\n${lastInviteLink}`);
                  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                }}>
                  <AppIcon name="MessageCircle" size={16} />WhatsApp
                </Button>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(lastInviteLink!); toast.success('Link copiado!'); }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1">
                Copiar link novamente
              </button>
            </div>
          )}

          {!lastInviteLink && <p className="text-[11px] text-muted-foreground text-center">O link será gerado e você poderá enviar por email ou WhatsApp.</p>}
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Convites Pendentes ({pendingInvites.length})</h3>
          {pendingInvites.map((inv: any) => (
            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <AppIcon name="Clock" size={16} className="text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{inv.email}</p>
                <p className="text-xs text-muted-foreground">Expira em {format(new Date(inv.expires_at), "dd/MM", { locale: ptBR })}</p>
              </div>
              <button onClick={() => copyLink(inv.token)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Copiar link">
                <AppIcon name="Copy" size={16} className="text-muted-foreground" />
              </button>
              <button onClick={() => deleteInvite.mutate(inv.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Remover">
                <AppIcon name="Trash2" size={16} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB: NÍVEIS DE ACESSO
// ═══════════════════════════════════════════════════════════════
function LevelsTab() {
  const { accessLevels, isLoading, addAccessLevel, updateAccessLevel, deleteAccessLevel } = useAccessLevels();
  const { activeUnitId } = useUnit();
  const queryClient = useQueryClient();

  const [editingLevel, setEditingLevel] = useState<AccessLevel | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formModules, setFormModules] = useState<string[]>([]);

  // Fetch user assignments for count
  const { data: userAssignments = [] } = useQuery({
    queryKey: ['user-unit-assignments', activeUnitId],
    queryFn: async () => {
      const { data } = await supabase.from('user_units').select('user_id, access_level_id').eq('unit_id', activeUnitId!);
      return data || [];
    },
    enabled: !!activeUnitId,
    staleTime: 60 * 1000,
  });

  const openCreate = () => {
    setEditingLevel(null); setIsCreating(true); setFormName(''); setFormDescription(''); setFormModules([]);
  };

  const openEdit = (level: AccessLevel) => {
    setEditingLevel(level); setIsCreating(true); setFormName(level.name); setFormDescription(level.description || ''); setFormModules([...level.modules]);
  };

  const toggleModule = (key: string) => setFormModules(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);

  const toggleAllInGroup = (groupModules: typeof ALL_MODULES) => {
    const keys = groupModules.map(m => m.key);
    const allSelected = keys.every(k => formModules.includes(k));
    setFormModules(prev => allSelected ? prev.filter(m => !keys.includes(m)) : [...new Set([...prev, ...keys])]);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Nome é obrigatório'); return; }
    if (formModules.length === 0) { toast.error('Selecione pelo menos um módulo'); return; }
    try {
      if (editingLevel) {
        await updateAccessLevel({ id: editingLevel.id, name: formName, description: formDescription, modules: formModules });
      } else {
        await addAccessLevel({ name: formName, description: formDescription, modules: formModules });
      }
      setIsCreating(false);
    } catch { toast.error('Erro ao salvar nível de acesso'); }
  };

  const handleDelete = async (level: AccessLevel) => {
    if (!confirm(`Remover o nível "${level.name}"?`)) return;
    await deleteAccessLevel(level.id);
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Crie níveis customizados para controlar o acesso a módulos específicos.</p>
        <Button size="sm" onClick={openCreate} className="gap-1.5 shrink-0">
          <AppIcon name="Plus" size={14} />Criar
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
                  <p className="text-[10px] text-muted-foreground">{level.modules.length} módulo{level.modules.length !== 1 ? 's' : ''} · {assignedCount} usuário{assignedCount !== 1 ? 's' : ''}</p>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto w-[calc(100%-2rem)] sm:w-full rounded-2xl">
          <DialogHeader><DialogTitle>{editingLevel ? 'Editar Nível' : 'Novo Nível de Acesso'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Líder" />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Ex: Acesso a operação sem financeiro" />
            </div>
            <div className="space-y-3">
              <Label>Módulos permitidos</Label>
              <p className="text-[10px] text-muted-foreground -mt-1">Dashboard e Configurações estão sempre acessíveis</p>
              {moduleGroups.map(group => {
                const allSelected = group.modules.every(m => formModules.includes(m.key));
                const someSelected = group.modules.some(m => formModules.includes(m.key));
                return (
                  <div key={group.label} className="space-y-1.5">
                    <button onClick={() => toggleAllInGroup(group.modules)}
                      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors">
                      <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} className="h-3.5 w-3.5" />
                      {group.label}
                    </button>
                    <div className="grid grid-cols-2 gap-1.5 pl-1">
                      {group.modules.map(mod => (
                        <button key={mod.key} onClick={() => toggleModule(mod.key)}
                          className={cn("flex items-center gap-2 p-2 rounded-lg text-left transition-all text-xs",
                            formModules.includes(mod.key) ? "bg-primary/10 border border-primary/30 text-foreground" : "bg-secondary/40 border border-border/20 text-muted-foreground")}>
                          <Checkbox checked={formModules.includes(mod.key)} className="h-3.5 w-3.5 pointer-events-none" />
                          <AppIcon name={mod.icon} size={14} />
                          <span className="truncate">{mod.label}</span>
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
    </div>
  );
}
