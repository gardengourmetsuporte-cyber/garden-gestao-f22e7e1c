import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MenuCategory, MenuGroup, MenuProduct, MenuOptionGroup } from '@/hooks/useMenuAdmin';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionGroup: MenuOptionGroup | null;
  categories: MenuCategory[];
  groups: MenuGroup[];
  products: MenuProduct[];
  linkedProductIds: string[];
  onSave: (optionGroupId: string, productIds: string[]) => void;
}

export function LinkOptionsDialog({
  open, onOpenChange, optionGroup,
  categories, groups, products,
  linkedProductIds, onSave,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set(linkedProductIds));
  }, [linkedProductIds, open]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    const groupProducts = products.filter(p => p.group_id === groupId);
    const allSelected = groupProducts.every(p => selected.has(p.id));
    setSelected(prev => {
      const next = new Set(prev);
      groupProducts.forEach(p => allSelected ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  };

  const handleSave = () => {
    if (optionGroup) {
      onSave(optionGroup.id, Array.from(selected));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular "{optionGroup?.title}" a produtos</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-2">
            {categories.map(cat => {
              const catGroups = groups.filter(g => g.category_id === cat.id);
              if (catGroups.length === 0) return null;

              return (
                <div key={cat.id}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat.name}</p>
                  {catGroups.map(grp => {
                    const grpProducts = products.filter(p => p.group_id === grp.id);
                    if (grpProducts.length === 0) return null;
                    const allSelected = grpProducts.every(p => selected.has(p.id));
                    const someSelected = grpProducts.some(p => selected.has(p.id));

                    return (
                      <div key={grp.id} className="ml-2 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                            onCheckedChange={() => toggleGroup(grp.id)}
                          />
                          <span className="text-sm font-medium text-foreground">{grp.name}</span>
                          <span className="text-[10px] text-muted-foreground">({grpProducts.length})</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {grpProducts.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                              <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                              <span className="text-sm text-muted-foreground">{p.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Products without group */}
            {(() => {
              const ungrouped = products.filter(p => !p.group_id);
              if (ungrouped.length === 0) return null;
              return (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Sem Grupo</p>
                  <div className="ml-2 space-y-1">
                    {ungrouped.map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                        <span className="text-sm text-muted-foreground">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar ({selected.size} selecionados)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
