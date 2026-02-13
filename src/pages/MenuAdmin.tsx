import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMenuAdmin, MenuProduct, MenuOptionGroup } from '@/hooks/useMenuAdmin';
import { MenuCategoryTree } from '@/components/menu/MenuCategoryTree';
import { MenuGroupContent } from '@/components/menu/MenuGroupContent';
import { ProductSheet } from '@/components/menu/ProductSheet';
import { OptionGroupList } from '@/components/menu/OptionGroupList';
import { OptionGroupSheet } from '@/components/menu/OptionGroupSheet';
import { LinkOptionsDialog } from '@/components/menu/LinkOptionsDialog';
import { BookOpen } from 'lucide-react';

export default function MenuAdmin() {
  const {
    categories, groups, products, optionGroups, loading,
    saveCategory, deleteCategory,
    saveGroup, deleteGroup,
    saveProduct, deleteProduct,
    saveOptionGroup, deleteOptionGroup,
    getProductsByGroup, getLinkedProductIds, getLinkedOptionGroupIds,
    setProductOptionLinks,
  } = useMenuAdmin();

  const [activeTab, setActiveTab] = useState<'menu' | 'options'>('menu');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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

  const openNewProduct = () => {
    setEditingProduct({
      name: '', price: 0, category: 'Geral', group_id: selectedGroupId,
      is_active: true, availability: { tablet: true, delivery: true },
      price_type: 'fixed', is_highlighted: false, is_18_plus: false,
    });
    setProductSheetOpen(true);
  };

  const openEditProduct = (p: MenuProduct) => {
    setEditingProduct(p);
    setProductSheetOpen(true);
  };

  const openLinkOptionsForProduct = (productId: string) => {
    // Find or pick option group — for now open the options tab link dialog
    // This is a simplified approach: switch to options tab
    setActiveTab('options');
  };

  const openNewOG = () => {
    setEditingOG({
      title: '', min_selections: 0, max_selections: 1,
      allow_repeat: false, is_active: true,
      availability: { tablet: true, delivery: true },
      options: [],
    });
    setOgSheetOpen(true);
  };

  const openEditOG = (og: MenuOptionGroup) => {
    setEditingOG(og);
    setOgSheetOpen(true);
  };

  const openLinkProducts = (og: MenuOptionGroup) => {
    setLinkingOG(og);
    setLinkDialogOpen(true);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="page-header-bar">
        <div className="page-header-content flex items-center gap-3">
          <div className="page-header-icon bg-primary/15">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="page-title">Cardápio</h1>
            <p className="page-subtitle">Gerencie categorias, produtos e opcionais</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="tab-command">
          <button
            className={`tab-command-item ${activeTab === 'menu' ? 'tab-command-item-active' : 'tab-command-inactive'}`}
            onClick={() => setActiveTab('menu')}
          >
            Cardápio
          </button>
          <button
            className={`tab-command-item ${activeTab === 'options' ? 'tab-command-item-active' : 'tab-command-inactive'}`}
            onClick={() => setActiveTab('options')}
          >
            Opcionais
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'menu' ? (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: Category Tree */}
            <div className="lg:w-[300px] shrink-0">
              <div className="card-base p-3">
                <MenuCategoryTree
                  categories={categories}
                  groups={groups}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={setSelectedGroupId}
                  onSaveCategory={saveCategory}
                  onDeleteCategory={deleteCategory}
                  onSaveGroup={saveGroup}
                  onDeleteGroup={deleteGroup}
                  getProductCount={(gid) => getProductsByGroup(gid).length}
                />
              </div>
            </div>

            {/* Right: Group Content */}
            <div className="flex-1">
              <MenuGroupContent
                group={selectedGroup}
                products={groupProducts}
                getOptionCount={(pid) => getLinkedOptionGroupIds(pid).length}
                onNewProduct={openNewProduct}
                onEditProduct={openEditProduct}
                onDeleteProduct={deleteProduct}
                onLinkOptions={openLinkOptionsForProduct}
              />
            </div>
          </div>
        ) : (
          <OptionGroupList
            optionGroups={optionGroups}
            onNew={openNewOG}
            onEdit={openEditOG}
            onDelete={deleteOptionGroup}
            onLinkProducts={openLinkProducts}
          />
        )}
      </div>

      {/* Product Sheet */}
      <ProductSheet
        open={productSheetOpen}
        onOpenChange={setProductSheetOpen}
        product={editingProduct}
        groups={groups}
        onSave={saveProduct}
        onDelete={deleteProduct}
      />

      {/* Option Group Sheet */}
      <OptionGroupSheet
        open={ogSheetOpen}
        onOpenChange={setOgSheetOpen}
        optionGroup={editingOG}
        onSave={saveOptionGroup}
        onDelete={deleteOptionGroup}
      />

      {/* Link Options Dialog */}
      <LinkOptionsDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        optionGroup={linkingOG}
        categories={categories}
        groups={groups}
        products={products}
        linkedProductIds={linkingOG ? getLinkedProductIds(linkingOG.id) : []}
        onSave={(ogId, pids) => setProductOptionLinks(ogId, pids)}
      />
    </AppLayout>
  );
}
