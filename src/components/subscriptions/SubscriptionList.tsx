import { Subscription } from '@/hooks/useSubscriptions';
import { SubscriptionCard } from './SubscriptionCard';
import { Package } from 'lucide-react';

interface Props {
  items: Subscription[];
  onEdit: (item: Subscription) => void;
  onPause: (item: Subscription) => void;
  onCancel: (item: Subscription) => void;
  onDelete?: (item: Subscription) => void;
  onReactivate?: (item: Subscription) => void;
  emptyMessage?: string;
}

export function SubscriptionList({ items, onEdit, onPause, onCancel, onDelete, onReactivate, emptyMessage = 'Nenhum item encontrado' }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Package className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <SubscriptionCard key={item.id} item={item} onEdit={onEdit} onPause={onPause} onCancel={onCancel} onDelete={onDelete} onReactivate={onReactivate} />
      ))}
    </div>
  );
}
