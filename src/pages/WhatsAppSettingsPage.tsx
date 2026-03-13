import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useWhatsAppChannels } from '@/hooks/useWhatsApp';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from '@/hooks/use-toast';
import type { WhatsAppChannel } from '@/types/whatsapp';
import { cn } from '@/lib/utils';

const providers = [
  { value: 'evolution', label: 'Evolution API', desc: 'Open-source, self-hosted, sem custo de API', recommended: true, icon: 'Zap' },
  { value: 'zapi', label: 'Z-API', desc: 'Solução brasileira, fácil configuração', recommended: false, icon: 'MessageCircle' },
  { value: 'twilio', label: 'Twilio', desc: 'Enterprise, confiável, pago por mensagem', recommended: false, icon: 'Phone' },
  { value: 'meta', label: 'Meta (Direto)', desc: 'API oficial do WhatsApp Business', recommended: false, icon: 'Globe' },
];

type WizardStep = 'provider' | 'credentials' | 'ai';

export default function WhatsAppSettingsPage() {
  const navigate = useNavigate();
  const { activeUnitId } = useUnit();
  const { channels, isLoading, upsertChannel } = useWhatsAppChannels();
  const channel = channels[0];

  const [step, setStep] = useState<WizardStep>('provider');
  const [form, setForm] = useState<Partial<WhatsAppChannel> & { instance_name?: string }>({
    phone_number: '',
    provider: 'evolution',
    api_url: '',
    api_key_ref: '',
    is_active: false,
    instance_name: '',
    ai_personality: 'Você é um assistente virtual simpático e eficiente. Responda de forma clara e objetiva.',
    fallback_message: 'Olá! No momento estamos fora do horário de atendimento. Retornaremos em breve!',
  });

  const [testing, setTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);

  useEffect(() => {
    if (channel) {
      setForm({
        id: channel.id,
        phone_number: channel.phone_number,
        provider: channel.provider,
        api_url: channel.api_url || '',
        api_key_ref: channel.api_key_ref || '',
        is_active: channel.is_active,
        instance_name: (channel as any).instance_name || '',
        ai_personality: channel.ai_personality || '',
        fallback_message: channel.fallback_message || '',
        business_hours: channel.business_hours,
      });
      setStep('credentials');
    }
  }, [channel]);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  const handleSave = () => {
    if (!activeUnitId) return;
    upsertChannel.mutate({ ...form, unit_id: activeUnitId } as any);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: 'URL copiada!' });
  };

  const testConnection = async () => {
    setTesting(true);
    setHealthResult(null);
    try {
      const params = new URLSearchParams({ action: 'health', provider: form.provider || 'evolution' });
      if (form.id) params.set('channel_id', form.id);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook?${params}`);
      const data = await res.json();
      setHealthResult(data);
    } catch (e: any) {
      setHealthResult({ ok: false, error: e.message || 'Falha ao conectar' });
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) return (
    <AppLayout>
      <div className="text-center py-10 text-muted-foreground">Carregando...</div>
    </AppLayout>
  );

  const StatusIcon = ({ ok }: { ok: boolean }) => ok
    ? <AppIcon name="CheckCircle2" className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--neon-green))' }} />
    : <AppIcon name="XCircle" className="w-4 h-4 text-destructive shrink-0" />;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
        {/* Header */}
        <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-b border-border/20">
          <button onClick={() => navigate('/whatsapp')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors lg:hidden">
            <AppIcon name="ArrowLeft" size={18} className="text-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">Configurações WhatsApp</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4 max-w-2xl mx-auto pb-24">
            {/* Step Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-secondary/50">
              {[
                { key: 'provider' as const, label: 'Provedor', icon: 'Plug' },
                { key: 'credentials' as const, label: 'Conexão', icon: 'Key' },
                { key: 'ai' as const, label: 'IA & Horários', icon: 'Brain' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setStep(t.key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all',
                    step === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <AppIcon name={t.icon} size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Step: Provider */}
            {step === 'provider' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Escolha o provedor de API do WhatsApp:</p>
                {providers.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setForm(f => ({ ...f, provider: p.value })); setStep('credentials'); }}
                    className={cn(
                      "w-full card-command p-4 text-left flex items-center gap-3 active:scale-[0.98] transition-all",
                      form.provider === p.value && "ring-2 ring-primary"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary shrink-0">
                      <AppIcon name={p.icon} size={20} className={p.recommended ? 'text-emerald-500' : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{p.label}</p>
                        {p.recommended && (
                          <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded-full">
                            RECOMENDADO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                    </div>
                    <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Step: Credentials */}
            {step === 'credentials' && (
              <div className="space-y-4">
                {/* Status toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-border/30 bg-card">
                  <div className="flex items-center gap-3">
                    {form.is_active ? (
                      <AppIcon name="Wifi" className="w-5 h-5" style={{ color: 'hsl(var(--neon-green))' }} />
                    ) : (
                      <AppIcon name="WifiOff" className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">Atendimento IA</p>
                      <p className="text-xs text-muted-foreground">{form.is_active ? 'Ativo' : 'Desativado'}</p>
                    </div>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))} />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="text-sm">Número do WhatsApp</Label>
                  <Input
                    value={form.phone_number}
                    onChange={(e) => setForm(p => ({ ...p, phone_number: e.target.value }))}
                    placeholder="+5519999999999"
                  />
                </div>

                {/* Instance Name (Evolution) */}
                {form.provider === 'evolution' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Nome da Instância</Label>
                    <Input
                      value={form.instance_name || ''}
                      onChange={(e) => setForm(p => ({ ...p, instance_name: e.target.value }))}
                      placeholder="whatsapp-gestao"
                    />
                    <p className="text-[10px] text-muted-foreground">Nome configurado na Evolution API</p>
                  </div>
                )}

                {/* API URL */}
                <div className="space-y-2">
                  <Label className="text-sm">URL da API</Label>
                  <Input
                    value={form.api_url || ''}
                    onChange={(e) => setForm(p => ({ ...p, api_url: e.target.value }))}
                    placeholder={form.provider === 'zapi' ? 'https://api.z-api.io/instances/ID/token/TOKEN' : 'https://api.provedor.com/v1'}
                  />
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label className="text-sm">{form.provider === 'zapi' ? 'Client-Token' : 'Chave de API'}</Label>
                  <Input
                    type="password"
                    value={form.api_key_ref || ''}
                    onChange={(e) => setForm(p => ({ ...p, api_key_ref: e.target.value }))}
                    placeholder={form.provider === 'zapi' ? 'Seu Client-Token' : 'Sua chave de API'}
                  />
                  <p className="text-[10px] text-muted-foreground">Armazenada de forma segura no banco.</p>
                </div>

                {/* Webhook */}
                <div className="card-command p-4 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL do Webhook</Label>
                  <p className="text-[10px] text-muted-foreground">Configure no seu provedor para receber mensagens.</p>
                  <div className="flex gap-2">
                    <Input value={webhookUrl} readOnly className="text-xs font-mono" />
                    <Button size="icon" variant="outline" onClick={copyWebhook}>
                      <AppIcon name="Copy" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Test Connection */}
                <Button variant="outline" onClick={testConnection} disabled={testing} className="w-full gap-2">
                  {testing ? <AppIcon name="Loader2" className="w-4 h-4 animate-spin" /> : <AppIcon name="Activity" className="w-4 h-4" />}
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </Button>

                {healthResult && (
                  <div className="space-y-2">
                    {healthResult.checks ? (
                      Object.entries(healthResult.checks).map(([key, check]: [string, any]) => (
                        <div key={key} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-secondary/40">
                          <StatusIcon ok={check.ok} />
                          <div className="min-w-0">
                            <span className="font-medium capitalize">{
                              key === 'webhook' ? '🌐 Webhook' :
                              key === 'database' ? '🗄️ Banco' :
                              key === 'ai' ? '🤖 IA' :
                              key === 'channel' ? '📱 Canal' :
                              key === 'provider' ? '🔌 Provedor' : key
                            }</span>
                            <p className="text-xs text-muted-foreground break-all">{check.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start gap-2 text-sm p-2 rounded-lg bg-destructive/10">
                        <AppIcon name="XCircle" className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">Erro</span>
                          <p className="text-xs text-muted-foreground">{healthResult.error || 'Erro desconhecido'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step: AI */}
            {step === 'ai' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Personalidade da IA</Label>
                  <Textarea
                    value={form.ai_personality || ''}
                    onChange={(e) => setForm(p => ({ ...p, ai_personality: e.target.value }))}
                    rows={4}
                    placeholder="Descreva como a IA deve se comportar..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Mensagem fora do horário</Label>
                  <Textarea
                    value={form.fallback_message || ''}
                    onChange={(e) => setForm(p => ({ ...p, fallback_message: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Save */}
            <Button onClick={handleSave} disabled={upsertChannel.isPending} className="w-full gap-2">
              <AppIcon name="Save" className="w-4 h-4" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
