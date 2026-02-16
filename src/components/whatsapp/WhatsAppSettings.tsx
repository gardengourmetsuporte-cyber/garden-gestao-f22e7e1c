import { useState, useEffect } from 'react';
import { Copy, Save, Wifi, WifiOff, CheckCircle2, XCircle, Loader2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWhatsAppChannels } from '@/hooks/useWhatsApp';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from '@/hooks/use-toast';
import type { WhatsAppChannel } from '@/types/whatsapp';

const providers = [
  { value: 'evolution', label: 'Evolution API' },
  { value: 'zapi', label: 'Z-API' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'meta', label: 'Meta (Direto)' },
];

export function WhatsAppSettings() {
  const { activeUnitId } = useUnit();
  const { channels, isLoading, upsertChannel } = useWhatsAppChannels();
  const channel = channels[0]; // One channel per unit for MVP

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

  const [testing, setTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);

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

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Carregando...</div>;

  const StatusIcon = ({ ok }: { ok: boolean }) => ok 
    ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--neon-green))' }} /> 
    : <XCircle className="w-4 h-4 text-destructive shrink-0" />;

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* Connection Test */}
      <div className="card-command p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnóstico de Conexão</Label>
          <Button size="sm" variant="outline" onClick={testConnection} disabled={testing} className="gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>
        </div>

        {healthResult && (
          <div className="space-y-2 mt-2">
            {healthResult.checks ? (
              Object.entries(healthResult.checks).map(([key, check]: [string, any]) => (
                <div key={key} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-secondary/40">
                  <StatusIcon ok={check.ok} />
                  <div className="min-w-0">
                    <span className="font-medium capitalize">{
                      key === 'webhook' ? '🌐 Webhook' :
                      key === 'database' ? '🗄️ Banco de Dados' :
                      key === 'ai' ? '🤖 IA (GPT)' :
                      key === 'channel' ? '📱 Canal WhatsApp' :
                      key === 'provider' ? '🔌 Provedor API' : key
                    }</span>
                    <p className="text-xs text-muted-foreground break-all">{check.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-2 text-sm p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Erro no teste</span>
                  <p className="text-xs text-muted-foreground">{healthResult.error || 'Erro desconhecido'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Webhook URL */}
      <div className="card-command p-4 space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL do Webhook</Label>
        <p className="text-xs text-muted-foreground">Configure esta URL no seu provedor de WhatsApp para receber mensagens.</p>
        <div className="flex gap-2">
          <Input value={webhookUrl} readOnly className="text-xs font-mono" />
          <Button size="icon" variant="outline" onClick={copyWebhook}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card/60">
        <div className="flex items-center gap-3">
          {form.is_active ? (
            <Wifi className="w-5 h-5" style={{ color: 'hsl(var(--neon-green))' }} />
          ) : (
            <WifiOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-sm">Atendimento IA</p>
            <p className="text-xs text-muted-foreground">{form.is_active ? 'Ativo' : 'Desativado'}</p>
          </div>
        </div>
        <Switch
          checked={form.is_active}
          onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))}
        />
      </div>

      {/* Provider & Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Provedor</Label>
          <Select value={form.provider} onValueChange={(v) => setForm(p => ({ ...p, provider: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {providers.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Número do WhatsApp</Label>
          <Input
            value={form.phone_number}
            onChange={(e) => setForm(p => ({ ...p, phone_number: e.target.value }))}
            placeholder="+5519999999999"
          />
        </div>
      </div>

      {/* Instance Name (Evolution) */}
      {form.provider === 'evolution' && (
        <div className="space-y-2">
          <Label className="text-sm">Nome da Instância (Evolution API)</Label>
          <Input
            value={form.instance_name || ''}
            onChange={(e) => setForm(p => ({ ...p, instance_name: e.target.value }))}
            placeholder="whatsapp-gestao"
          />
          <p className="text-[10px] text-muted-foreground">O nome da instância configurado na Evolution API (ex: whatsapp-gestao)</p>
        </div>
      )}

      {/* API URL & Key */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">URL da API</Label>
          <Input
            value={form.api_url || ''}
            onChange={(e) => setForm(p => ({ ...p, api_url: e.target.value }))}
            placeholder={form.provider === 'zapi' ? 'https://api.z-api.io/instances/ID/token/TOKEN' : 'https://api.provedor.com/v1'}
          />
          {form.provider === 'zapi' && (
            <p className="text-[10px] text-muted-foreground">Formato: https://api.z-api.io/instances/SEU_ID/token/SEU_TOKEN</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm">{form.provider === 'zapi' ? 'Client-Token' : 'Chave de API'}</Label>
          <Input
            type="password"
            value={form.api_key_ref || ''}
            onChange={(e) => setForm(p => ({ ...p, api_key_ref: e.target.value }))}
            placeholder={form.provider === 'zapi' ? 'Seu Client-Token da Z-API' : 'Sua chave de API'}
          />
          <p className="text-[10px] text-muted-foreground">A chave é armazenada criptografada no banco.</p>
        </div>
      </div>

      {/* AI Personality */}
      <div className="space-y-2">
        <Label className="text-sm">Personalidade da IA</Label>
        <Textarea
          value={form.ai_personality || ''}
          onChange={(e) => setForm(p => ({ ...p, ai_personality: e.target.value }))}
          rows={4}
          placeholder="Descreva como a IA deve se comportar..."
        />
      </div>

      {/* Fallback message */}
      <div className="space-y-2">
        <Label className="text-sm">Mensagem fora do horário</Label>
        <Textarea
          value={form.fallback_message || ''}
          onChange={(e) => setForm(p => ({ ...p, fallback_message: e.target.value }))}
          rows={2}
        />
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={upsertChannel.isPending} className="w-full gap-2">
        <Save className="w-4 h-4" />
        Salvar Configurações
      </Button>
    </div>
  );
}
