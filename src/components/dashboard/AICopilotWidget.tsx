import { useState, useEffect, useRef } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useManagementAI } from '@/hooks/useManagementAI';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';

export function AICopilotWidget() {
  const { messages, isLoading, isExecuting, hasGreeted, sendMessage, clearHistory } = useManagementAI();
  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-greet on mount
  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, []);

  // Scroll only within messages container
  useEffect(() => {
    if (expanded && messagesContainerRef.current) {
      const el = messagesContainerRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, expanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    sendMessage(question.trim());
    setQuestion('');
    setExpanded(true);
  };

  const lastAssistantMsg = messages.filter(m => m.role === 'assistant').at(-1);

  return (
    <div className="col-span-2 rounded-2xl overflow-hidden animate-slide-up stagger-2 relative">
      {/* Collapsed: Greeting card style */}
      {!expanded && (
        <div
          onClick={() => setExpanded(true)}
          className="card-stat-holo p-4 flex items-center gap-3 cursor-pointer group"
        >
          <img src={mascotImg} alt="Garden Copiloto" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0" />
          <div className="flex-1 min-w-0">
            {lastAssistantMsg ? (
              <>
                <p className="text-xs font-semibold text-foreground leading-tight">Copiloto IA</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                  {lastAssistantMsg.content}
                </p>
              </>
            ) : isLoading ? (
              <>
                <p className="text-xs font-semibold text-foreground leading-tight">Copiloto IA</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-muted-foreground ml-1">Analisando...</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-foreground leading-tight">Olá! Sou seu Copiloto 🌿</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Seu assistente de gestão</p>
              </>
            )}
          </div>
          <div className="shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <AppIcon name="MessageCircle" size={16} className="text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Expanded: full chat */}
      {expanded && (
        <div className="card-stat-holo rounded-2xl overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <img src={mascotImg} alt="Copiloto" className="w-8 h-8 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Copiloto IA</p>
              <p className="text-[10px] text-muted-foreground">Online</p>
            </div>
            <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
              <AppIcon name="X" size={14} className="text-muted-foreground" />
            </button>
          </div>
          <div className="px-4 pb-4 pt-3 space-y-3">
          {/* Messages */}
          <div ref={messagesContainerRef} className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "text-xs leading-relaxed rounded-2xl px-3 py-2",
                  msg.role === 'assistant'
                    ? "bg-secondary/50 text-foreground mr-6"
                    : "bg-primary/15 text-primary ml-6 text-right"
                )}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-1 px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Pergunte algo..."
              className="h-9 text-xs rounded-full"
              disabled={isLoading}
            />
            <Button type="submit" size="sm" className="h-9 w-9 p-0 rounded-full shrink-0" disabled={isLoading || !question.trim()}>
              <AppIcon name="Send" size={14} />
            </Button>
          </form>

          {/* Clear history */}
          {messages.length > 4 && (
            <button
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors mx-auto block"
            >
              Limpar histórico
            </button>
          )}
        </div>
        </div>
      )}
    </div>
  );
}
