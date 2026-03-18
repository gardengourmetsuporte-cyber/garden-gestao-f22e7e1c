import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TeamMember {
  user_id: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistType: 'abertura' | 'fechamento';
  pendingCount: number;
}

function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length >= 12) return cleaned;
  return `55${cleaned}`;
}

export function ChecklistReminderSheet({ open, onOpenChange, checklistType, pendingCount }: Props) {
  const { user } = useAuth();
  const { activeUnitId, activeUnit } = useUnit();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !activeUnitId || !user?.id) return;
    setLoading(true);
    (async () => {
      // Get employees for this unit (excluding current user)
      const { data: employees } = await supabase
        .from('employees')
        .select('user_id, full_name, phone')
        .eq('unit_id', activeUnitId)
        .is('deleted_at', null)
        .eq('is_active', true);

      if (!employees?.length) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Get avatar URLs from profiles
      const userIds = employees.filter(e => e.user_id).map(e => e.user_id!);
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('user_id, avatar_url').in('user_id', userIds)
        : { data: [] as any[] };

      const avatarMap = new Map((profiles || []).map(p => [p.user_id, p.avatar_url]));

      const list: TeamMember[] = employees
        .filter(e => e.user_id !== user.id)
        .map(e => ({
          user_id: e.user_id || e.full_name,
          full_name: e.full_name,
          phone: e.phone,
          avatar_url: e.user_id ? avatarMap.get(e.user_id) || null : null,
        }));

      setMembers(list);
      // Select only members with phone by default
      const withPhone = list.filter(m => m.phone && m.phone.replace(/\D/g, '').length >= 10);
      setSelected(new Set(withPhone.map(m => m.user_id)));
      setLoading(false);
    })();
  }, [open, activeUnitId, user?.id]);

  const toggleMember = (userId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAll = () => {
    const withPhone = members.filter(m => m.phone && m.phone.replace(/\D/g, '').length >= 10);
    if (selected.size === withPhone.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(withPhone.map(m => m.user_id)));
    }
  };

  const handleSend = async () => {
    if (selected.size === 0 || !user?.id || !activeUnitId) return;
    setSending(true);

    const typeLabel = checklistType === 'abertura' ? 'Abertura' : 'Fechamento';
    const unitName = activeUnit?.name || 'a unidade';
    const message = `⏰ *Checklist de ${typeLabel} — ${unitName}*\n\nOlá! Faltam *${pendingCount} tarefa(s)* pendentes e o prazo está acabando!\nAcesse o app e complete o checklist. 💪\n\n📱 Acesse: app.gardengestao.com.br`;

    const selectedMembers = members.filter(m => selected.has(m.user_id));
    const membersWithPhone = selectedMembers.filter(m => m.phone && m.phone.replace(/\D/g, '').length >= 10);

    if (membersWithPhone.length === 0) {
      toast.error('Nenhum membro selecionado tem WhatsApp cadastrado');
      setSending(false);
      return;
    }

    try {
      // Send WhatsApp to each member via wa.me links
      let sentCount = 0;
      for (const member of membersWithPhone) {
        const phone = formatPhoneForWhatsApp(member.phone!);
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        sentCount++;
        // Small delay between opens to avoid browser blocking
        if (sentCount < membersWithPhone.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      // Also send in-app notifications
      const notifRows = selectedMembers
        .filter(m => m.user_id && !m.user_id.includes(' ')) // only real user_ids
        .map(m => ({
          user_id: m.user_id,
          type: 'alert' as const,
          title: `⏰ Finalize o Checklist de ${typeLabel}!`,
          description: `Faltam ${pendingCount} tarefa(s) e o prazo está acabando. Corra para completar!`,
          origin: 'checklist' as const,
          read: false,
        }));

      if (notifRows.length > 0) {
        await supabase.from('notifications').insert(notifRows as any);
      }

      toast.success(`WhatsApp aberto para ${sentCount} pessoa(s)`);
      onOpenChange(false);
    } catch (err) {
      console.error('Reminder error:', err);
      toast.error('Erro ao enviar lembrete');
    } finally {
      setSending(false);
    }
  };

  const selectedWithPhone = members.filter(
    m => selected.has(m.user_id) && m.phone && m.phone.replace(/\D/g, '').length >= 10
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="chat" size={18} fill={1} className="text-[#25D366]" />
            Lembrar Equipe
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {/* Info banner */}
          <div className="p-3 rounded-xl bg-primary/5">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {pendingCount} tarefa(s) pendente(s)
              </span>{' '}
              no checklist de {checklistType === 'abertura' ? 'Abertura' : 'Fechamento'}.
              O lembrete será enviado via WhatsApp.
            </p>
          </div>

          {/* Select all */}
          {members.length > 0 && (
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Checkbox
                checked={selectedWithPhone.length === members.filter(m => m.phone && m.phone.replace(/\D/g, '').length >= 10).length && selectedWithPhone.length > 0}
                className="w-4 h-4 rounded"
              />
              <span>{selected.size > 0 ? 'Desmarcar todos' : 'Selecionar todos'}</span>
            </button>
          )}

          {/* Members list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <AppIcon name="progress_activity" size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AppIcon name="group" size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum funcionário na unidade</p>
            </div>
          ) : (
            <div className="space-y-1">
              {members.map(m => {
                const hasPhone = m.phone && m.phone.replace(/\D/g, '').length >= 10;
                const isSelected = selected.has(m.user_id);

                return (
                  <button
                    key={m.user_id}
                    onClick={() => hasPhone ? toggleMember(m.user_id) : undefined}
                    disabled={!hasPhone}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      !hasPhone && "opacity-40 cursor-not-allowed",
                      hasPhone && isSelected
                        ? "bg-primary/[0.06]"
                        : "bg-muted/[0.04]"
                    )}
                  >
                    <Checkbox
                      checked={isSelected && !!hasPhone}
                      disabled={!hasPhone}
                      className="w-5 h-5 rounded-full shrink-0"
                    />

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <AppIcon name="person" size={16} className="text-muted-foreground/50" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {hasPhone ? (
                          <span className="text-[10px] text-primary flex items-center gap-0.5">
                            <img src="/icons/whatsapp.png" alt="" className="w-3 h-3 dark:invert" />
                            {m.phone}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">
                            Sem telefone cadastrado
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/10">
          <Button
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
            onClick={handleSend}
            disabled={sending || selectedWithPhone.length === 0}
          >
            {sending ? (
              <AppIcon name="progress_activity" size={16} className="animate-spin" />
            ) : (
              <AppIcon name="chat" size={16} fill={1} className="text-white" />
            )}
            Enviar via WhatsApp ({selectedWithPhone.length})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
