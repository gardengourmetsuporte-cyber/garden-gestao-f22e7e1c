import { useState } from 'react';
import { X, Package, Soup, AlertTriangle, Pencil, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { formatCurrency, type RecipeUnitType, type IngredientSourceType, calculateIngredientCost, calculateSubRecipeCost } from '@/types/recipe';
import { cn } from '@/lib/utils';

interface IngredientRowProps {
  ingredient: {
    source_type: IngredientSourceType;
    item_id: string | null;
    item_name: string | null;
    item_unit: string | null;
    item_price: number | null;
    source_recipe_id: string | null;
    source_recipe_name: string | null;
    source_recipe_unit: string | null;
    source_recipe_cost: number | null;
    quantity: number;
    unit_type: RecipeUnitType;
    total_cost: number;
  };
  onChange: (updates: Partial<IngredientRowProps['ingredient']>) => void;
  onRemove: () => void;
  onUpdateGlobalPrice?: (itemId: string, newPrice: number) => Promise<void>;
}

const UNIT_OPTIONS: { value: RecipeUnitType; label: string }[] = [
  { value: 'unidade', label: 'un' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'litro', label: 'L' },
  { value: 'ml', label: 'ml' },
];

export function IngredientRow({ ingredient, onChange, onRemove, onUpdateGlobalPrice }: IngredientRowProps) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPriceValue, setNewPriceValue] = useState('');
  const [showGlobalWarning, setShowGlobalWarning] = useState(false);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const isSubRecipe = ingredient.source_type === 'recipe';
  const baseUnit = isSubRecipe ? ingredient.source_recipe_unit : ingredient.item_unit;
  // Allow all units freely - the recipe's "usage unit" is independent from stock
  const allUnits: RecipeUnitType[] = ['unidade', 'kg', 'g', 'litro', 'ml'];

  const basePrice = isSubRecipe
    ? ingredient.source_recipe_cost || 0
    : ingredient.item_price || 0;

  const displayName = isSubRecipe
    ? ingredient.source_recipe_name
    : ingredient.item_name;

  const displayUnit = baseUnit || 'unidade';
  const hasNoPrice = !isSubRecipe && (ingredient.item_price === null || ingredient.item_price === 0);

  const handleQuantityChange = (value: string) => {
    const quantity = parseFloat(value) || 0;
    const total_cost = isSubRecipe
      ? calculateSubRecipeCost(basePrice, displayUnit, quantity, ingredient.unit_type)
      : calculateIngredientCost(basePrice, displayUnit, quantity, ingredient.unit_type);
    onChange({ quantity, total_cost });
  };

  const handleUnitChange = (unit_type: RecipeUnitType) => {
    const total_cost = isSubRecipe
      ? calculateSubRecipeCost(basePrice, displayUnit, ingredient.quantity, unit_type)
      : calculateIngredientCost(basePrice, displayUnit, ingredient.quantity, unit_type);
    onChange({ unit_type, total_cost });
  };

  const handleStartEditPrice = () => {
    setNewPriceValue(String(ingredient.item_price || ''));
    setEditingPrice(true);
  };

  const handleConfirmPriceEdit = () => {
    const newPrice = parseFloat(newPriceValue) || 0;
    if (newPrice !== ingredient.item_price) {
      setShowGlobalWarning(true);
    } else {
      setEditingPrice(false);
    }
  };

  const handleSaveGlobalPrice = async () => {
    if (!ingredient.item_id || !onUpdateGlobalPrice) return;
    const newPrice = parseFloat(newPriceValue) || 0;

    setIsSavingPrice(true);
    try {
      await onUpdateGlobalPrice(ingredient.item_id, newPrice);
      // Update local state immediately
      const total_cost = calculateIngredientCost(newPrice, displayUnit, ingredient.quantity, ingredient.unit_type);
      onChange({ item_price: newPrice, total_cost });
    } finally {
      setIsSavingPrice(false);
      setShowGlobalWarning(false);
      setEditingPrice(false);
    }
  };

  return (
    <>
      <div className={cn(
        "p-4 rounded-xl space-y-3 border",
        hasNoPrice ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20" : "border-border bg-secondary/30"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "p-1.5 rounded-lg shrink-0",
              isSubRecipe ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : "bg-primary/10 text-primary"
            )}>
              {isSubRecipe ? <Soup className="h-4 w-4" /> : <Package className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {isSubRecipe ? 'Sub-receita' : `Estoque: ${displayUnit}`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Alert for no price */}
        {hasNoPrice && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/20 px-2 py-1.5 rounded-md">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Sem preço definido — custo não será calculado</span>
          </div>
        )}

        {/* Price Section */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {isSubRecipe ? 'Custo por porção' : 'Preço global'}
            </Label>
            {isSubRecipe ? (
              <Badge variant="outline" className="text-[10px] h-5">Sincronizado</Badge>
            ) : onUpdateGlobalPrice && !editingPrice ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={handleStartEditPrice}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
            ) : null}
          </div>

          {editingPrice ? (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newPriceValue}
                onChange={(e) => setNewPriceValue(e.target.value)}
                className="h-8 flex-1 text-sm"
                autoFocus
              />
              <span className="text-muted-foreground text-xs">/{displayUnit}</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary shrink-0" onClick={handleConfirmPriceEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0" onClick={() => setEditingPrice(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold">{formatCurrency(basePrice)}/{displayUnit}</p>
          )}
        </div>

        {/* Quantity + Unit + Cost */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Quantidade</Label>
            <Input
              type="number"
              value={ingredient.quantity || ''}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="h-9"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Unidade</Label>
            <Select value={ingredient.unit_type} onValueChange={handleUnitChange}>
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.filter((u) => allUnits.includes(u.value)).map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-right pb-0.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Custo</Label>
            <p className={cn(
              "text-base font-bold mt-1",
              hasNoPrice ? "text-amber-500" : "text-primary"
            )}>
              {hasNoPrice ? '—' : formatCurrency(ingredient.total_cost)}
            </p>
          </div>
        </div>

        {/* Conversion info */}
        {!hasNoPrice && ingredient.unit_type !== displayUnit && (
          <p className="text-[11px] text-muted-foreground italic">
            Conversão: {ingredient.quantity} {UNIT_OPTIONS.find(u => u.value === ingredient.unit_type)?.label} → {displayUnit} (automática)
          </p>
        )}
      </div>

      {/* Global Price Warning Dialog */}
      <AlertDialog open={showGlobalWarning} onOpenChange={setShowGlobalWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar preço global</AlertDialogTitle>
            <AlertDialogDescription>
              Esta alteração atualizará o custo de <strong>{displayName}</strong> em{' '}
              <strong>todas as fichas técnicas</strong> que utilizam este ingrediente.
              <br /><br />
              Novo preço: <strong>{formatCurrency(parseFloat(newPriceValue) || 0)}/{displayUnit}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingPrice}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveGlobalPrice} disabled={isSavingPrice}>
              {isSavingPrice ? 'Atualizando...' : 'Confirmar alteração'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
