 import { useState, useMemo } from 'react';
 import { Plus, Search, ChefHat, DollarSign, Archive, ChevronDown, ChevronRight } from 'lucide-react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { RecipeCard } from '@/components/recipes/RecipeCard';
 import { RecipeSheet } from '@/components/recipes/RecipeSheet';
 import { useRecipes } from '@/hooks/useRecipes';
 import { useAuth } from '@/contexts/AuthContext';
 import { formatCurrency, type Recipe } from '@/types/recipe';
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
 
 export default function Recipes() {
   const { isAdmin } = useAuth();
   const {
     recipes,
     categories,
     inventoryItems,
     isLoading,
     addRecipe,
     updateRecipe,
     toggleActive,
     duplicateRecipe,
     deleteRecipe,
     isAddingRecipe,
     isUpdatingRecipe,
   } = useRecipes();
   
   const [search, setSearch] = useState('');
   const [sheetOpen, setSheetOpen] = useState(false);
   const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
   const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
   
   // Filter and group recipes
   const groupedRecipes = useMemo(() => {
     const filtered = recipes.filter((r) =>
       r.name.toLowerCase().includes(search.toLowerCase())
     );
     
     const groups: Record<string, { category: typeof categories[0] | null; recipes: Recipe[] }> = {};
     
     filtered.forEach((recipe) => {
       const catId = recipe.category_id || 'sem-categoria';
       if (!groups[catId]) {
         groups[catId] = {
           category: recipe.category || null,
           recipes: [],
         };
       }
       groups[catId].recipes.push(recipe);
     });
     
     return Object.entries(groups).sort((a, b) => {
       const orderA = a[1].category?.sort_order ?? 999;
       const orderB = b[1].category?.sort_order ?? 999;
       return orderA - orderB;
     });
   }, [recipes, search]);
   
   // Stats
   const stats = useMemo(() => {
     const active = recipes.filter((r) => r.is_active);
     const inactive = recipes.filter((r) => !r.is_active);
     const avgCost = active.length > 0
       ? active.reduce((sum, r) => sum + r.cost_per_portion, 0) / active.length
       : 0;
     return { total: recipes.length, avgCost, inactive: inactive.length };
   }, [recipes]);
   
   const toggleCategory = (catId: string) => {
     setExpandedCategories((prev) => {
       const next = new Set(prev);
       if (next.has(catId)) {
         next.delete(catId);
       } else {
         next.add(catId);
       }
       return next;
     });
   };
   
   const handleEdit = (recipe: Recipe) => {
     setSelectedRecipe(recipe);
     setSheetOpen(true);
   };
   
   const handleCreate = () => {
     setSelectedRecipe(null);
     setSheetOpen(true);
   };
   
   const handleSave = async (data: any) => {
     if (data.id) {
       await updateRecipe(data);
     } else {
       await addRecipe(data);
     }
   };
   
   const handleDeleteConfirm = () => {
     if (recipeToDelete) {
       deleteRecipe(recipeToDelete);
       setRecipeToDelete(null);
       setDeleteDialogOpen(false);
     }
   };
   
   if (!isAdmin) {
     return (
       <AppLayout>
         <div className="p-6 flex items-center justify-center min-h-[60vh]">
           <p className="text-muted-foreground">Acesso restrito a gestores.</p>
         </div>
       </AppLayout>
     );
   }
   
   return (
     <AppLayout>
       <div className="p-4 lg:p-6 space-y-6">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-bold">Fichas Técnicas</h1>
             <p className="text-muted-foreground text-sm">Gerencie suas receitas e custos</p>
           </div>
           <Button onClick={handleCreate} className="gap-2">
             <Plus className="h-4 w-4" />
             <span className="hidden sm:inline">Nova Ficha</span>
           </Button>
         </div>
         
         {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="card-unified overflow-hidden">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center min-h-[80px]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                 <ChefHat className="h-5 w-5 text-primary" />
               </div>
                <p className="text-xl font-bold leading-tight">{stats.total}</p>
                <p className="text-[10px] text-muted-foreground">Receitas</p>
             </CardContent>
           </Card>
            <Card className="card-unified overflow-hidden">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center min-h-[80px]">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-1">
                 <DollarSign className="h-5 w-5 text-success" />
               </div>
                <p className="text-lg font-bold leading-tight">{formatCurrency(stats.avgCost)}</p>
                <p className="text-[10px] text-muted-foreground">Custo Médio</p>
             </CardContent>
           </Card>
            <Card className="card-unified overflow-hidden">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center min-h-[80px]">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-1">
                 <Archive className="h-5 w-5 text-muted-foreground" />
               </div>
                <p className="text-xl font-bold leading-tight">{stats.inactive}</p>
                <p className="text-[10px] text-muted-foreground">Inativas</p>
             </CardContent>
           </Card>
         </div>
         
         {/* Search */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Buscar receitas..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-10"
           />
         </div>
         
         {/* Recipe List */}
         {isLoading ? (
           <div className="text-center py-12 text-muted-foreground">Carregando...</div>
         ) : groupedRecipes.length === 0 ? (
           <div className="text-center py-12">
             <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
             <p className="text-muted-foreground">Nenhuma ficha técnica encontrada</p>
             <Button onClick={handleCreate} variant="outline" className="mt-4">
               Criar primeira ficha
             </Button>
           </div>
         ) : (
           <div className="space-y-4">
             {groupedRecipes.map(([catId, group]) => (
               <Collapsible
                 key={catId}
                 open={expandedCategories.has(catId) || search.length > 0}
                 onOpenChange={() => toggleCategory(catId)}
               >
                 <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                   {expandedCategories.has(catId) || search.length > 0 ? (
                     <ChevronDown className="h-4 w-4 text-muted-foreground" />
                   ) : (
                     <ChevronRight className="h-4 w-4 text-muted-foreground" />
                   )}
                   <div
                     className="w-3 h-3 rounded-full"
                     style={{ backgroundColor: group.category?.color || '#6b7280' }}
                   />
                   <span className="font-medium">
                     {group.category?.name || 'Sem categoria'}
                   </span>
                   <span className="text-sm text-muted-foreground ml-auto">
                     ({group.recipes.length})
                   </span>
                 </CollapsibleTrigger>
                 
                 <CollapsibleContent>
                   <div className="space-y-2 mt-2 ml-2">
                     {group.recipes.map((recipe) => (
                       <RecipeCard
                         key={recipe.id}
                         recipe={recipe}
                         onEdit={handleEdit}
                         onDuplicate={duplicateRecipe}
                         onToggleActive={(id, active) => toggleActive({ id, is_active: active })}
                         onDelete={(id) => {
                           setRecipeToDelete(id);
                           setDeleteDialogOpen(true);
                         }}
                       />
                     ))}
                   </div>
                 </CollapsibleContent>
               </Collapsible>
             ))}
           </div>
         )}
       </div>
       
       <RecipeSheet
         open={sheetOpen}
         onOpenChange={setSheetOpen}
         recipe={selectedRecipe}
         categories={categories}
         inventoryItems={inventoryItems}
         onSave={handleSave}
         isSaving={isAddingRecipe || isUpdatingRecipe}
       />
       
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Excluir ficha técnica?</AlertDialogTitle>
             <AlertDialogDescription>
               Esta ação não pode ser desfeita. A ficha técnica será removida permanentemente.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
               Excluir
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </AppLayout>
   );
 }