import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDashboardCalendar } from '@/hooks/useDashboardCalendar';
import { calendarEventColors } from '@/types/calendar';
import type { CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { UnifiedMonthGrid } from '@/components/ui/unified-month-grid';
import { UnifiedMonthNav } from '@/components/ui/unified-month-nav';

export default function CalendarFull() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(format(new Date(), 'yyyy-MM-dd'));
  const { eventsMap, isLoading } = useDashboardCalendar(currentMonth);

  const selectedEvents = selectedDate ? eventsMap.get(selectedDate) : null;

  const getDayIndicators = (dateKey: string) => {
    const ev = eventsMap.get(dateKey);
    if (!ev) return [];
    const chips: { color: string; className?: string }[] = [];
    if (ev.tasks.length > 0) chips.push({ color: '', className: calendarEventColors.task_pending });
    if (ev.marketing.length > 0) chips.push({ color: '', className: calendarEventColors.marketing });
    if (ev.schedules.length > 0) chips.push({ color: '', className: calendarEventColors.schedule });
    if (ev.finance.length > 0) chips.push({ color: '', className: calendarEventColors.finance_income });
    const hasPeak = ev.finance.some(f => f.type === 'finance_peak' && f.subtitle === 'Acima da média');
    if (hasPeak) chips.push({ color: '', className: calendarEventColors.finance_peak });
    return chips;
  };

  const allEvents = selectedEvents
    ? [
        ...selectedEvents.tasks,
        ...selectedEvents.finance,
        ...selectedEvents.marketing,
        ...selectedEvents.schedules,
      ]
    : [];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                <AppIcon name="ChevronLeft" size={18} />
              </Button>
              <h1 className="text-lg font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>
                Calendário
              </h1>
            </div>
            <button
              className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
              }}
            >
              Hoje
            </button>
          </div>

          {/* Month nav */}
          <UnifiedMonthNav
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />

          {/* Calendar grid */}
          <UnifiedMonthGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onSelectDate={(key) => setSelectedDate(key || null)}
            getDayIndicators={getDayIndicators}
            isLoading={isLoading}
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
            {[
              { label: 'Tarefas', color: calendarEventColors.task_pending },
              { label: 'Marketing', color: calendarEventColors.marketing },
              { label: 'Folga', color: calendarEventColors.schedule },
              { label: 'Financeiro', color: calendarEventColors.finance_income },
              { label: 'Data importante', color: calendarEventColors.finance_peak },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={cn('w-2.5 h-2.5 rounded-full', s.color)} />
                <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selectedDate && (
            <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground capitalize">
                  {format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <button onClick={() => setSelectedDate(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <AppIcon name="X" size={16} />
                </button>
              </div>

              {allEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <AppIcon name="CalendarDays" size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents!.tasks.length > 0 && (
                    <EventSection icon="CheckCircle2" iconColor="text-emerald-500" title="Tarefas">
                      {selectedEvents!.tasks.map(ev => <EventRow key={ev.id} event={ev} />)}
                    </EventSection>
                  )}
                  {selectedEvents!.finance.length > 0 && (
                    <EventSection icon="DollarSign" iconColor="text-orange-500" title="Financeiro">
                      {selectedEvents!.finance.map(ev => <EventRow key={ev.id} event={ev} />)}
                    </EventSection>
                  )}
                  {selectedEvents!.marketing.length > 0 && (
                    <EventSection icon="Megaphone" iconColor="text-accent" title="Marketing">
                      {selectedEvents!.marketing.map(ev => <EventRow key={ev.id} event={ev} />)}
                    </EventSection>
                  )}
                  {selectedEvents!.schedules.length > 0 && (
                    <EventSection icon="Coffee" iconColor="text-amber-500" title="Folgas">
                      {selectedEvents!.schedules.map(ev => <EventRow key={ev.id} event={ev} />)}
                    </EventSection>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function EventSection({ icon, iconColor, title, children }: { icon: string; iconColor: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <AppIcon name={icon} size={16} className={iconColor} />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1.5 pl-6">{children}</div>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', calendarEventColors[event.type])} />
        <span className="text-sm text-foreground truncate">{event.title}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {event.subtitle && (
          <span className="text-xs text-muted-foreground">{event.subtitle}</span>
        )}
        {event.time && (
          <span className="text-xs text-muted-foreground">{event.time}</span>
        )}
      </div>
    </div>
  );
}
