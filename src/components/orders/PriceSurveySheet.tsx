import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { Supplier } from '@/types/database';
import { cn } from '@/lib/utils';
import { normalizePhone } from '@/lib/normalizePhone';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  suppliers: Supplier[];
  onSubmit: (data: { title: string; supplierIds: string[]; categoryIds: string[]; notes?: string }) => Promise<any>;
}

export function PriceSurveySheet({ open, onOpenChange, suppliers, onSubmit }: Props) {
  const { activeUnitId } = useUnit();
  const [step, setStep] = useState<'categories' | 'suppliers'>('categories');
  const [title, setTitle] = useState('Pesquisa de Preços');
  const [notes, setNotes] = useState('');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (open && activeUnitId) {
      supabase
        .from('categories')
        .select('id, name, color')
        .eq('unit_id', activeUnitId)
        .order('sort_order')
        .then(({ data }) => setCategories(data || []));
    }
  }, [open, activeUnitId]);

  const toggleSupplier = (id: string) => {
    setSelectedSupplierIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllCategories = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categories.map(c => c.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedSupplierIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        title,
        supplierIds: selectedSupplierIds,
        categoryIds: selectedCategoryIds,
        notes: notes || undefined,
      });
      setResult(res);
    } catch (err) {
      console.error('Error creating survey:', err);
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
    window.open(url, '_blank');
  };

  const handleClose = () => {
    setResult(null);
    setSelectedSupplierIds([]);
    setSelectedCategoryIds([]);
    setStep('categories');
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
                  <AppIcon name="chat" size={15} fill={1} className="text-white" />
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

          {step === 'categories' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Categorias ({selectedCategoryIds.length}/{categories.length})
                </label>
                <Button variant="ghost" size="sm" onClick={selectAllCategories} className="text-xs h-7">
                  {selectedCategoryIds.length === categories.length ? 'Desmarcar todas' : 'Selecionar todas'}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Selecione as categorias de itens que deseja incluir. Deixe vazio para incluir todos.
              </p>
              <div className="space-y-2 max-h-[25vh] overflow-y-auto">
                {categories.map(cat => {
                  const selected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                        selected ? "bg-primary/10 border border-primary/30" : "bg-secondary/30 hover:bg-secondary/50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          selected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                        style={!selected ? { backgroundColor: cat.color + '20' } : {}}
                      >
                        {selected ? (
                          <AppIcon name="Check" size={16} />
                        ) : (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        )}
                      </div>
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              <Button
                className="w-full mt-4"
                onClick={() => setStep('suppliers')}
                disabled={!title.trim()}
              >
                Próximo: Fornecedores
                <AppIcon name="ChevronRight" size={16} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep('categories')}>
                  <AppIcon name="ChevronLeft" size={16} />
                </Button>
                <label className="text-xs font-medium text-muted-foreground">
                  Selecionar Fornecedores ({selectedSupplierIds.length})
                </label>
              </div>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {suppliers.map(s => {
                  const selected = selectedSupplierIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSupplier(s.id)}
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

              <Button
                className="w-full mt-4"
                disabled={selectedSupplierIds.length === 0 || isSubmitting || !title.trim()}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Criando...' : `Criar Pesquisa (${selectedSupplierIds.length} fornecedor${selectedSupplierIds.length !== 1 ? 'es' : ''})`}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
