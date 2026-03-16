import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { Supplier } from '@/types/database';
import { cn } from '@/lib/utils';
import { normalizePhone } from '@/lib/normalizePhone';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  suppliers: Supplier[];
  onSubmit: (data: { title: string; supplierIds: string[]; notes?: string }) => Promise<any>;
}

export function PriceSurveySheet({ open, onOpenChange, suppliers, onSubmit }: Props) {
  const [title, setTitle] = useState('Pesquisa de Preços');
  const [notes, setNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await onSubmit({ title, supplierIds: selectedIds, notes: notes || undefined });
      setResult(res);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = (supplier: any) => {
    const phone = normalizePhone(supplier.supplier?.phone);
    if (!phone) return;
    const surveyUrl = `${window.location.origin}/pesquisa/${supplier.token}`;
    const message = `Olá ${supplier.supplier?.name || ''}! 🛒\n\nGostaríamos de saber seus preços atuais. Acesse o link abaixo e preencha os itens que você fornece:\n\n${surveyUrl}\n\nObrigado!`;
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  const handleClose = () => {
    setResult(null);
    setSelectedIds([]);
    setTitle('Pesquisa de Preços');
    setNotes('');
    onOpenChange(false);
  };

  if (result) {
    const surveySuppliers = result.suppliers || [];
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Pesquisa Criada! 🎉</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Envie o link para cada fornecedor via WhatsApp:</p>
            {surveySuppliers.map((ss: any) => (
              <div key={ss.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded-xl">
                <div>
                  <p className="text-sm font-medium">{ss.supplier?.name}</p>
                  <p className="text-xs text-muted-foreground">{ss.supplier?.phone || 'Sem telefone'}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendWhatsApp(ss)}
                  disabled={!normalizePhone(ss.supplier?.phone)}
                  className="gap-1.5"
                >
                  <img src="/icons/whatsapp.png" className="w-4 h-4" alt="" />
                  Enviar
                </Button>
              </div>
            ))}
            <Button className="w-full mt-4" onClick={handleClose}>Concluir</Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Nova Pesquisa de Preços</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Observações (opcional)</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1" rows={2} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Selecionar Fornecedores ({selectedIds.length})
            </label>
            <div className="mt-2 space-y-2 max-h-[30vh] overflow-y-auto">
              {suppliers.map(s => {
                const selected = selectedIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                      selected ? "bg-primary/10 border border-primary/30" : "bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      selected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {selected ? <AppIcon name="Check" size={16} /> : <AppIcon name="Truck" size={16} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={selectedIds.length === 0 || isSubmitting || !title.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Criando...' : `Criar Pesquisa (${selectedIds.length} fornecedor${selectedIds.length !== 1 ? 'es' : ''})`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
