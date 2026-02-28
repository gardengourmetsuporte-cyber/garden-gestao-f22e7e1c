import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CashClosing } from '@/types/cashClosing';
import { CashClosingDetail } from './CashClosingDetail';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppIcon } from '@/components/ui/app-icon';
 
 interface Props {
   closings: CashClosing[];
   isAdmin: boolean;
   onRefresh: () => void;
 }
 
 export function CashClosingList({ closings, isAdmin, onRefresh }: Props) {
   const [selectedClosing, setSelectedClosing] = useState<CashClosing | null>(null);
 
   const getStatusConfig = (status: string) => {
     switch (status) {
       case 'approved':
         return { 
           icon: 'CheckCircle2', 
           label: 'Aprovado', 
           color: 'bg-success/10 text-success border-success/20' 
         };
       case 'divergent':
         return { 
           icon: 'AlertTriangle', 
           label: 'Divergente', 
           color: 'bg-destructive/10 text-destructive border-destructive/20' 
         };
       default:
         return { 
           icon: 'Clock', 
           label: 'Pendente', 
           color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
         };
     }
   };
 
   // Group closings by date
   const groupedByDate = closings.reduce((acc, closing) => {
     const date = closing.date;
     if (!acc[date]) acc[date] = [];
     acc[date].push(closing);
     return acc;
   }, {} as Record<string, CashClosing[]>);
 
   if (closings.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
           <AppIcon name="Clock" className="w-8 h-8 text-muted-foreground" />
         </div>
         <h3 className="font-medium text-lg mb-1">Nenhum fechamento</h3>
         <p className="text-muted-foreground text-sm">
           {isAdmin 
             ? 'Nenhum fechamento foi enviado ainda'
             : 'Você ainda não enviou nenhum fechamento'}
         </p>
       </div>
     );
   }
 
   return (
     <>
       <div className="space-y-4">
         {Object.entries(groupedByDate).map(([date, dateClosings]) => (
           <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                {format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h3>
             <div className="space-y-2">
               {dateClosings.map(closing => {
                 const status = getStatusConfig(closing.status);
                 
                 return (
                   <Card 
                     key={closing.id}
                     className="card-unified-interactive cursor-pointer"
                     onClick={() => setSelectedClosing(closing)}
                   >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <AppIcon name="User" className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium truncate">
                                {closing.profile?.full_name || 'Usuário'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{closing.unit_name}</span>
                              {/* Valores só aparecem para admin */}
                              {isAdmin && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-foreground">
                                    R$ {closing.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <Badge 
                            variant="outline" 
                            className={`${status.color} shrink-0`}
                          >
                            <AppIcon name={status.icon} className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          
                          <AppIcon name="ChevronRight" className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                   </Card>
                 );
               })}
             </div>
           </div>
         ))}
       </div>
 
       <Sheet open={!!selectedClosing} onOpenChange={() => setSelectedClosing(null)}>
         <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
           <SheetHeader>
             <SheetTitle>Detalhes do Fechamento</SheetTitle>
           </SheetHeader>
           {selectedClosing && (
             <CashClosingDetail 
               closing={selectedClosing} 
               isAdmin={isAdmin}
               onClose={() => {
                 setSelectedClosing(null);
                 onRefresh();
               }}
             />
           )}
         </SheetContent>
       </Sheet>
     </>
   );
 }