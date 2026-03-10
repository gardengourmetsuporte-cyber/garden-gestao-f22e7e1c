import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { ManagerTask } from '@/types/agenda';

interface AgendaAIPanelProps {
  tasks: ManagerTask[];
}

export function AgendaAIPanel({ tasks }: AgendaAIPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOrganizing, setIsOrganizing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const pending = tasks.filter(t => !t.is_completed);
    const overdue = pending.filter(t => t.due_date && t.due_date < today);
    const todayTasks = pending.filter(t => t.due_date === today);
    const noDate = pending.filter(t => !t.due_date);
    const upcoming = pending.filter(t => t.due_date && t.due_date > today);
    return { overdue, todayTasks, noDate, upcoming, pending };
  }, [tasks, today]);

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

      await queryClient.invalidateQueries({ queryKey: ['manager-tasks'] });

      toast.success(data.summary || `${data.updated_count} tarefas repriorizadas pela IA!`, {
        duration: 5000,
      });
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

  const overdueDays = (date: string) => {
    const diff = Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86400000);
    return diff;
  };

  return (
    <div className="space-y-3">
      {/* Smart Summary Card */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <img src="/icons/copilot-ai.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <AppIcon name="Sparkles" size={18} className="text-primary absolute opacity-0 [img[style*='display: none']+&]:opacity-100" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Copilot IA</p>
              <p className="text-[11px] text-muted-foreground">Análise inteligente da agenda</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl text-xs h-8 px-3"
            onClick={() => navigate('/copilot')}
          >
            <AppIcon name="MessageSquare" size={14} className="mr-1" />
            Chat
          </Button>
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2">
          {stats.overdue.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <AppIcon name="AlertTriangle" size={13} className="text-destructive" />
              <span className="text-xs font-semibold text-destructive">{stats.overdue.length} atrasada{stats.overdue.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {stats.todayTasks.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AppIcon name="Clock" size={13} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{stats.todayTasks.length} para hoje</span>
            </div>
          )}
          {stats.upcoming.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <AppIcon name="Calendar" size={13} className="text-primary" />
              <span className="text-xs font-semibold text-primary">{stats.upcoming.length} próxima{stats.upcoming.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {stats.noDate.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted border border-border/40">
              <AppIcon name="Minus" size={13} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{stats.noDate.length} sem data</span>
            </div>
          )}
        </div>

        {/* Organize button */}
        <Button
          onClick={handleOrganize}
          disabled={isOrganizing || stats.pending.length === 0}
          className="w-full rounded-xl h-10 text-sm font-semibold"
          variant="default"
        >
          {isOrganizing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analisando com IA...
            </>
          ) : (
            <>
              <AppIcon name="Sparkles" size={16} className="mr-1" />
              Organizar com IA
            </>
          )}
        </Button>
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
                  task.priority === 'medium' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
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
  );
}
