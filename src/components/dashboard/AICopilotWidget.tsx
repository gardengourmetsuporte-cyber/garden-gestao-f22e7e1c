import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useManagementAI } from '@/hooks/useManagementAI';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';

const CopilotMessageContent = lazy(() => import('@/components/copilot/CopilotMessageContent'));

const SUGGESTIONS = [
  { label: 'Resumo do dia', icon: 'BarChart3' },
  { label: 'Meu estoque', icon: 'Package' },
  { label: 'Pendências', icon: 'Receipt' },
  { label: 'Criar post', icon: 'Megaphone' },
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

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded && !hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, [expanded]);

  useEffect(() => {
    if (expanded && messagesContainerRef.current) {
      requestAnimationFrame(() => {
        messagesContainerRef.current!.scrollTop = messagesContainerRef.current!.scrollHeight;
      });
    }
  }, [messages, expanded, isLoading]);

  useEffect(() => {
    if (expanded) {
      requestAnimationFrame(() => {
        widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        setTimeout(() => textareaRef.current?.focus(), 200);
      });
    }
  }, [expanded]);

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
    if (imgAtt) imageBase64 = await fileToBase64(imgAtt.file);

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
        <div className="animate-fade-in">
          <div className="copilot-surface rounded-[20px] overflow-hidden">
            {/* Input row */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3.5">
              <div className="relative shrink-0">
                <div className="copilot-avatar-ring w-10 h-10 rounded-[14px] p-[2px]">
                  <img src={mascotImg} alt="Copiloto" className="w-full h-full rounded-[12px] object-cover" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background copilot-glow-dot" />
              </div>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onFocus={() => setExpanded(true)}
                placeholder="Pergunte ao Copiloto..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none min-w-0 font-medium"
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="copilot-send-btn w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-20 transition-all duration-300 active:scale-90 hover:shadow-lg hover:shadow-primary/20"
              >
                <AppIcon name="ArrowUp" size={16} className="text-white" />
              </button>
            </form>

            {/* Suggestion chips */}
            <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s.label)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <AppIcon name={s.icon} size={12} className="opacity-60" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === EXPANDED === */}
      {expanded && (
        <div className="animate-scale-in">
          <div className="copilot-surface rounded-[20px] overflow-hidden flex flex-col" style={{ maxHeight: '540px' }}>
            {/* Header — clean, minimal */}
            <div className="flex items-center gap-3 px-4 py-3 copilot-header">
              <div className="relative">
                <div className="copilot-avatar-ring w-9 h-9 rounded-[12px] p-[1.5px]">
                  <img src={mascotImg} alt="Copiloto" className="w-full h-full rounded-[11px] object-cover" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight tracking-tight">Copiloto</p>
                <p className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Online
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={newConversation} className="copilot-icon-btn" title="Nova conversa">
                  <AppIcon name="MessageSquarePlus" size={15} />
                </button>
                <button onClick={() => setShowHistory(true)} className="copilot-icon-btn" title="Histórico">
                  <AppIcon name="Clock" size={15} />
                </button>
                {messages.length > 2 && (
                  <button onClick={clearHistory} className="copilot-icon-btn" title="Limpar">
                    <AppIcon name="Trash2" size={14} />
                  </button>
                )}
                <button onClick={() => setExpanded(false)} className="copilot-icon-btn">
                  <AppIcon name="Minus" size={15} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin min-h-[100px] max-h-[350px]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "copilot-msg-enter",
                    msg.role === 'user' ? "flex justify-end" : "flex justify-start gap-2.5"
                  )}
                  style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}
                >
                  {msg.role === 'assistant' && (
                    <img src={mascotImg} alt="" className="w-6 h-6 rounded-lg object-cover mt-0.5 shrink-0 ring-1 ring-border/10" />
                  )}
                  <div className={cn(
                    "max-w-[82%] text-[13px] leading-relaxed",
                    msg.role === 'assistant'
                      ? "copilot-bubble-ai rounded-2xl rounded-tl-lg px-3.5 py-2.5"
                      : "copilot-bubble-user rounded-2xl rounded-tr-lg px-3.5 py-2.5"
                  )}>
                    {msg.role === 'assistant' ? (
                      <Suspense fallback={<span className="text-xs text-muted-foreground/50">...</span>}>
                        <CopilotMessageContent content={msg.content} />
                      </Suspense>
                    ) : (
                      <>
                        {msg.imageUrl && <img src={msg.imageUrl} alt="" className="w-full max-w-[180px] rounded-xl mb-2" />}
                        <span className="font-medium">{msg.content}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start gap-2.5 copilot-msg-enter">
                  <img src={mascotImg} alt="" className="w-6 h-6 rounded-lg object-cover mt-0.5 shrink-0 ring-1 ring-border/10" />
                  <div className="copilot-bubble-ai rounded-2xl rounded-tl-lg px-4 py-3.5">
                    <div className="copilot-typing-dots flex gap-1.5">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}

              {/* Executing indicator */}
              {isExecuting && (
                <div className="flex justify-start gap-2.5 copilot-msg-enter">
                  <img src={mascotImg} alt="" className="w-6 h-6 rounded-lg object-cover mt-0.5 shrink-0 ring-1 ring-border/10" />
                  <div className="copilot-bubble-ai rounded-2xl rounded-tl-lg px-3.5 py-2.5 flex items-center gap-2.5">
                    <div className="copilot-exec-spinner w-3.5 h-3.5" />
                    <span className="text-[11px] text-muted-foreground font-medium">Executando ação...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex gap-2 px-4 pb-1 overflow-x-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative shrink-0 animate-scale-in">
                    {att.type === 'image' ? (
                      <img src={att.preview} alt="" className="w-14 h-14 rounded-xl object-cover ring-1 ring-border/20" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-secondary/60 flex items-center justify-center">
                        <AppIcon name="FileText" size={18} className="text-muted-foreground" />
                      </div>
                    )}
                    <button onClick={() => removeAttachment(idx)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[9px] font-bold shadow-lg">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="px-3 pb-3 pt-1.5">
              {plusOpen && (
                <div className="flex gap-2 mb-2 animate-fade-in">
                  <button onClick={() => { fileInputRef.current?.click(); setPlusOpen(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 text-xs font-medium text-foreground transition-all active:scale-95">
                    <AppIcon name="Paperclip" size={13} className="text-primary" /> Arquivo
                  </button>
                  <button onClick={() => { cameraInputRef.current?.click(); setPlusOpen(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 text-xs font-medium text-foreground transition-all active:scale-95">
                    <AppIcon name="Camera" size={13} className="text-primary" /> Câmera
                  </button>
                  <button onClick={() => { galleryInputRef.current?.click(); setPlusOpen(false); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 text-xs font-medium text-foreground transition-all active:scale-95">
                    <AppIcon name="Image" size={13} className="text-primary" /> Galeria
                  </button>
                </div>
              )}
              <div className="copilot-input-bar flex items-end gap-1.5 rounded-[14px] px-1.5 py-1.5">
                <button onClick={() => setPlusOpen(v => !v)} className="copilot-icon-btn-sm shrink-0 mb-[1px]">
                  <AppIcon name={plusOpen ? "X" : "Plus"} size={16} />
                </button>

                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem..."
                  rows={1}
                  className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/35 outline-none py-1.5 px-1 resize-none max-h-[100px] font-medium"
                  disabled={isLoading}
                />

                <button
                  onClick={() => handleSubmit()}
                  disabled={isLoading || (!question.trim() && attachments.length === 0)}
                  className="copilot-send-btn w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mb-[1px] disabled:opacity-15 transition-all duration-300 active:scale-90 hover:shadow-lg hover:shadow-primary/25"
                >
                  <AppIcon name="ArrowUp" size={14} className="text-white" />
                </button>
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
        <SheetContent side="bottom" className="rounded-t-[20px] max-h-[60vh]">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-sm font-bold">Conversas</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto space-y-1 pb-4">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { switchConversation(conv.id); setShowHistory(false); }}
                className={cn(
                  "w-full text-left px-3.5 py-3 rounded-[14px] text-xs transition-all duration-200 active:scale-[0.98]",
                  conv.id === conversationId
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-secondary/60"
                )}
              >
                <p className="truncate font-medium">{conv.title || 'Conversa sem título'}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{new Date(conv.created_at).toLocaleDateString('pt-BR')}</p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center py-8">Nenhuma conversa salva</p>
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
