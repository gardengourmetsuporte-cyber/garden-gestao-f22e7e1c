import { useState, useMemo, useRef, useCallback, lazy, Suspense, useEffect } from 'react';
import { useFabActions } from '@/contexts/FabActionContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMenuAdmin, MenuProduct, MenuOptionGroup } from '@/hooks/useMenuAdmin';
import { useTabletAdmin } from '@/hooks/useTabletAdmin';
import { useDeliveryHub } from '@/hooks/useDeliveryHub';
import { useUnit } from '@/contexts/UnitContext';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Menu components
import { MenuCategoryTree } from '@/components/menu/MenuCategoryTree';
import { MenuGroupContent } from '@/components/menu/MenuGroupContent';
import { ProductSheet } from '@/components/menu/ProductSheet';
import { OptionGroupList } from '@/components/menu/OptionGroupList';
import { OptionGroupSheet } from '@/components/menu/OptionGroupSheet';
import { LinkOptionsDialog } from '@/components/menu/LinkOptionsDialog';

import { RecipeSyncPanel } from '@/components/menu/RecipeSyncPanel';
import { CardapioDesktopNav } from '@/components/cardapio/CardapioDesktopNav';
import { FichaTecnicaHeader } from '@/components/menu/FichaTecnicaHeader';
// UnifiedOrdersPanel removed — orders managed via PDV/KDS/Deliveries
import { useRecipeMenuSync } from '@/hooks/useRecipeMenuSync';

// Recipe integration
import { RecipeSheet } from '@/components/recipes/RecipeSheet';
import { useRecipes } from '@/hooks/useRecipes';
import { useRecipeCostSettings } from '@/hooks/useRecipeCostSettings';
import type { Recipe } from '@/types/recipe';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CardapioDashboardLazy = lazy(() => import('@/components/cardapio/CardapioDashboard').then(m => ({ default: m.CardapioDashboard })));
const CardapioConfigHubLazy = lazy(() => import('@/components/cardapio/CardapioConfigHub').then(m => ({ default: m.CardapioConfigHub })));
const CardapioOrdersViewLazy = lazy(() => import('@/components/cardapio/CardapioOrdersView').then(m => ({ default: m.CardapioOrdersView })));

type CardapioTab = 'produtos' | 'opcionais' | 'replicar';

