import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { RewardRedemption } from '@/hooks/useRewards';

interface RedemptionHistoryProps {
  redemptions: RewardRedemption[];
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    icon: 'Clock' as const,
    className: 'bg-warning/10 text-warning',
  },
  approved: {
    label: 'Aprovado',
    icon: 'CheckCircle2' as const,
    className: 'bg-primary/10 text-primary',
  },
  delivered: {
    label: 'Entregue',
    icon: 'Truck' as const,
    className: 'bg-success/10 text-success',
  },
  cancelled: {
    label: 'Cancelado',
    icon: 'XCircle' as const,
    className: 'bg-destructive/10 text-destructive',
  },
};

export function RedemptionHistory({ redemptions }: RedemptionHistoryProps) {
  if (redemptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AppIcon name="Star" size={48} className="mx-auto mb-3 opacity-30" />
        <p>Você ainda não resgatou nenhum prêmio.</p>
        <p className="text-sm">Complete tarefas para ganhar pontos!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {redemptions.map((redemption) => {
        const status = statusConfig[redemption.status];
        
        return (
          <div 
            key={redemption.id}
            className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name="Star" size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {redemption.product?.name || 'Produto removido'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(redemption.created_at), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 text-warning">
                  <AppIcon name="Star" size={14} />
                  <span className="font-semibold">{redemption.points_spent}</span>
                </div>
              </div>
              <Badge className={status.className}>
                <AppIcon name={status.icon} size={12} className="mr-1" />
                {status.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
