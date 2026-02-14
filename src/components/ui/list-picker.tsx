import { useState } from 'react';
import { Check, Plus, Loader2, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  /** If provided, shows a "Criar novo" input at the top of the list */
  onCreateNew?: (name: string) => Promise<string | null>;
  createLabel?: string;
  createPlaceholder?: string;
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
  onCreateNew,
  createLabel = 'Criar novo',
  createPlaceholder = 'Nome...',
}: ListPickerProps) {
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);

  const handleSelect = (id: string | null) => {
    onSelect(id);
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setSearch('');
    setNewName('');
    setShowCreateInput(false);
  };

  const handleCreate = async () => {
    if (!onCreateNew || !newName.trim()) return;
    setIsCreating(true);
    try {
      const newId = await onCreateNew(newName.trim());
      if (newId) {
        onSelect(newId);
        onOpenChange(false);
      }
      resetState();
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = items.filter(item =>
    !search || item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
       <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="pb-3 border-b border-border/20">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="pt-3 flex flex-col h-[calc(70vh-80px)]" data-vaul-no-drag>
          {/* Search + Create button row */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 h-10 rounded-xl bg-secondary/50 border-border/20 text-sm"
              />
            </div>
            {onCreateNew && !showCreateInput && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1 shrink-0"
                onClick={() => setShowCreateInput(true)}
              >
                <Plus className="w-4 h-4" />
                Novo
              </Button>
            )}
          </div>

          {/* Inline create input */}
          {showCreateInput && onCreateNew && (
            <div className="flex gap-2 mb-3">
              <Input
                data-vaul-no-drag
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={createPlaceholder}
                className="h-10 flex-1 rounded-xl"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    e.preventDefault();
                    handleCreate();
                  }
                  if (e.key === 'Escape') {
                    setShowCreateInput(false);
                    setNewName('');
                  }
                }}
              />
              <Button
                size="sm"
                className="h-10"
                disabled={!newName.trim() || isCreating}
                onClick={handleCreate}
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
              </Button>
            </div>
          )}

          {/* Item list */}
          <div className="flex-1 overflow-y-auto space-y-0.5">
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

            {filtered.map(item => {
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

            {filtered.length === 0 && !showCreateInput && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum item encontrado</p>
                {onCreateNew && (
                  <button
                    onClick={() => { setShowCreateInput(true); setNewName(search); }}
                    className="text-primary text-sm mt-2 hover:underline"
                  >
                    Criar "{search}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