export default function CardapioHub() {
  const { activeUnit } = useUnit();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isProdutos = searchParams.get('tab') === 'produtos';
  const isPedidosConfig = searchParams.get('tab') === 'pedidos';
  const isDashboard = !searchParams.get('tab') && !searchParams.get('section');
  const isConfigFromUrl = searchParams.get('section') === 'config';

  // Menu admin hook
  const menuAdmin = useMenuAdmin();
  const {
    categories, groups, products, optionGroups, loading: menuLoading,
    saveCategory, deleteCategory,
    saveGroup, deleteGroup,
    saveProduct, deleteProduct,
    saveOptionGroup, deleteOptionGroup,
    getProductsByGroup, getLinkedProductIds, getLinkedOptionGroupIds,
    setProductOptionLinks, uploadProductImage,
  } = menuAdmin;

  // Tablet admin hook (for orders)
  const tabletAdmin = useTabletAdmin();
  const { orders, pdvConfig, retryPDV } = tabletAdmin;
  const { orders: hubOrders } = useDeliveryHub(activeUnit?.id);

  // Recipe sync

  // Recipe sync
  const recipeSync = useRecipeMenuSync(products, groups, () => {
    menuAdmin.fetchProducts();
  });

  // Recipe editing (integrated from /recipes)
  const {
    recipes, categories: recipeCategories, inventoryItems: recipeInventoryItems,
    addRecipe, updateRecipe, isAddingRecipe, isUpdatingRecipe, getAvailableSubRecipes,
    updateItemPrice, updateItemUnit,
  } = useRecipes();
  const { calculateOperationalCosts } = useRecipeCostSettings();
  const [recipeSheetOpen, setRecipeSheetOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeTargetProductId, setRecipeTargetProductId] = useState<string | null>(null);

  const [defaultRecipeName, setDefaultRecipeName] = useState('');
  const [defaultRecipeCategoryId, setDefaultRecipeCategoryId] = useState<string | null>(null);
  const [defaultRecipeSellingPrice, setDefaultRecipeSellingPrice] = useState<number | null>(null);

  const handleEditRecipe = useCallback((product: MenuProduct) => {
    const recipeId = (product as any).recipe_id;
    setRecipeTargetProductId(product.id);
    setDefaultRecipeSellingPrice(product.price || 0);

    if (recipeId) {
      const recipe = recipes.find(r => r.id === recipeId) || null;
      setEditingRecipe(recipe);
      setDefaultRecipeName('');
      setDefaultRecipeCategoryId(null);
    } else {
      setEditingRecipe(null);
      setDefaultRecipeName(product.name);
      // Match menu product category name to recipe category id
      const matchedCat = recipeCategories.find(c => c.name.toLowerCase() === product.category?.toLowerCase());
      setDefaultRecipeCategoryId(matchedCat?.id || null);
    }

    setRecipeSheetOpen(true);
  }, [recipes, recipeCategories]);

  const handleRecipeSave = async (data: any) => {
    const { _cost_snapshot: costSnapshot, ...recipePayload } = data || {};

    const savedRecipe = recipePayload.id ? await updateRecipe(recipePayload) : await addRecipe(recipePayload);
    const savedRecipeId = savedRecipe?.id || recipePayload.id;

    const ingredientTotalCost = (recipePayload.ingredients || []).reduce((sum: number, ing: any) => sum + (ing.total_cost || 0), 0);
    const ingredientCostPerPortion = recipePayload.yield_quantity > 0
      ? ingredientTotalCost / recipePayload.yield_quantity
      : ingredientTotalCost;

    const targetProduct = recipeTargetProductId
      ? products.find(p => p.id === recipeTargetProductId)
      : products.find(p => (p as any).recipe_id === savedRecipeId);

    const snapshotCost = typeof costSnapshot?.totalCostPerPortion === 'number'
      ? costSnapshot.totalCostPerPortion
      : null;
    const snapshotSellingPrice = typeof costSnapshot?.referenceSellingPrice === 'number'
      ? costSnapshot.referenceSellingPrice
      : undefined;

    const opCosts = calculateOperationalCosts(ingredientCostPerPortion, targetProduct?.price ?? snapshotSellingPrice);
    const fallbackFullCostPerPortion = ingredientCostPerPortion + opCosts.totalOperational;
    const fullCostPerPortion = snapshotCost && snapshotCost > 0
      ? snapshotCost
      : fallbackFullCostPerPortion;

    if (recipeTargetProductId && savedRecipeId) {
      const { data: linkedRows, error: linkError } = await supabase
        .from('tablet_products')
        .update({
          recipe_id: savedRecipeId,
          cost_per_portion: fullCostPerPortion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipeTargetProductId)
        .select('id');

      if (linkError) throw linkError;
      if (!linkedRows || linkedRows.length === 0) {
        throw new Error('Não foi possível vincular a ficha técnica ao produto.');
      }

      await menuAdmin.fetchProducts();
    } else if (savedRecipeId && targetProduct) {
      await supabase
        .from('tablet_products')
        .update({ cost_per_portion: fullCostPerPortion, updated_at: new Date().toISOString() })
        .eq('id', targetProduct.id);

      await menuAdmin.fetchProducts();
    }
  };

  // Internal tab for cardápio content
  const [cardapioTab, setCardapioTab] = useState<CardapioTab>('produtos');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'menu' | 'ficha'>('menu');
  const handleSelectGroup = useCallback((groupId: string) => {
    setSelectedGroupId(prev => prev === groupId ? null : groupId);
  }, []);

  // Product sheet
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<MenuProduct> | null>(null);

  // Option group sheet
  const [ogSheetOpen, setOgSheetOpen] = useState(false);
  const [editingOG, setEditingOG] = useState<Partial<MenuOptionGroup> | null>(null);

  // Link dialog
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingOG, setLinkingOG] = useState<MenuOptionGroup | null>(null);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;
  const groupProducts = selectedGroupId ? getProductsByGroup(selectedGroupId) : [];

  // Order stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => o.created_at.slice(0, 10) === today);
    return {
      total: todayOrders.length,
      sent: todayOrders.filter(o => o.status === 'sent_to_pdv').length,
      errors: todayOrders.filter(o => o.status === 'error').length,
      pending: todayOrders.filter(o => o.status === 'confirmed' || o.status === 'awaiting_confirmation').length,
    };
  }, [orders]);

  const statusConfig: Record<string, { label: string; color: string; icon: string; dotColor: string }> = {
    draft: { label: 'Rascunho', color: 'bg-secondary text-muted-foreground', icon: 'FileEdit', dotColor: 'bg-muted-foreground' },
    awaiting_confirmation: { label: 'Aguardando', color: 'bg-warning/15 text-warning', icon: 'Clock', dotColor: 'bg-warning' },
    pending: { label: 'Pendente', color: 'bg-warning/15 text-warning', icon: 'Clock', dotColor: 'bg-warning' },
    confirmed: { label: 'Confirmado', color: 'bg-primary/15 text-primary', icon: 'CheckCircle', dotColor: 'bg-primary' },
    preparing: { label: 'Preparando', color: 'bg-orange-500/15 text-orange-400', icon: 'ChefHat', dotColor: 'bg-orange-400' },
    ready: { label: 'Pronto', color: 'bg-success/15 text-success', icon: 'PackageCheck', dotColor: 'bg-success' },
    dispatched: { label: 'Despachado', color: 'bg-blue-500/15 text-blue-400', icon: 'Truck', dotColor: 'bg-blue-400' },
    delivered: { label: 'Entregue', color: 'bg-success/15 text-success', icon: 'CircleCheckBig', dotColor: 'bg-success' },
    sent_to_pdv: { label: 'Enviado PDV', color: 'bg-success/15 text-success', icon: 'CheckCircle', dotColor: 'bg-success' },
    cancelled: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive', icon: 'XCircle', dotColor: 'bg-destructive' },
    error: { label: 'Erro', color: 'bg-destructive/15 text-destructive', icon: 'AlertTriangle', dotColor: 'bg-destructive' },
  };
  const getStatus = (s: string) => statusConfig[s] || { label: s, color: 'bg-secondary text-muted-foreground', icon: 'HelpCircle', dotColor: 'bg-muted-foreground' };
  const formatPrice = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const getSourceLabel = (order: any) => {
    if (order.source === 'delivery') return 'Delivery';
    if (order.source === 'balcao') return 'Balcão';
    if (order.table_number > 0) return `Mesa ${order.table_number}`;
    if (order.customer_name) return order.customer_name;
    return `Mesa ${order.table_number}`;
  };

  // Product sheet handlers
  const openNewProduct = () => {
    setEditingProduct({
      name: '', price: 0, category: 'Geral', group_id: selectedGroupId,
      is_active: true, availability: { tablet: true, delivery: true },
      price_type: 'fixed', is_highlighted: false, is_18_plus: false,
    });
    setProductSheetOpen(true);
  };
  const openEditProduct = (p: MenuProduct) => { setEditingProduct(p); setProductSheetOpen(true); };

  // Option group handlers
  const openNewOG = () => {
    setEditingOG({
      title: '', min_selections: 0, max_selections: 1,
      allow_repeat: false, is_active: true,
      availability: { tablet: true, delivery: true }, options: [],
    });
    setOgSheetOpen(true);
  };
  const openEditOG = (og: MenuOptionGroup) => { setEditingOG(og); setOgSheetOpen(true); };
  const openLinkProducts = (og: MenuOptionGroup) => { setLinkingOG(og); setLinkDialogOpen(true); };

  // FAB actions — contextual per active tab
  useFabActions(
    isProdutos && cardapioTab === 'produtos'
      ? [{ icon: viewMode === 'menu' ? 'RecipeBook' : 'Eye', label: viewMode === 'menu' ? 'Ficha Técnica' : 'Cardápio', onClick: () => setViewMode(v => v === 'menu' ? 'ficha' : 'menu') }]
      : isProdutos && cardapioTab === 'opcionais'
        ? [{ icon: 'Plus', label: 'Novo Opcional', onClick: openNewOG }]
        : [],
    [isProdutos, cardapioTab, viewMode]
  );


  if (isDashboard) {
    const handleDashboardNavigate = (tab: string) => {
      if (tab === 'pedidos') {
        setSearchParams({ tab: 'pedidos' });
      } else if (tab === 'produtos') {
        setSearchParams({});
        setCardapioTab('produtos');
      } else {
        setSearchParams({});
      }
    };

    return (
      <AppLayout>
        <CardapioDesktopNav />
        <div className="min-h-screen bg-background pb-24 lg:pb-6">
          <Suspense fallback={<div className="p-4 space-y-4"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" /></div>}>
            <CardapioDashboardLazy
              onNavigate={handleDashboardNavigate}
              unitId={activeUnit?.id}
              menuLoading={menuLoading}
              products={products}
              groups={groups}
              orders={orders}
            />
          </Suspense>
        </div>
      </AppLayout>
    );
  }

  // ==================== PEDIDOS (ORDERS) VIEW ====================
  if (isPedidosConfig) {
    return (
      <AppLayout>
        <CardapioDesktopNav />
        <div className="min-h-screen bg-background pb-24 lg:pb-6">
          <Suspense fallback={<div className="p-4 space-y-4"><Skeleton className="h-10 w-full rounded-xl" /><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" /></div>}>
            <CardapioOrdersViewLazy orders={orders} hubOrders={hubOrders} />
          </Suspense>
        </div>
      </AppLayout>
    );
  }

  // ==================== CONFIG HUB VIEW (via section=config) ====================
  if (isConfigFromUrl) {
    return (
      <AppLayout>
        <CardapioDesktopNav />
        <div className="min-h-screen bg-background pb-24 lg:pb-6">
          <Suspense fallback={<div className="p-4 space-y-4"><Skeleton className="h-10 w-48 rounded-xl" /><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" /></div>}>
            <CardapioConfigHubLazy />
          </Suspense>
        </div>
      </AppLayout>
    );
  }


  // ==================== CARDÁPIO VIEW (default) ====================
  return (
    <AppLayout>
      <CardapioDesktopNav />
      <div className="min-h-screen bg-background pb-24 lg:pb-6">
        {/* Quick Access Links only in config */}

        {(
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-3 pb-2 lg:px-6 space-y-2">
            {activeUnit && <MenuPublishBar unitId={activeUnit.id} products={products} groups={groups} />}
            <div className="flex items-center gap-2">
               <div className="flex gap-1 p-1 rounded-full bg-foreground/[0.07] backdrop-blur-sm flex-1 min-w-0">
                 {([
                   { id: 'produtos' as CardapioTab, label: 'Produtos', count: products.length },
                   { id: 'opcionais' as CardapioTab, label: 'Opcionais', count: optionGroups.length },
                 ]).map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setCardapioTab(tab.id)}
                     className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium transition-all",
                        cardapioTab === tab.id
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0",
                          cardapioTab === tab.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {tab.count}
                        </span>
                      )}
                   </button>
                 ))}
               </div>
             </div>
          </div>
        )}

        <div className="px-4 py-3 lg:px-6 space-y-4">
          {/* ==================== PRODUTOS ==================== */}
          {cardapioTab === 'produtos' && (
            <div className="space-y-4">
              {viewMode === 'ficha' && (
                <FichaTecnicaHeader
                  products={products}
                  syncing={recipeSync.syncing}
                  onRefreshCosts={recipeSync.refreshCosts}
                />
              )}
              <MenuCategoryTree
                viewMode={viewMode}
                getProductsByGroup={getProductsByGroup}
                categories={categories}
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={handleSelectGroup}
                onSaveCategory={saveCategory}
                onDeleteCategory={deleteCategory}
                onSaveGroup={saveGroup}
                onDeleteGroup={deleteGroup}
                getProductCount={(gid) => getProductsByGroup(gid).length}
                renderGroupContent={(gid) => {
                  const grp = groups.find(g => g.id === gid) || null;
                  const prods = getProductsByGroup(gid);
                  return (
                    <MenuGroupContent
                      group={grp}
                      products={prods}
                      getOptionCount={(pid) => getLinkedOptionGroupIds(pid).length}
                      onNewProduct={openNewProduct}
                      onEditProduct={openEditProduct}
                      onDeleteProduct={deleteProduct}
                      onLinkOptions={() => setCardapioTab('opcionais')}
                      onImageUpload={(productId, file) => uploadProductImage(productId, file)}
                      onToggleProductAvailability={(prod, channel) => {
                        const avail = (prod.availability as any) || { tablet: true, delivery: true };
                        saveProduct({ ...prod, availability: { ...avail, [channel]: !avail[channel] } } as any);
                      }}
                      onEditRecipe={handleEditRecipe}
                      viewMode={viewMode}
                    />
                  );
                }}
              />
            </div>
          )}

          {/* ==================== OPCIONAIS ==================== */}
          {cardapioTab === 'opcionais' && (
            <OptionGroupList
              optionGroups={optionGroups}
              onNew={openNewOG}
              onEdit={openEditOG}
              onDelete={deleteOptionGroup}
              onLinkProducts={openLinkProducts}
            />
          )}

        </div>
      </div>

      {/* Sheets */}
      <ProductSheet open={productSheetOpen} onOpenChange={setProductSheetOpen} product={editingProduct} groups={groups} onSave={saveProduct} onDelete={deleteProduct} onImageUpload={(productId, file) => uploadProductImage(productId, file)} />
      <OptionGroupSheet open={ogSheetOpen} onOpenChange={setOgSheetOpen} optionGroup={editingOG} onSave={saveOptionGroup} onDelete={deleteOptionGroup} />
      <LinkOptionsDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} optionGroup={linkingOG} categories={categories} groups={groups} products={products} linkedProductIds={linkingOG ? getLinkedProductIds(linkingOG.id) : []} onSave={(ogId, pids) => setProductOptionLinks(ogId, pids)} />
      <RecipeSheet
        open={recipeSheetOpen}
        onOpenChange={(open) => {
          setRecipeSheetOpen(open);
          if (!open) {
            setEditingRecipe(null);
            setRecipeTargetProductId(null);
            setDefaultRecipeName('');
            setDefaultRecipeCategoryId(null);
            setDefaultRecipeSellingPrice(null);
          }
        }}
        recipe={editingRecipe}
        defaultName={defaultRecipeName}
        defaultCategoryId={defaultRecipeCategoryId}
        defaultSellingPrice={defaultRecipeSellingPrice}
        categories={recipeCategories}
        inventoryItems={recipeInventoryItems}
        subRecipes={getAvailableSubRecipes(editingRecipe?.id).map(r => ({
          id: r.id, name: r.name, yield_unit: r.yield_unit, cost_per_portion: r.cost_per_portion,
          category: r.category ? { id: r.category.id, name: r.category.name, color: r.category.color } : null,
        }))}
        onSave={handleRecipeSave}
        isSaving={isAddingRecipe || isUpdatingRecipe}
        onUpdateItemPrice={async (itemId, price) => { await updateItemPrice({ itemId, price }); }}
        onUpdateItemUnit={async (itemId, unitType) => { await updateItemUnit({ itemId, unitType }); }}
      />
    </AppLayout>
  );
}


