import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useManagementAI } from '@/hooks/useManagementAI';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';

export default function CopilotPage() {
  const navigate = useNavigate();
  const { messages, isLoading, hasGreeted, sendMessage, clearHistory } = useManagementAI();
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-greet on mount
  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    sendMessage(question.trim());
    setQuestion('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <header
        className="shrink-0 border-b border-border/30 bg-card"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 h-14 px-4">
          <button
            onClick={() => navigate(-1)}
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
          {messages.length > 2 && (
            <button
              onClick={clearHistory}
              className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-secondary transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === 'assistant'
                  ? "bg-secondary/60 text-foreground rounded-tl-md"
                  : "bg-primary text-primary-foreground rounded-tr-md"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary/60 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t border-border/30 bg-card px-4 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
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
