import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePackagingTemplates } from '@/hooks/usePackagingTemplates';

interface LocalItem {
  id?: string;
  name: string;
  cost: number;
  quantity: number;
}

interface EditingTemplate {
  id?: string;
  name: string;
  items: LocalItem[];
}

export function PackagingTemplatesSettings() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, isCreating, isUpdating } = usePackagingTemplates();
  const [editing, setEditing] = useState<EditingTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleNew = () => {
    setEditing({ name: '', items: [{ name: '', cost: 0, quantity: 1 }] });
    setDialogOpen(true);
  };

  const handleEdit = (tpl: typeof templates[0]) => {
    setEditing({
      id: tpl.id,
      name: tpl.name,
      items: tpl.items.map(i => ({ id: i.id, name: i.name, cost: i.cost, quantity: i.quantity })),
    });
    setDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!editing) return;
    setEditing({ ...editing, items: [...editing.items, { name: '', cost: 0, quantity: 1 }] });
  };

  const handleRemoveItem = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, items: editing.items.filter((_, i) => i !== idx) });
  };

  const handleItemChange = (idx: number, field: keyof LocalItem, value: string | number) => {
    if (!editing) return;
    const items = [...editing.items];
    items[idx] = { ...items[idx], [field]: value };
    setEditing({ ...editing, items });
  };

  const handleSave = () => {
    if (!editing || !editing.name.trim()) return;
    const validItems = editing.items.filter(i => i.name.trim());

    if (editing.id) {
      updateTemplate({ id: editing.id, name: editing.name.trim(), items: validItems });
    } else {
      createTemplate({ name: editing.name.trim(), items: validItems });
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const editingTotal = editing?.items.reduce((s, i) => s + (i.cost || 0) * (i.quantity || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AppIcon name="Package" className="h-4 w-4" />
            Templates de Embalagem
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Crie templates reutilizáveis com os itens de embalagem e vincule a cada receita
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
              Nenhum template criado. Crie um para vincular às receitas.
            </p>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <AppIcon name="Package" className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm truncate">{tpl.name}</span>
                      <span className="text-sm font-semibold text-primary ml-auto shrink-0">{formatCurrency(tpl.total_cost)}</span>
                    </div>
                    {tpl.items.length > 0 && (
                      <div className="mt-1 ml-6 text-xs text-muted-foreground">
                        {tpl.items.map(i => `${i.name} (${i.quantity}x)`).join(' • ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tpl)}>
                      <AppIcon name="Pencil" className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate(tpl.id)}>
                      <AppIcon name="Trash2" className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleNew} className="w-full">
            <AppIcon name="Plus" className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar Template' : 'Novo Template de Embalagem'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input
                value={editing?.name || ''}
                onChange={(e) => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Ex: Embalagem Lanche"
              />
            </div>

            <div className="space-y-2">
              <Label>Itens da Embalagem</Label>
              <div className="space-y-2">
                {editing?.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      placeholder="Nome do item"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={item.cost || ''}
                        onChange={(e) => handleItemChange(idx, 'cost', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center gap-1 w-16">
                      <Input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full"
                      />
                      <span className="text-xs text-muted-foreground">x</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemoveItem(idx)}>
                      <AppIcon name="X" className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <AppIcon name="Plus" className="h-3.5 w-3.5 mr-1" />
                Adicionar Item
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Custo Total:</span>
              <span className="font-bold text-primary">{formatCurrency(editingTotal)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating || !editing?.name?.trim()}>
              {editing?.id ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
