 import { useState } from 'react';
 import { usePaymentSettings, PaymentMethodSetting } from '@/hooks/usePaymentSettings';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
 import { AppIcon } from '@/components/ui/app-icon';
 
 const ICON_MAP: Record<string, string> = {
   cash_amount: 'Banknote',
   debit_amount: 'CreditCard',
   credit_amount: 'CreditCard',
   pix_amount: 'Smartphone',
   meal_voucher_amount: 'Utensils',
   delivery_amount: 'Truck',
 };
 
 const COLORS: Record<string, string> = {
   cash_amount: '#22c55e',
   debit_amount: '#3b82f6',
   credit_amount: '#8b5cf6',
   pix_amount: '#06b6d4',
   meal_voucher_amount: '#f59e0b',
   delivery_amount: '#f97316',
 };
 
 const DAYS_OF_WEEK = [
   { value: 0, label: 'Domingo' },
   { value: 1, label: 'Segunda' },
   { value: 2, label: 'Terça' },
   { value: 3, label: 'Quarta' },
   { value: 4, label: 'Quinta' },
   { value: 5, label: 'Sexta' },
   { value: 6, label: 'Sábado' },
 ];
 
 interface PaymentCardProps {
   setting: PaymentMethodSetting;
   onSave: (id: string, updates: Partial<PaymentMethodSetting>) => Promise<boolean>;
 }
 
 function PaymentCard({ setting, onSave }: PaymentCardProps) {
   const [localSetting, setLocalSetting] = useState(setting);
   const [isSaving, setIsSaving] = useState(false);
   const iconName = ICON_MAP[setting.method_key] || 'Banknote';
   const color = COLORS[setting.method_key] || '#6366f1';
 
   const handleSave = async () => {
     setIsSaving(true);
     await onSave(setting.id, {
       settlement_type: localSetting.settlement_type,
       settlement_days: localSetting.settlement_days,
       settlement_day_of_week: localSetting.settlement_day_of_week,
       fee_percentage: localSetting.fee_percentage,
      create_transaction: localSetting.create_transaction,
     });
     setIsSaving(false);
   };
 
   const hasChanges = 
     localSetting.settlement_type !== setting.settlement_type ||
     localSetting.settlement_days !== setting.settlement_days ||
     localSetting.settlement_day_of_week !== setting.settlement_day_of_week ||
    localSetting.fee_percentage !== setting.fee_percentage ||
    localSetting.create_transaction !== setting.create_transaction;
 
   return (
     <Card className="relative overflow-hidden">
       <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
       <CardHeader className="pb-3">
         <div className="flex items-center gap-3">
           <div 
             className="w-10 h-10 rounded-full flex items-center justify-center"
             style={{ backgroundColor: `${color}20` }}
           >
             <AppIcon name={iconName} size={20} style={{ color }} />
           </div>
           <CardTitle className="text-base">{setting.method_name}</CardTitle>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         <div className="grid grid-cols-2 gap-3">
           <div className="space-y-2">
             <Label className="text-xs text-muted-foreground">Quando cai</Label>
             <Select
               value={localSetting.settlement_type}
               onValueChange={(v) => setLocalSetting(prev => ({
                 ...prev,
                 settlement_type: v as PaymentMethodSetting['settlement_type'],
                 settlement_days: v === 'immediate' ? 0 : prev.settlement_days,
                 settlement_day_of_week: v === 'weekly_day' ? 3 : null,
               }))}
             >
               <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="immediate">Na hora</SelectItem>
                 <SelectItem value="business_days">Dias úteis</SelectItem>
                 <SelectItem value="weekly_day">Dia da semana</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           {localSetting.settlement_type === 'business_days' && (
             <div className="space-y-2">
               <Label className="text-xs text-muted-foreground">Dias úteis</Label>
               <Input type="number" min={0} max={60} value={localSetting.settlement_days}
                 onChange={(e) => setLocalSetting(prev => ({ ...prev, settlement_days: parseInt(e.target.value) || 0 }))}
                 className="h-9" />
             </div>
           )}
 
           {localSetting.settlement_type === 'weekly_day' && (
             <div className="space-y-2">
               <Label className="text-xs text-muted-foreground">Dia</Label>
               <Select value={String(localSetting.settlement_day_of_week ?? 3)}
                 onValueChange={(v) => setLocalSetting(prev => ({ ...prev, settlement_day_of_week: parseInt(v) }))}>
                 <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   {DAYS_OF_WEEK.map(day => (
                     <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}
         </div>
 
         <div className="space-y-2">
           <Label className="text-xs text-muted-foreground">Taxa de desconto (%)</Label>
           <div className="flex items-center gap-2">
             <Input type="number" step="0.01" min={0} max={100} value={localSetting.fee_percentage}
               onChange={(e) => setLocalSetting(prev => ({ ...prev, fee_percentage: parseFloat(e.target.value) || 0 }))}
               className="h-9" />
             <span className="text-sm text-muted-foreground">%</span>
           </div>
           {localSetting.fee_percentage > 0 && (
             <p className="text-xs text-muted-foreground">
               Ex: R$ 100,00 → R$ {(100 - (100 * localSetting.fee_percentage / 100)).toFixed(2)} líquido
             </p>
           )}
         </div>
 
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-0.5">
            <Label className="text-sm">Lançar no financeiro</Label>
            <p className="text-xs text-muted-foreground">Criar transação ao aprovar fechamento</p>
          </div>
          <Switch checked={localSetting.create_transaction}
            onCheckedChange={(checked) => setLocalSetting(prev => ({ ...prev, create_transaction: checked }))} />
        </div>

         {hasChanges && (
           <Button onClick={handleSave} disabled={isSaving} className="w-full" size="sm">
             {isSaving ? <AppIcon name="progress_activity" size={16} className="animate-spin mr-2" /> : <AppIcon name="Save" size={16} className="mr-2" />}
             Salvar
           </Button>
         )}
       </CardContent>
     </Card>
   );
 }
 
 export function PaymentMethodSettings() {
   const { settings, isLoading, updateSetting } = usePaymentSettings();
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <AppIcon name="progress_activity" size={32} className="animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   return (
     <div className="space-y-4">
       <div className="mb-4">
         <h2 className="text-lg font-semibold">Meios de Pagamento</h2>
         <p className="text-sm text-muted-foreground">
           Configure quando cada meio de pagamento cai na conta e as taxas aplicadas
         </p>
       </div>
 
       <div className="grid gap-4 sm:grid-cols-2">
         {settings.map(setting => (
           <PaymentCard key={setting.id} setting={setting} onSave={updateSetting} />
         ))}
       </div>
     </div>
   );
 }
