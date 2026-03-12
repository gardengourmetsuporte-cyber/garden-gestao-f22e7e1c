import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListPicker } from '@/components/ui/list-picker';
import { InventoryItem, Category, Supplier } from '@/types/database';
import { AppIcon } from '@/components/ui/app-icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ItemFormSheetProps {
  item?: InventoryItem | null;
  categories: Category[];
  suppliers?: Supplier[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    category_id: string | null;
    supplier_id: string | null;
    unit_type: 'unidade' | 'kg' | 'g' | 'litro' | 'ml';
    current_stock: number;
    min_stock: number;
    unit_price: number | null;
    stock_unit_label: string | null;
    purchase_unit_label: string | null;
    purchase_to_stock_factor: number | null;
  }) => void;
  onDelete?: (id: string) => void;
  onCreateSupplier?: (name: string) => Promise<{ id: string } | null>;
  isAdmin?: boolean;
}

export function ItemFormSheetNew({ 
  item, 
  categories, 
  suppliers = [],
  open, 
  onOpenChange, 
  onSave, 
  onDelete,
  onCreateSupplier,
  isAdmin 
}: ItemFormSheetProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [unitType, setUnitType] = useState<'unidade' | 'kg' | 'g' | 'litro' | 'ml'>('unidade');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [stockUnitLabel, setStockUnitLabel] = useState('');
  const [purchaseUnitLabel, setPurchaseUnitLabel] = useState('');
  const [purchaseToStockFactor, setPurchaseToStockFactor] = useState('');
  const [showPurchaseSection, setShowPurchaseSection] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.category_id || '');
      setSupplierId(item.supplier_id || '');
      setUnitType(item.unit_type as any);
      setCurrentStock(item.current_stock.toString());
      setMinStock(item.min_stock.toString());
      setUnitPrice(item.unit_price?.toString() || '');
      setStockUnitLabel(item.stock_unit_label || '');
      setPurchaseUnitLabel(item.purchase_unit_label || '');
      setPurchaseToStockFactor(item.purchase_to_stock_factor?.toString() || '');
      setShowPurchaseSection(!!item.purchase_unit_label || !!item.purchase_to_stock_factor);
    } else {
      setName('');
      setCategoryId('');
      setSupplierId('');
      setUnitType('unidade');
      setCurrentStock('');
      setMinStock('');
      setUnitPrice('');
      setStockUnitLabel('');
      setPurchaseUnitLabel('');
      setPurchaseToStockFactor('');
      setShowPurchaseSection(false);
    }
  }, [item, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      category_id: categoryId || null,
      supplier_id: supplierId || null,
      unit_type: unitType,
      current_stock: parseFloat(currentStock) || 0,
      min_stock: parseFloat(minStock) || 0,
      unit_price: unitPrice ? parseFloat(unitPrice) : null,
      stock_unit_label: stockUnitLabel.trim() || null,
      purchase_unit_label: purchaseUnitLabel.trim() || null,
      purchase_to_stock_factor: purchaseToStockFactor ? parseFloat(purchaseToStockFactor) : null,
    });
    
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item.id);
      onOpenChange(false);
    }
  };


  const isValid = name.trim();

  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-safe-bottom h-[85dvh] overflow-y-auto scroll-smooth overscroll-contain">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">
            {item ? 'Editar Item' : 'Novo Item'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">Nome do Item *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Hambúrguer 150g"
              className="input-large"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Categoria</Label>
            <button
              type="button"
              onClick={() => setCategoryPickerOpen(true)}
              className="flex items-center justify-between w-full h-14 px-4 text-lg rounded-xl border border-input bg-background hover:bg-accent/50 transition-colors"
            >
              <span className={categoryId ? 'text-foreground' : 'text-muted-foreground'}>
                {categoryId
                  ? categories.find(c => c.id === categoryId)?.name || 'Selecione a categoria'
                  : 'Selecione a categoria'}
              </span>
              <AppIcon name="ExpandMore" size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Supplier */}
          {suppliers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Fornecedor</Label>
              <button
                type="button"
                onClick={() => setSupplierPickerOpen(true)}
                className="flex items-center justify-between w-full h-14 px-4 text-lg rounded-xl border border-input bg-background hover:bg-accent/50 transition-colors"
              >
                <span className={supplierId ? 'text-foreground' : 'text-muted-foreground'}>
                  {supplierId
                    ? suppliers.find(s => s.id === supplierId)?.name || 'Selecione o fornecedor'
                    : 'Selecione o fornecedor'}
                </span>
                <AppIcon name="ExpandMore" size={20} className="text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Unit Type */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Tipo de Controle *</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { value: 'unidade', label: 'un' },
                { value: 'kg', label: 'kg' },
                { value: 'g', label: 'g' },
                { value: 'litro', label: 'L' },
                { value: 'ml', label: 'ml' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUnitType(option.value as any)}
                  className={`h-12 rounded-xl font-medium transition-all text-sm ${
                    unitType === option.value
                      ? 'gradient-primary text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock" className="text-base font-medium">
                Estoque Atual
              </Label>
              <Input
                id="currentStock"
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="0"
                className="input-large"
                step={unitType === 'unidade' ? 1 : 0.1}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock" className="text-base font-medium">
                Estoque Mínimo
              </Label>
              <Input
                id="minStock"
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="0"
                className="input-large"
                step={unitType === 'unidade' ? 1 : 0.1}
                min={0}
              />
            </div>
          </div>

          {/* Custom Stock Unit Label */}
          <div className="space-y-2">
            <Label htmlFor="stockUnitLabel" className="text-base font-medium">
              Nome personalizado da unidade
            </Label>
            <Input
              id="stockUnitLabel"
              value={stockUnitLabel}
              onChange={(e) => setStockUnitLabel(e.target.value)}
              placeholder={unitType === 'kg' ? 'kg' : unitType === 'g' ? 'g' : unitType === 'litro' ? 'litro' : unitType === 'ml' ? 'ml' : 'unidade'}
              className="input-large"
            />
            <p className="text-xs text-muted-foreground">
              Ex: pacote, saco, bandeja. Deixe vazio para usar o padrão.
            </p>
          </div>

          {/* Unit Price */}
          <div className="space-y-2">
            <Label htmlFor="unitPrice" className="text-base font-medium">
              Preço por {stockUnitLabel.trim() || (unitType === 'kg' ? 'kg' : unitType === 'g' ? 'g' : unitType === 'litro' ? 'L' : unitType === 'ml' ? 'ml' : 'unidade')}
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="unitPrice"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0,00"
                className="input-large pl-12"
                step={0.01}
                min={0}
              />
            </div>
          </div>

          {/* Recipe info note */}
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
            <p className="text-sm text-muted-foreground">
              💡 Nas fichas técnicas, você poderá usar unidades compatíveis (ex: kg↔g, L↔ml) e a conversão será automática.
            </p>
          </div>

          {/* Purchase unit section */}
          <Collapsible open={showPurchaseSection} onOpenChange={setShowPurchaseSection}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 justify-between text-base font-medium"
              >
                <span>📦 Configurar para Compras/Pedidos</span>
                {showPurchaseSection ? <AppIcon name="ExpandLess" size={20} /> : <AppIcon name="ExpandMore" size={20} />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure a unidade usada para pedir ao fornecedor.
                Ex: você compra por "caixa", cada caixa vem com 8 {stockUnitLabel.trim() || (unitType === 'kg' ? 'kg' : unitType === 'g' ? 'g' : unitType === 'litro' ? 'litros' : unitType === 'ml' ? 'ml' : 'unidades')}.
              </p>

              <div className="space-y-2">
                <Label htmlFor="purchaseUnitLabel" className="text-base font-medium">
                  Unidade de compra
                </Label>
                <Input
                  id="purchaseUnitLabel"
                  value={purchaseUnitLabel}
                  onChange={(e) => setPurchaseUnitLabel(e.target.value)}
                  placeholder="Ex: caixa, fardo, engradado"
                  className="input-large"
                />
              </div>

              {purchaseUnitLabel.trim() && (
                <div className="space-y-2">
                  <Label htmlFor="purchaseToStockFactor" className="text-base font-medium">
                    Qtd de {stockUnitLabel.trim() || (unitType === 'kg' ? 'kg' : unitType === 'g' ? 'g' : unitType === 'litro' ? 'litros' : unitType === 'ml' ? 'ml' : 'unidades')} por {purchaseUnitLabel.trim()}
                  </Label>
                  <Input
                    id="purchaseToStockFactor"
                    type="number"
                    value={purchaseToStockFactor}
                    onChange={(e) => setPurchaseToStockFactor(e.target.value)}
                    placeholder="Ex: 8"
                    className="input-large"
                    step={1}
                    min={1}
                  />
                  {parseFloat(purchaseToStockFactor) > 0 && parseFloat(unitPrice) > 0 && (
                    <p className="text-sm text-primary font-medium">
                      = R$ {(parseFloat(unitPrice) * parseFloat(purchaseToStockFactor)).toFixed(2)} por {purchaseUnitLabel.trim()}
                    </p>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <LoadingButton
              onClick={handleSave}
              disabled={!isValid}
              className="w-full h-14 text-lg font-semibold rounded-xl"
            >
              {item ? 'Salvar Alterações' : 'Adicionar Item'}
            </LoadingButton>

            {item && onDelete && isAdmin && (
              <Button
                variant="ghost"
                onClick={handleDelete}
                className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <AppIcon name="Delete" size={20} className="mr-2" />
                Excluir Item
              </Button>
            )}
          </div>
        </div>
      </SheetContent>

      <ListPicker
        nested
        open={categoryPickerOpen}
        onOpenChange={setCategoryPickerOpen}
        title="Selecionar Categoria"
        items={categories.map(c => ({ id: c.id, label: c.name }))}
        selectedId={categoryId || null}
        onSelect={(id) => setCategoryId(id || '')}
        allowNone
        noneLabel="Sem categoria"
      />

      <ListPicker
        nested
        open={supplierPickerOpen}
        onOpenChange={setSupplierPickerOpen}
        title="Selecionar Fornecedor"
        items={suppliers.map(s => ({ id: s.id, label: s.name }))}
        selectedId={supplierId || null}
        onSelect={(id) => setSupplierId(id || '')}
        allowNone
        noneLabel="Sem fornecedor"
        onCreateNew={onCreateSupplier ? async (name) => {
          const result = await onCreateSupplier(name);
          return result?.id || null;
        } : undefined}
        createLabel="Criar fornecedor"
        createPlaceholder="Nome do fornecedor"
      />
    </Sheet>
  );
}
