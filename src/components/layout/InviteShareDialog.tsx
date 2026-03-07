import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppIcon } from '@/components/ui/app-icon';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InviteShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteShareDialog({ open, onOpenChange }: InviteShareDialogProps) {
  const { user } = useAuth();
  const { activeUnit } = useUnit();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && activeUnit && user) {
      generateInviteLink();
    }
  }, [open, activeUnit?.id]);

  async function generateInviteLink() {
    if (!activeUnit || !user) return;
    setLoading(true);
    try {
      // Check for existing active invite
      const { data: existing } = await supabase
        .from('invites')
        .select('token')
        .eq('unit_id', activeUnit.id)
        .eq('invited_by', user.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.token) {
        setInviteLink(`${window.location.origin}/invite?token=${existing.token}`);
      } else {
        // Create new invite
        const token = crypto.randomUUID();
        const { error } = await supabase.from('invites').insert({
          unit_id: activeUnit.id,
          email: 'open-invite@garden.app',
          role: 'member',
          token,
          invited_by: user.id,
        });
        if (error) throw error;
        setInviteLink(`${window.location.origin}/invite?token=${token}`);
      }
    } catch (err) {
      console.error('Error generating invite:', err);
      toast.error('Erro ao gerar link de convite');
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Link copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const shareViaWhatsApp = () => {
    if (!inviteLink) return;
    const text = encodeURIComponent(`Junte-se à equipe ${activeUnit?.name || 'Garden'}: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AppIcon name="UserPlus" size={20} className="text-primary" />
            Convidar Equipe
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Compartilhe o link abaixo para convidar alguém para a equipe <strong>{activeUnit?.name}</strong>.
        </p>

        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : inviteLink ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 bg-transparent text-xs text-foreground outline-none truncate"
              />
              <button
                onClick={copyToClipboard}
                className="shrink-0 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Copiar
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={shareViaWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#25D366]/10 text-[#25D366] text-sm font-semibold hover:bg-[#25D366]/20 transition-colors"
              >
                <AppIcon name="MessageCircle" size={18} />
                WhatsApp
              </button>
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
              >
                <AppIcon name="Link" size={18} />
                Copiar Link
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Erro ao gerar link</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
