import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { ManagerTask } from '@/types/agenda';

interface TimeBlocksViewProps {
  tasks: ManagerTask[];
  onToggleTask: (id: string) => void;
  onTaskClick: (task: ManagerTask) => void;
}

// ── localStorage helpers ──
const getStorageKey = (date: string) => `timeblocks-${date}`;

// Migration: handle old format (Record<number, string>) and new (Record<number, string[]>)
function loadAllocations(dateStr: string): Record<number, string[]> {
  try {
    const raw = localStorage.getItem(getStorageKey(dateStr));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Migrate old format: { 6: "id" } → { 6: ["id"] }
    const result: Record<number, string[]> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) {
        result[Number(k)] = v as string[];
      } else if (typeof v === 'string') {
        result[Number(k)] = [v];
      }
    }
    return result;
  } catch { return {}; }
}

function saveAllocations(dateStr: string, allocs: Record<number, string[]>) {
  try { localStorage.setItem(getStorageKey(dateStr), JSON.stringify(allocs)); } catch { }
}

// Working hours only (6h - 23h)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "EEEE, d 'de' MMM", { locale: ptBR });
}

function PickerTaskList({ availableTasks, pickerHour, allocateTask }: {
  availableTasks: ManagerTask[];
  pickerHour: number | null;
  allocateTask: (hour: number, taskId: string) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (availableTasks.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Todas as tarefas já foram alocadas</p>;
  }

  const grouped = new Map<string, { category: ManagerTask['category']; tasks: ManagerTask[] }>();
  const uncategorized: ManagerTask[] = [];
  availableTasks.forEach(task => {
    if (task.category) {
      const key = task.category.id || task.category.name;
      if (!grouped.has(key)) grouped.set(key, { category: task.category, tasks: [] });
      grouped.get(key)!.tasks.push(task);
    } else {
      uncategorized.push(task);
    }
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-1.5 mt-3 pb-4">
      {[...grouped.values()].map(({ category, tasks: catTasks }) => {
        const key = category!.id || category!.name;
        const isOpen = expandedGroups.has(key);
        return (
          <div key={key}>
            <button
              onClick={() => toggleGroup(key)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category!.color }} />
                <span className="text-sm font-semibold">{category!.name}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground font-medium">{catTasks.length}</span>
              </div>
              <AppIcon name="ChevronDown" size={16} className={cn("text-muted-foreground transition-transform duration-200", isOpen ? "rotate-0" : "-rotate-90")} />
            </button>
            <div className={cn("overflow-hidden transition-all duration-200", isOpen ? "max-h-[2000px] opacity-100 mt-1.5" : "max-h-0 opacity-0")}>
              <div className="space-y-1.5 ml-2">
                {catTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => pickerHour !== null && allocateTask(pickerHour, task.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/25 transition-all text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium truncate block">{task.title}</span>
                      {task.notes && <span className="text-[11px] text-muted-foreground truncate block">{task.notes}</span>}
                    </div>
                    <AppIcon name="Plus" size={16} className="text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      {uncategorized.length > 0 && (
        <div>
          {grouped.size > 0 && (
            <button
              onClick={() => toggleGroup('__uncategorized__')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-all"
            >
              <div className="flex items-center gap-2">
                <AppIcon name="Folder" size={14} className="text-muted-foreground" />
                <span className="text-sm font-semibold">Sem categoria</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground font-medium">{uncategorized.length}</span>
              </div>
              <AppIcon name="ChevronDown" size={16} className={cn("text-muted-foreground transition-transform duration-200", expandedGroups.has('__uncategorized__') ? "rotate-0" : "-rotate-90")} />
            </button>
          )}
          <div className={cn("overflow-hidden transition-all duration-200", 
            grouped.size === 0 || expandedGroups.has('__uncategorized__') ? "max-h-[2000px] opacity-100 mt-1.5" : "max-h-0 opacity-0"
          )}>
            <div className="space-y-1.5 ml-2">
              {uncategorized.map(task => (
                <button
                  key={task.id}
                  onClick={() => pickerHour !== null && allocateTask(pickerHour, task.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/25 transition-all text-left"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium truncate block">{task.title}</span>
                    {task.notes && <span className="text-[11px] text-muted-foreground truncate block">{task.notes}</span>}
                  </div>
                  <AppIcon name="Plus" size={16} className="text-primary shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TimeBlocksView({ tasks, onToggleTask, onTaskClick }: TimeBlocksViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const [allocations, setAllocations] = useState<Record<number, string[]>>(() => loadAllocations(dateStr));
  const [pickerHour, setPickerHour] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentHour = new Date().getHours();

  // Reload allocations when date changes
  useEffect(() => {
    setAllocations(loadAllocations(dateStr));
  }, [dateStr]);

  // Save allocations on change
  useEffect(() => { saveAllocations(dateStr, allocations); }, [allocations, dateStr]);

  // Auto-scroll to current hour on mount
  const hasScrolled = useRef(false);
  useEffect(() => {
    if (hasScrolled.current || !isToday(currentDate)) return;
    hasScrolled.current = true;
    const el = document.getElementById(`block-${currentHour}`);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [currentDate, currentHour]);

  // Task map
  const taskMap = useMemo(() => {
    const m = new Map<string, ManagerTask>();
    tasks.forEach(t => m.set(t.id, t));
    return m;
  }, [tasks]);

  // Allocated task IDs (all across all hours)
  const allocatedIds = useMemo(() => {
    const s = new Set<string>();
    Object.values(allocations).forEach(ids => ids.forEach(id => s.add(id)));
    return s;
  }, [allocations]);

  // Available tasks for this day
  const availableTasks = useMemo(() => {
    return tasks
      .filter(t => !t.is_completed && !allocatedIds.has(t.id))
      .filter(t => !t.due_date || t.due_date === dateStr);
  }, [tasks, allocatedIds, dateStr]);

  const allocateTask = useCallback((hour: number, taskId: string) => {
    setAllocations(prev => {
      const existing = prev[hour] || [];
      if (existing.includes(taskId)) return prev;
      return { ...prev, [hour]: [...existing, taskId] };
    });
    // Don't close picker — allow adding more tasks
    try { navigator.vibrate?.(10); } catch { }
  }, []);

  const removeTaskFromHour = useCallback((hour: number, taskId: string) => {
    setAllocations(prev => {
      const existing = prev[hour] || [];
      const next = existing.filter(id => id !== taskId);
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[hour];
        return copy;
      }
      return { ...prev, [hour]: next };
    });
  }, []);

  const filledCount = Object.values(allocations).reduce((sum, ids) => sum + ids.length, 0);
  const totalWorking = HOURS.length;

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentDate(d => subDays(d, 1))}>
          <AppIcon name="ChevronLeft" size={20} />
        </Button>
        <div className="text-center">
          <h2 className="text-base font-semibold capitalize">{formatDateLabel(currentDate)}</h2>
          {!isToday(currentDate) && (
            <button onClick={() => setCurrentDate(new Date())} className="text-[11px] text-primary font-medium mt-0.5">
              Ir para hoje
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentDate(d => addDays(d, 1))}>
          <AppIcon name="ChevronRight" size={20} />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.min((filledCount / totalWorking) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{filledCount}</span>
        {filledCount > 0 && (
          <button
            onClick={() => setAllocations({})}
            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="relative flex flex-col-reverse gap-1">
        {HOURS.map((hour) => {
          const taskIds = allocations[hour] || [];
          const hourTasks = taskIds.map(id => taskMap.get(id)).filter(Boolean) as ManagerTask[];
          const hasTasks = hourTasks.length > 0;
          const isNow = isToday(currentDate) && currentHour === hour;
          const isPast = isToday(currentDate) && hour < currentHour;
          const endHour = hour + 1;

          return (
            <div
              key={hour}
              id={`block-${hour}`}
              className={cn(
                "relative flex gap-3 px-3 py-3 rounded-xl border transition-all duration-300 min-h-[52px]",
                "card-surface border-white/5",
                isNow && "border-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-primary/20",
                isPast && !hasTasks && "opacity-40",
                hasTasks && "shadow-sm border-white/10",
              )}
            >
              {/* Now indicator */}
              {isNow && (
                <span className="absolute left-0 w-1 h-8 rounded-r-full bg-primary animate-pulse top-1/2 -translate-y-1/2" />
              )}

              {/* Time */}
              <div className="shrink-0 w-[52px] text-center pt-0.5">
                <span className={cn(
                  "text-xs font-mono font-medium",
                  isNow ? "text-emerald-400 font-bold drop-shadow-md" : isPast ? "text-muted-foreground/40" : "text-muted-foreground"
                )}>
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>

              {/* Divider line */}
              <div className={cn("w-px self-stretch shrink-0", isNow ? "bg-primary/30" : "bg-border/60")} />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {hourTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onTaskClick(task)}
                      className="flex items-center gap-2.5 min-w-0 flex-1"
                    >
                      {task.category && (
                        <span
                          className="w-2.5 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: task.category.color }}
                        />
                      )}
                      <div className="min-w-0">
                        <span className={cn(
                          "text-sm font-medium truncate block",
                          task.is_completed && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                          task.is_completed
                            ? "bg-success/20 text-success"
                            : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                      >
                        <AppIcon name="Check" size={14} />
                      </button>
                      <button
                        onClick={() => removeTaskFromHour(hour, task.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        <AppIcon name="X" size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add more / empty slot */}
                <button
                  onClick={() => availableTasks.length > 0 && setPickerHour(hour)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs italic transition-colors w-full text-left",
                    hasTasks
                      ? "text-primary/60 hover:text-primary pt-0.5"
                      : isPast ? "text-muted-foreground/30" : "text-muted-foreground/50 hover:text-primary/60"
                  )}
                >
                  {availableTasks.length > 0 ? (
                    <>
                      <AppIcon name="Plus" size={12} className="shrink-0" />
                      <span>{hasTasks ? 'adicionar mais' : 'toque para agendar'}</span>
                    </>
                  ) : (
                    !hasTasks && <span>livre</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Picker Sheet */}
      <Sheet open={pickerHour !== null} onOpenChange={(open) => !open && setPickerHour(null)}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="text-left pb-2">
            <SheetTitle>
              Agendar às {pickerHour !== null ? `${String(pickerHour).padStart(2, '0')}:00` : ''}
            </SheetTitle>
            <SheetDescription>Selecione tarefas para este horário</SheetDescription>
          </SheetHeader>

          {/* Tasks already in this slot */}
          {pickerHour !== null && (allocations[pickerHour] || []).length > 0 && (
            <div className="mb-3 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Neste horário</span>
              {(allocations[pickerHour] || []).map(id => {
                const t = taskMap.get(id);
                if (!t) return null;
                return (
                  <div key={id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 min-w-0">
                      {t.category && <span className="w-2 h-5 rounded-full shrink-0" style={{ backgroundColor: t.category.color }} />}
                      <span className="text-sm font-medium truncate">{t.title}</span>
                    </div>
                    <button onClick={() => removeTaskFromHour(pickerHour!, id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <AppIcon name="X" size={14} />
                    </button>
                  </div>
                );
              })}
              <div className="border-t border-border mt-2 pt-2" />
            </div>
          )}

          <PickerTaskList
            availableTasks={availableTasks}
            pickerHour={pickerHour}
            allocateTask={allocateTask}
          />

          {/* Close button */}
          <div className="sticky bottom-0 pb-4 pt-2">
            <Button variant="outline" className="w-full rounded-xl border-border" onClick={() => setPickerHour(null)}>
              Fechar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
