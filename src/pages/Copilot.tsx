import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useManagementAI, CopilotContextStats } from '@/hooks/useManagementAI';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';
import CopilotMessageContent from '@/components/copilot/CopilotMessageContent';
import CopilotSuggestionChips from '@/components/copilot/CopilotSuggestionChips';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';

function BriefingCard({ stats, contextStats, visible }: {
  stats: ReturnType<typeof useDashboardStats>['stats'];
  contextStats: CopilotContextStats | null;
  visible: boolean;
}) {
  if (!visible || (!stats && !contextStats)) return null;
  const hasPendingExp = contextStats ? contextStats.pendingExpensesCount > 0 : (stats?.pendingExpenses ?? 0) > 0;
  const pendingExpCount = contextStats?.pendingExpensesCount ?? null;
  const lowStock = contextStats?.lowStockCount ?? (stats?.criticalItems ?? 0);
  const pendingTasks = contextStats?.pendingTasksCount ?? 0;
  const invoices = contextStats?.upcomingInvoicesCount ?? 0;
  const checklistPct = contextStats?.checklistPct ?? 0;
  const allGood = !hasPendingExp && lowStock === 0 && pendingTasks === 0;
  return (
    <div className="rounded-2xl border border-border/30 bg-secondary/30 px-4 py-3 space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Resumo agora</p>
      <div className="flex flex-wrap gap-2">
        {hasPendingExp && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AppIcon name="Clock" size={12} />
            <span>{pendingExpCount !== null ? `${pendingExpCount} despesa${pendingExpCount > 1 ? 's' : ''} pendente${pendingExpCount > 1 ? 's' : ''}` : 'Despesas pendentes'}</span>
          </div>
        )}
        {lowStock > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AppIcon name="AlertTriangle" size={12} />
            <span>{lowStock} item{lowStock > 1 ? 'ns' : ''} em baixo estoque</span>
          </div>
        )}
        {pendingTasks > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <AppIcon name="ListChecks" size={12} />
            <span>{pendingTasks} tarefa{pendingTasks > 1 ? 's' : ''} hoje</span>
          </div>
        )}
        {invoices > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-orange-500">
            <AppIcon name="FileText" size={12} />
            <span>{invoices} boleto{invoices > 1 ? 's' : ''} vencendo</span>
          </div>
        )}
        {checklistPct > 0 && checklistPct < 100 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AppIcon name="CheckSquare" size={12} />
            <span>Checklist {checklistPct}%</span>
          </div>
        )}
        {allGood && (
          <div className="flex items-center gap-1.5 text-xs text-success">
            <AppIcon name="CheckCircle" size={12} />
            <span>Tudo em dia 🎉</span>
          </div>
        )}
      </div>
    </div>
  );
}

function isActionMessage(content: string) {
  return content.startsWith('[ACTION]');
}

function stripActionMarker(content: string) {
  return content.replace(/^\[ACTION\]\s*/, '');
}

function getActionNavigation(content: string): { label: string; href: string; icon: string } | null {
  const lower = content.toLowerCase();
  if (lower.includes('transação') || lower.includes('receita') || lower.includes('despesa') || lower.includes('paga')) {
    return { label: 'Ver no Financeiro', href: '/finance', icon: 'DollarSign' };
  }
  if (lower.includes('tarefa') || lower.includes('compromisso')) {
    return { label: 'Ver na Agenda', href: '/agenda', icon: 'CalendarDays' };
  }
  if (lower.includes('estoque') || lower.includes('movimentação') || lower.includes('item')) {
    return { label: 'Ver Estoque', href: '/inventory', icon: 'Package' };
  }
  if (lower.includes('pedido') || lower.includes('fornecedor')) {
    return { label: 'Ver Pedidos', href: '/orders', icon: 'ShoppingCart' };
  }
  if (lower.includes('fechamento') || lower.includes('caixa')) {
    return { label: 'Ver Fechamentos', href: '/cash-closing', icon: 'Receipt' };
  }
  if (lower.includes('checklist')) {
    return { label: 'Ver Checklist', href: '/checklists', icon: 'ClipboardCheck' };
  }
  if (lower.includes('boleto') || lower.includes('fatura')) {
    return { label: 'Ver Financeiro', href: '/finance', icon: 'FileText' };
  }
  return null;
}

