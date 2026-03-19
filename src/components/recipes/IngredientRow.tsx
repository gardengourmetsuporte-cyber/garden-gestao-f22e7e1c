import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { AppIcon } from '@/components/ui/app-icon';

type KDSStationOption = { id: string; name: string; color: string };

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
    kds_station_id?: string | null;
  };
  onChange: (updates: Partial<IngredientRowProps['ingredient']>) => void;
  onRemove: () => void;
  onUpdateGlobalPrice?: (itemId: string, newPrice: number) => Promise<void>;
  onUpdateItemUnit?: (itemId: string, unitType: string) => Promise<void>;
  kdsStations?: KDSStationOption[];
}

const UNIT_OPTIONS: { value: RecipeUnitType; label: string }[] = [
  { value: 'unidade', label: 'un' },
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'litro', label: 'L' },
  { value: 'ml', label: 'ml' },
];

export function IngredientRow({ ingredient, onChange, onRemove, onUpdateGlobalPrice, onUpdateItemUnit, kdsStations = [] }: IngredientRowProps) {
  const [editPopoverOpen, setEditPopoverOpen] = useState(false);
  const [newPriceValue, setNewPriceValue] = useState('');
  const [newBaseUnit, setNewBaseUnit] = useState<string>('');
  const [showGlobalWarning, setShowGlobalWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ price?: number; unit?: string }>({});

  const isSubRecipe = ingredient.source_type === 'recipe';
  const baseUnit = isSubRecipe ? ingredient.source_recipe_unit : ingredient.item_unit;
  const basePrice = isSubRecipe ? ingredient.source_recipe_cost || 0 : ingredient.item_price || 0;
  const displayName = isSubRecipe ? ingredient.source_recipe_name : ingredient.item_name;
  const displayUnit = baseUnit || 'unidade';
  const hasNoPrice = !isSubRecipe && (ingredient.item_price === null || ingredient.item_price === 0);

  // Show all unit options — recipe may use a different unit family than inventory
  const filteredUnitOptions = UNIT_OPTIONS;
  const unitLabel = UNIT_OPTIONS.find(u => u.value === displayUnit)?.label || displayUnit;

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

  const handleOpenEditPopover = () => {
    setNewPriceValue(String(ingredient.item_price || ''));
    setNewBaseUnit(displayUnit);
    setEditPopoverOpen(true);
  };

  const handleConfirmEdit = () => {
    const newPrice = parseFloat(newPriceValue) || 0;
    const unitChanged = newBaseUnit !== displayUnit;
    const priceChanged = newPrice !== ingredient.item_price;

    if (!priceChanged && !unitChanged) {
      setEditPopoverOpen(false);
      return;
    }

    setPendingChanges({
      ...(priceChanged ? { price: newPrice } : {}),
      ...(unitChanged ? { unit: newBaseUnit } : {}),
    });
    setShowGlobalWarning(true);
    setEditPopoverOpen(false);
  };

  const handleSaveGlobalChanges = async () => {
    if (!ingredient.item_id) return;
    setIsSaving(true);
    try {
      if (pendingChanges.price !== undefined && onUpdateGlobalPrice) {
        await onUpdateGlobalPrice(ingredient.item_id, pendingChanges.price);
      }
      if (pendingChanges.unit && onUpdateItemUnit) {
        await onUpdateItemUnit(ingredient.item_id, pendingChanges.unit);
      }

      const finalPrice = pendingChanges.price ?? ingredient.item_price ?? 0;
      const finalBaseUnit = pendingChanges.unit ?? displayUnit;
      const total_cost = calculateIngredientCost(finalPrice, finalBaseUnit, ingredient.quantity, ingredient.unit_type);

      onChange({
        ...(pendingChanges.price !== undefined ? { item_price: pendingChanges.price } : {}),
        ...(pendingChanges.unit ? { item_unit: pendingChanges.unit } : {}),
        total_cost,
      });

      setShowGlobalWarning(false);
    } catch (err) {
      console.error('Erro ao salvar alterações:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className={cn(
        "p-3 rounded-xl border",
        hasNoPrice ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20" : "border-border bg-secondary/30"
      )}>
        {/* Header: Name + price inline + edit + remove */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "p-1.5 rounded-lg shrink-0",
              isSubRecipe ? "bg-accent/10 text-accent dark:bg-accent/20" : "bg-primary/10 text-primary"
            )}>
              {isSubRecipe ? <AppIcon name="Soup" className="h-4 w-4" /> : <AppIcon name="Package" className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {isSubRecipe ? 'Sub-receita' : (
                  hasNoPrice ? (
                    <span className="text-amber-500">Sem preço definido</span>
                  ) : (
                    <>{formatCurrency(basePrice)}/{unitLabel}</>
                  )
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Edit button - only for inventory items */}
            {!isSubRecipe && (onUpdateGlobalPrice || onUpdateItemUnit) && (
              <Popover open={editPopoverOpen} onOpenChange={(open) => {
                if (open) handleOpenEditPopover();
                else setEditPopoverOpen(false);
              }}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                  >
                    <AppIcon name="Pencil" className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Editar item</p>

                    {onUpdateItemUnit && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Unidade base (estoque)</Label>
                        <Select value={newBaseUnit} onValueChange={setNewBaseUnit}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {onUpdateGlobalPrice && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Preço por unidade</Label>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-sm">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newPriceValue}
                            onChange={(e) => setNewPriceValue(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="ghost" size="sm" className="flex-1 h-8" onClick={() => setEditPopoverOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" className="flex-1 h-8" onClick={handleConfirmEdit}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
              onClick={onRemove}
            >
              <AppIcon name="X" className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main row: Quantity + Unit + Cost */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={ingredient.quantity || ''}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="h-9 w-20 text-sm"
            placeholder="0"
            min="0"
            step="0.01"
          />

          <Select value={ingredient.unit_type} onValueChange={handleUnitChange}>
            <SelectTrigger className="w-[70px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredUnitOptions.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground text-sm">=</span>

          <p className={cn(
            "text-sm font-bold flex-1 text-right",
            hasNoPrice ? "text-amber-500" : "text-primary"
          )}>
            {hasNoPrice ? '—' : formatCurrency(ingredient.total_cost)}
          </p>
        </div>

        {/* Conversion note — only when units differ */}
        {!hasNoPrice && ingredient.unit_type !== displayUnit && (
          <p className="text-[11px] text-muted-foreground italic mt-1.5">
            {ingredient.quantity} {UNIT_OPTIONS.find(u => u.value === ingredient.unit_type)?.label} → {unitLabel}
          </p>
        )}

        {/* KDS Station */}
        {kdsStations.length > 0 && (
          <div className="mt-2">
            <Select
              value={ingredient.kds_station_id || 'none'}
              onValueChange={(v) => onChange({ kds_station_id: v === 'none' ? null : v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <div className="flex items-center gap-1.5">
                  <AppIcon name="Monitor" className="h-3 w-3 text-muted-foreground" />
                  <SelectValue placeholder="Pista KDS" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma pista</SelectItem>
                {kdsStations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Global Warning Dialog */}
      <AlertDialog open={showGlobalWarning} onOpenChange={setShowGlobalWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar item globalmente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta alteração atualizará <strong>{displayName}</strong> em{' '}
              <strong>todas as fichas técnicas</strong> que utilizam este item.
              {pendingChanges.price !== undefined && (
                <>
                  <br />Novo preço: <strong>{formatCurrency(pendingChanges.price)}/{UNIT_OPTIONS.find(u => u.value === (pendingChanges.unit || displayUnit))?.label}</strong>
                </>
              )}
              {pendingChanges.unit && (
                <>
                  <br />Nova unidade base: <strong>{UNIT_OPTIONS.find(u => u.value === pendingChanges.unit)?.label}</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button onClick={handleSaveGlobalChanges} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Confirmar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
