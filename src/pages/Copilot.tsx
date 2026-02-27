import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useManagementAI } from '@/hooks/useManagementAI';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';
import CopilotMessageContent from '@/components/copilot/CopilotMessageContent';
import CopilotSuggestionChips from '@/components/copilot/CopilotSuggestionChips';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [question, setQuestion] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <header
        className="shrink-0 border-b border-border/30 bg-card"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 h-14 px-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <AppIcon name="ArrowLeft" size={20} className="text-foreground" />
          </button>
          <img
            src={mascotImg}
            alt="Garden Copiloto"
            className="w-9 h-9 rounded-xl object-cover border border-primary/20"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-none">Copiloto IA</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Seu assistente de gestão</p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 2 && (
              <button
                onClick={clearHistory}
                className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => {
                newConversation();
              }}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
              title="Nova conversa"
            >
              <AppIcon name="Plus" size={18} className="text-muted-foreground" />
            </button>
            <Sheet open={showHistory} onOpenChange={setShowHistory}>
              <SheetTrigger asChild>
                <button className="p-2 rounded-xl hover:bg-secondary transition-colors" title="Histórico">
                  <AppIcon name="Clock" size={18} className="text-muted-foreground" />
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
      </header>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 overscroll-contain"
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Briefing card — aparece só quando há dados e ainda não houve conversa */}
        {contextStats && messages.length <= 2 && (
          <div className="rounded-2xl border border-border/30 bg-secondary/30 px-4 py-3 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Resumo agora</p>
            <div className="flex flex-wrap gap-2">
              {contextStats.pendingExpensesCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AppIcon name="Clock" size={12} />
                  <span>{contextStats.pendingExpensesCount} despesa{contextStats.pendingExpensesCount > 1 ? 's' : ''} pendente{contextStats.pendingExpensesCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {contextStats.lowStockCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AppIcon name="AlertTriangle" size={12} />
                  <span>{contextStats.lowStockCount} item{contextStats.lowStockCount > 1 ? 'ns' : ''} em baixo estoque</span>
                </div>
              )}
              {contextStats.pendingTasksCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-blue-500">
                  <AppIcon name="ListChecks" size={12} />
                  <span>{contextStats.pendingTasksCount} tarefa{contextStats.pendingTasksCount > 1 ? 's' : ''} hoje</span>
                </div>
              )}
              {contextStats.upcomingInvoicesCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-orange-500">
                  <AppIcon name="FileText" size={12} />
                  <span>{contextStats.upcomingInvoicesCount} boleto{contextStats.upcomingInvoicesCount > 1 ? 's' : ''} vencendo</span>
                </div>
              )}
              {contextStats.checklistPct > 0 && contextStats.checklistPct < 100 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AppIcon name="CheckSquare" size={12} />
                  <span>Checklist {contextStats.checklistPct}%</span>
                </div>
              )}
              {contextStats.pendingExpensesCount === 0 && contextStats.lowStockCount === 0 && contextStats.pendingTasksCount === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-green-500">
                  <AppIcon name="CheckCircle" size={12} />
                  <span>Tudo em dia 🎉</span>
                </div>
              )}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAction = msg.role === 'assistant' && isActionMessage(msg.content);
          const displayContent = isAction ? stripActionMarker(msg.content) : msg.content;
          const navAction = isAction ? getActionNavigation(displayContent) : null;

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Imagem enviada"
                  className="max-w-[200px] max-h-[200px] rounded-xl mb-1 object-cover border border-border/30"
                />
              )}
              {isAction ? (
                <div className="max-w-[85%] space-y-2">
                  <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-tl-md">
                    <CopilotMessageContent content={displayContent} />
                  </div>
                  {navAction && (
                    <button
                      onClick={() => navigate(navAction.href)}
                      className="flex items-center gap-1.5 text-xs text-primary font-medium px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <AppIcon name={navAction.icon as any} size={12} />
                      {navAction.label} →
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === 'assistant'
                      ? "bg-secondary/60 text-foreground rounded-tl-md"
                      : "bg-primary text-primary-foreground rounded-tr-md"
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
          <div className="flex justify-start">
            <div className="bg-secondary/60 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
              {isExecuting ? (
                <>
                  <AppIcon name="Loader2" size={14} className="text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Executando ação...</span>
                </>
              ) : (
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {showChips && (
          <CopilotSuggestionChips onChipClick={handleChipClick} contextStats={contextStats} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Input */}
      <div
        className="shrink-0 border-t border-border/30 bg-card px-4 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 w-11 p-0 rounded-full shrink-0"
            disabled={isLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <AppIcon name="Camera" size={18} className="text-muted-foreground" />
          </Button>
          <Input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Pergunte ao Copiloto..."
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
  );
}
