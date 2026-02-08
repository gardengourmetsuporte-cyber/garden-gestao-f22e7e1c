import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
   Banknote, 
   CreditCard, 
   Smartphone, 
   Truck,
   Clock,
   CheckCircle2,
   AlertTriangle,
   User,
   Calendar,
   Building2,
   FileImage,
   MessageSquare,
   Loader2,
  Trash2,
  Receipt
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { ScrollArea } from '@/components/ui/scroll-area';
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
 import { CashClosing, PAYMENT_METHODS } from '@/types/cashClosing';
 import { useCashClosing } from '@/hooks/useCashClosing';
 import { toast } from 'sonner';
 
 interface Props {
   closing: CashClosing;
   isAdmin: boolean;
   onClose: () => void;
 }
 
 export function CashClosingDetail({ closing, isAdmin, onClose }: Props) {
   const { approveClosing, markDivergent, deleteClosing } = useCashClosing();
   const [isApproving, setIsApproving] = useState(false);
   const [isMarkingDivergent, setIsMarkingDivergent] = useState(false);
   const [showDivergentDialog, setShowDivergentDialog] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const [divergentNotes, setDivergentNotes] = useState('');
   const [showReceipt, setShowReceipt] = useState(false);
 
   const getStatusConfig = (status: string) => {
     switch (status) {
       case 'approved':
         return { 
           icon: CheckCircle2, 
           label: 'Aprovado', 
           color: 'bg-success/10 text-success border-success/20' 
         };
       case 'divergent':
         return { 
           icon: AlertTriangle, 
           label: 'Divergente', 
           color: 'bg-destructive/10 text-destructive border-destructive/20' 
         };
       default:
         return { 
           icon: Clock, 
           label: 'Pendente', 
           color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
         };
     }
   };
 
   const getIcon = (iconName: string) => {
     switch (iconName) {
       case 'Banknote': return Banknote;
       case 'CreditCard': return CreditCard;
       case 'Smartphone': return Smartphone;
       case 'Truck': return Truck;
       default: return Banknote;
     }
   };
 
   const handleApprove = async () => {
     setIsApproving(true);
     const success = await approveClosing(closing.id);
     setIsApproving(false);
     if (success) onClose();
   };
 
   const handleMarkDivergent = async () => {
     if (!divergentNotes.trim()) {
       toast.error('Informe o motivo da divergência');
       return;
     }
     setIsMarkingDivergent(true);
     const success = await markDivergent(closing.id, divergentNotes);
     setIsMarkingDivergent(false);
     setShowDivergentDialog(false);
     if (success) onClose();
   };
 
   const handleDelete = async () => {
     const success = await deleteClosing(closing.id);
     setShowDeleteDialog(false);
     if (success) onClose();
   };
 
   const status = getStatusConfig(closing.status);
   const StatusIcon = status.icon;
 
   return (
     <ScrollArea className="h-[calc(90vh-80px)] pr-4">
       <div className="space-y-4 pb-6 pt-4">
         {/* Status Badge */}
         <div className="flex items-center justify-between">
           <Badge 
             variant="outline" 
             className={`${status.color} text-sm px-3 py-1`}
           >
             <StatusIcon className="w-4 h-4 mr-1" />
             {status.label}
           </Badge>
           
           {isAdmin && (
             <Button
               variant="ghost"
               size="icon"
               className="text-destructive"
               onClick={() => setShowDeleteDialog(true)}
             >
               <Trash2 className="w-5 h-5" />
             </Button>
           )}
         </div>
 
         {/* Info Card */}
         <Card className="card-unified">
           <CardContent className="p-4 space-y-3">
             <div className="flex items-center gap-3">
               <User className="w-5 h-5 text-muted-foreground" />
               <div>
                 <p className="text-sm text-muted-foreground">Responsável</p>
                 <p className="font-medium">{closing.profile?.full_name || 'Usuário'}</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <Calendar className="w-5 h-5 text-muted-foreground" />
               <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(parseISO(closing.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
             </div>
             <div className="flex items-center gap-3">
               <Building2 className="w-5 h-5 text-muted-foreground" />
               <div>
                 <p className="text-sm text-muted-foreground">Unidade</p>
                 <p className="font-medium">{closing.unit_name}</p>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card className="card-unified">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold mb-2">Valores por Meio de Pagamento</h3>
            
            {PAYMENT_METHODS.map(method => {
              const Icon = getIcon(method.icon);
              const value = closing[method.key as keyof CashClosing] as number;
              if (value === 0) return null;
              
              return (
                <div key={method.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${method.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: method.color }} />
                    </div>
                    <span className="text-sm">{method.label}</span>
                  </div>
                  <span className="font-medium">
                    R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}

            {/* Total real de vendas (sem descontar despesas) */}
            {(() => {
              const rawTotal = closing.cash_amount + closing.debit_amount + closing.credit_amount + 
                closing.pix_amount + closing.meal_voucher_amount + closing.delivery_amount;
              return (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total em Vendas</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {rawTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })()}

            {closing.cash_difference !== 0 && (
              <div className="flex items-center justify-between text-amber-600 text-sm">
                <span>Diferença de caixa</span>
                <span className="font-medium">
                  R$ {closing.cash_difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
 
        {/* Expenses */}
        {closing.expenses && closing.expenses.length > 0 && (
          <Card className="card-unified">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Gastos do Dia</h3>
              </div>
              
              {closing.expenses.map((expense, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{expense.description}</span>
                  <span className="font-medium text-destructive">
                    - R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}

              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total de gastos</span>
                  <span className="font-medium text-destructive">
                    - R$ {closing.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

         {/* Receipt */}
         <Card className="card-unified">
           <CardContent className="p-4">
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                 <FileImage className="w-5 h-5 text-muted-foreground" />
                 <span className="font-medium">Comprovante PDV</span>
               </div>
              {closing.receipt_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceipt(!showReceipt)}
                >
                  {showReceipt ? 'Ocultar' : 'Visualizar'}
                </Button>
              )}
             </div>
             
            {!closing.receipt_url && (
              <p className="text-sm text-muted-foreground">Nenhum comprovante anexado</p>
            )}
            
            {showReceipt && closing.receipt_url && (
               <img 
                 src={closing.receipt_url} 
                 alt="Comprovante" 
                 className="w-full rounded-xl border"
               />
             )}
           </CardContent>
         </Card>
 
         {/* Notes */}
         {closing.notes && (
           <Card className="card-unified">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 mb-2">
                 <MessageSquare className="w-5 h-5 text-muted-foreground" />
                 <span className="font-medium">Observações</span>
               </div>
               <p className="text-sm text-muted-foreground">{closing.notes}</p>
             </CardContent>
           </Card>
         )}
 
         {/* Validation Notes (if divergent) */}
         {closing.status === 'divergent' && closing.validation_notes && (
           <Card className="card-unified border-destructive/50">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 mb-2">
                 <AlertTriangle className="w-5 h-5 text-destructive" />
                 <span className="font-medium text-destructive">Motivo da Divergência</span>
               </div>
               <p className="text-sm">{closing.validation_notes}</p>
               {closing.validator_profile && (
                 <p className="text-xs text-muted-foreground mt-2">
                   Por {closing.validator_profile.full_name} em{' '}
                   {closing.validated_at && format(new Date(closing.validated_at), "dd/MM/yyyy 'às' HH:mm")}
                 </p>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Approved info */}
         {closing.status === 'approved' && closing.validator_profile && (
           <Card className="card-unified border-success/50">
             <CardContent className="p-4">
               <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5 text-success" />
                 <div>
                   <span className="font-medium text-success">Aprovado</span>
                   <p className="text-xs text-muted-foreground">
                     Por {closing.validator_profile.full_name} em{' '}
                     {closing.validated_at && format(new Date(closing.validated_at), "dd/MM/yyyy 'às' HH:mm")}
                   </p>
                 </div>
               </div>
               {closing.financial_integrated && (
                 <p className="text-xs text-success mt-2">
                   ✓ Integrado ao módulo financeiro
                 </p>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Admin Actions */}
         {isAdmin && closing.status === 'pending' && (
           <div className="flex gap-3 pt-2">
             <Button
               variant="outline"
               className="flex-1 h-12 border-destructive text-destructive hover:bg-destructive/10"
               onClick={() => setShowDivergentDialog(true)}
             >
               <AlertTriangle className="w-4 h-4 mr-2" />
               Divergente
             </Button>
             <Button
               className="flex-1 h-12 bg-success hover:bg-success/90"
               onClick={handleApprove}
               disabled={isApproving}
             >
               {isApproving ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               ) : (
                 <CheckCircle2 className="w-4 h-4 mr-2" />
               )}
               Aprovar
             </Button>
           </div>
         )}
       </div>
 
       {/* Divergent Dialog */}
       <AlertDialog open={showDivergentDialog} onOpenChange={setShowDivergentDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Marcar como Divergente</AlertDialogTitle>
             <AlertDialogDescription>
               Informe o motivo da divergência. Esta informação será visível para o funcionário.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <div className="py-4">
             <Label>Motivo da divergência *</Label>
             <Textarea
               placeholder="Descreva o problema encontrado..."
               value={divergentNotes}
               onChange={(e) => setDivergentNotes(e.target.value)}
               rows={3}
               className="mt-2"
             />
           </div>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleMarkDivergent}
               disabled={isMarkingDivergent || !divergentNotes.trim()}
               className="bg-destructive hover:bg-destructive/90"
             >
               {isMarkingDivergent ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               ) : null}
               Confirmar Divergência
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
 
       {/* Delete Dialog */}
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Excluir Fechamento</AlertDialogTitle>
             <AlertDialogDescription>
               Tem certeza que deseja excluir este fechamento? Esta ação não pode ser desfeita.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDelete}
               className="bg-destructive hover:bg-destructive/90"
             >
               Excluir
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </ScrollArea>
   );
 }