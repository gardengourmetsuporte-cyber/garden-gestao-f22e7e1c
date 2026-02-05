 import { useState, useEffect } from 'react';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { CalendarIcon, Clock, Folder, Plus, X } from 'lucide-react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Switch } from '@/components/ui/switch';
 import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
 import { Calendar } from '@/components/ui/calendar';
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
   const [showNewCategory, setShowNewCategory] = useState(false);
   const [newCategoryName, setNewCategoryName] = useState('');
   const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[4]);
 
   useEffect(() => {
     if (editingTask) {
       setTitle(editingTask.title);
       setNotes(editingTask.notes || '');
       setHasDate(!!editingTask.due_date);
       setDueDate(editingTask.due_date ? new Date(editingTask.due_date) : new Date());
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
     setShowNewCategory(false);
     setNewCategoryName('');
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
 
   const handleAddCategory = () => {
     if (!newCategoryName.trim()) return;
     onAddCategory({ name: newCategoryName.trim(), color: newCategoryColor });
     setNewCategoryName('');
     setShowNewCategory(false);
   };
 
   const handleDelete = () => {
     if (editingTask && onDelete) {
       onDelete(editingTask.id);
       onOpenChange(false);
     }
   };
 
   return (
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
               autoFocus
             />
             <Textarea
               placeholder="Notas"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] border-0 bg-transparent px-0 resize-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
             />
           </div>
 
           {/* Category */}
          <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                   <Folder className="w-4 h-4 text-primary" />
                 </div>
                <p className="font-semibold text-sm">Categoria</p>
               </div>
               <Select 
                 value={categoryId || 'none'} 
                 onValueChange={(v) => setCategoryId(v === 'none' ? null : v)}
               >
                 <SelectTrigger className="w-auto h-8 border-0 bg-transparent gap-2">
                   <SelectValue placeholder="Nenhuma" />
                 </SelectTrigger>
                 <SelectContent align="end">
                   <SelectItem value="none">Nenhuma</SelectItem>
                   {categories.map((cat) => (
                     <SelectItem key={cat.id} value={cat.id}>
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                         {cat.name}
                       </div>
                     </SelectItem>
                   ))}
                   <button
                     type="button"
                     className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-primary hover:bg-muted rounded"
                     onClick={() => setShowNewCategory(true)}
                   >
                     <Plus className="w-4 h-4" />
                     Nova categoria
                   </button>
                 </SelectContent>
               </Select>
             </div>
 
             {showNewCategory && (
               <div className="mt-3 pt-3 border-t space-y-2">
                 <div className="flex items-center gap-2">
                   <Input
                     placeholder="Nome da categoria"
                     value={newCategoryName}
                     onChange={(e) => setNewCategoryName(e.target.value)}
                     className="flex-1 h-9"
                   />
                   <Button type="button" size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                     Criar
                   </Button>
                   <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowNewCategory(false)}>
                     <X className="w-4 h-4" />
                   </Button>
                 </div>
                 <div className="flex gap-1.5 flex-wrap">
                   {CATEGORY_COLORS.map((color) => (
                     <button
                       key={color}
                       type="button"
                       className={cn(
                         "w-6 h-6 rounded-full transition-all",
                         newCategoryColor === color && "ring-2 ring-offset-2 ring-foreground"
                       )}
                       style={{ backgroundColor: color }}
                       onClick={() => setNewCategoryColor(color)}
                     />
                   ))}
                 </div>
               </div>
             )}
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
                       <PopoverContent className="w-auto p-0" align="start">
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
   );
 }