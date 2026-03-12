import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface OrderTrackerProps {
  orderId: string;
  unitId: string;
}

const STEPS = [
  { key: 'pending', label: 'Pedido Recebido', icon: 'ClipboardList' },
  { key: 'preparing', label: 'Preparando', icon: 'ChefHat' },
  { key: 'ready', label: 'Pronto', icon: 'Check' },
  { key: 'delivered', label: 'Entregue', icon: 'Package' },
] as const;

export function OrderTracker({ orderId, unitId }: OrderTrackerProps) {
  const [status, setStatus] = useState<string>('pending');
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('tablet_orders')
        .select('status, order_number')
        .eq('id', orderId)
        .single();
      if (data) {
        setStatus(data.status || 'pending');
        setOrderNumber(data.order_number);
      }
    };
    fetchOrder();

    const channel = supabase
      .channel(`order-tracker-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tablet_orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        if (payload.new?.status) {
          setStatus(payload.new.status as string);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const currentIndex = STEPS.findIndex(s => s.key === status);

  return (
    <div className="px-6 py-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <AppIcon name="ShoppingBag" size={28} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold">Acompanhe seu Pedido</h2>
        {orderNumber && (
          <p className="text-2xl font-bold text-primary mt-1">#{orderNumber}</p>
        )}
      </div>

      <div className="space-y-0">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.key} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all',
                  isCompleted && 'bg-emerald-500 text-white',
                  isCurrent && 'bg-primary text-primary-foreground animate-pulse',
                  isPending && 'bg-muted text-muted-foreground',
                )}>
                  <AppIcon name={isCompleted ? 'Check' : step.icon} size={18} />
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'w-0.5 h-12 transition-all',
                    isCompleted ? 'bg-emerald-500' : 'bg-muted',
                  )} />
                )}
              </div>

              {/* Label */}
              <div className="pt-2.5">
                <p className={cn(
                  'text-sm font-medium',
                  isCurrent && 'text-primary font-bold',
                  isPending && 'text-muted-foreground',
                )}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">Em andamento...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
