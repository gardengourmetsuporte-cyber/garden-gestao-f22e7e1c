 import { useState, useEffect } from 'react';
 import { Calculator, HelpCircle, Save } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { useRecipeCostSettings } from '@/hooks/useRecipeCostSettings';
 
 export function RecipeCostSettings() {
   const {
     settings,
     isLoading,
     expenseCategories,
     monthlyFixedCost,
     saveSettings,
     isSaving,
   } = useRecipeCostSettings();
 
   const [monthlyProductsSold, setMonthlyProductsSold] = useState('1000');
   const [taxPercentage, setTaxPercentage] = useState('0');
   const [cardFeePercentage, setCardFeePercentage] = useState('0');
   const [packagingCostPerUnit, setPackagingCostPerUnit] = useState('0');
   const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
 
   // Carregar valores quando settings mudar
   useEffect(() => {
     if (settings && 'id' in settings) {
       setMonthlyProductsSold(String(settings.monthly_products_sold || 1000));
       setTaxPercentage(String(settings.tax_percentage || 0));
       setCardFeePercentage(String(settings.card_fee_percentage || 0));
       setPackagingCostPerUnit(String(settings.packaging_cost_per_unit || 0));
       setSelectedCategoryIds(settings.fixed_cost_category_ids || []);
     }
   }, [settings]);
 
   const handleToggleCategory = (categoryId: string) => {
     setSelectedCategoryIds((prev) =>
       prev.includes(categoryId)
         ? prev.filter((id) => id !== categoryId)
         : [...prev, categoryId]
     );
   };
 
   const handleSave = () => {
     saveSettings({
       monthly_products_sold: parseFloat(monthlyProductsSold) || 1000,
       tax_percentage: parseFloat(taxPercentage) || 0,
       card_fee_percentage: parseFloat(cardFeePercentage) || 0,
       packaging_cost_per_unit: parseFloat(packagingCostPerUnit) || 0,
       fixed_cost_category_ids: selectedCategoryIds,
     });
   };
 
   const costPerProduct = parseFloat(monthlyProductsSold) > 0
     ? monthlyFixedCost / parseFloat(monthlyProductsSold)
     : 0;
 
   const formatCurrency = (value: number) =>
     new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
       </div>
     );
   }
 
   return (
     <TooltipProvider>
       <div className="space-y-6">
         <div>
           <h3 className="text-lg font-semibold">Configurações de Custos</h3>
           <p className="text-sm text-muted-foreground">
             Defina como os custos operacionais são calculados nas fichas técnicas
           </p>
         </div>
 
         {/* Rateio de Custos Fixos */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
               <Calculator className="h-4 w-4" />
               Rateio de Custos Fixos
             </CardTitle>
             <CardDescription>
               Os custos fixos do financeiro serão divididos pela quantidade de produtos vendidos
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="monthly-products" className="flex items-center gap-2">
                 Média de produtos vendidos por mês
                 <Tooltip>
                   <TooltipTrigger>
                     <HelpCircle className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-xs">
                     Informe quantos produtos você vende em média por mês.
                     Esse número será usado para dividir os custos fixos.
                   </TooltipContent>
                 </Tooltip>
               </Label>
               <div className="flex items-center gap-2">
                 <Input
                   id="monthly-products"
                   type="number"
                   value={monthlyProductsSold}
                   onChange={(e) => setMonthlyProductsSold(e.target.value)}
                   min="1"
                   className="max-w-[200px]"
                 />
                 <span className="text-sm text-muted-foreground">produtos</span>
               </div>
             </div>
 
             {/* Categorias de Custo Fixo */}
             <div className="space-y-3">
               <Label className="flex items-center gap-2">
                 Categorias de Custo Fixo (do Financeiro)
                 <Tooltip>
                   <TooltipTrigger>
                     <HelpCircle className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-xs">
                     Selecione quais categorias de despesa do financeiro devem ser
                     consideradas como custo fixo e rateadas por produto.
                   </TooltipContent>
                 </Tooltip>
               </Label>
 
               {expenseCategories.length === 0 ? (
                 <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                   Nenhuma categoria de despesa encontrada no financeiro.
                   Crie categorias primeiro.
                 </p>
               ) : (
                 <div className="space-y-2 border rounded-lg p-3">
                   {expenseCategories.map((category) => (
                     <div key={category.id} className="flex items-center space-x-3">
                       <Checkbox
                         id={`category-${category.id}`}
                         checked={selectedCategoryIds.includes(category.id)}
                         onCheckedChange={() => handleToggleCategory(category.id)}
                       />
                       <label
                         htmlFor={`category-${category.id}`}
                         className="text-sm font-medium leading-none cursor-pointer"
                       >
                         {category.name}
                       </label>
                     </div>
                   ))}
                 </div>
               )}
             </div>
 
             {/* Resumo do Custo Fixo */}
             <div className="bg-muted/50 rounded-lg p-4 space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Custo Fixo Mensal:</span>
                 <span className="font-medium">{formatCurrency(monthlyFixedCost)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Custo por Produto:</span>
                 <span className="font-bold text-primary">{formatCurrency(costPerProduct)}</span>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Taxas Adicionais */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-base">Taxas Adicionais</CardTitle>
             <CardDescription>
               Percentuais e valores fixos a serem incluídos no custo do produto
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="tax" className="flex items-center gap-2">
                   Impostos sobre venda
                   <Tooltip>
                     <TooltipTrigger>
                       <HelpCircle className="h-4 w-4 text-muted-foreground" />
                     </TooltipTrigger>
                     <TooltipContent>
                       Percentual de impostos (ex: DAS, ISS)
                     </TooltipContent>
                   </Tooltip>
                 </Label>
                 <div className="flex items-center gap-2">
                   <Input
                     id="tax"
                     type="number"
                     value={taxPercentage}
                     onChange={(e) => setTaxPercentage(e.target.value)}
                     min="0"
                     max="100"
                     step="0.1"
                   />
                   <span className="text-sm text-muted-foreground">%</span>
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="card-fee" className="flex items-center gap-2">
                   Taxa de maquininha
                   <Tooltip>
                     <TooltipTrigger>
                       <HelpCircle className="h-4 w-4 text-muted-foreground" />
                     </TooltipTrigger>
                     <TooltipContent>
                       Taxa média cobrada pela máquina de cartão
                     </TooltipContent>
                   </Tooltip>
                 </Label>
                 <div className="flex items-center gap-2">
                   <Input
                     id="card-fee"
                     type="number"
                     value={cardFeePercentage}
                     onChange={(e) => setCardFeePercentage(e.target.value)}
                     min="0"
                     max="100"
                     step="0.1"
                   />
                   <span className="text-sm text-muted-foreground">%</span>
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="packaging" className="flex items-center gap-2">
                   Custo de embalagem
                   <Tooltip>
                     <TooltipTrigger>
                       <HelpCircle className="h-4 w-4 text-muted-foreground" />
                     </TooltipTrigger>
                     <TooltipContent>
                       Custo médio de embalagem por unidade vendida
                     </TooltipContent>
                   </Tooltip>
                 </Label>
                 <div className="flex items-center gap-2">
                   <span className="text-sm text-muted-foreground">R$</span>
                   <Input
                     id="packaging"
                     type="number"
                     value={packagingCostPerUnit}
                     onChange={(e) => setPackagingCostPerUnit(e.target.value)}
                     min="0"
                     step="0.01"
                   />
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Botão Salvar */}
         <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
           <Save className="h-4 w-4 mr-2" />
           {isSaving ? 'Salvando...' : 'Salvar Configurações'}
         </Button>
       </div>
     </TooltipProvider>
   );
 }