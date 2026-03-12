import { AppIcon } from '@/components/ui/app-icon';
import type { PendingItem } from '@/hooks/useTeamDashboard';

interface Props {
  items: PendingItem[];
  total: number;
}

export function TeamPendingItems({ items, total }: Props) {
  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-destructive/15 flex items-center justify-center">
          <AppIcon name="pending_actions" size={14} className="text-destructive" />
        </div>
        <h3 className="text-sm font-semibold text-foreground flex-1">Pendências do dia</h3>
        {total > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive tabular-nums">
            {total}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-1.5">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <AppIcon name="check_circle" size={20} className="text-emerald-400" />
          </div>
          <p className="text-xs text-muted-foreground">Tudo concluído hoje!</p>
        </div>
      ) : (
        <ul className="space-y-1 max-h-[240px] overflow-y-auto scrollbar-none">
          {items.map(item => (
            <li key={item.item_id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl hover:bg-muted/20 transition-colors">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.sector_color }}
              />
              <span className="text-xs text-foreground truncate flex-1">{item.item_name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{item.sector_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
