 import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
 import { useState } from 'react';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { formatCurrency } from '@/types/recipe';
 import { OperationalCosts } from '@/hooks/useRecipeCostSettings';
 
 interface OperationalCostsSectionProps {
   operationalCosts: OperationalCosts;
   settings: {
     tax_percentage: number;
     card_fee_percentage: number;
   };
 }
 
 export function OperationalCostsSection({ 
   operationalCosts, 
   settings 
 }: OperationalCostsSectionProps) {
   const [isOpen, setIsOpen] = useState(true);
   
   const hasOperationalCosts = operationalCosts.totalOperational > 0;
   
   if (!hasOperationalCosts) return null;
 
   return (
     <TooltipProvider>
       <Collapsible open={isOpen} onOpenChange={setIsOpen}>
         <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
           <CollapsibleTrigger className="flex items-center justify-between w-full">
             <div className="flex items-center gap-2">
               <span className="text-sm font-semibold">Custos Operacionais</span>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <HelpCircle className="h-4 w-4 text-muted-foreground" />
                 </TooltipTrigger>
                 <TooltipContent className="max-w-xs">
                   Custos adicionais calculados com base nas configurações definidas em
                   Configurações → Custos. Inclui rateio de despesas fixas, impostos, taxas e embalagem.
                 </TooltipContent>
               </Tooltip>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-primary">
                 {formatCurrency(operationalCosts.totalOperational)}
               </span>
               {isOpen ? (
                 <ChevronUp className="h-4 w-4 text-muted-foreground" />
               ) : (
                 <ChevronDown className="h-4 w-4 text-muted-foreground" />
               )}
             </div>
           </CollapsibleTrigger>
           
           <CollapsibleContent className="space-y-2">
             {operationalCosts.fixedCostPerProduct > 0 && (
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Gastos Fixos (rateio)</span>
                 <span>{formatCurrency(operationalCosts.fixedCostPerProduct)}</span>
               </div>
             )}
             
             {operationalCosts.taxAmount > 0 && (
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">
                   Impostos ({settings.tax_percentage}%)
                 </span>
                 <span>{formatCurrency(operationalCosts.taxAmount)}</span>
               </div>
             )}
             
             {operationalCosts.cardFeeAmount > 0 && (
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">
                   Taxa Maquininha ({settings.card_fee_percentage}%)
                 </span>
                 <span>{formatCurrency(operationalCosts.cardFeeAmount)}</span>
               </div>
             )}
             
             {operationalCosts.packagingCost > 0 && (
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Embalagem</span>
                 <span>{formatCurrency(operationalCosts.packagingCost)}</span>
               </div>
             )}
           </CollapsibleContent>
         </div>
       </Collapsible>
     </TooltipProvider>
   );
 }