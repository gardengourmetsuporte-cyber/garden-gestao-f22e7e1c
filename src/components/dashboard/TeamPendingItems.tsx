import { AppIcon } from '@/components/ui/app-icon';
import type { PendingItem } from '@/hooks/useTeamDashboard';

interface Props {
  items: PendingItem[];
  total: number;
}

export function TeamPendingItems({ items, total }: Props) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AppIcon name="pending_actions" size={16} className="text-destructive" />
          <h3 className="text-sm font-semibold text-foreground">Pendências do dia</h3>
        </div>
        {total > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
            {total}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-1">
          <AppIcon name="check_circle" size={28} className="text-primary" />
          <p className="text-xs text-muted-foreground">Tudo concluído hoje!</p>
        </div>
      ) : (
        <ul className="space-y-1.5 max-h-[240px] overflow-y-auto">
          {items.map(item => (
            <li key={item.item_id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors">
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
