import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { FinanceCategory, CategoryType } from '@/types/finance';
import { cn } from '@/lib/utils';
import { CategoryManagement } from './CategoryManagement';

interface CategoryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: FinanceCategory[];
  type: CategoryType;
  selectedId: string | null;
  onSelect: (category: FinanceCategory) => void;
  onRefreshCategories?: () => Promise<void>;
}

export function CategoryPicker({
  open,
  onOpenChange,
  categories,
  type,
  selectedId,
  onSelect,
  onRefreshCategories
}: CategoryPickerProps) {
  const [viewingParent, setViewingParent] = useState<FinanceCategory | null>(null);
  const [managementOpen, setManagementOpen] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);
  const displayCategories = viewingParent 
    ? viewingParent.subcategories || []
    : filteredCategories;

  const handleSelect = (category: FinanceCategory) => {
    if (category.subcategories && category.subcategories.length > 0 && !viewingParent) {
      setViewingParent(category);
    } else {
      onSelect(category);
      onOpenChange(false);
      setViewingParent(null);
    }
  };

  const handleBack = () => {
    setViewingParent(null);
  };

  const handleClose = () => {
    setViewingParent(null);
    onOpenChange(false);
  };

  const handleOpenManagement = () => {
    setManagementOpen(true);
  };

  const handleManagementClose = async (isOpen: boolean) => {
    setManagementOpen(isOpen);
    if (!isOpen && onRefreshCategories) {
      await onRefreshCategories();
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center gap-2">
              {viewingParent && (
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <AppIcon name="ChevronLeft" size={20} />
                </Button>
              )}
              <SheetTitle className="flex-1">
                {viewingParent ? viewingParent.name : type === 'expense' ? 'Categorias de Despesa' : 'Categorias de Receita'}
              </SheetTitle>
              {onRefreshCategories && (
                <Button variant="ghost" size="icon" onClick={handleOpenManagement}>
                  <AppIcon name="Settings2" size={20} />
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="py-4 space-y-1 overflow-y-auto max-h-[calc(70vh-100px)]">
            {displayCategories.map(category => {
              const hasSubcategories = category.subcategories && category.subcategories.length > 0;
              const isSelected = selectedId === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => handleSelect(category)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-xl transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-secondary"
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <AppIcon name={category.icon} size={20} style={{ color: category.color }} />
                  </div>
                  <span className="flex-1 text-left font-medium">{category.name}</span>
                  {hasSubcategories && !viewingParent && (
                    <AppIcon name="ChevronRight" size={20} className="text-muted-foreground" />
                  )}
                </button>
              );
            })}

            {displayCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma categoria encontrada</p>
                {onRefreshCategories && (
                  <Button variant="link" onClick={handleOpenManagement} className="mt-2">
                    <AppIcon name="Plus" size={16} className="mr-1" />
                    Adicionar categoria
                  </Button>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {onRefreshCategories && (
        <CategoryManagement
          open={managementOpen}
          onOpenChange={handleManagementClose}
          categories={categories}
          onRefresh={onRefreshCategories}
        />
      )}
    </>
  );
}
