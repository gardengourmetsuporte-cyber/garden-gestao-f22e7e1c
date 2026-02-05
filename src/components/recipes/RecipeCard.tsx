 import { MoreVertical, Copy, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { getLucideIcon } from '@/lib/icons';
 import { formatCurrency, type Recipe } from '@/types/recipe';
 import { cn } from '@/lib/utils';
 
 interface RecipeCardProps {
   recipe: Recipe;
   onEdit: (recipe: Recipe) => void;
   onDuplicate: (id: string) => void;
   onToggleActive: (id: string, is_active: boolean) => void;
   onDelete: (id: string) => void;
 }
 
 export function RecipeCard({
   recipe,
   onEdit,
   onDuplicate,
   onToggleActive,
   onDelete,
 }: RecipeCardProps) {
   const CategoryIcon = getLucideIcon(recipe.category?.icon || 'ChefHat');
   
   return (
     <Card
       className={cn(
         'card-unified cursor-pointer transition-all hover:shadow-md',
         !recipe.is_active && 'opacity-60'
       )}
       onClick={() => onEdit(recipe)}
     >
       <CardContent className="p-4">
         <div className="flex items-start justify-between gap-3">
           <div className="flex items-start gap-3 min-w-0 flex-1">
             <div
               className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ backgroundColor: `${recipe.category?.color || '#6366f1'}20` }}
             >
               {CategoryIcon && (
                 <CategoryIcon
                   className="w-5 h-5"
                   style={{ color: recipe.category?.color || '#6366f1' }}
                 />
               )}
             </div>
             
             <div className="min-w-0 flex-1">
               <h3 className="font-medium text-foreground truncate">{recipe.name}</h3>
               <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                 <span>Custo: {formatCurrency(recipe.total_cost)}</span>
                 <span className="text-muted-foreground/50">•</span>
                 <span>Porção: {formatCurrency(recipe.cost_per_portion)}</span>
               </div>
               <div className="flex items-center gap-2 mt-2">
                 <Badge
                   variant={recipe.is_active ? 'default' : 'secondary'}
                   className="text-xs"
                 >
                   {recipe.is_active ? 'Ativo' : 'Inativo'}
                 </Badge>
                 {recipe.ingredients && (
                   <span className="text-xs text-muted-foreground">
                     {recipe.ingredients.length} ingredientes
                   </span>
                 )}
               </div>
             </div>
           </div>
           
           <DropdownMenu>
             <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
               <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                 <MoreVertical className="h-4 w-4" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
               <DropdownMenuItem
                 onClick={(e) => {
                   e.stopPropagation();
                   onDuplicate(recipe.id);
                 }}
               >
                 <Copy className="h-4 w-4 mr-2" />
                 Duplicar
               </DropdownMenuItem>
               <DropdownMenuItem
                 onClick={(e) => {
                   e.stopPropagation();
                   onToggleActive(recipe.id, !recipe.is_active);
                 }}
               >
                 {recipe.is_active ? (
                   <>
                     <ToggleLeft className="h-4 w-4 mr-2" />
                     Inativar
                   </>
                 ) : (
                   <>
                     <ToggleRight className="h-4 w-4 mr-2" />
                     Ativar
                   </>
                 )}
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem
                 className="text-destructive"
                 onClick={(e) => {
                   e.stopPropagation();
                   onDelete(recipe.id);
                 }}
               >
                 <Trash2 className="h-4 w-4 mr-2" />
                 Excluir
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       </CardContent>
     </Card>
   );
 }