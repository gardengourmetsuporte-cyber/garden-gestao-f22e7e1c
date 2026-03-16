import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnifiedKnowledge, type CopilotKnowledgeArticle } from '@/hooks/useCopilotConfig';
import { useUnit } from '@/contexts/UnitContext';
import { AppIcon } from '@/components/ui/app-icon';

const CATEGORY_OPTIONS = ['geral', 'operação', 'financeiro', 'equipe', 'estoque', 'atendimento', 'delivery', 'entrega', 'pagamento', 'funcionamento', 'politicas', 'contato'];

const SUGGESTIONS = [
  { title: 'Horário de Funcionamento', category: 'funcionamento', content: 'Ex: Segunda a Sexta: 11h às 23h\nSábados: 11h às 00h\nDomingos: 12h às 22h' },
  { title: 'Endereço e Localização', category: 'geral', content: 'Ex: Rua Exemplo, 123 - Bairro - Cidade/UF' },
  { title: 'Formas de Pagamento', category: 'pagamento', content: 'Ex: Aceitamos Pix, cartão de crédito/débito e dinheiro.' },
  { title: 'Tempo de Entrega', category: 'entrega', content: 'Ex: Entregas em até 45 minutos para a região.' },
  { title: 'Taxa de Entrega', category: 'entrega', content: 'Ex: Taxa fixa de R$ 5,00 para até 5km.' },
  { title: 'Política de Cancelamento', category: 'politicas', content: 'Ex: Cancelamentos aceitos em até 5 minutos após a confirmação do pedido.' },
  { title: 'Informações sobre Alérgenos', category: 'geral', content: 'Ex: Nossos produtos podem conter glúten, lactose e oleaginosas. Consulte antes de pedir.' },
  { title: 'Contato / Redes Sociais', category: 'contato', content: 'Ex: Instagram: @restaurante\nTelefone: (11) 99999-9999' },
];

export function WhatsAppKnowledge() {
  const { activeUnitId } = useUnit();
  const { articles, isLoading, upsertArticle, deleteArticle, toggleActive } = useUnifiedKnowledge();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<WhatsAppKnowledgeArticle> | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const openNew = () => {
    setEditing({ title: '', content: '', category: 'geral', is_active: true });
    setSheetOpen(true);
  };

  const openEdit = (article: WhatsAppKnowledgeArticle) => {
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
    <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)' }}>
            <AppIcon name="BookOpen" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Base de Conhecimento</h2>
            <p className="text-[11px] text-muted-foreground">{articles.length} artigo{articles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 flex-1" onClick={() => setShowSuggestions(!showSuggestions)}>
            <AppIcon name="Lightbulb" className="w-3.5 h-3.5" />
            Sugestões
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5 flex-1" onClick={openNew}>
            <AppIcon name="Plus" className="w-3.5 h-3.5" />
            Novo Artigo
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl border border-border/30 bg-card">
          <p className="col-span-full text-xs text-muted-foreground mb-1">Clique para usar como base:</p>
          {SUGGESTIONS.filter(s => !articles.some(a => a.title === s.title)).map(s => (
            <button
              key={s.title}
              onClick={() => useSuggestion(s)}
              className="text-left text-xs p-3 rounded-xl border border-border/20 hover:bg-accent/50 transition-colors"
            >
              <span className="font-medium text-foreground">{s.title}</span>
              <span className="block text-muted-foreground mt-0.5">{s.category}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <AppIcon name="BookOpen" className="w-7 h-7 opacity-40" />
          </div>
          <p className="text-sm font-medium">Nenhum artigo cadastrado</p>
          <p className="text-xs mt-1">Use as sugestões ou crie um novo artigo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map((article, i) => (
            <div
              key={article.id}
              className="flex items-center gap-3 p-3 rounded-2xl border border-border/20 bg-card animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Switch
                checked={article.is_active}
                onCheckedChange={(v) => toggleActive.mutate({ id: article.id, is_active: v })}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                <p className="text-xs text-muted-foreground">{article.category}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => openEdit(article)}>
                  <AppIcon name="Pencil" className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-destructive" onClick={() => deleteArticle.mutate(article.id)}>
                  <AppIcon name="Trash2" className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing?.id ? 'Editar Artigo' : 'Novo Artigo'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Título</Label>
              <Input
                value={editing?.title || ''}
                onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
                placeholder="Ex: Horário de Funcionamento"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={editing?.category || 'geral'}
                onValueChange={v => setEditing(prev => prev ? { ...prev, category: v } : prev)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={editing?.content || ''}
                onChange={e => setEditing(prev => prev ? { ...prev, content: e.target.value } : prev)}
                placeholder="Escreva aqui as informações que a IA deve saber..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-1">A IA vai ler este conteúdo para responder perguntas dos clientes.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editing?.is_active ?? true}
                onCheckedChange={v => setEditing(prev => prev ? { ...prev, is_active: v } : prev)}
              />
              <Label>Artigo ativo</Label>
            </div>
            <Button onClick={handleSave} disabled={upsertArticle.isPending} className="w-full">
              {upsertArticle.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
