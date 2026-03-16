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
  imagePreview?: string;
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

// Uses supabase.functions.invoke for proper auth

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
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagem muito grande (máx 10MB)'); return; }
    const base64 = await fileToBase64(file);
    setPendingImage(base64);
    inputRef.current?.focus();
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && !pendingImage) || isLoading) return;

    const hasImage = !!pendingImage;
    const messageText = text.trim() || (hasImage ? 'Analise este criativo e reproduza um post similar usando os dados da minha marca.' : '');

    let content: MessageContent;
    if (hasImage) {
      content = [
        { type: 'text', text: messageText },
        { type: 'image_url', image_url: { url: pendingImage! } },
      ];
    } else {
      content = messageText;
    }

    const userMsg: ChatMessage = { role: 'user', content, imagePreview: pendingImage || undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setPendingImage(null);
    setIsLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : m.content,
        ...(m.imagePreview ? { imageUrl: m.imagePreview } : {}),
      }));

      const { data, error: fnError } = await supabase.functions.invoke('management-ai', {
        body: {
          messages: apiMessages,
          context: { marketing_mode: true },
          unit_id: unitId,
        },
      });

      if (fnError) throw new Error(fnError.message || 'Erro ao chamar IA');

      const responseText = data.suggestion || 'Desculpe, não consegui gerar uma resposta.';
      
      // Check if response contains a marketing post (tool call result)
      let postData: PostData | undefined;
      
      // Try to detect structured post data from the response
      const titleMatch = responseText.match(/\*\*(.+?)\*\*/);
      if (data.action_executed && titleMatch) {
        // The AI executed create_marketing_post tool
        // Extract post data from the formatted response
        const captionMatch = responseText.match(/📌.*?\n\n([\s\S]*?)(?:\n\n🏷️|$)/);
        const tagsMatch = responseText.match(/🏷️ Tags: (.+)/);
        const imagePromptMatch = responseText.match(/🎨 Prompt de imagem: (.+)/);
        const bestTimeMatch = responseText.match(/⏰ Melhor horário: (.+)/);
        
        if (captionMatch) {
          postData = {
            title: titleMatch[1],
            caption: captionMatch[1].trim(),
            tags: tagsMatch ? tagsMatch[1].split(', ') : [],
            image_prompt: imagePromptMatch ? imagePromptMatch[1] : '',
            best_time: bestTimeMatch ? bestTimeMatch[1] : undefined,
          };
        }
      }

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
      {/* Empty state with quick prompts */}
      {messages.length === 0 && !pendingImage ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
              <AppIcon name="Sparkles" size={28} className="text-white" />
            </div>
            <h3 className="text-base font-semibold">Assistente de Marketing</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Descreva o post, envie uma referência visual ou escolha uma sugestão
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
        /* Messages area */
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 space-y-3 pb-2 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border border-border/40 rounded-bl-md'
              )}>
                {msg.imagePreview && (
                  <div className="mb-2 rounded-xl overflow-hidden -mx-1 -mt-1">
                    <img src={msg.imagePreview} alt="Referência" className="w-full max-h-40 object-cover" />
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

      {/* Pending image preview */}
      {pendingImage && (
        <div className="px-1 pt-2">
          <div className="relative inline-block">
            <img src={pendingImage} alt="Preview" className="h-16 rounded-xl border border-border/40 object-cover" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <AppIcon name="X" size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 pt-3 mt-auto">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
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
            placeholder={pendingImage ? "Descreva o que quer reproduzir..." : "Descreva o post que deseja..."}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            disabled={isLoading}
            className="h-10 rounded-xl pr-12 bg-secondary/40 border-border/30"
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && !pendingImage) || isLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg"
          >
            <AppIcon name="Send" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
