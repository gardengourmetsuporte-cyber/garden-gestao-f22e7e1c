import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useManagementAI } from '@/hooks/useManagementAI';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';

function isActionMessage(content: string) {
  return content.startsWith('[ACTION]');
}

function stripActionMarker(content: string) {
  return content.replace(/^\[ACTION\]\s*/, '');
}

export default function CopilotPage() {
  const navigate = useNavigate();
  const { messages, isLoading, isExecuting, hasGreeted, sendMessage, clearHistory } = useManagementAI();
  const [question, setQuestion] = useState('');
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

    // Validate file
    if (!file.type.startsWith('image/')) {
      sendMessage('Envie apenas imagens (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      sendMessage('A imagem deve ter no máximo 10MB.');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const prompt = question.trim() || 'Analise esta imagem e extraia todas as informações relevantes (valores, itens, datas, etc.)';
      sendMessage(prompt, base64);
      setQuestion('');
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
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
            onClick={() => navigate('/dashboard')}
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
        {messages.map((msg, i) => {
          const isAction = msg.role === 'assistant' && isActionMessage(msg.content);
          const displayContent = isAction ? stripActionMarker(msg.content) : msg.content;

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              {/* Show image thumbnail if message has one */}
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Imagem enviada"
                  className="max-w-[200px] max-h-[200px] rounded-xl mb-1 object-cover border border-border/30"
                />
              )}
              {isAction ? (
                <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-tl-md">
                  <div className="whitespace-pre-line">{displayContent}</div>
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
                  {displayContent}
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
