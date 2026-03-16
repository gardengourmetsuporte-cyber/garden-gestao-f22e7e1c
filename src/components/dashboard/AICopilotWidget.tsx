import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useManagementAI } from '@/hooks/useManagementAI';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';

const CopilotMessageContent = lazy(() => import('@/components/copilot/CopilotMessageContent'));

const SUGGESTIONS = [
  { label: 'Resumo do dia', icon: 'BarChart3' },
  { label: 'Como está meu estoque?', icon: 'Package' },
  { label: 'Despesas pendentes', icon: 'Receipt' },
  { label: 'Criar post marketing', icon: 'Megaphone' },
];

const ACCEPTED_FILES = 'image/*,.pdf,.doc,.docx,.csv,.xlsx,.xls,.txt,.json';

interface Attachment {
  file: File;
  preview?: string;
  type: 'image' | 'file';
}

export function AICopilotWidget() {
  const {
    messages, isLoading, isExecuting, hasGreeted, sendMessage, clearHistory,
    conversations, conversationId, switchConversation, newConversation,
  } = useManagementAI();

  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Auto-greet on first expand
  useEffect(() => {
    if (expanded && !hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, [expanded]);

  // Auto-scroll messages
  useEffect(() => {
    if (expanded && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setTimeout(() => {
        widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages, expanded, isLoading]);

  // Focus textarea on expand
  useEffect(() => {
    if (expanded) {
      requestAnimationFrame(() => {
        widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        setTimeout(() => textareaRef.current?.focus(), 300);
      });
    }
  }, [expanded]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 100) + 'px';
    }
  }, [question]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: Attachment[] = Array.from(files).slice(0, 3).map(file => {
      const isImage = file.type.startsWith('image/');
      return { file, type: isImage ? 'image' : 'file', preview: isImage ? URL.createObjectURL(file) : undefined };
    });
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 3));
    setPlusOpen(false);
  }, []);

  const removeAttachment = (idx: number) => {
    setAttachments(prev => {
      const copy = [...prev];
      if (copy[idx]?.preview) URL.revokeObjectURL(copy[idx].preview!);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = question.trim();
    if (!text && attachments.length === 0) return;
    if (isLoading) return;

    let imageBase64: string | undefined;
    const imgAtt = attachments.find(a => a.type === 'image');
    if (imgAtt) {
      imageBase64 = await fileToBase64(imgAtt.file);
    }

    setQuestion('');
    setAttachments([]);
    if (!expanded) setExpanded(true);
    await sendMessage(text || 'Analise esta imagem', imageBase64);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
    setExpanded(true);
  };

  return (
    <div ref={widgetRef} className="copilot-widget-root w-full">
      {/* === COLLAPSED === */}
      {!expanded && (
        <div className="copilot-bar-gradient rounded-2xl p-[1px] animate-fade-in">
          <div className="bg-background rounded-2xl">
            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
              <div className="relative shrink-0">
                <img src={mascotImg} alt="Copiloto" className="w-9 h-9 rounded-xl object-cover" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background copilot-glow-dot" />
              </div>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onFocus={() => setExpanded(true)}
                placeholder="Pergunte ao Copiloto..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 copilot-send-btn disabled:opacity-30 transition-all duration-200 active:scale-90"
              >
                <AppIcon name="Send" size={16} className="text-white" />
              </button>
            </form>
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s.label)}
                  className="copilot-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 hover:scale-[1.03] active:scale-95"
                >
                  <AppIcon name={s.icon} size={12} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === EXPANDED === */}
      {expanded && (
        <div className="copilot-bar-gradient rounded-2xl p-[1px] animate-scale-in">
          <div className="bg-background rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '520px' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/20">
              <div className="relative">
                <img src={mascotImg} alt="Copiloto" className="w-8 h-8 rounded-xl object-cover" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground leading-tight">Copiloto IA</p>
                <p className="text-[10px] text-emerald-400 font-medium">Online</p>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={newConversation} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors" title="Nova conversa">
                  <AppIcon name="Plus" size={14} className="text-muted-foreground" />
                </button>
                <button onClick={() => setShowHistory(true)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors" title="Histórico">
                  <AppIcon name="History" size={14} className="text-muted-foreground" />
                </button>
                {messages.length > 2 && (
                  <button onClick={clearHistory} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors" title="Limpar">
                    <AppIcon name="Trash2" size={13} className="text-muted-foreground" />
                  </button>
                )}
                <button onClick={() => setExpanded(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
                  <AppIcon name="ChevronDown" size={15} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-thin min-h-[120px] max-h-[340px]">
              {messages.map((msg, i) => (
                <div key={i} className={cn("animate-fade-in", msg.role === 'user' ? "flex justify-end" : "flex justify-start gap-2")}>
                  {msg.role === 'assistant' && (
                    <img src={mascotImg} alt="" className="w-5 h-5 rounded-md object-cover mt-1 shrink-0" />
                  )}
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    msg.role === 'assistant' ? "bg-card text-foreground rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"
                  )}>
                    {msg.role === 'assistant' ? (
                      <Suspense fallback={<span className="text-xs text-muted-foreground">...</span>}>
                        <CopilotMessageContent content={msg.content} />
                      </Suspense>
                    ) : (
                      <>
                        {msg.imageUrl && <img src={msg.imageUrl} alt="" className="w-full max-w-[180px] rounded-xl mb-2" />}
                        {msg.content}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start gap-2 animate-fade-in">
                  <img src={mascotImg} alt="" className="w-5 h-5 rounded-md object-cover mt-1 shrink-0" />
                  <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {isExecuting && (
                <div className="flex justify-start gap-2 animate-fade-in">
                  <img src={mascotImg} alt="" className="w-5 h-5 rounded-md object-cover mt-1 shrink-0" />
                  <div className="bg-card rounded-2xl rounded-tl-sm px-3.5 py-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-[11px] text-muted-foreground">Executando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex gap-2 px-4 pb-1 overflow-x-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative shrink-0">
                    {att.type === 'image' ? (
                      <img src={att.preview} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
                        <AppIcon name="FileText" size={16} className="text-muted-foreground" />
                      </div>
                    )}
                    <button onClick={() => removeAttachment(idx)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px]">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-end gap-2 bg-secondary/50 rounded-xl px-2 py-1.5">
                {/* Plus button */}
                <Popover open={plusOpen} onOpenChange={setPlusOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 hover:bg-muted/50 transition-colors mb-0.5">
                      <AppIcon name="Plus" size={16} className="text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-40 p-1 rounded-xl">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted text-xs text-foreground">
                      <AppIcon name="Paperclip" size={13} className="text-primary" /> Arquivo
                    </button>
                    <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted text-xs text-foreground">
                      <AppIcon name="Camera" size={13} className="text-primary" /> Câmera
                    </button>
                    <button onClick={() => galleryInputRef.current?.click()} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted text-xs text-foreground">
                      <AppIcon name="Image" size={13} className="text-primary" /> Galeria
                    </button>
                  </PopoverContent>
                </Popover>

                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte algo..."
                  rows={1}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none py-1.5 resize-none max-h-[100px]"
                  disabled={isLoading}
                />

                <Button
                  onClick={() => handleSubmit()}
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg shrink-0 mb-0.5"
                  disabled={isLoading || (!question.trim() && attachments.length === 0)}
                >
                  <AppIcon name="ArrowUp" size={13} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept={ACCEPTED_FILES} multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />

      {/* History sheet */}
      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-sm">Histórico de Conversas</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto space-y-1 pb-4">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { switchConversation(conv.id); setShowHistory(false); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors",
                  conv.id === conversationId ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                )}
              >
                <p className="truncate">{conv.title || 'Conversa sem título'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(conv.created_at).toLocaleDateString('pt-BR')}</p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa salva</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
