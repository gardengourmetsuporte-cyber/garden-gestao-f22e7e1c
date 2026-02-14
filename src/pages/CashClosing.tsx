import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AppLayout } from '@/components/layout/AppLayout';
import { CashClosingForm } from '@/components/cashClosing/CashClosingForm';
import { CashClosingList } from '@/components/cashClosing/CashClosingList';
import { useCashClosing } from '@/hooks/useCashClosing';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CashClosing() {
  const { isAdmin, user } = useAuth();
  const { closings, isLoading, refetch } = useCashClosing();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysClosing = closings.find(c => c.date === today && c.user_id === user?.id);
  const pendingCount = closings.filter(c => c.status === 'pending').length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-36">
        {/* Header */}
        <div className="page-header-bar">
          <div className="page-header-content flex items-center gap-3">
            <div className="icon-glow icon-glow-md icon-glow-primary">
              <AppIcon name="Receipt" size={20} />
            </div>
            <div>
              <h1 className="page-title">Fechamento de Caixa</h1>
              <p className="page-subtitle">
                {isAdmin 
                  ? `${closings.length} registro${closings.length !== 1 ? 's' : ''}${pendingCount > 0 ? ` • ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}` : ''}`
                  : 'Envie seu fechamento diário'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : isAdmin ? (
            <CashClosingList 
              closings={closings} 
              isAdmin={isAdmin}
              onRefresh={refetch}
            />
          ) : (
            <EmployeeClosingView 
              todaysClosing={todaysClosing}
              onOpenForm={() => setIsFormOpen(true)}
            />
          )}
        </div>

        {/* FAB */}
        <Sheet open={isFormOpen} onOpenChange={(open) => {
          // Prevent accidental close — only allow programmatic close via onSuccess
          if (!open) return;
          setIsFormOpen(open);
        }}>
          <SheetTrigger asChild>
            <button className="fab">
              <AppIcon name="Plus" size={28} />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <SheetHeader className="flex flex-row items-center justify-between">
              <SheetTitle>Novo Fechamento de Caixa</SheetTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)} className="text-muted-foreground">
                Fechar
              </Button>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(90vh-80px)] pt-4">
              <CashClosingForm 
                onSuccess={() => {
                  setIsFormOpen(false);
                  refetch();
                }} 
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}

function EmployeeClosingView({ 
  todaysClosing, 
  onOpenForm 
}: { 
  todaysClosing: any; 
  onOpenForm: () => void;
}) {
  const today = new Date();
  const formattedDate = format(today, "EEEE, dd 'de' MMMM", { locale: ptBR });

  if (todaysClosing) {
    const statusConfig = {
      pending: {
        cardClass: 'card-command-warning',
        icon: () => <AppIcon name="Send" size={32} />,
        iconBg: 'bg-warning/10',
        iconColor: 'text-warning',
        title: 'Fechamento Enviado',
        subtitle: 'Aguardando validação do gestor',
        subtitleColor: 'text-warning',
      },
      approved: {
        cardClass: 'card-command-success',
        icon: () => <AppIcon name="CheckCircle2" size={32} />,
        iconBg: 'bg-success/10',
        iconColor: 'text-success',
        title: 'Fechamento Aprovado',
        subtitle: 'Validado com sucesso!',
        subtitleColor: 'text-success',
      },
      divergent: {
        cardClass: 'card-command-danger',
        icon: () => <AppIcon name="Receipt" size={32} />,
        iconBg: 'bg-destructive/10',
        iconColor: 'text-destructive',
        title: 'Fechamento com Divergência',
        subtitle: 'Verificar com o gestor',
        subtitleColor: 'text-destructive',
      },
    };

    const config = statusConfig[todaysClosing.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`${config.cardClass} p-6 text-center`}>
        <div className={`w-16 h-16 mx-auto rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
          <Icon />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{config.title}</h3>
        <p className="text-muted-foreground text-sm capitalize mb-1">{formattedDate}</p>
        <p className={`text-sm ${config.subtitleColor}`}>{config.subtitle}</p>
        {todaysClosing.status === 'divergent' && todaysClosing.validation_notes && (
          <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-lg">
            {todaysClosing.validation_notes}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card-command-info p-6 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <AppIcon name="Receipt" size={32} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Fechamento de Hoje</h3>
      <p className="text-muted-foreground text-sm capitalize mb-4">{formattedDate}</p>
      <p className="text-sm text-muted-foreground mb-4">
        Você ainda não enviou o fechamento de caixa de hoje.
      </p>
      <Button onClick={onOpenForm} className="w-full">
        <AppIcon name="Plus" size={16} className="mr-2" />
        Iniciar Fechamento
      </Button>
    </div>
  );
}
