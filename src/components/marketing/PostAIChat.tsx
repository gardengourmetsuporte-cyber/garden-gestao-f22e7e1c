import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PostData {
  title: string;
  caption: string;
  tags: string[];
  image_prompt: string;
  best_time?: string;
}

type MessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: MessageContent;
  imagePreviews?: string[];
  postData?: PostData;
}

interface PostAIChatProps {
  unitId: string;
  onApplyPost: (data: PostData) => void;
}

const QUICK_PROMPTS = [
  { icon: 'Camera', label: 'Post de produto', color: 'text-pink-400', bg: 'bg-pink-500/10', prompt: 'Crie um post destacando um produto do cardápio. Escolha o mais atrativo e gere a legenda completa.' },
  { icon: 'Flame', label: 'Promoção', color: 'text-amber-400', bg: 'bg-amber-500/10', prompt: 'Crie um post de promoção especial para hoje, baseado nos produtos reais do cardápio.' },
  { icon: 'BookOpen', label: 'Storytelling', color: 'text-blue-400', bg: 'bg-blue-500/10', prompt: 'Crie um post de storytelling contando um pouco sobre o negócio, bastidores ou a equipe.' },
  { icon: 'BarChart3', label: 'Engajamento', color: 'text-primary', bg: 'bg-primary/10', prompt: 'Crie um post interativo para engajar o público — pode ser enquete, pergunta, ou "isso ou aquilo".' },
];

function getTextContent(content: MessageContent): string {
  if (typeof content === 'string') return content;
  const textPart = content.find(p => p.type === 'text');
  return textPart && 'text' in textPart ? textPart.text : '';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PostAIChat({ unitId, onApplyPost }: PostAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { toast.error('Selecione apenas imagens'); continue; }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} muito grande (máx 10MB)`); continue; }
      const base64 = await fileToBase64(file);
      newImages.push(base64);
    }
    
    setPendingImages(prev => [...prev, ...newImages]);
    inputRef.current?.focus();
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && pendingImages.length === 0) || isLoading) return;

    const hasImages = pendingImages.length > 0;
    const messageText = text.trim() || (hasImages ? 'Analise este(s) criativo(s) e reproduza um post similar usando os dados da minha marca.' : '');

    let content: MessageContent;
    if (hasImages) {
      content = [
        { type: 'text', text: messageText },
        ...pendingImages.map(img => ({ type: 'image_url' as const, image_url: { url: img } })),
      ];
    } else {
      content = messageText;
    }

    const userMsg: ChatMessage = { role: 'user', content, imagePreviews: hasImages ? [...pendingImages] : undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setPendingImages([]);
    setIsLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error: fnError } = await supabase.functions.invoke('marketing-post-chat', {
        body: {
          messages: apiMessages,
          unit_id: unitId,
        },
      });

      if (fnError) throw new Error(fnError.message || 'Erro ao chamar IA');

      const responseText = data?.text || 'Desculpe, não consegui gerar uma resposta.';
      const postData = data?.postData || undefined;

      setMessages(prev => [...prev, { role: 'assistant', content: responseText, postData }]);
    } catch (e: any) {
      console.error('Chat error:', e);
      toast.error(e.message || 'Erro ao conversar com a IA');
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {messages.length === 0 && pendingImages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
              <AppIcon name="Sparkles" size={28} className="text-white" />
            </div>
            <h3 className="text-base font-semibold">Assistente de Marketing</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Descreva o post, envie referências visuais ou escolha uma sugestão
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => sendMessage(qp.prompt)}
                disabled={isLoading}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-border/40 bg-card hover:bg-secondary/60 transition-colors text-left active:scale-[0.97]"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", qp.bg)}>
                  <AppIcon name={qp.icon} size={18} className={qp.color} />
                </div>
                <span className="text-xs font-medium leading-tight">{qp.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 space-y-3 pb-2 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border/40 rounded-bl-md'
              )}>
                {msg.imagePreviews && msg.imagePreviews.length > 0 && (
                  <div className={cn("mb-2 -mx-1 -mt-1 gap-1", msg.imagePreviews.length > 1 ? "grid grid-cols-2" : "")}>
                    {msg.imagePreviews.map((img, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden">
                        <img src={img} alt={`Referência ${idx + 1}`} className="w-full max-h-40 object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:mb-1.5 [&>ol]:mb-1.5">
                    <ReactMarkdown>{getTextContent(msg.content)}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{getTextContent(msg.content)}</p>
                )}
                {msg.postData && (
                  <Button
                    size="sm"
                    className="mt-3 w-full gap-2 rounded-xl h-9"
                    onClick={() => onApplyPost(msg.postData!)}
                  >
                    <AppIcon name="Check" size={14} />
                    Usar este post
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/40 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending images preview */}
      {pendingImages.length > 0 && (
        <div className="px-1 pt-2 flex gap-2 flex-wrap">
          {pendingImages.map((img, idx) => (
            <div key={idx} className="relative inline-block">
              <img src={img} alt={`Preview ${idx + 1}`} className="h-16 rounded-xl border border-border/40 object-cover" />
              <button
                onClick={() => removePendingImage(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <AppIcon name="X" size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 pt-3 mt-auto">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={isLoading}
          className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center shrink-0 transition-colors active:scale-95"
        >
          <AppIcon name="Image" size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={pendingImages.length > 0 ? "Descreva o que quer reproduzir..." : "Descreva o post que deseja..."}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            disabled={isLoading}
            className="h-10 rounded-xl pr-12 bg-secondary/40 border-border/30"
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg"
          >
            <AppIcon name="Send" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
