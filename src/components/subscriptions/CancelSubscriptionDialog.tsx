import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Subscription } from '@/hooks/useSubscriptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Subscription | null;
  onConfirm: () => void;
}

export function CancelSubscriptionDialog({ open, onOpenChange, item, onConfirm }: Props) {
  if (!item) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar "{item.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação marcará o item como cancelado. Ele não entrará mais nos cálculos de gastos recorrentes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirmar cancelamento
          </AlertDialogAction>
          {item.management_url && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.open(item.management_url!, '_blank');
                onOpenChange(false);
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ir para site oficial
            </Button>
          )}
          <AlertDialogCancel>Voltar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
