import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useManagementAI } from '@/hooks/useManagementAI';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';

const CopilotMessageContent = lazy(() => import('@/components/copilot/CopilotMessageContent'));
const CopilotSuggestionChips = lazy(() => import('@/components/copilot/CopilotSuggestionChips'));

const ACCEPTED_FILES = 'image/*,.pdf,.doc,.docx,.csv,.xlsx,.xls,.txt,.json';

interface Attachment {
  file: File;
  preview?: string;
  type: 'image' | 'file';
}

export function CopilotFullChat() {
  const {
    messages, isLoading, isExecuting, hasGreeted, sendMessage, clearHistory,
    conversations, conversationId, switchConversation, newConversation, contextStats,
  } = useManagementAI();

  const [question, setQuestion] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Auto-greet
  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [question]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: Attachment[] = Array.from(files).slice(0, 5).map(file => {
      const isImage = file.type.startsWith('image/');
      return {
        file,
        type: isImage ? 'image' : 'file',
        preview: isImage ? URL.createObjectURL(file) : undefined,
      };
    });
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5));
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

  const handleSubmit = async () => {
    const text = question.trim();
    if (!text && attachments.length === 0) return;
    if (isLoading) return;

    let imageBase64: string | undefined;
    if (attachments.length > 0) {
      const imgAtt = attachments.find(a => a.type === 'image');
      if (imgAtt) {
        imageBase64 = await fileToBase64(imgAtt.file);
      }
    }

    setQuestion('');
    setAttachments([]);
    await sendMessage(text || 'Analise esta imagem', imageBase64);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div
      className="flex flex-col h-[calc(100vh-13rem)] lg:h-[calc(100vh-11rem)]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <AppIcon name="Upload" className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">Solte os arquivos aqui</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/30">
        <div className="relative">
          <img src={mascotImg} alt="Copiloto" className="w-9 h-9 rounded-xl object-cover" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">Copiloto IA</p>
          <p className="text-[10px] text-emerald-400 font-medium">Online</p>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 2 && (
            <button onClick={clearHistory} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
              <AppIcon name="Trash2" size={14} className="text-muted-foreground" />
            </button>
          )}
          <button onClick={newConversation} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
            <AppIcon name="Plus" size={14} className="text-muted-foreground" />
          </button>
          <button onClick={() => setShowHistory(true)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
            <AppIcon name="History" size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin relative">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <img src={mascotImg} alt="" className="w-16 h-16 rounded-2xl object-cover mb-3 opacity-60" />
            <p className="text-sm text-muted-foreground">Inicie uma conversa com o Copiloto</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("animate-fade-in", msg.role === 'user' ? "flex justify-end" : "flex justify-start gap-2")}
          >
            {msg.role === 'assistant' && (
              <img src={mascotImg} alt="" className="w-6 h-6 rounded-lg object-cover mt-1 shrink-0" />
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                msg.role === 'assistant'
                  ? "bg-card text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}
            >
              {msg.role === 'assistant' ? (
                <Suspense fallback={<span className="text-xs text-muted-foreground">...</span>}>
                  <CopilotMessageContent content={msg.content} />
                </Suspense>
              ) : (
                <>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="" className="w-full max-w-[200px] rounded-xl mb-2" />
                  )}
                  {msg.content}
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start gap-2 animate-fade-in">
            <img src={mascotImg} alt="" className="w-6 h-6 rounded-lg object-cover mt-1 shrink-0" />
            <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {isExecuting && (
          <div className="flex justify-start gap-2 animate-fade-in">
            <img src={mascotImg} alt="" className="w-6 h-6 rounded-lg object-cover mt-1 shrink-0" />
            <div className="bg-card rounded-2xl rounded-tl-sm px-3.5 py-2 flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-[11px] text-muted-foreground">Executando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Suggestion chips */}
        {messages.length <= 2 && !isLoading && (
          <Suspense fallback={null}>
            <CopilotSuggestionChips
              onChipClick={(text) => sendMessage(text)}
              contextStats={contextStats}
            />
          </Suspense>
        )}
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 px-1 pb-2 overflow-x-auto">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative shrink-0">
              {att.type === 'image' ? (
                <img src={att.preview} alt="" className="w-14 h-14 rounded-xl object-cover border border-border" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <AppIcon name="FileText" size={18} className="text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px]"
              >
                ✕
              </button>
              <p className="text-[9px] text-muted-foreground truncate w-14 text-center mt-0.5">{att.file.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border/30 pt-3">
        <div className="flex items-end gap-2">
          {/* Plus button */}
          <Popover open={plusOpen} onOpenChange={setPlusOpen}>
            <PopoverTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center shrink-0 hover:bg-secondary transition-colors mb-0.5">
                <AppIcon name="Plus" size={18} className="text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-44 p-1.5 rounded-xl">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors">
                <AppIcon name="Paperclip" size={15} className="text-primary" /> Arquivo
              </button>
              <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors">
                <AppIcon name="Camera" size={15} className="text-primary" /> Câmera
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-muted text-sm text-foreground transition-colors">
                <AppIcon name="Image" size={15} className="text-primary" /> Galeria
              </button>
            </PopoverContent>
          </Popover>

          {/* Textarea */}
          <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo..."
              rows={1}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none max-h-[120px]"
              disabled={isLoading}
            />
          </div>

          {/* Send */}
          <Button
            onClick={handleSubmit}
            size="sm"
            className="w-9 h-9 p-0 rounded-xl shrink-0 mb-0.5"
            disabled={isLoading || (!question.trim() && attachments.length === 0)}
          >
            <AppIcon name="ArrowUp" size={16} />
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept={ACCEPTED_FILES} multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />

      {/* History sheet */}
      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent side="right" className="w-[300px] p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-sm">Histórico</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto p-3 space-y-1">
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
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa</p>
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
