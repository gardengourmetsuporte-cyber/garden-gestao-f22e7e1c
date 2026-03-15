import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { useManagementAI } from '@/hooks/useManagementAI';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/garden-mascot.png';

const CopilotMessageContent = lazy(() => import('@/components/copilot/CopilotMessageContent'));

const SUGGESTIONS = [
  { label: 'Resumo do dia', icon: 'BarChart3' },
  { label: 'Como está meu estoque?', icon: 'Package' },
  { label: 'Despesas pendentes', icon: 'Receipt' },
];

export function AICopilotWidget() {
  const { messages, isLoading, isExecuting, hasGreeted, sendMessage, clearHistory } = useManagementAI();
  const [question, setQuestion] = useState('');
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-greet on first expand
  useEffect(() => {
    if (expanded && !hasGreeted && messages.length === 0) {
      sendMessage();
    }
  }, [expanded]);

  // Auto-scroll ONLY the messages container (not the page) + keep widget visible
  useEffect(() => {
    if (expanded && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setTimeout(() => {
        widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages, expanded, isLoading]);

  // Scroll widget into view + focus input on expand
  useEffect(() => {
    if (expanded) {
      requestAnimationFrame(() => {
        widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => inputRef.current?.focus(), 300);
      });
    }
  }, [expanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    sendMessage(question.trim());
    setQuestion('');
    if (!expanded) setExpanded(true);
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
    setExpanded(true);
  };

  return (
    <div ref={widgetRef} className="copilot-widget-root w-full">
      {/* === COLLAPSED: Modern AI search bar === */}
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

      {/* === EXPANDED: Full chat panel === */}
      {expanded && (
        <div className="copilot-bar-gradient rounded-2xl p-[1px] animate-scale-in">
          <div className="bg-background rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '500px' }}>
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
              {messages.length > 2 && (
                <button
                  onClick={clearHistory}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  <AppIcon name="Trash2" size={13} className="text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
                <AppIcon name="ChevronDown" size={15} className="text-muted-foreground" />
              </button>
            </div>

            {/* Messages area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-thin min-h-[120px] max-h-[340px]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "animate-fade-in",
                    msg.role === 'user' ? "flex justify-end" : "flex justify-start"
                  )}
                >
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
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    <div className="copilot-shimmer-typing w-32 h-3 rounded-full" />
                  </div>
                </div>
              )}

              {isExecuting && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-card rounded-2xl rounded-tl-sm px-3.5 py-2 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-[11px] text-muted-foreground">Executando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-1">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-1.5">
                <input
                  ref={inputRef}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Pergunte algo..."
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none py-1.5"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg shrink-0"
                  disabled={isLoading || !question.trim()}
                >
                  <AppIcon name="Send" size={13} />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
