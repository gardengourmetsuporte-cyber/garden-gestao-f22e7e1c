import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AppointmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (appointment: { title: string; scheduled_time: string; notes?: string }) => void;
  isSubmitting?: boolean;
}

export function AppointmentSheet({ open, onOpenChange, onSubmit, isSubmitting }: AppointmentSheetProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({ 
      title: title.trim(), 
      scheduled_time: time,
      notes: notes.trim() || undefined,
    });
    setTitle('');
    setTime('09:00');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Novo Compromisso</SheetTitle>
          <SheetDescription>
            Adicione um compromisso com horário fixo
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="appointment-title">Título</Label>
            <Input
              id="appointment-title"
              placeholder="Ex: Reunião com fornecedor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-time">Horário</Label>
            <Input
              id="appointment-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-notes">Observações (opcional)</Label>
            <Textarea
              id="appointment-notes"
              placeholder="Ex: Discutir preços de laticínios"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12" 
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Compromisso'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
