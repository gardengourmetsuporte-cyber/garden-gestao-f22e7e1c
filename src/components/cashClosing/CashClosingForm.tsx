 import { useState, useRef } from 'react';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { 
   Banknote, 
   CreditCard, 
   Smartphone, 
   Truck, 
   Upload, 
   Camera,
   AlertCircle,
   CheckCircle2,
   Loader2
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 import { useCashClosing } from '@/hooks/useCashClosing';
 import { CashClosingFormData, PAYMENT_METHODS } from '@/types/cashClosing';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 interface Props {
   onSuccess: () => void;
 }
 
 export function CashClosingForm({ onSuccess }: Props) {
   const { profile } = useAuth();
   const { uploadReceipt, createClosing, checkChecklistCompleted } = useCashClosing();
   const fileInputRef = useRef<HTMLInputElement>(null);
   
   const today = format(new Date(), 'yyyy-MM-dd');
   
   const [formData, setFormData] = useState<CashClosingFormData>({
     date: today,
     unit_name: 'Principal',
     cash_amount: 0,
     debit_amount: 0,
     credit_amount: 0,
     pix_amount: 0,
     delivery_amount: 0,
     cash_difference: 0,
     receipt_url: '',
     notes: '',
   });
   
   const [receiptFile, setReceiptFile] = useState<File | null>(null);
   const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [checklistStatus, setChecklistStatus] = useState<'checking' | 'completed' | 'incomplete' | null>(null);
 
   const total = 
     Number(formData.cash_amount) +
     Number(formData.debit_amount) +
     Number(formData.credit_amount) +
     Number(formData.pix_amount) +
     Number(formData.delivery_amount);
 
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       setReceiptFile(file);
       const reader = new FileReader();
       reader.onloadend = () => {
         setReceiptPreview(reader.result as string);
       };
       reader.readAsDataURL(file);
     }
   };
 
   const handleValueChange = (key: keyof CashClosingFormData, value: string) => {
     const numValue = value === '' ? 0 : parseFloat(value) || 0;
     setFormData(prev => ({ ...prev, [key]: numValue }));
   };
 
   const handleSubmit = async () => {
     // Check checklist first
     setChecklistStatus('checking');
     const checklistOk = await checkChecklistCompleted(formData.date);
     
     if (!checklistOk) {
       setChecklistStatus('incomplete');
       toast.error('Complete o checklist de fechamento antes de enviar!');
       return;
     }
     setChecklistStatus('completed');
 
     // Validate receipt
     if (!receiptFile) {
       toast.error('Anexe o comprovante do PDV!');
       return;
     }
 
     if (total <= 0) {
       toast.error('Informe pelo menos um valor de pagamento');
       return;
     }
 
     setIsSubmitting(true);
 
     try {
       // Upload receipt
       const receiptUrl = await uploadReceipt(receiptFile);
       if (!receiptUrl) {
         setIsSubmitting(false);
         return;
       }
 
       // Create closing
       const success = await createClosing({
         ...formData,
         receipt_url: receiptUrl,
       });
 
       if (success) {
         onSuccess();
       }
     } finally {
       setIsSubmitting(false);
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
 
   return (
     <div className="space-y-4 pb-6">
       {/* Header Info */}
       <Card className="card-unified">
         <CardContent className="p-4">
           <div className="flex justify-between items-center text-sm">
             <div>
               <span className="text-muted-foreground">Data:</span>
               <span className="ml-2 font-medium">
                 {format(new Date(formData.date), "dd 'de' MMMM", { locale: ptBR })}
               </span>
             </div>
             <div>
               <span className="text-muted-foreground">Responsável:</span>
               <span className="ml-2 font-medium">{profile?.full_name || 'Usuário'}</span>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Payment Values */}
       <Card className="card-unified">
         <CardHeader className="pb-2">
           <CardTitle className="text-base">Valores por Meio de Pagamento</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           {PAYMENT_METHODS.map(method => {
             const Icon = getIcon(method.icon);
             return (
               <div key={method.key} className="flex items-center gap-3">
                 <div 
                   className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ backgroundColor: `${method.color}20` }}
                 >
                   <Icon className="w-5 h-5" style={{ color: method.color }} />
                 </div>
                 <Label className="flex-1 text-sm font-medium">{method.label}</Label>
                 <div className="relative w-32">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                   <Input
                     type="number"
                     inputMode="decimal"
                     step="0.01"
                     min="0"
                     className="pl-10 text-right h-11"
                     value={formData[method.key as keyof CashClosingFormData] || ''}
                     onChange={(e) => handleValueChange(method.key as keyof CashClosingFormData, e.target.value)}
                     placeholder="0,00"
                   />
                 </div>
               </div>
             );
           })}
 
           {/* Total */}
           <div className="border-t pt-3 mt-3">
             <div className="flex items-center justify-between">
               <span className="font-semibold text-lg">Total</span>
               <span className="text-2xl font-bold text-primary">
                 R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </span>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Cash Difference (optional) */}
       <Card className="card-unified">
         <CardContent className="p-4">
           <div className="flex items-center gap-3">
             <Label className="flex-1 text-sm">Diferença de Caixa (se houver)</Label>
             <div className="relative w-32">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
               <Input
                 type="number"
                 inputMode="decimal"
                 step="0.01"
                 className="pl-10 text-right h-11"
                 value={formData.cash_difference || ''}
                 onChange={(e) => handleValueChange('cash_difference', e.target.value)}
                 placeholder="0,00"
               />
             </div>
           </div>
           {formData.cash_difference !== 0 && (
             <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" />
               {formData.cash_difference > 0 ? 'Sobra' : 'Falta'} no caixa será registrada
             </p>
           )}
         </CardContent>
       </Card>
 
       {/* Receipt Upload */}
       <Card className="card-unified">
         <CardHeader className="pb-2">
           <CardTitle className="text-base flex items-center gap-2">
             <Upload className="w-4 h-4" />
             Comprovante do PDV (Colibri)
             <span className="text-destructive">*</span>
           </CardTitle>
         </CardHeader>
         <CardContent>
           <input
             ref={fileInputRef}
             type="file"
             accept="image/*,.pdf"
             capture="environment"
             className="hidden"
             onChange={handleFileChange}
           />
           
           {receiptPreview ? (
             <div className="relative">
               <img 
                 src={receiptPreview} 
                 alt="Comprovante" 
                 className="w-full h-48 object-cover rounded-xl"
               />
               <Button
                 variant="secondary"
                 size="sm"
                 className="absolute bottom-2 right-2"
                 onClick={() => fileInputRef.current?.click()}
               >
                 Trocar
               </Button>
             </div>
           ) : (
             <Button
               variant="outline"
               className="w-full h-32 border-dashed flex flex-col gap-2"
               onClick={() => fileInputRef.current?.click()}
             >
               <Camera className="w-8 h-8 text-muted-foreground" />
               <span className="text-muted-foreground">Tirar foto ou anexar arquivo</span>
             </Button>
           )}
         </CardContent>
       </Card>
 
       {/* Notes */}
       <Card className="card-unified">
         <CardContent className="p-4">
           <Label className="text-sm mb-2 block">Observações (opcional)</Label>
           <Textarea
             placeholder="Alguma observação sobre o fechamento..."
             value={formData.notes}
             onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
             rows={2}
           />
         </CardContent>
       </Card>
 
       {/* Checklist Alert */}
       {checklistStatus === 'incomplete' && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertDescription>
             Complete o checklist de fechamento antes de enviar o caixa!
           </AlertDescription>
         </Alert>
       )}
 
       {/* Submit Button */}
       <Button
         className="w-full h-14 text-lg font-semibold"
         onClick={handleSubmit}
         disabled={isSubmitting || !receiptFile}
       >
         {isSubmitting ? (
           <>
             <Loader2 className="w-5 h-5 mr-2 animate-spin" />
             Enviando...
           </>
         ) : (
           <>
             <CheckCircle2 className="w-5 h-5 mr-2" />
             Enviar Fechamento
           </>
         )}
       </Button>
     </div>
   );
 }