export default function CopilotPage() {
  const navigate = useNavigate();
  const {
    messages, isLoading, isExecuting, hasGreeted, sendMessage, clearHistory,
    conversations, conversationId, switchConversation, newConversation,
    contextStats,
  } = useManagementAI();
  const { stats } = useDashboardStats();
  const [question, setQuestion] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    sendMessage(question.trim());
    setQuestion('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;

    if (!file.type.startsWith('image/')) {
      sendMessage('Envie apenas imagens (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      sendMessage('A imagem deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const prompt = question.trim() || 'Analise esta imagem e extraia todas as informações relevantes (valores, itens, datas, etc.)';
      sendMessage(prompt, base64);
      setQuestion('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleChipClick = (text: string) => {
    if (isLoading) return;
    sendMessage(text);
  };

  const showChips = messages.length <= 2 && !isLoading;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem-5rem)] lg:h-screen">
        {/* Toolbar */}
        <div className="shrink-0">
          <div className="flex items-center justify-end gap-1 h-10 px-3">
            {messages.length > 2 && (
              <button
                onClick={clearHistory}
                className="p-2 rounded-xl hover:bg-secondary transition-colors" title="Limpar"
              >
                <AppIcon name="Trash2" size={16} className="text-muted-foreground hover:text-foreground" />
              </button>
            )}
            <button
              onClick={newConversation}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
              title="Nova conversa"
            >
              <AppIcon name="Plus" size={16} className="text-muted-foreground" />
            </button>
            <Sheet open={showHistory} onOpenChange={setShowHistory}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-xl hover:bg-secondary transition-colors" title="Histórico">
                  <AppIcon name="Clock" size={16} className="text-muted-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <SheetHeader className="p-4 border-b border-border/30">
                  <SheetTitle className="text-sm">Conversas</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
                  {conversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center">Nenhuma conversa</p>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          switchConversation(conv.id);
                          setShowHistory(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-border/10 hover:bg-secondary/50 transition-colors",
                          conv.id === conversationId && "bg-primary/10"
                        )}
                      >
                        <p className="text-sm font-medium truncate">{conv.title || 'Conversa'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(conv.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 pb-2 space-y-1 overscroll-contain">
          <BriefingCard stats={stats} contextStats={contextStats} visible={messages.length <= 2} />

          {messages.map((msg, i) => {
            const isAction = msg.role === 'assistant' && isActionMessage(msg.content);
            const displayContent = isAction ? stripActionMarker(msg.content) : msg.content;
            const navAction = isAction ? getActionNavigation(displayContent) : null;
            const isUser = msg.role === 'user';
            const showTail = i === 0 || messages[i - 1]?.role !== msg.role;

            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col",
                  isUser ? "items-end" : "items-start",
                  showTail ? "mt-2" : "mt-0.5"
                )}
              >
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Imagem enviada"
                    className="max-w-[200px] max-h-[200px] rounded-2xl mb-1 object-cover"
                  />
                )}
                {isAction ? (
                  <div className="max-w-[80%] space-y-1.5">
                    <div className="rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed bg-secondary/60 text-foreground rounded-tl-sm">
                      <CopilotMessageContent content={displayContent} />
                    </div>
                    {navAction && (
                      <button
                        onClick={() => navigate(navAction.href)}
                        className="flex items-center gap-1.5 text-xs text-primary font-medium px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors"
                      >
                        <AppIcon name={navAction.icon as any} size={12} />
                        {navAction.label} →
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "max-w-[80%] px-3.5 py-2 text-[14px] leading-relaxed",
                      isUser
                        ? cn("bg-primary text-primary-foreground", showTail ? "rounded-2xl rounded-tr-sm" : "rounded-2xl")
                        : cn("bg-secondary/60 text-foreground", showTail ? "rounded-2xl rounded-tl-sm" : "rounded-2xl")
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <CopilotMessageContent content={displayContent} />
                    ) : (
                      displayContent
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start mt-1">
              <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                {isExecuting ? (
                  <>
                    <AppIcon name="Loader2" size={14} className="text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">Executando...</span>
                  </>
                ) : (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {showChips && (
            <CopilotSuggestionChips onChipClick={handleChipClick} contextStats={contextStats} quickStats={stats} />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Input bar */}
        <div className="shrink-0 border-t border-border/20 bg-card/60 backdrop-blur-sm px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full shrink-0"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              <AppIcon name="Paperclip" size={18} className="text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-full shrink-0"
              disabled={isLoading}
              onClick={() => cameraInputRef.current?.click()}
            >
              <AppIcon name="Camera" size={18} className="text-muted-foreground" />
            </Button>
            <Input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Mensagem..."
              className="h-11 text-sm rounded-full bg-secondary/50 border-border/30"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              className="h-11 w-11 p-0 rounded-full shrink-0"
              disabled={isLoading || !question.trim()}
            >
              <AppIcon name="Send" size={16} />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