// ==================== MENU PUBLISH BAR ====================
function MenuPublishBar({ unitId, products, groups }: { unitId: string; products: any[]; groups: any[] }) {
  const queryClient = useQueryClient();

  const { data: publishedAt } = useQuery({
    queryKey: ['menu-published-at', unitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('units')
        .select('menu_published_at')
        .eq('id', unitId)
        .single();
      return (data as any)?.menu_published_at as string | null;
    },
  });

  // Build a fingerprint of all relevant data to detect ANY change
  const dataFingerprint = useMemo(() => {
    const prodParts = products.map(p => `${p.id}:${p.updated_at}:${p.is_active}:${JSON.stringify(p.availability)}`).join('|');
    const grpParts = groups.map(g => `${g.id}:${g.updated_at}:${g.is_active}:${JSON.stringify(g.availability)}`).join('|');
    return `${prodParts}__${grpParts}`;
  }, [products, groups]);

  const hasUnpublished = useMemo(() => {
    if (!publishedAt) return products.length > 0 || groups.length > 0;
    const pubDate = new Date(publishedAt).getTime();
    return products.some(p => new Date(p.updated_at).getTime() > pubDate) ||
           groups.some(g => new Date(g.updated_at).getTime() > pubDate);
  }, [publishedAt, products, groups, dataFingerprint]);

  const publish = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('units')
        .update({ menu_published_at: new Date().toISOString() })
        .eq('id', unitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-published-at', unitId] });
      toast.success('Cardápio publicado com sucesso!');
    },
    onError: () => toast.error('Erro ao publicar'),
  });

  if (!hasUnpublished) return null;

  return (
    <button
      onClick={() => publish.mutate()}
      disabled={publish.isPending}
      className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-all disabled:opacity-60"
    >
      <AppIcon name="Upload" size={16} />
      {publish.isPending ? 'Publicando...' : 'Publicar Cardápio'}
      <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground text-[10px] ml-1">
        Alterações pendentes
      </Badge>
    </button>
  );
}
