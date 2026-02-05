 import { useState } from 'react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Badge } from '@/components/ui/badge';
 import { FinanceCategory, FinanceAccount } from '@/types/finance';
 import { getLucideIcon } from '@/lib/icons';
 import { X, Flag, Landmark, Tag } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 export interface TransactionFiltersState {
   status: 'all' | 'paid' | 'pending';
   categoryId: string | null;
   accountId: string | null;
 }
 
 interface TransactionFiltersProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   filters: TransactionFiltersState;
   onFiltersChange: (filters: TransactionFiltersState) => void;
   categories: FinanceCategory[];
   accounts: FinanceAccount[];
 }
 
 export function TransactionFilters({
   open,
   onOpenChange,
   filters,
   onFiltersChange,
   categories,
   accounts
 }: TransactionFiltersProps) {
   const [localFilters, setLocalFilters] = useState<TransactionFiltersState>(filters);
 
   const handleApply = () => {
     onFiltersChange(localFilters);
     onOpenChange(false);
   };
 
   const handleReset = () => {
     const defaultFilters: TransactionFiltersState = {
       status: 'all',
       categoryId: null,
       accountId: null
     };
     setLocalFilters(defaultFilters);
     onFiltersChange(defaultFilters);
     onOpenChange(false);
   };
 
   const statusOptions = [
     { value: 'all', label: 'Todas' },
     { value: 'paid', label: 'Efetuadas' },
     { value: 'pending', label: 'Pendentes' }
   ];
 
   const selectedCategory = categories.flatMap(c => [c, ...(c.subcategories || [])]).find(c => c.id === localFilters.categoryId);
   const selectedAccount = accounts.find(a => a.id === localFilters.accountId);
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
         {/* Header */}
         <div className="flex items-center justify-between pb-4 border-b">
           <Button variant="ghost" onClick={() => onOpenChange(false)}>
             Cancelar
           </Button>
           <SheetTitle className="font-semibold">Filtros</SheetTitle>
           <Button variant="ghost" className="text-primary font-semibold" onClick={handleApply}>
             Filtrar
           </Button>
         </div>
 
         <div className="space-y-6 py-4">
           {/* Status filter */}
           <div className="space-y-3">
             <Label className="text-muted-foreground">Situação</Label>
             <div className="flex flex-wrap gap-2">
               {statusOptions.map(opt => (
                 <Badge
                   key={opt.value}
                   variant={localFilters.status === opt.value ? "default" : "outline"}
                   className={cn(
                     "px-4 py-2 cursor-pointer transition-all",
                     localFilters.status === opt.value 
                       ? "bg-primary text-primary-foreground" 
                       : "hover:bg-secondary"
                   )}
                   onClick={() => setLocalFilters({ ...localFilters, status: opt.value as TransactionFiltersState['status'] })}
                 >
                   {opt.label}
                 </Badge>
               ))}
             </div>
           </div>
 
           {/* Category filter */}
           <div className="space-y-3 border-t pt-4">
             <Label className="text-muted-foreground">Categorias</Label>
             <div 
               className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 cursor-pointer"
               onClick={() => {
                 // Toggle category selection - for now, cycle through or clear
                 setLocalFilters({ ...localFilters, categoryId: null });
               }}
             >
               <Flag className="w-5 h-5 text-muted-foreground" />
               <span>{selectedCategory?.name || 'Todas'}</span>
             </div>
             
             {/* Show category list */}
             <div className="max-h-40 overflow-y-auto space-y-1">
               <div 
                 className={cn(
                   "flex items-center gap-2 p-2 rounded-lg cursor-pointer",
                   !localFilters.categoryId && "bg-primary/10"
                 )}
                 onClick={() => setLocalFilters({ ...localFilters, categoryId: null })}
               >
                 <span className="text-sm">Todas as categorias</span>
               </div>
               {categories.map(cat => {
                 const CatIcon = getLucideIcon(cat.icon);
                 return (
                   <div key={cat.id}>
                     <div 
                       className={cn(
                         "flex items-center gap-2 p-2 rounded-lg cursor-pointer",
                         localFilters.categoryId === cat.id && "bg-primary/10"
                       )}
                       onClick={() => setLocalFilters({ ...localFilters, categoryId: cat.id })}
                     >
                       {CatIcon && <CatIcon className="w-4 h-4" style={{ color: cat.color }} />}
                       <span className="text-sm font-medium">{cat.name}</span>
                     </div>
                     {cat.subcategories?.map(sub => (
                       <div 
                         key={sub.id}
                         className={cn(
                           "flex items-center gap-2 p-2 pl-8 rounded-lg cursor-pointer",
                           localFilters.categoryId === sub.id && "bg-primary/10"
                         )}
                         onClick={() => setLocalFilters({ ...localFilters, categoryId: sub.id })}
                       >
                         <span className="text-sm">{sub.name}</span>
                       </div>
                     ))}
                   </div>
                 );
               })}
             </div>
           </div>
 
           {/* Account filter */}
           <div className="space-y-3 border-t pt-4">
             <Label className="text-muted-foreground">Contas</Label>
             <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
               <Landmark className="w-5 h-5 text-muted-foreground" />
               <span>{selectedAccount?.name || 'Todas'}</span>
             </div>
             
             {/* Show accounts list */}
             <div className="max-h-32 overflow-y-auto space-y-1">
               <div 
                 className={cn(
                   "flex items-center gap-2 p-2 rounded-lg cursor-pointer",
                   !localFilters.accountId && "bg-primary/10"
                 )}
                 onClick={() => setLocalFilters({ ...localFilters, accountId: null })}
               >
                 <span className="text-sm">Todas as contas</span>
               </div>
               {accounts.filter(a => a.type !== 'credit_card').map(acc => (
                 <div 
                   key={acc.id}
                   className={cn(
                     "flex items-center gap-2 p-2 rounded-lg cursor-pointer",
                     localFilters.accountId === acc.id && "bg-primary/10"
                   )}
                   onClick={() => setLocalFilters({ ...localFilters, accountId: acc.id })}
                 >
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                   <span className="text-sm">{acc.name}</span>
                 </div>
               ))}
             </div>
           </div>
 
           {/* Reset button */}
           <div className="pt-4 border-t">
             <Button 
               variant="outline" 
               className="w-full" 
               onClick={handleReset}
             >
               Limpar filtros
             </Button>
           </div>
         </div>
       </SheetContent>
     </Sheet>
   );
 }