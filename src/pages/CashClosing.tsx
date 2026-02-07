import { useState } from 'react';
import { Plus, Receipt, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CashClosingForm } from '@/components/cashClosing/CashClosingForm';
import { CashClosingList } from '@/components/cashClosing/CashClosingList';
import { useCashClosing } from '@/hooks/useCashClosing';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CashClosing() {
  const { isAdmin, user } = useAuth();
  const { closings, isLoading, refetch } = useCashClosing();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const navigate = useNavigate();

  // Para funcionários: verificar se já enviou fechamento hoje
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysClosing = closings.find(c => c.date === today && c.user_id === user?.id);
  
  // Contagem de pendentes (para admin)
  const pendingCount = closings.filter(c => c.status === 'pending').length;

  return (
    <AppLayout>
      <div className="p-4 space-y-4 pb-24">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Fechamento de Caixa</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin 
                  ? `${closings.length} registro${closings.length !== 1 ? 's' : ''}${pendingCount > 0 ? ` • ${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}` : ''}`
                  : 'Envie seu fechamento diário'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : isAdmin ? (
          // Admin: vê lista completa unificada
          <CashClosingList 
            closings={closings} 
            isAdmin={isAdmin}
            onRefresh={refetch}
          />
        ) : (
          // Funcionário: vê status do dia ou formulário
          <EmployeeClosingView 
            todaysClosing={todaysClosing}
            onOpenForm={() => setIsFormOpen(true)}
          />
        )}

        {/* FAB for new closing - apenas para funcionários ou admin */}
        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-20 right-4 h-14 w-14 rounded-2xl 
                bg-gradient-to-br from-primary to-primary/80 
                shadow-lg shadow-primary/30 z-50
                hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
            </Button>
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

// Componente para visão do funcionário
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
    // Já enviou - mostra status simples sem valores
    return (
      <div className="space-y-4">
        <Card className="card-unified">
          <CardContent className="p-6 text-center">
            {todaysClosing.status === 'pending' ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Fechamento Enviado
                </h3>
                <p className="text-muted-foreground text-sm capitalize mb-1">
                  {formattedDate}
                </p>
                <p className="text-sm text-amber-600">
                  Aguardando validação do gestor
                </p>
              </>
            ) : todaysClosing.status === 'approved' ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Fechamento Aprovado
                </h3>
                <p className="text-muted-foreground text-sm capitalize mb-1">
                  {formattedDate}
                </p>
                <p className="text-sm text-success">
                  Validado com sucesso!
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Fechamento com Divergência
                </h3>
                <p className="text-muted-foreground text-sm capitalize mb-1">
                  {formattedDate}
                </p>
                <p className="text-sm text-destructive">
                  Verificar com o gestor
                </p>
                {todaysClosing.validation_notes && (
                  <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-lg">
                    {todaysClosing.validation_notes}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Não enviou ainda - mostra card para iniciar
  return (
    <div className="space-y-4">
      <Card className="card-unified">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Fechamento de Hoje
          </h3>
          <p className="text-muted-foreground text-sm capitalize mb-4">
            {formattedDate}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Você ainda não enviou o fechamento de caixa de hoje.
          </p>
          <Button onClick={onOpenForm} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Iniciar Fechamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
