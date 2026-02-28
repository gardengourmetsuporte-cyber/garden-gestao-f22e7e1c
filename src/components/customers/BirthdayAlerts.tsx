import { useMemo } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import type { Customer } from '@/types/customer';

interface BirthdayAlertsProps {
  customers: Customer[];
}

export function BirthdayAlerts({ customers }: BirthdayAlertsProps) {
  const upcoming = useMemo(() => {
    const today = new Date();
    const results: { customer: Customer; daysUntil: number }[] = [];

    customers.forEach(c => {
      if (!c.birthday) return;
      const [y, m, d] = c.birthday.split('-').map(Number);
      if (!m || !d) return;

      const thisYear = new Date(today.getFullYear(), m - 1, d);
      const nextYear = new Date(today.getFullYear() + 1, m - 1, d);
      const target = thisYear >= today ? thisYear : nextYear;
      const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);

      if (diff <= 7) {
        results.push({ customer: c, daysUntil: diff });
      }
    });

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [customers]);

  if (upcoming.length === 0) return null;

  return (
    <div className="card-surface p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm">🎂</span>
        <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">
          Aniversários esta semana
        </span>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
          {upcoming.length}
        </span>
      </div>
      {upcoming.map(({ customer, daysUntil }) => (
        <div key={customer.id} className="flex items-center gap-3 py-1.5">
          <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center shrink-0">
            <AppIcon name="Cake" size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{customer.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {daysUntil === 0 ? '🎉 Hoje!' : daysUntil === 1 ? 'Amanhã' : `Em ${daysUntil} dias`}
            </p>
          </div>
          {customer.phone && (
            <a
              href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0 hover:bg-success/20 transition-colors"
            >
              <AppIcon name="MessageCircle" size={14} className="text-success" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
