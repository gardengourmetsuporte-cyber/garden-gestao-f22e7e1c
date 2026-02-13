import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getLucideIcon } from '@/lib/icons';
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
    setEditingCat({ name: '', icon: 'UtensilsCrossed', color: '#6366f1', is_active: true });
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

  return (
    <div className="space-y-2">
      <Button onClick={openNewCategory} size="sm" className="w-full mb-3">
        <Plus className="w-4 h-4 mr-1" /> Nova Categoria
      </Button>

      {categories.map(cat => {
        const expanded = expandedCats.has(cat.id);
        const catGroups = groups.filter(g => g.category_id === cat.id);
        const IconComp = getLucideIcon(cat.icon || 'UtensilsCrossed');

        return (
          <div key={cat.id}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleCat(cat.id)}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-secondary/50"
                style={{ borderLeft: `3px solid ${cat.color}` }}
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                {IconComp && <IconComp className="w-4 h-4" style={{ color: cat.color }} />}
                <span className="flex-1 text-left text-foreground">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground">{catGroups.length}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg hover:bg-secondary/60">
                    <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openNewGroup(cat.id)}>
                    <Plus className="w-3.5 h-3.5 mr-2" /> Novo Grupo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteCategory(cat.id)} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {expanded && (
              <div className="ml-6 mt-1 space-y-0.5">
                {catGroups.map(grp => {
                  const count = getProductCount(grp.id);
                  const isSelected = selectedGroupId === grp.id;
                  const avail = grp.availability as any;
                  return (
                    <div key={grp.id} className="flex items-center gap-1">
                      <button
                        onClick={() => onSelectGroup(grp.id)}
                        className={cn(
                          "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                          isSelected
                            ? "bg-primary/10 text-foreground border border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        )}
                      >
                        <span className="flex-1 text-left truncate">{grp.name}</span>
                        <div className="flex items-center gap-1">
                          {avail?.tablet && <Badge variant="secondary" className="text-[8px] px-1 py-0">Mesa</Badge>}
                          {avail?.delivery && <Badge variant="secondary" className="text-[8px] px-1 py-0">Delivery</Badge>}
                          <span className="text-[10px] text-muted-foreground">{count}</span>
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-secondary/60">
                            <MoreVertical className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditGroup(grp)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteGroup(grp.id)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                <button
                  onClick={() => openNewGroup(cat.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-primary hover:bg-primary/5 rounded-lg transition-all w-full"
                >
                  <Plus className="w-3 h-3" /> Adicionar grupo
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
              <Label>Ícone (Lucide)</Label>
              <Input value={editingCat.icon || ''} onChange={e => setEditingCat({ ...editingCat, icon: e.target.value })} placeholder="UtensilsCrossed" />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={editingCat.color || '#6366f1'} onChange={e => setEditingCat({ ...editingCat, color: e.target.value })} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                <Input value={editingCat.color || ''} onChange={e => setEditingCat({ ...editingCat, color: e.target.value })} className="flex-1" />
              </div>
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
