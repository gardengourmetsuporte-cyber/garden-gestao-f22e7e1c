import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Obligation, getCategoryConfig, getObligationStatus } from '@/hooks/useObligations';

interface ObligationCardProps {
  obligation: Obligation;
  onClick: () => void;
}

export function ObligationCard({ obligation, onClick }: ObligationCardProps) {
  const cat = getCategoryConfig(obligation.category);
  const status = getObligationStatus(obligation);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-2xl border border-border/30 p-4 flex items-start gap-3 relative overflow-hidden hover:bg-accent/30 transition-colors"
    >
      {/* Color bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ backgroundColor: cat.color }} />

      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '20' }}>
        <AppIcon name="ShieldCheck" size={20} style={{ color: cat.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm text-foreground truncate">{obligation.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{cat.label}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: status.color + '18', color: status.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            {status.label}
          </div>
          {obligation.expiry_date && (
            <span className="text-[11px] text-muted-foreground">
              Vence: {format(new Date(obligation.expiry_date + 'T12:00:00'), "dd/MM/yyyy")}
            </span>
          )}
          {obligation.document_url && (
            <AppIcon name="Paperclip" size={12} className="text-muted-foreground" />
          )}
        </div>
      </div>

      <AppIcon name="ChevronRight" size={16} className="text-muted-foreground/50 mt-3 shrink-0" />
    </button>
  );
}
