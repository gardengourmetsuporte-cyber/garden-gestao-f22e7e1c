import { useState } from 'react';
import { Plus, Receipt, CheckCircle2, Send } from 'lucide-react';
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
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="page-header-bar">
          <div className="page-header-content flex items-center gap-3">
            <div className="page-header-icon bg-primary/10">
              <Receipt className="w-5 h-5 text-primary" />
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
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetTrigger asChild>
            <button className="fab">
              <Plus className="w-7 h-7" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Novo Fechamento de Caixa</SheetTitle>
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
        icon: Send,
        iconBg: 'bg-warning/10',
        iconColor: 'text-warning',
        title: 'Fechamento Enviado',
        subtitle: 'Aguardando validação do gestor',
        subtitleColor: 'text-warning',
      },
      approved: {
        cardClass: 'card-command-success',
        icon: CheckCircle2,
        iconBg: 'bg-success/10',
        iconColor: 'text-success',
        title: 'Fechamento Aprovado',
        subtitle: 'Validado com sucesso!',
        subtitleColor: 'text-success',
      },
      divergent: {
        cardClass: 'card-command-danger',
        icon: Receipt,
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
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
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
        <Receipt className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Fechamento de Hoje</h3>
      <p className="text-muted-foreground text-sm capitalize mb-4">{formattedDate}</p>
      <p className="text-sm text-muted-foreground mb-4">
        Você ainda não enviou o fechamento de caixa de hoje.
      </p>
      <Button onClick={onOpenForm} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Iniciar Fechamento
      </Button>
    </div>
  );
}
