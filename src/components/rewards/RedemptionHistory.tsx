import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Star, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RewardRedemption } from '@/hooks/useRewards';

interface RedemptionHistoryProps {
  redemptions: RewardRedemption[];
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  approved: {
    label: 'Aprovado',
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  delivered: {
    label: 'Entregue',
    icon: Truck,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function RedemptionHistory({ redemptions }: RedemptionHistoryProps) {
  if (redemptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Você ainda não resgatou nenhum prêmio.</p>
        <p className="text-sm">Complete tarefas para ganhar pontos!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {redemptions.map((redemption) => {
        const status = statusConfig[redemption.status];
        const StatusIcon = status.icon;
        
        return (
          <div 
            key={redemption.id}
            className="card-base flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-primary" />
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
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-semibold">{redemption.points_spent}</span>
                </div>
              </div>
              <Badge className={status.className}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
