import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
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

export function ChecklistReminderSheet({ open, onOpenChange, checklistType, pendingCount }: Props) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !activeUnitId || !user?.id) return;
    setLoading(true);
    (async () => {
      const { data: unitUsers } = await supabase
        .from('user_units')
        .select('user_id')
        .eq('unit_id', activeUnitId)
        .neq('user_id', user.id);

      if (!unitUsers?.length) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const userIds = unitUsers.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, avatar_url')
        .in('user_id', userIds);

      const list: TeamMember[] = (profiles || []).map(p => ({
        user_id: p.user_id,
        full_name: p.full_name || 'Sem nome',
        phone: p.phone,
        avatar_url: p.avatar_url,
      }));

      setMembers(list);
      // Select all by default
      setSelected(new Set(list.map(m => m.user_id)));
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
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map(m => m.user_id)));
    }
  };

  const handleSend = async () => {
    if (selected.size === 0 || !user?.id || !activeUnitId) return;
    setSending(true);

    const typeLabel = checklistType === 'abertura' ? 'Abertura' : 'Fechamento';
    const message = `⏰ *Checklist de ${typeLabel}*\n\nFaltam ${pendingCount} tarefa(s) pendentes e o prazo está acabando!\nCorra para completar! 💪`;

    const selectedMembers = members.filter(m => selected.has(m.user_id));

    try {
      // 1. Send in-app notifications
      const notifRows = selectedMembers.map(m => ({
        user_id: m.user_id,
        type: 'alert' as const,
        title: `⏰ Finalize o Checklist de ${typeLabel}!`,
        description: `Faltam ${pendingCount} tarefa(s) e o prazo está acabando. Corra para completar!`,
        origin: 'checklist' as const,
        read: false,
      }));
      await supabase.from('notifications').insert(notifRows as any);

      // 2. Try WhatsApp for members with phone numbers
      const phonesForWa = selectedMembers
        .filter(m => m.phone && m.phone.replace(/\D/g, '').length >= 10)
        .map(m => m.phone!.replace(/\D/g, ''));

      let waSent = 0;
      if (phonesForWa.length > 0) {
        try {
          const { data, error } = await supabase.functions.invoke('whatsapp-bulk-send', {
            body: {
              unit_id: activeUnitId,
              phones: phonesForWa,
              message,
            },
          });
          if (!error && data?.sent) {
            waSent = data.sent;
          }
        } catch {
          // WhatsApp not configured — that's ok, notification still sent
        }
      }

      const parts: string[] = [`Notificação enviada para ${selectedMembers.length} pessoa(s)`];
      if (waSent > 0) parts.push(`${waSent} via WhatsApp`);
      else if (phonesForWa.length > 0) parts.push('WhatsApp não configurado');

      toast.success(parts.join(' • '));
      onOpenChange(false);
    } catch (err) {
      console.error('Reminder error:', err);
      toast.error('Erro ao enviar lembrete');
    } finally {
      setSending(false);
    }
  };

  const whatsappCount = members.filter(
    m => selected.has(m.user_id) && m.phone && m.phone.replace(/\D/g, '').length >= 10
  ).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="notifications" size={20} className="text-primary" />
            Lembrar Equipe
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {/* Info banner */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {pendingCount} tarefa(s) pendente(s)
              </span>{' '}
              no checklist de {checklistType === 'abertura' ? 'Abertura' : 'Fechamento'}.
              Selecione quem deve receber o lembrete.
            </p>
          </div>

          {/* Channels info */}
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <AppIcon name="notifications" size={12} />
              Notificação
            </Badge>
            {whatsappCount > 0 && (
              <Badge variant="secondary" className="gap-1 text-[10px] bg-emerald-500/10 text-emerald-600">
                <AppIcon name="Phone" size={12} />
                WhatsApp ({whatsappCount})
              </Badge>
            )}
          </div>

          {/* Select all */}
          {members.length > 0 && (
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Checkbox
                checked={selected.size === members.length}
                className="w-4 h-4 rounded"
              />
              <span>{selected.size === members.length ? 'Desmarcar todos' : 'Selecionar todos'}</span>
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
                    onClick={() => toggleMember(m.user_id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      isSelected
                        ? "bg-primary/[0.06] border border-primary/10"
                        : "bg-muted/[0.04] border border-border/5 opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
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
                          <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                            <AppIcon name="Phone" size={10} />
                            WhatsApp
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">
                            Sem WhatsApp
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
            className="w-full gap-2"
            onClick={handleSend}
            disabled={sending || selected.size === 0}
          >
            {sending ? (
              <AppIcon name="progress_activity" size={16} className="animate-spin" />
            ) : (
              <AppIcon name="send" size={16} />
            )}
            Enviar Lembrete ({selected.size})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
