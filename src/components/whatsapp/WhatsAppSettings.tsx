import { useState, useEffect } from 'react';
import { Copy, Save, Wifi, WifiOff } from 'lucide-react';
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

  const [form, setForm] = useState<Partial<WhatsAppChannel>>({
    phone_number: '',
    provider: 'evolution',
    api_url: '',
    api_key_ref: '',
    is_active: false,
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

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
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
            placeholder="+5511999999999"
          />
        </div>
      </div>

      {/* API URL & Key */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">URL da API</Label>
          <Input
            value={form.api_url || ''}
            onChange={(e) => setForm(p => ({ ...p, api_url: e.target.value }))}
            placeholder="https://api.provedor.com/v1"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Chave de API</Label>
          <Input
            type="password"
            value={form.api_key_ref || ''}
            onChange={(e) => setForm(p => ({ ...p, api_key_ref: e.target.value }))}
            placeholder="Sua chave de API"
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
