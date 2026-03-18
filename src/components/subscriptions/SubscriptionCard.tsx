import { Pause, Play, Trash2, ExternalLink, PenSquare, RotateCcw, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Subscription, getCategoryInfo, getMonthlyPrice, getAlertLevel, AlertLevel } from '@/hooks/useSubscriptions';
import { cn } from '@/lib/utils';

interface Props {
  item: Subscription;
  onEdit: (item: Subscription) => void;
  onPause: (item: Subscription) => void;
  onCancel: (item: Subscription) => void;
  onDelete?: (item: Subscription) => void;
  onReactivate?: (item: Subscription) => void;
}

const cycleLabels: Record<string, string> = { mensal: '/mês', anual: '/ano', semanal: '/sem' };

const alertBorder: Record<AlertLevel, string> = {
  overdue: 'ring-1 ring-destructive/40',
  today: 'ring-1 ring-destructive/30',
  tomorrow: 'ring-1 ring-orange-500/30',
  soon: 'ring-1 ring-yellow-500/20',
};

export function SubscriptionCard({ item, onEdit, onPause, onCancel, onDelete, onReactivate }: Props) {
  const cat = getCategoryInfo(item.category);
  const isCanceled = item.status === 'cancelado';
  const isPaused = item.status === 'pausado';
  const alert = item.next_payment_date ? getAlertLevel(item.next_payment_date) : null;
  const monthlyVal = getMonthlyPrice(item.price, item.billing_cycle);

  return (
    <div
      className={cn(
        'bg-secondary/40 rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]',
        isCanceled && 'opacity-50',
        alert && !isCanceled && !isPaused && alertBorder[alert]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm truncate">{item.name}</h4>
          <Badge
            className="mt-1 text-[10px] border-0"
            style={{ backgroundColor: cat.color + '22', color: cat.color }}
          >
            {cat.label}
          </Badge>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-lg font-bold">R$ {Number(item.price).toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">{cycleLabels[item.billing_cycle] || '/mês'}</p>
          {item.billing_cycle !== 'mensal' && (
            <p className="text-[10px] text-muted-foreground/60">≈ R$ {monthlyVal.toFixed(2)}/mês</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        {item.next_payment_date && (
          <span>Próx: {new Date(item.next_payment_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
        )}
        <span className="ml-auto">
          {isPaused && <Badge variant="secondary" className="text-[10px]">Pausado</Badge>}
          {isCanceled && <Badge variant="destructive" className="text-[10px] border-0">Cancelado</Badge>}
          {!isPaused && !isCanceled && <Badge className="text-[10px] bg-primary/20 text-primary border-0">Ativo</Badge>}
        </span>
      </div>

      <div className="flex items-center gap-1 -ml-1">
        {!isCanceled && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => onEdit(item)}>
            <PenSquare className="w-3.5 h-3.5" />
          </Button>
        )}
        {!isCanceled && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => onPause(item)}>
            {isPaused ? <Play className="w-3.5 h-3.5 text-primary" /> : <Pause className="w-3.5 h-3.5 text-yellow-400" />}
          </Button>
        )}
        {!isCanceled && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => onCancel(item)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
        {isCanceled && onReactivate && (
          <Button variant="ghost" size="sm" className="h-8 rounded-xl text-primary gap-1 text-xs" onClick={() => onReactivate(item)}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reativar
          </Button>
        )}
        {isCanceled && onDelete && (
          <Button variant="ghost" size="sm" className="h-8 rounded-xl text-destructive gap-1 text-xs" onClick={() => onDelete(item)}>
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </Button>
        )}
        {item.management_url && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl ml-auto"
            onClick={() => window.open(item.management_url!, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
