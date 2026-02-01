import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronRight,
  GripVertical,
  Folder,
  FileText,
  Calendar,
  CalendarDays,
  CalendarRange,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { ChecklistSector, ChecklistSubcategory, ItemFrequency, ChecklistType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

const frequencyOptions: { value: ItemFrequency; label: string; icon: typeof Calendar }[] = [
  { value: 'daily', label: 'Diária', icon: Calendar },
  { value: 'weekly', label: 'Semanal', icon: CalendarDays },
  { value: 'monthly', label: 'Mensal', icon: CalendarRange },
];

const checklistTypeOptions: { value: ChecklistType; label: string; icon: typeof Sun }[] = [
  { value: 'abertura', label: 'Abertura', icon: Sun },
  { value: 'fechamento', label: 'Fechamento', icon: Moon },
  { value: 'limpeza', label: 'Limpeza', icon: Sparkles },
];

interface ChecklistSettingsProps {
  sectors: ChecklistSector[];
  onAddSector: (data: { name: string; color: string }) => Promise<void>;
  onUpdateSector: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  onDeleteSector: (id: string) => Promise<void>;
  onAddSubcategory: (data: { sector_id: string; name: string }) => Promise<void>;
  onUpdateSubcategory: (id: string, data: { name?: string }) => Promise<void>;
  onDeleteSubcategory: (id: string) => Promise<void>;
  onAddItem: (data: { subcategory_id: string; name: string; description?: string; frequency?: ItemFrequency; checklist_type?: ChecklistType }) => Promise<void>;
  onUpdateItem: (id: string, data: { name?: string; description?: string; is_active?: boolean; frequency?: ItemFrequency; checklist_type?: ChecklistType }) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export function ChecklistSettings({
  sectors,
  onAddSector,
  onUpdateSector,
  onDeleteSector,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: ChecklistSettingsProps) {
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  
  // Sheet states
  const [sectorSheetOpen, setSectorSheetOpen] = useState(false);
  const [subcategorySheetOpen, setSubcategorySheetOpen] = useState(false);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  
  // Editing states
  const [editingSector, setEditingSector] = useState<ChecklistSector | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<ChecklistSubcategory | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  
  // Form states
  const [sectorName, setSectorName] = useState('');
  const [sectorColor, setSectorColor] = useState('#6366f1');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemFrequency, setItemFrequency] = useState<ItemFrequency>('daily');
  const [itemChecklistType, setItemChecklistType] = useState<ChecklistType>('abertura');

  const getFrequencyLabel = (freq: ItemFrequency) => {
    return frequencyOptions.find(f => f.value === freq)?.label || 'Diária';
  };

  const getChecklistTypeLabel = (type: ChecklistType) => {
    return checklistTypeOptions.find(t => t.value === type)?.label || 'Abertura';
  };

  const getChecklistTypeIcon = (type: ChecklistType) => {
    switch (type) {
      case 'abertura': return Sun;
      case 'fechamento': return Moon;
      case 'limpeza': return Sparkles;
    }
  };

  const toggleSector = (sectorId: string) => {
    setExpandedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectorId)) {
        newSet.delete(sectorId);
      } else {
        newSet.add(sectorId);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
      return newSet;
    });
  };

  // Sector handlers
  const handleOpenSectorSheet = (sector?: ChecklistSector) => {
    if (sector) {
      setEditingSector(sector);
      setSectorName(sector.name);
      setSectorColor(sector.color);
    } else {
      setEditingSector(null);
      setSectorName('');
      setSectorColor('#6366f1');
    }
    setSectorSheetOpen(true);
  };

  const handleSaveSector = async () => {
    if (!sectorName.trim()) return;

    if (editingSector) {
      await onUpdateSector(editingSector.id, { name: sectorName.trim(), color: sectorColor });
    } else {
      await onAddSector({ name: sectorName.trim(), color: sectorColor });
    }
    setSectorSheetOpen(false);
  };

  // Subcategory handlers
  const handleOpenSubcategorySheet = (sectorId: string, subcategory?: ChecklistSubcategory) => {
    setSelectedSectorId(sectorId);
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubcategoryName(subcategory.name);
    } else {
      setEditingSubcategory(null);
      setSubcategoryName('');
    }
    setSubcategorySheetOpen(true);
  };

  const handleSaveSubcategory = async () => {
    if (!subcategoryName.trim() || !selectedSectorId) return;

    if (editingSubcategory) {
      await onUpdateSubcategory(editingSubcategory.id, { name: subcategoryName.trim() });
    } else {
      await onAddSubcategory({ sector_id: selectedSectorId, name: subcategoryName.trim() });
    }
    setSubcategorySheetOpen(false);
  };

  // Item handlers
  const handleOpenItemSheet = (subcategoryId: string, item?: any) => {
    setSelectedSubcategoryId(subcategoryId);
    if (item) {
      setEditingItem(item);
      setItemName(item.name || '');
      setItemDescription(item.description || '');
      setItemFrequency(item.frequency || 'daily');
      setItemChecklistType(item.checklist_type || 'abertura');
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDescription('');
      setItemFrequency('daily');
      setItemChecklistType('abertura');
    }
    setItemSheetOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) return;

    if (editingItem) {
      await onUpdateItem(editingItem.id, {
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        frequency: itemFrequency,
        checklist_type: itemChecklistType,
      });
    } else if (selectedSubcategoryId) {
      await onAddItem({
        subcategory_id: selectedSubcategoryId,
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        frequency: itemFrequency,
        checklist_type: itemChecklistType,
      });
    }
    setItemSheetOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Add Sector Button */}
      <Button
        onClick={() => handleOpenSectorSheet()}
        className="w-full gap-2"
        variant="outline"
      >
        <Plus className="w-4 h-4" />
        Novo Setor
      </Button>

      {/* Sectors List */}
      {sectors.map(sector => {
        const isExpanded = expandedSectors.has(sector.id);

        return (
          <div key={sector.id} className="bg-card rounded-xl border overflow-hidden">
            {/* Sector Header */}
            <div className="flex items-center gap-2 p-3 bg-secondary/30">
              <button
                onClick={() => toggleSector(sector.id)}
                className="flex-1 flex items-center gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: sector.color }}
                >
                  <Folder className="w-4 h-4" />
                </div>
                <span className="font-semibold text-foreground">{sector.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({sector.subcategories?.length || 0} subcategorias)
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenSubcategorySheet(sector.id)}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"
                  title="Adicionar subcategoria"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenSectorSheet(sector)}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteSector(sector.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Subcategories */}
            {isExpanded && (
              <div className="p-2 space-y-2">
                {sector.subcategories?.map(subcategory => {
                  const isSubExpanded = expandedSubcategories.has(subcategory.id);

                  return (
                    <div key={subcategory.id} className="bg-secondary/20 rounded-lg overflow-hidden">
                      {/* Subcategory Header */}
                      <div className="flex items-center gap-2 p-2">
                        <button
                          onClick={() => toggleSubcategory(subcategory.id)}
                          className="flex-1 flex items-center gap-2"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{subcategory.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({subcategory.items?.length || 0} itens)
                          </span>
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenItemSheet(subcategory.id)}
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary"
                            title="Adicionar item"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleOpenSubcategorySheet(sector.id, subcategory)}
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteSubcategory(subcategory.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          {isSubExpanded ? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      {isSubExpanded && subcategory.items && subcategory.items.length > 0 && (
                        <div className="px-2 pb-2 space-y-1">
                          {subcategory.items.map(item => (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg bg-card",
                                !item.is_active && "opacity-50"
                              )}
                            >
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium">{item.name}</p>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                    {getFrequencyLabel(item.frequency || 'daily')}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-1">
                                    {(() => {
                                      const itemType = (item as any).checklist_type || 'abertura';
                                      const Icon = getChecklistTypeIcon(itemType as ChecklistType);
                                      return <Icon className="w-3 h-3" />;
                                    })()}
                                    {getChecklistTypeLabel(((item as any).checklist_type || 'abertura') as ChecklistType)}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => onUpdateItem(item.id, { is_active: !item.is_active })}
                                className={cn(
                                  "text-xs px-2 py-1 rounded",
                                  item.is_active 
                                    ? "bg-success/10 text-success" 
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {item.is_active ? 'Ativo' : 'Inativo'}
                              </button>
                              <button
                                onClick={() => handleOpenItemSheet(subcategory.id, item)}
                                className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => onDeleteItem(item.id)}
                                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!sector.subcategories || sector.subcategories.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma subcategoria. Clique em + para adicionar.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {sectors.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum setor configurado</p>
          <p className="text-sm mt-1">Clique em "Novo Setor" para começar</p>
        </div>
      )}

      {/* Sector Sheet */}
      <Sheet open={sectorSheetOpen} onOpenChange={setSectorSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingSector ? 'Editar Setor' : 'Novo Setor'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome do Setor</Label>
              <Input
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                placeholder="Ex: Cozinha"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSectorColor(color)}
                    className={`w-full aspect-square rounded-xl transition-all ${
                      sectorColor === color
                        ? 'ring-2 ring-primary ring-offset-2'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveSector}
              disabled={!sectorName.trim()}
              className="w-full h-12"
            >
              {editingSector ? 'Salvar' : 'Criar Setor'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Subcategory Sheet */}
      <Sheet open={subcategorySheetOpen} onOpenChange={setSubcategorySheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome da Subcategoria</Label>
              <Input
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                placeholder="Ex: Pista Fria"
                className="h-12"
              />
            </div>

            <Button
              onClick={handleSaveSubcategory}
              disabled={!subcategoryName.trim()}
              className="w-full h-12"
            >
              {editingSubcategory ? 'Salvar' : 'Criar Subcategoria'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Item Sheet */}
      <Sheet open={itemSheetOpen} onOpenChange={setItemSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</SheetTitle>
          </SheetHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome do Item</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ex: Verificar temperatura"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Ex: Deve estar entre 2°C e 8°C"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={itemFrequency} onValueChange={(v) => setItemFrequency(v as ItemFrequency)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Checklist</Label>
              <Select value={itemChecklistType} onValueChange={(v) => setItemChecklistType(v as ChecklistType)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {checklistTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSaveItem}
              disabled={!itemName.trim()}
              className="w-full h-12"
            >
              {editingItem ? 'Salvar Item' : 'Criar Item'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
