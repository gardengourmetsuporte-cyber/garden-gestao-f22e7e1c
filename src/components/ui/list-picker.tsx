import { Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface ListPickerItem {
  id: string;
  label: string;
}

interface ListPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ListPickerItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  allowNone?: boolean;
  noneLabel?: string;
}

export function ListPicker({
  open,
  onOpenChange,
  title,
  items,
  selectedId,
  onSelect,
  allowNone = false,
  noneLabel = 'Nenhum',
}: ListPickerProps) {
  const handleSelect = (id: string | null) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-1 overflow-y-auto max-h-[calc(70vh-100px)]">
          {allowNone && (
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl transition-colors",
                selectedId === null ? "bg-primary/10" : "hover:bg-secondary"
              )}
            >
              <span className="flex-1 text-left font-medium text-muted-foreground">{noneLabel}</span>
              {selectedId === null && <Check className="w-5 h-5 text-primary" />}
            </button>
          )}

          {items.map(item => {
            const isSelected = selectedId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-xl transition-colors",
                  isSelected ? "bg-primary/10" : "hover:bg-secondary"
                )}
              >
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {isSelected && <Check className="w-5 h-5 text-primary" />}
              </button>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum item encontrado</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
