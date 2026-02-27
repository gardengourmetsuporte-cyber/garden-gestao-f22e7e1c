import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import type { MenuCategory, MenuGroup } from '@/hooks/useMenuAdmin';

interface Props {
  categories: MenuCategory[];
  groups: MenuGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onSaveCategory: (cat: Partial<MenuCategory> & { name: string }) => void;
  onDeleteCategory: (id: string) => void;
  onSaveGroup: (grp: Partial<MenuGroup> & { name: string; category_id: string }) => void;
  onDeleteGroup: (id: string) => void;
  getProductCount: (groupId: string) => number;
}

export function MenuCategoryTree({
  categories, groups, selectedGroupId,
  onSelectGroup, onSaveCategory, onDeleteCategory,
  onSaveGroup, onDeleteGroup, getProductCount,
}: Props) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(categories.map(c => c.id)));
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<MenuCategory>>({});
  const [grpDialog, setGrpDialog] = useState(false);
  const [editingGrp, setEditingGrp] = useState<Partial<MenuGroup> & { category_id?: string }>({});

  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openNewCategory = () => {
    setEditingCat({ name: '', icon: 'UtensilsCrossed', color: 'hsl(var(--primary))', is_active: true });
    setCatDialog(true);
  };

  const openEditCategory = (cat: MenuCategory) => {
    setEditingCat(cat);
    setCatDialog(true);
  };

  const handleSaveCat = () => {
    if (!editingCat.name) return;
    onSaveCategory(editingCat as any);
    setCatDialog(false);
  };

  const openNewGroup = (categoryId: string) => {
    setEditingGrp({ name: '', category_id: categoryId, is_active: true, availability: { tablet: true, delivery: true } });
    setGrpDialog(true);
  };

  const openEditGroup = (grp: MenuGroup) => {
    setEditingGrp(grp);
    setGrpDialog(true);
  };

  const handleSaveGrp = () => {
    if (!editingGrp.name || !editingGrp.category_id) return;
    onSaveGroup(editingGrp as any);
    setGrpDialog(false);
  };

  if (categories.length === 0) {
    return (
      <div className="card-base p-5">
        <div className="empty-state py-6">
          <div className="icon-glow icon-glow-lg icon-glow-muted mx-auto mb-3">
            <AppIcon name="BookOpen" size={24} />
          </div>
          <p className="empty-state-title">Nenhuma categoria</p>
          <p className="empty-state-text mb-4">Comece criando sua primeira categoria de cardápio</p>
          <Button size="sm" onClick={openNewCategory}>
            <AppIcon name="Plus" size={16} className="mr-1.5" /> Nova Categoria
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Add category button */}
      <button
        onClick={openNewCategory}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary transition-all active:scale-[0.97] bg-primary/[0.06] border border-dashed border-primary/20 hover:bg-primary/[0.1]"
      >
        <AppIcon name="Plus" size={16} /> Nova Categoria
      </button>

      {categories.map(cat => {
        const expanded = expandedCats.has(cat.id);
        const catGroups = groups.filter(g => g.category_id === cat.id);

        return (
          <div key={cat.id} className="card-base overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleCat(cat.id)}
                className="flex-1 flex items-center gap-2.5 px-3.5 py-3 text-sm font-semibold transition-all"
              >
                <div className="icon-glow icon-glow-sm icon-glow-primary">
                  <AppIcon name={cat.icon || 'Package'} size={16} />
                </div>
                <span className="flex-1 text-left text-foreground">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground mr-1">{catGroups.length} grupos</span>
                <AppIcon
                  name="ChevronDown"
                  size={14}
                  className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    !expanded && "-rotate-90"
                  )}
                />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-secondary/60 mr-1">
                    <AppIcon name="MoreVertical" size={14} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openNewGroup(cat.id)}>
                    <AppIcon name="Plus" size={14} className="mr-2" /> Novo Grupo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                    <AppIcon name="Pencil" size={14} className="mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteCategory(cat.id)} className="text-destructive">
                    <AppIcon name="Trash2" size={14} className="mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {expanded && (
              <div className="px-3 pb-3 space-y-1">
                <div className="h-px bg-border/30 mb-2" />
                {catGroups.map(grp => {
                  const count = getProductCount(grp.id);
                  const isSelected = selectedGroupId === grp.id;
                  const avail = grp.availability as any;
                  return (
                    <div key={grp.id} className="flex items-center gap-1">
                      <button
                        onClick={() => onSelectGroup(grp.id)}
                        className={cn(
                          "flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]",
                          isSelected
                            ? "finance-hero-card text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
                        )}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)' }}
                        />
                        <span className="flex-1 text-left truncate">{grp.name}</span>
                        <div className="flex items-center gap-1.5">
                          {avail?.tablet && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">Mesa</span>
                          )}
                          {avail?.delivery && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">Delivery</span>
                          )}
                          <span className="text-[10px] text-muted-foreground font-medium">{count}</span>
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-secondary/60">
                            <AppIcon name="MoreVertical" size={12} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditGroup(grp)}>
                            <AppIcon name="Pencil" size={14} className="mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteGroup(grp.id)} className="text-destructive">
                            <AppIcon name="Trash2" size={14} className="mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                <button
                  onClick={() => openNewGroup(cat.id)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-primary/5 rounded-xl transition-all w-full active:scale-[0.98]"
                >
                  <AppIcon name="Plus" size={12} /> Adicionar grupo
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat.id ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={editingCat.name || ''} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })} />
            </div>
            <div>
              <Label>Ícone (Material Symbol)</Label>
              <Input value={editingCat.icon || ''} onChange={e => setEditingCat({ ...editingCat, icon: e.target.value })} placeholder="UtensilsCrossed" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCat} disabled={!editingCat.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Dialog */}
      <Dialog open={grpDialog} onOpenChange={setGrpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGrp.id ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={editingGrp.name || ''} onChange={e => setEditingGrp({ ...editingGrp, name: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={editingGrp.description || ''} onChange={e => setEditingGrp({ ...editingGrp, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Disponível no Tablet (Mesa)</Label>
              <Switch
                checked={(editingGrp.availability as any)?.tablet ?? true}
                onCheckedChange={v => setEditingGrp({ ...editingGrp, availability: { ...(editingGrp.availability as any), tablet: v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Disponível no Delivery</Label>
              <Switch
                checked={(editingGrp.availability as any)?.delivery ?? true}
                onCheckedChange={v => setEditingGrp({ ...editingGrp, availability: { ...(editingGrp.availability as any), delivery: v } })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrpDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveGrp} disabled={!editingGrp.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}