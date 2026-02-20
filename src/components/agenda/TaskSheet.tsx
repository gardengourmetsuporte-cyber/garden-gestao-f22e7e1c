import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, Folder, Plus, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ListPicker, ListPickerItem } from '@/components/ui/list-picker';
import { cn } from '@/lib/utils';
import type { ManagerTask, TaskCategory } from '@/types/agenda';

interface TaskFormData {
  title: string; 
  notes?: string;
  due_date?: string; 
  due_time?: string;
  category_id?: string;
}

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: TaskFormData) => void;
  onUpdate?: (task: TaskFormData & { id: string }) => void;
  onDelete?: (id: string) => void;
  isSubmitting?: boolean;
  editingTask?: ManagerTask | null;
  categories: TaskCategory[];
  onAddCategory: (category: { name: string; color: string }) => void;
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

export function TaskSheet({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onUpdate,
  onDelete,
  isSubmitting,
  editingTask,
  categories,
  onAddCategory
}: TaskSheetProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [hasDate, setHasDate] = useState(true);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [hasTime, setHasTime] = useState(false);
  const [dueTime, setDueTime] = useState('09:00');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes || '');
      setHasDate(!!editingTask.due_date);
      setDueDate(editingTask.due_date ? new Date(editingTask.due_date + 'T12:00:00') : new Date());
      setHasTime(!!editingTask.due_time);
      setDueTime(editingTask.due_time || '09:00');
      setCategoryId(editingTask.category_id || null);
    } else {
      resetForm();
    }
  }, [editingTask, open]);

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setHasDate(true);
    setDueDate(new Date());
    setHasTime(false);
    setDueTime('09:00');
    setCategoryId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const formData: TaskFormData = { 
      title: title.trim(), 
      notes: notes.trim() || undefined,
      due_date: hasDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      due_time: hasTime ? dueTime : undefined,
      category_id: categoryId || undefined
    };

    if (editingTask && onUpdate) {
      onUpdate({ ...formData, id: editingTask.id });
    } else {
      onSubmit(formData);
    }
    
    resetForm();
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editingTask && onDelete) {
      onDelete(editingTask.id);
      onOpenChange(false);
    }
  };

  const categoryItems: ListPickerItem[] = categories.map(cat => ({
    id: cat.id,
    label: cat.name,
  }));

  const selectedCategoryName = categories.find(c => c.id === categoryId)?.name;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-3xl overflow-y-auto">
         <SheetHeader className="text-left pb-2">
            <SheetTitle>{editingTask ? 'Editar Lembrete' : 'Novo Lembrete'}</SheetTitle>
           <SheetDescription className="text-muted-foreground">
              {editingTask ? 'Atualize as informações do lembrete' : 'Adicione um lembrete com data opcional'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-4">
            {/* Title & Notes */}
           <div className="bg-secondary/50 rounded-2xl p-4 space-y-2 border border-border">
              <Input
                placeholder="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
               className="h-12 border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0 placeholder:text-muted-foreground/60"
                data-vaul-no-drag
              />
              <Textarea
                placeholder="Notas"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
               className="min-h-[60px] border-0 bg-transparent px-0 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
                data-vaul-no-drag
              />
            </div>

            {/* Category - using ListPicker */}
           <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
              <button
                type="button"
                onClick={() => setShowCategoryPicker(true)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                 <div className="p-2.5 rounded-xl bg-primary/10">
                    <Folder className="w-4 h-4 text-primary" />
                  </div>
                 <p className="font-semibold text-sm">Categoria</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedCategoryName || 'Nenhuma'}
                </span>
              </button>
            </div>

            {/* Date & Time */}
           <div className="bg-secondary/50 rounded-2xl divide-y divide-border border border-border">
             <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                 <div className="p-2.5 rounded-xl bg-destructive/10">
                    <CalendarIcon className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                   <p className="font-semibold text-sm">Data</p>
                    {hasDate && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="text-xs text-primary hover:underline">
                            {format(dueDate, "d 'de' MMMM", { locale: ptBR })}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[10001]" align="start">
                          <Calendar mode="single" selected={dueDate} onSelect={(date) => date && setDueDate(date)} locale={ptBR} />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
                <Switch checked={hasDate} onCheckedChange={setHasDate} />
              </div>

             <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                 <div className="p-2.5 rounded-xl bg-primary/10">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                   <p className="font-semibold text-sm">Horário</p>
                    {hasTime && (
                      <input 
                        type="time" 
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="text-xs text-primary bg-transparent border-none p-0"
                        data-vaul-no-drag
                      />
                    )}
                  </div>
                </div>
                <Switch checked={hasTime} onCheckedChange={setHasTime} />
              </div>
            </div>

            <div className="flex gap-2">
              {editingTask && onDelete && (
               <Button type="button" variant="destructive" className="h-12 rounded-xl" onClick={handleDelete}>
                  Excluir
                </Button>
              )}
             <Button type="submit" className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20" disabled={!title.trim() || isSubmitting}>
                {isSubmitting ? 'Salvando...' : editingTask ? 'Salvar' : 'Criar Lembrete'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <ListPicker
        open={showCategoryPicker}
        onOpenChange={setShowCategoryPicker}
        title="Categoria"
        items={categoryItems}
        selectedId={categoryId}
        onSelect={(id) => setCategoryId(id)}
        allowNone
        noneLabel="Nenhuma"
        onCreateNew={async (name) => {
          onAddCategory({ name, color: CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)] });
          return null;
        }}
        createLabel="Nova categoria"
        createPlaceholder="Nome da categoria"
      />
    </>
  );
}
