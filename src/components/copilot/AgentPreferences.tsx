import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { useCopilotConfig } from '@/hooks/useCopilotConfig';

export function AgentPreferences() {
  const { config, isLoading, upsertConfig } = useCopilotConfig();
  const [language, setLanguage] = useState('pt-BR');
  const [maxResponseLength, setMaxResponseLength] = useState('medium');
  const [autoGreet, setAutoGreet] = useState(true);
  const [activeHoursEnabled, setActiveHoursEnabled] = useState(false);
  const [startHour, setStartHour] = useState('08:00');
  const [endHour, setEndHour] = useState('23:00');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config) {
      const c = config as any;
      setLanguage(c.language || 'pt-BR');
      setMaxResponseLength(c.max_response_length || 'medium');
      setAutoGreet(c.auto_greet !== false);
      if (c.active_hours) {
        setActiveHoursEnabled(true);
        setStartHour(c.active_hours.start || '08:00');
        setEndHour(c.active_hours.end || '23:00');
      }
    }
  }, [config]);

  const mark = () => setDirty(true);

  const handleSave = () => {
    upsertConfig.mutate({
      language,
      max_response_length: maxResponseLength,
      auto_greet: autoGreet,
      active_hours: activeHoursEnabled ? { start: startHour, end: endHour } : null,
    } as any, { onSuccess: () => setDirty(false) });
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Language */}
      <div className="space-y-2">
        <Label>Idioma de resposta</Label>
        <Select value={language} onValueChange={(v) => { setLanguage(v); mark(); }}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
            <SelectItem value="en">🇺🇸 English</SelectItem>
            <SelectItem value="es">🇪🇸 Español</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Response length */}
      <div className="space-y-2">
        <Label>Tamanho das respostas</Label>
        <p className="text-xs text-muted-foreground">Define o nível de detalhe das respostas do agente.</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'short', label: 'Curta', desc: '1-2 frases' },
            { key: 'medium', label: 'Média', desc: '2-4 frases' },
            { key: 'detailed', label: 'Detalhada', desc: 'Completa' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => { setMaxResponseLength(opt.key); mark(); }}
              className={`p-3 rounded-xl border text-center transition-all ${
                maxResponseLength === opt.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30'
              }`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-[10px]">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Auto-greet */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <AppIcon name="Hand" className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Saudação automática</p>
          <p className="text-[11px] text-muted-foreground">Mostrar mensagem de boas-vindas ao abrir o chat</p>
        </div>
        <Switch checked={autoGreet} onCheckedChange={(v) => { setAutoGreet(v); mark(); }} />
      </div>

      {/* Active hours */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <AppIcon name="Clock" className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Horário ativo</p>
            <p className="text-[11px] text-muted-foreground">Limitar respostas ao horário de expediente</p>
          </div>
          <Switch checked={activeHoursEnabled} onCheckedChange={(v) => { setActiveHoursEnabled(v); mark(); }} />
        </div>

        {activeHoursEnabled && (
          <div className="grid grid-cols-2 gap-3 pl-11">
            <div className="space-y-1">
              <Label className="text-xs">Início</Label>
              <Input type="time" value={startHour} onChange={(e) => { setStartHour(e.target.value); mark(); }} className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim</Label>
              <Input type="time" value={endHour} onChange={(e) => { setEndHour(e.target.value); mark(); }} className="rounded-xl" />
            </div>
          </div>
        )}
      </div>

      {dirty && (
        <Button onClick={handleSave} disabled={upsertConfig.isPending} className="w-full gap-2">
          <AppIcon name="Save" className="w-4 h-4" />
          {upsertConfig.isPending ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      )}
    </div>
  );
}
