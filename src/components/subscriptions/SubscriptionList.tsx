import { Subscription } from '@/hooks/useSubscriptions';
import { SubscriptionCard } from './SubscriptionCard';
import { Package } from 'lucide-react';

interface Props {
  items: Subscription[];
  onEdit: (item: Subscription) => void;
  onPause: (item: Subscription) => void;
  onCancel: (item: Subscription) => void;
  emptyMessage?: string;
}

export function SubscriptionList({ items, onEdit, onPause, onCancel, emptyMessage = 'Nenhum item encontrado' }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => (
        <SubscriptionCard key={item.id} item={item} onEdit={onEdit} onPause={onPause} onCancel={onCancel} />
      ))}
    </div>
  );
}
