import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import type { ManagerTask } from '@/types/agenda';

interface AISuggestion {
  id: string;
  suggested_priority: 'low' | 'medium' | 'high';
  reason: string;
  enabled: boolean;
}

interface AgendaAIPanelProps {
  tasks: ManagerTask[];
}

const PRIORITY_LABELS: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' };
const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-destructive/15 text-destructive border-destructive/20',
  medium: 'bg-warning/15 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-border/40',
};

export function AgendaAIPanel({ tasks }: AgendaAIPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [summary, setSummary] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const pending = tasks.filter(t => !t.is_completed);
    const overdue = pending.filter(t => t.due_date && t.due_date < today);
    const todayTasks = pending.filter(t => t.due_date === today);
    const noDate = pending.filter(t => !t.due_date);
    const upcoming = pending.filter(t => t.due_date && t.due_date > today);
    return { overdue, todayTasks, noDate, upcoming, pending };
  }, [tasks, today]);

  const taskMap = useMemo(() => {
    const m = new Map<string, ManagerTask>();
    tasks.forEach(t => m.set(t.id, t));
    return m;
  }, [tasks]);

  const handleOrganize = async () => {
    if (stats.pending.length === 0) {
      toast.info('Nenhuma tarefa pendente para organizar.');
      return;
    }

    setIsOrganizing(true);
    try {
      const payload = stats.pending.slice(0, 50).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
        due_time: t.due_time,
        category_name: t.category?.name || null,
        notes: t.notes,
      }));

      const { data, error } = await supabase.functions.invoke('agenda-ai-prioritize', {
        body: { tasks: payload },
      });

      if (error) throw error;

      const aiSuggestions: AISuggestion[] = (data.suggestions || []).map((s: any) => ({
        ...s,
        enabled: true,
      }));

      setSuggestions(aiSuggestions);
      setSummary(data.summary || '');
      setReviewOpen(true);
    } catch (err: any) {
      const msg = err?.message?.includes('429')
        ? 'Muitas requisições. Tente novamente em alguns minutos.'
        : err?.message?.includes('402')
          ? 'Créditos insuficientes para usar a IA.'
          : 'Erro ao organizar tarefas com IA.';
      toast.error(msg);
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleApprove = async () => {
    const approved = suggestions.filter(s => s.enabled);
    if (approved.length === 0) {
      toast.info('Nenhuma sugestão selecionada.');
      return;
    }

    setIsApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke('agenda-ai-prioritize', {
        body: { apply: true, approved_tasks: approved },
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });
      setReviewOpen(false);
      setSuggestions([]);
      toast.success(`${data.updated_count} tarefa(s) atualizada(s)!`);
    } catch {
      toast.error('Erro ao aplicar mudanças.');
    } finally {
      setIsApplying(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const enabledCount = suggestions.filter(s => s.enabled).length;
  const changedSuggestions = suggestions.filter(s => {
    const task = taskMap.get(s.id);
    return task && task.priority !== s.suggested_priority;
  });

  const overdueDays = (date: string) => {
    return Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86400000);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Folhinha Mascot Card — slim */}
        <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 64 }}>
          <img
            src="/images/folhinha-mascot.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

          <div className="relative flex items-center justify-between p-3 h-full" style={{ minHeight: 64 }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Copilot IA</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-white leading-tight mt-0.5">Organizar agenda</p>
              </div>
            </div>

            <button
              onClick={handleOrganize}
              disabled={isOrganizing || stats.pending.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md disabled:opacity-40 shrink-0"
            >
              {isOrganizing ? (
                <svg className="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <AppIcon name="Sparkles" size={13} className="text-primary" />
              )}
              <span className="text-xs font-semibold text-white">{isOrganizing ? '...' : 'IA'}</span>
            </button>
          </div>
        </div>

        {/* Overdue alerts */}
        {stats.overdue.length > 0 && (
          <div className="space-y-1.5">
            {stats.overdue.slice(0, 3).map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-destructive/5 border border-destructive/15"
              >
                <AppIcon name="AlertCircle" size={16} className="text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <p className="text-[11px] text-destructive/80">
                    Atrasada há {overdueDays(task.due_date!)} dia{overdueDays(task.due_date!) > 1 ? 's' : ''}
                  </p>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                  task.priority === 'high' ? 'bg-destructive/15 text-destructive' :
                    task.priority === 'medium' ? 'bg-warning/15 text-warning' :
                      'bg-muted text-muted-foreground'
                )}>
                  {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                </div>
              </div>
            ))}
            {stats.overdue.length > 3 && (
              <p className="text-[11px] text-destructive/60 text-center">
                +{stats.overdue.length - 3} tarefa{stats.overdue.length - 3 > 1 ? 's' : ''} atrasada{stats.overdue.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Review Sheet */}
      <Sheet open={reviewOpen} onOpenChange={setReviewOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl flex flex-col overflow-hidden">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2">
              <AppIcon name="Sparkles" size={20} className="text-primary" />
              Sugestões da IA
            </SheetTitle>
            <SheetDescription>{summary}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-3">
            {changedSuggestions.length === 0 && suggestions.length > 0 && (
              <div className="text-center py-8">
                <AppIcon name="CheckCircle2" size={32} className="text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Suas prioridades já estão ótimas!</p>
                <p className="text-xs text-muted-foreground mt-1">A IA não sugeriu alterações.</p>
              </div>
            )}

            {suggestions.map(suggestion => {
              const task = taskMap.get(suggestion.id);
              if (!task) return null;
              const changed = task.priority !== suggestion.suggested_priority;

              return (
                <div
                  key={suggestion.id}
                  className={cn(
                    "rounded-xl border p-3.5 transition-all",
                    suggestion.enabled ? "bg-card border-border/50" : "bg-muted/30 border-border/20 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>

                      {/* Priority change indicator */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border", PRIORITY_COLORS[task.priority])}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                        {changed && (
                          <>
                            <AppIcon name="ArrowRight" size={12} className="text-muted-foreground" />
                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border", PRIORITY_COLORS[suggestion.suggested_priority])}>
                              {PRIORITY_LABELS[suggestion.suggested_priority]}
                            </span>
                          </>
                        )}
                        {!changed && (
                          <span className="text-[10px] text-muted-foreground italic">sem alteração</span>
                        )}
                      </div>
                    </div>

                    {changed && (
                      <Switch
                        checked={suggestion.enabled}
                        onCheckedChange={() => toggleSuggestion(suggestion.id)}
                        className="shrink-0 mt-1"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="sticky bottom-0 pt-3 pb-4 border-t border-border/50 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onClick={() => setReviewOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
              disabled={isApplying || enabledCount === 0}
              onClick={handleApprove}
            >
              {isApplying ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Aplicando...
                </>
              ) : (
                <>
                  <AppIcon name="Check" size={16} className="mr-1" />
                  Aplicar {enabledCount > 0 ? `(${enabledCount})` : ''}
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
