import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { AppIcon } from '@/components/ui/app-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';

interface NotifCategory {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const CATEGORIES: NotifCategory[] = [
  { key: 'estoque', label: 'Estoque', description: 'Alertas de estoque baixo ou zerado', icon: 'Package' },
  { key: 'financeiro', label: 'Financeiro', description: 'Contas a pagar, vencidas e saldo negativo', icon: 'DollarSign' },
  { key: 'checklist', label: 'Checklists', description: 'Lembretes de tarefas pendentes', icon: 'ClipboardCheck' },
  { key: 'caixa', label: 'Fechamento de Caixa', description: 'Alertas de caixa não fechado', icon: 'Calculator' },
  { key: 'agenda', label: 'Agenda', description: 'Compromissos e eventos próximos', icon: 'CalendarDays' },
  { key: 'sistema', label: 'Sistema', description: 'Atualizações e avisos gerais', icon: 'Bell' },
];

export function NotificationSettings() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe, isLoading: pushLoading } = usePushNotifications();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('category, enabled')
        .eq('user_id', user.id);

      const map: Record<string, boolean> = {};
      CATEGORIES.forEach(c => { map[c.key] = true; }); // default all enabled
      (data || []).forEach((p: any) => { map[p.category] = p.enabled; });
      setPrefs(map);
      setLoading(false);
    })();
  }, [user]);

  const toggleCategory = async (category: string, enabled: boolean) => {
    if (!user) return;
    setSaving(category);
    setPrefs(prev => ({ ...prev, [category]: enabled }));

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: user.id, category, enabled },
        { onConflict: 'user_id,category' }
      );

    if (error) {
      toast.error('Erro ao salvar preferência');
      setPrefs(prev => ({ ...prev, [category]: !enabled }));
    }
    setSaving(null);
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success('Notificações push desativadas');
    } else {
      const ok = await subscribe();
      if (ok) toast.success('Notificações push ativadas!');
      else toast.error('Não foi possível ativar. Verifique as permissões do navegador.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="w-10 h-5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push master toggle */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Push Notifications</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="BellRing" size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Notificações Push</p>
            <p className="text-[11px] text-muted-foreground">
              {!isSupported
                ? 'Não suportado neste navegador'
                : permission === 'denied'
                ? 'Bloqueado nas configurações do navegador'
                : isSubscribed
                ? 'Ativado — você receberá alertas sonoros'
                : 'Desativado — ative para receber alertas'}
            </p>
          </div>
          {isSupported && permission !== 'denied' && (
            <Button
              size="sm"
              variant={isSubscribed ? 'secondary' : 'default'}
              onClick={handlePushToggle}
              disabled={pushLoading}
              className="rounded-xl text-xs"
            >
              {pushLoading ? 'Aguarde...' : isSubscribed ? 'Desativar' : 'Ativar'}
            </Button>
          )}
        </div>
      </div>

      {/* Category toggles */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Categorias de Alerta</h3>
        <p className="text-[11px] text-muted-foreground">Escolha quais tipos de notificação você deseja receber.</p>

        <div className="space-y-1">
          {CATEGORIES.map(cat => (
            <div
              key={cat.key}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/20 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                <AppIcon name={cat.icon} size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="text-[11px] text-muted-foreground">{cat.description}</p>
              </div>
              <Switch
                checked={prefs[cat.key] ?? true}
                onCheckedChange={(checked) => toggleCategory(cat.key, checked)}
                disabled={saving === cat.key}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
