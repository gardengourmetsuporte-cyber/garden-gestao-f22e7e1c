import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '@/components/ui/app-icon';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDashboardCalendar } from '@/hooks/useDashboardCalendar';
import { calendarEventColors } from '@/types/calendar';
import type { CalendarEvent } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { UnifiedMonthGrid } from '@/components/ui/unified-month-grid';
import { UnifiedMonthNav } from '@/components/ui/unified-month-nav';

export function UnifiedCalendarWidget() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { eventsMap, isLoading } = useDashboardCalendar(currentMonth);

  const selectedEvents = selectedDate ? eventsMap.get(selectedDate) : null;
  const todayStart = startOfDay(new Date());

  const getDayIndicators = (dateKey: string) => {
    const ev = eventsMap.get(dateKey);
    if (!ev) return [];
    const day = new Date(dateKey + 'T12:00:00');
    const isPast = isBefore(day, todayStart) && !isToday(day);
    if (isPast) return [];

    const chips: { color: string; className?: string }[] = [];
    const hasPendingTasks = ev.tasks.some(t => t.type === 'task_pending');
    if (hasPendingTasks) chips.push({ color: '', className: calendarEventColors.task_pending });
    if (ev.marketing.length > 0) chips.push({ color: '', className: calendarEventColors.marketing });
    if (ev.schedules.length > 0) chips.push({ color: '', className: calendarEventColors.schedule });
    const hasPeak = ev.finance.some(f => f.type === 'finance_peak' && f.subtitle === 'Acima da média');
    if (hasPeak) chips.push({ color: '', className: calendarEventColors.finance_peak });
    return chips;
  };

  return (
    <div className="col-span-2 animate-slide-up stagger-4">
      <div className="space-y-2">
        {/* Header */}
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center justify-between px-1 w-full hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <AppIcon name="CalendarDays" size={16} className="text-primary" />
            <span className="text-xs font-bold text-foreground font-display" style={{ letterSpacing: '-0.02em' }}>Calendário</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground mr-1">Ver completo</span>
            <AppIcon name="ChevronRight" size={14} className="text-muted-foreground" />
          </div>
        </button>

        {/* Month nav */}
        <UnifiedMonthNav
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />

        {/* Calendar Grid */}
        <UnifiedMonthGrid
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={(key) => setSelectedDate(key || null)}
          getDayIndicators={getDayIndicators}
          disablePast
          compact
          isLoading={isLoading}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center px-3 py-1">
          {[
            { label: 'Tarefas', color: calendarEventColors.task_pending },
            { label: 'Marketing', color: calendarEventColors.marketing },
            { label: 'Folga', color: calendarEventColors.schedule },
            { label: 'Data importante', color: calendarEventColors.finance_peak },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', s.color)} />
              <span className="text-[9px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Inline detail panel */}
        {selectedDate && selectedEvents && (
          <div className="calendar-card-brand p-3 space-y-3 animate-slide-up">
            <p className="text-xs font-semibold text-foreground capitalize">
              {format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>

            {/* Tasks */}
            {selectedEvents.tasks.length > 0 && (
              <EventSection icon={<AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />} title="Tarefas">
                {selectedEvents.tasks.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </EventSection>
            )}

            {/* Finance */}
            {selectedEvents.finance.length > 0 && (
              <EventSection icon={<AppIcon name="DollarSign" size={14} className="text-orange-500" />} title="Financeiro">
                {selectedEvents.finance.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </EventSection>
            )}

            {/* Marketing */}
            {selectedEvents.marketing.length > 0 && (
              <EventSection icon={<AppIcon name="Megaphone" size={14} className="text-accent" />} title="Marketing">
                {selectedEvents.marketing.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </EventSection>
            )}

            {/* Schedules */}
            {selectedEvents.schedules.length > 0 && (
              <EventSection icon={<AppIcon name="Coffee" size={14} className="text-amber-500" />} title="Folgas">
                {selectedEvents.schedules.map(ev => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </EventSection>
            )}

            {selectedEvents.tasks.length === 0 && selectedEvents.finance.length === 0 && selectedEvents.marketing.length === 0 && selectedEvents.schedules.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum evento neste dia</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EventSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1 pl-5">{children}</div>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', calendarEventColors[event.type])} />
        <span className="text-xs text-foreground truncate">{event.title}</span>
      </div>
      {event.subtitle && (
        <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{event.subtitle}</span>
      )}
      {event.time && (
        <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{event.time}</span>
      )}
    </div>
  );
}
