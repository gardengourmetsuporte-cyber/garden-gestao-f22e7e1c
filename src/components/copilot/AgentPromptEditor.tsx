import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { useCopilotConfig } from '@/hooks/useCopilotConfig';

const DEFAULT_PROMPT = `Você é o Copiloto Garden, assistente de gestão para restaurantes.

REGRAS DE RESPOSTA:
- Máximo 3 frases curtas + dados numéricos formatados
- NÃO liste todos os dados disponíveis - responda APENAS o que foi perguntado
- Use emojis com moderação (máximo 3 por resposta)
- Nunca invente valores - use os dados do contexto
- Use **negrito** para valores e nomes importantes`;

export function AgentPromptEditor() {
  const { config, isLoading, upsertConfig } = useCopilotConfig();
  const [agentName, setAgentName] = useState('Copiloto Garden');
  const [toneOfVoice, setToneOfVoice] = useState('profissional e amigável');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setAgentName(config.agent_name || 'Copiloto Garden');
      setToneOfVoice(config.tone_of_voice || 'profissional e amigável');
      setSystemPrompt(config.system_prompt || '');
    }
  }, [config]);

  const handleSave = () => {
    upsertConfig.mutate({
      agent_name: agentName,
      tone_of_voice: toneOfVoice,
      system_prompt: systemPrompt || null,
    }, { onSuccess: () => setDirty(false) });
  };

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-12 bg-muted rounded-xl" /><div className="h-32 bg-muted rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Agente</Label>
          <Input value={agentName} onChange={handleChange(setAgentName)} placeholder="Copiloto Garden" />
        </div>
        <div className="space-y-2">
          <Label>Tom de Voz</Label>
          <Input value={toneOfVoice} onChange={handleChange(setToneOfVoice)} placeholder="profissional e amigável" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Prompt do Sistema (customizado)</Label>
        <p className="text-xs text-muted-foreground">
          Deixe em branco para usar o prompt padrão. Adicione instruções extras para personalizar o comportamento do agente.
        </p>
        <Textarea
          value={systemPrompt}
          onChange={handleChange(setSystemPrompt)}
          placeholder={DEFAULT_PROMPT}
          className="min-h-[200px] font-mono text-xs"
        />
      </div>

      {!systemPrompt && (
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AppIcon name="Info" className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Preview do prompt padrão</span>
          </div>
          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono">{DEFAULT_PROMPT}</pre>
        </div>
      )}

      <Button onClick={handleSave} disabled={!dirty || upsertConfig.isPending} className="gap-2">
        <AppIcon name="Save" className="w-4 h-4" />
        {upsertConfig.isPending ? 'Salvando...' : 'Salvar Configuração'}
      </Button>
    </div>
  );
}
