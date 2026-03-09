import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface PostData {
  title: string;
  caption: string;
  tags: string[];
  image_prompt: string;
  best_time?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  postData?: PostData;
}

interface PostAIChatProps {
  unitId: string;
  onApplyPost: (data: PostData) => void;
}

const QUICK_PROMPTS = [
  { emoji: '📸', label: 'Post de produto', prompt: 'Crie um post destacando um produto do cardápio. Escolha o mais atrativo e gere a legenda completa.' },
  { emoji: '🔥', label: 'Promoção', prompt: 'Crie um post de promoção especial para hoje, baseado nos produtos reais do cardápio.' },
  { emoji: '📖', label: 'Storytelling', prompt: 'Crie um post de storytelling contando um pouco sobre o negócio, bastidores ou a equipe.' },
  { emoji: '📊', label: 'Engajamento', prompt: 'Crie um post interativo para engajar o público — pode ser enquete, pergunta, ou "isso ou aquilo".' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketing-post-chat`;

export function PostAIChat({ unitId, onApplyPost }: PostAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    let toolCallArgs = '';
    let isToolCall = false;

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          unit_id: unitId,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('No stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const upsertAssistant = (text: string, postData?: PostData) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: text, postData: postData || m.postData } : m);
          }
          return [...prev, { role: 'assistant', content: text, postData }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) {
              assistantContent += delta.content;
              upsertAssistant(assistantContent);
            }
            if (delta?.tool_calls) {
              isToolCall = true;
              for (const tc of delta.tool_calls) {
                if (tc.function?.arguments) {
                  toolCallArgs += tc.function.arguments;
                }
              }
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Process tool call result
      if (isToolCall && toolCallArgs) {
        try {
          const postData: PostData = JSON.parse(toolCallArgs);
          const summary = `✅ **Post criado!**\n\n**${postData.title}**\n\n${postData.caption}\n\n${postData.best_time ? `⏰ Melhor horário: ${postData.best_time}` : ''}`;
          upsertAssistant(summary, postData);
        } catch (e) {
          console.error('Failed to parse tool call:', e);
        }
      }

      if (!assistantContent && !isToolCall) {
        upsertAssistant('Desculpe, não consegui gerar uma resposta. Tente novamente.');
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      toast.error(e.message || 'Erro ao conversar com a IA');
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-sm text-muted-foreground text-center">
            Escolha um tipo de post ou converse livremente
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((qp) => (
              <Button
                key={qp.label}
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1 text-left"
                onClick={() => sendMessage(qp.prompt)}
                disabled={isLoading}
              >
                <span className="text-lg">{qp.emoji}</span>
                <span className="text-xs font-medium">{qp.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 -mx-2 px-2" ref={scrollRef as any}>
        <div className="space-y-3 pb-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border/40'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                {msg.postData && (
                  <Button
                    size="sm"
                    className="mt-2 w-full gap-2"
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
              <div className="bg-card border border-border/40 rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
        <Input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Descreva o post que deseja..."
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
        >
          <AppIcon name="Send" size={16} />
        </Button>
      </div>
    </div>
  );
}
