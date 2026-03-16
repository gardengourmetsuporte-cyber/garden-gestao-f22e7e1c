import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { useUnifiedKnowledge, type CopilotKnowledgeArticle } from '@/hooks/useCopilotConfig';
import { useUnit } from '@/contexts/UnitContext';

const CATEGORY_OPTIONS = ['geral', 'operação', 'financeiro', 'equipe', 'estoque', 'atendimento', 'delivery', 'entrega', 'pagamento', 'funcionamento', 'politicas', 'contato'];

const SUGGESTIONS = [
  { title: 'Regras de Fechamento de Caixa', category: 'financeiro', content: 'Ex: O caixa deve ser fechado diariamente até 23h. Diferenças acima de R$20 devem ser justificadas.' },
  { title: 'Política de Estoque Mínimo', category: 'estoque', content: 'Ex: Quando um item atinge 20% do estoque ideal, criar pedido automaticamente.' },
  { title: 'Procedimento de Abertura', category: 'operação', content: 'Ex: Checklist de abertura deve ser concluído antes das 10h.' },
  { title: 'Metas Mensais da Equipe', category: 'equipe', content: 'Ex: Meta de faturamento: R$ 80.000/mês. Meta de avaliação: 4.5 estrelas.' },
];

export function CopilotKnowledgeBase() {
  const { activeUnitId } = useUnit();
  const { articles, isLoading, upsertArticle, deleteArticle, toggleActive } = useCopilotKnowledge();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CopilotKnowledgeArticle> | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const openNew = () => {
    setEditing({ title: '', content: '', category: 'geral', is_active: true });
    setSheetOpen(true);
  };

  const openEdit = (article: CopilotKnowledgeArticle) => {
    setEditing({ ...article });
    setSheetOpen(true);
  };

  const useSuggestion = (s: typeof SUGGESTIONS[0]) => {
    setEditing({ title: s.title, content: s.content, category: s.category, is_active: true });
    setShowSuggestions(false);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!editing?.title || !activeUnitId) return;
    upsertArticle.mutate({ ...editing, unit_id: activeUnitId } as any, {
      onSuccess: () => { setSheetOpen(false); setEditing(null); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{articles.length} artigo{articles.length !== 1 ? 's' : ''} na base</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setShowSuggestions(!showSuggestions)}>
            <AppIcon name="Lightbulb" className="w-3.5 h-3.5" />
            Sugestões
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={openNew}>
            <AppIcon name="Plus" className="w-3.5 h-3.5" />
            Novo Artigo
          </Button>
        </div>
      </div>

      {showSuggestions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => useSuggestion(s)}
              className="p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 text-left transition-colors"
            >
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.category}</p>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AppIcon name="BookOpen" className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum artigo ainda</p>
          <p className="text-xs mt-1">Adicione conhecimento para o agente usar como contexto</p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map(article => (
            <div key={article.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors">
              <div className="flex-1 min-w-0" onClick={() => openEdit(article)} role="button">
                <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{article.category} · {article.content.slice(0, 60)}...</p>
              </div>
              <Switch
                checked={article.is_active}
                onCheckedChange={(checked) => toggleActive.mutate({ id: article.id, is_active: checked })}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteArticle.mutate(article.id)}>
                <AppIcon name="Trash2" className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing?.id ? 'Editar Artigo' : 'Novo Artigo'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={editing?.title || ''} onChange={e => setEditing(prev => ({ ...prev, title: e.target.value }))} placeholder="Ex: Regras de fechamento" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={editing?.category || 'geral'} onValueChange={v => setEditing(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={editing?.content || ''}
                onChange={e => setEditing(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Descreva o conhecimento que o agente deve usar..."
                className="min-h-[120px]"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!editing?.title || upsertArticle.isPending} className="flex-1">
                {upsertArticle.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
