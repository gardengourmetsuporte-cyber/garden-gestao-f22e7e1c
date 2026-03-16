import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { useManagementAI, CopilotContextStats } from '@/hooks/useManagementAI';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';
import CopilotMessageContent from '@/components/copilot/CopilotMessageContent';
import CopilotSuggestionChips from '@/components/copilot/CopilotSuggestionChips';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';

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

// Attachment preview chip
function AttachmentPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="relative group inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/60 px-2.5 py-1.5">
      {isImage && preview ? (
        <img src={preview} alt="" className="w-8 h-8 rounded-lg object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <AppIcon name="FileText" size={14} className="text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 max-w-[120px]">
        <p className="text-[11px] font-medium text-foreground truncate">{file.name}</p>
        <p className="text-[9px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <AppIcon name="X" size={10} />
      </button>
    </div>
  );
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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, [question]);

  const processFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo deve ter no máximo 10MB');
      return;
    }
    setAttachedFiles(prev => [...prev, file]);
    setShowAttachMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(processFile);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!question.trim() && attachedFiles.length === 0) || isLoading) return;

    let imageBase64: string | undefined;

    // Process the first image attachment as base64
    const imageFile = attachedFiles.find(f => f.type.startsWith('image/'));
    if (imageFile) {
      imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    const prompt = question.trim() || (attachedFiles.length > 0
      ? 'Analise esta imagem e extraia todas as informações relevantes (valores, itens, datas, etc.)'
      : '');

    sendMessage(prompt, imageBase64);
    setQuestion('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChipClick = (text: string) => {
    if (isLoading) return;
    sendMessage(text);
  };

  // Drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  };

  const showChips = messages.length <= 2 && !isLoading;

  return (
    <AppLayout>
      <div
        className="flex flex-col h-[calc(100vh-3.5rem-5rem)] lg:h-screen"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/5 border-2 border-dashed border-primary/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <AppIcon name="Upload" size={32} className="text-primary" />
              <p className="text-sm font-medium text-primary">Solte o arquivo aqui</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="shrink-0 border-b border-border/10">
          <div className="flex items-center justify-between h-12 px-4">
            <div className="flex items-center gap-2">
              <img src={mascotImg} alt="" className="w-6 h-6 rounded-full" />
              <span className="text-sm font-semibold text-foreground">Copiloto IA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center gap-0.5">
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
              <button
                onClick={() => navigate('/copilot/settings')}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
                title="Configurações"
              >
                <AppIcon name="Settings" size={16} className="text-muted-foreground" />
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
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-2 space-y-1 overscroll-contain">
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
                  "flex",
                  isUser ? "justify-end" : "justify-start",
                  showTail ? "mt-3" : "mt-0.5"
                )}
              >
                {/* Assistant avatar */}
                {!isUser && showTail && (
                  <img src={mascotImg} alt="" className="w-6 h-6 rounded-full mr-2 mt-1 shrink-0" />
                )}
                {!isUser && !showTail && <div className="w-6 mr-2 shrink-0" />}

                <div className="max-w-[80%] space-y-1.5">
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Imagem enviada"
                      className="max-w-[200px] max-h-[200px] rounded-2xl object-cover"
                    />
                  )}
                  {isAction ? (
                    <>
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
                    </>
                  ) : (
                    <div
                      className={cn(
                        "px-3.5 py-2.5 text-[14px] leading-relaxed",
                        isUser
                          ? cn("bg-primary text-primary-foreground", showTail ? "rounded-2xl rounded-tr-sm" : "rounded-2xl")
                          : cn("bg-secondary/60 text-foreground", showTail ? "rounded-2xl rounded-tl-sm" : "rounded-2xl")
                      )}
                    >
                      {msg.role === 'assistant' ? (
                        <CopilotMessageContent content={displayContent} />
                      ) : (
                        <span className="whitespace-pre-wrap">{displayContent}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start mt-2">
              <img src={mascotImg} alt="" className="w-6 h-6 rounded-full mr-2 mt-1 shrink-0" />
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
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Input area — Lovable-style */}
        <div className="shrink-0 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] mb-[64px] lg:mb-0 pt-1">
          {/* Attachment previews */}
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2 px-1">
              {attachedFiles.map((file, i) => (
                <AttachmentPreview key={i} file={file} onRemove={() => removeAttachment(i)} />
              ))}
            </div>
          )}

          <div className="relative rounded-2xl border border-border/40 bg-secondary/30 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground px-4 pt-3 pb-12 rounded-2xl focus:outline-none max-h-[160px]"
            />

            {/* Bottom actions bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 pb-2 pt-1">
              <div className="flex items-center gap-0.5">
                <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="p-2 rounded-xl hover:bg-secondary/80 transition-colors"
                      disabled={isLoading}
                    >
                      <AppIcon name="Plus" size={18} className="text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-48 p-1.5 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => { cameraInputRef.current?.click(); setShowAttachMenu(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm"
                    >
                      <AppIcon name="Camera" size={16} className="text-muted-foreground" />
                      <span>Câmera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm"
                    >
                      <AppIcon name="Image" size={16} className="text-muted-foreground" />
                      <span>Galeria</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm"
                    >
                      <AppIcon name="Paperclip" size={16} className="text-muted-foreground" />
                      <span>Arquivo</span>
                    </button>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                type="button"
                size="sm"
                className="h-8 w-8 p-0 rounded-xl shrink-0"
                disabled={isLoading || (!question.trim() && attachedFiles.length === 0)}
                onClick={handleSubmit as any}
              >
                <AppIcon name="ArrowUp" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
