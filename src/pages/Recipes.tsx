 import { useState, useMemo } from 'react';
 import { Plus, Search, ChefHat, DollarSign, Archive, ChevronDown, ChevronRight } from 'lucide-react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent } from '@/components/ui/card';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
     getAvailableSubRecipes,
     reorderCategories,
      updateItemPrice,
      updateItemUnit,
    } = useRecipes();
   
   const [search, setSearch] = useState('');
   const [sheetOpen, setSheetOpen] = useState(false);
   const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
   const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'produtos' | 'bases'>('produtos');
  const [preSelectedCategoryId, setPreSelectedCategoryId] = useState<string | null>(null);
   
  // Find the "Bases e Preparos" category
  const basesCategory = useMemo(() => {
    return categories.find(c => c.name.toLowerCase().includes('bases') || c.name.toLowerCase().includes('preparo'));
  }, [categories]);
  
   // Filter and group recipes
  const { productRecipes, baseRecipes, groupedRecipes } = useMemo(() => {
    const basesCategoryId = basesCategory?.id;
    
    const products = recipes.filter(r => 
      r.category_id !== basesCategoryId && 
      r.name.toLowerCase().includes(search.toLowerCase())
    );
    
    const bases = recipes.filter(r => 
      r.category_id === basesCategoryId && 
      r.name.toLowerCase().includes(search.toLowerCase())
     );
     
    const recipesToGroup = activeTab === 'produtos' ? products : bases;
    
     const groups: Record<string, { category: typeof categories[0] | null; recipes: Recipe[] }> = {};
     
    recipesToGroup.forEach((recipe) => {
       const catId = recipe.category_id || 'sem-categoria';
       if (!groups[catId]) {
         groups[catId] = {
           category: recipe.category || null,
           recipes: [],
         };
       }
       groups[catId].recipes.push(recipe);
     });
     
    const grouped = Object.entries(groups).sort((a, b) => {
       const orderA = a[1].category?.sort_order ?? 999;
       const orderB = b[1].category?.sort_order ?? 999;
       return orderA - orderB;
     });
    
    return { productRecipes: products, baseRecipes: bases, groupedRecipes: grouped };
  }, [recipes, search, basesCategory, activeTab]);
   
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
    // Pre-select "Bases e Preparos" category when creating from bases tab
    if (activeTab === 'bases' && basesCategory) {
      setPreSelectedCategoryId(basesCategory.id);
    } else {
      setPreSelectedCategoryId(null);
    }
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
         
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'produtos' | 'bases')}>
          <div className="flex items-center gap-2">
            <TabsList className="flex-1">
              <TabsTrigger value="produtos" className="flex-1 gap-2">
                <ChefHat className="h-4 w-4" />
                Produtos
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {productRecipes.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="bases" className="flex-1 gap-2">
                🍲 Bases
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {baseRecipes.length}
                </span>
              </TabsTrigger>
            </TabsList>
            <Button onClick={handleCreate} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">
                {activeTab === 'bases' ? 'Nova Base' : 'Nova Ficha'}
              </span>
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'bases' ? 'Buscar bases e preparos...' : 'Buscar receitas...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
         
          {/* Recipe List */}
          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : groupedRecipes.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === 'bases' 
                    ? 'Nenhuma base ou preparo encontrado'
                    : 'Nenhuma ficha técnica encontrada'}
                </p>
                <Button onClick={handleCreate} variant="outline" className="mt-4">
                  {activeTab === 'bases' ? 'Criar primeira base' : 'Criar primeira ficha'}
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
          </TabsContent>
        </Tabs>
       </div>
       
       <RecipeSheet
         open={sheetOpen}
         onOpenChange={setSheetOpen}
         recipe={selectedRecipe}
         categories={categories}
         inventoryItems={inventoryItems}
        defaultCategoryId={preSelectedCategoryId}
        subRecipes={getAvailableSubRecipes(selectedRecipe?.id).map(r => ({
          id: r.id,
          name: r.name,
          yield_unit: r.yield_unit,
          cost_per_portion: r.cost_per_portion,
          category: r.category ? { id: r.category.id, name: r.category.name, color: r.category.color } : null,
        }))}
          onSave={handleSave}
          isSaving={isAddingRecipe || isUpdatingRecipe}
           onUpdateItemPrice={async (itemId, price) => {
             await updateItemPrice({ itemId, price });
           }}
           onUpdateItemUnit={async (itemId, unitType) => {
             await updateItemUnit({ itemId, unitType });
           }}
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