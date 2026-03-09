import { AppIcon } from '@/components/ui/app-icon';
import { format } from 'date-fns';
import { getCategoryConfig, getObligationStatus, Obligation } from '@/hooks/useObligations';
import { cn } from '@/lib/utils';

interface Props {
  template: { category: string; title: string; description: string; icon: string; defaultAlertDays: number };
  obligation?: Obligation | null;
  onClick: () => void;
}

export function ObligationChecklistCard({ template, obligation, onClick }: Props) {
  const cat = getCategoryConfig(template.category);
  const isCompleted = !!obligation?.expiry_date;
  const status = obligation ? getObligationStatus(obligation) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-card rounded-2xl border p-4 flex items-start gap-3 relative overflow-hidden transition-all',
        isCompleted ? 'border-border/30' : 'border-dashed border-border/50'
      )}
    >
      {/* Color bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ backgroundColor: isCompleted ? cat.color : cat.color + '40' }}
      />

      {/* Check circle */}
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
        )}
        style={{ backgroundColor: isCompleted ? cat.color + '20' : 'hsl(var(--secondary))' }}
      >
        {isCompleted ? (
          <AppIcon name="CheckCircle2" size={22} style={{ color: cat.color }} />
        ) : (
          <AppIcon name={template.icon as any} size={20} className="text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'font-semibold text-sm truncate',
          isCompleted ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {template.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{template.description}</p>

        {isCompleted && status && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: status.color + '18', color: status.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
              {status.label}
            </div>
            {obligation?.expiry_date && (
              <span className="text-[11px] text-muted-foreground">
                Vence: {format(new Date(obligation.expiry_date + 'T12:00:00'), 'dd/MM/yyyy')}
              </span>
            )}
            {obligation?.document_url && (
              <AppIcon name="Paperclip" size={12} className="text-muted-foreground" />
            )}
          </div>
        )}

        {!isCompleted && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[11px] text-muted-foreground/70 italic">Toque para preencher</span>
          </div>
        )}
      </div>

      <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/50 mt-3 shrink-0" />
    </button>
  );
}
