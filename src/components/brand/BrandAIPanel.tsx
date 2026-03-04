import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { useBrandCore } from '@/hooks/useBrandCore';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const AI_ACTIONS = [
  { key: 'generate_copy', label: 'Gerar Copy', icon: 'PenLine', desc: 'Cria textos no tom de voz da sua marca' },
  { key: 'suggest_creative', label: 'Sugerir Criativo', icon: 'Lightbulb', desc: 'Ideias de criativos baseados nos seus assets' },
  { key: 'generate_prompt', label: 'Prompt para Design', icon: 'Wand2', desc: 'Prompts otimizados para ferramentas de design' },
];

export function BrandAIPanel() {
  const { generateAI, aiLoading, identity } = useBrandCore();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedAction) {
      toast.error('Selecione uma ação');
      return;
    }
    if (!identity) {
      toast.error('Configure sua identidade de marca primeiro');
      return;
    }
    try {
      const data = await generateAI(selectedAction, prompt || undefined);
      setResult(data?.result || data?.content || JSON.stringify(data, null, 2));
    } catch (err) {
      toast.error('Erro ao gerar com IA');
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success('Copiado!');
    }
  };

  return (
    <div className="space-y-4">
      {!identity && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AppIcon name="AlertTriangle" size={20} className="text-warning shrink-0" />
            <p className="text-xs text-warning">Configure sua identidade de marca na aba "Identidade" para que a IA gere conteúdo personalizado.</p>
          </CardContent>
        </Card>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-3">
        {AI_ACTIONS.map(action => (
          <Card
            key={action.key}
            className={`cursor-pointer transition-all border-border/40 ${selectedAction === action.key ? 'ring-2 ring-primary border-primary/40' : 'hover:border-primary/20'}`}
            onClick={() => setSelectedAction(action.key)}
          >
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name={action.icon} size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              {selectedAction === action.key && (
                <AppIcon name="Check" size={16} className="text-primary ml-auto" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prompt */}
      {selectedAction && (
        <div className="space-y-3">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={
              selectedAction === 'generate_copy' ? 'Ex: Post sobre nosso hambúrguer artesanal para o Instagram...' :
              selectedAction === 'suggest_creative' ? 'Ex: Criativo para promoção de sexta-feira...' :
              'Ex: Prompt para gerar banner de delivery no Canva...'
            }
            rows={3}
          />
          <Button onClick={handleGenerate} disabled={aiLoading} className="w-full">
            {aiLoading ? (
              <><AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> Gerando...</>
            ) : (
              <><AppIcon name="Sparkles" size={16} className="mr-2" /> Gerar com IA</>
            )}
          </Button>
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AppIcon name="Sparkles" size={14} className="text-primary" />
                Resultado
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                <AppIcon name="Copy" size={14} className="mr-1" /> Copiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm prose-invert max-w-none text-xs">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
