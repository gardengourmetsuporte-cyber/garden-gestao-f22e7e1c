import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { SEGMENT_CONFIG, type Customer, type CustomerSegment } from '@/types/customer';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const TEMPLATES = [
  { label: '🔥 Sentimos sua falta!', text: 'Olá! Sentimos sua falta por aqui. Que tal nos visitar novamente? Temos novidades esperando por você! 😊' },
  { label: '🎉 Promoção especial', text: 'Olá! Temos uma promoção especial para você! Venha aproveitar condições exclusivas. Te esperamos! 🎁' },
  { label: '⭐ Cliente VIP', text: 'Olá! Como cliente VIP, preparamos algo especial para você. Venha conferir! 🌟' },
  { label: '📢 Novidade', text: 'Olá! Temos novidades no cardápio que você vai adorar! Venha experimentar. 😋' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customers: Customer[];
  segment: CustomerSegment | null;
}

export function MessageCampaignSheet({ open, onOpenChange, customers, segment }: Props) {
  const { activeUnit } = useUnit();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [configError, setConfigError] = useState(false);

  const recipients = useMemo(
    () => customers.filter(c => c.phone?.trim()),
    [customers]
  );

  const withoutPhone = customers.length - recipients.length;

  const segLabel = segment ? SEGMENT_CONFIG[segment]?.label : 'Todos';

  const handleSend = async () => {
    if (!message.trim() || !activeUnit || recipients.length === 0) return;

    setSending(true);
    setConfigError(false);
    try {
      const phones = recipients.map(c => c.phone!.replace(/\D/g, ''));
      const { data, error } = await supabase.functions.invoke('whatsapp-bulk-send', {
        body: { unit_id: activeUnit.id, phones, message: message.trim(), segment },
      });

      if (error) throw error;
      if (data?.error) {
        if (typeof data.error === 'string' && data.error.includes('CANAL_SEM_CONFIG')) {
          setConfigError(true);
          toast.error('Canal WhatsApp não configurado. Complete a configuração primeiro.');
          return;
        }
        throw new Error(data.error);
      }

      toast.success(`${data.sent} mensagens enviadas com sucesso!${data.errors ? ` (${data.errors} erros)` : ''}`);
      setMessage('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar mensagens');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="campaign" size={22} className="text-primary" />
            Enviar mensagem em massa
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Recipient summary */}
          <div className="card-surface rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AppIcon name="group" size={18} className="text-primary" />
              {recipients.length} destinatário{recipients.length !== 1 ? 's' : ''} ({segLabel})
            </div>
            {withoutPhone > 0 && (
              <p className="text-xs text-muted-foreground">
                {withoutPhone} cliente{withoutPhone !== 1 ? 's' : ''} sem telefone (excluído{withoutPhone !== 1 ? 's' : ''})
              </p>
            )}
          </div>

          {/* Config error alert */}
          {configError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-2">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AppIcon name="error" size={18} />
                Canal WhatsApp não configurado
              </p>
              <p className="text-xs text-muted-foreground">
                A URL da API ou chave de API não foram preenchidas. Complete a configuração para enviar mensagens.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/whatsapp/settings');
                }}
              >
                <AppIcon name="settings" size={16} />
                Ir para Configurações
              </Button>
            </div>
          )}

          {/* Quick templates */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Templates rápidos</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(t.text)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    message === t.text
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Mensagem</p>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={4}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length} caracteres</p>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || recipients.length === 0 || sending}
            className="w-full h-12 text-base font-semibold"
            style={{ background: 'var(--gradient-brand)' }}
          >
            {sending ? (
              <>
                <AppIcon name="progress_activity" size={18} className="animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <span className="material-symbols-rounded mr-2" style={{ fontSize: 18 }}>send</span>
                Enviar para {recipients.length} cliente{recipients.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            As mensagens serão enviadas via seu canal WhatsApp configurado com intervalo de 1s entre cada envio.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
