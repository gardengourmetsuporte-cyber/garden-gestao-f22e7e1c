import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { Obligation, OBLIGATION_CATEGORIES } from '@/hooks/useObligations';

interface ObligationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation?: Obligation | null;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function ObligationSheet({ open, onOpenChange, obligation, onSave, onDelete }: ObligationSheetProps) {
  const { activeUnit } = useUnit();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'outros',
    description: '',
    issue_date: '',
    expiry_date: '',
    alert_days_before: 30,
    notes: '',
    document_url: '',
  });

  useEffect(() => {
    if (obligation) {
      setForm({
        title: obligation.title,
        category: obligation.category,
        description: obligation.description || '',
        issue_date: obligation.issue_date || '',
        expiry_date: obligation.expiry_date || '',
        alert_days_before: obligation.alert_days_before,
        notes: obligation.notes || '',
        document_url: obligation.document_url || '',
      });
    } else {
      setForm({ title: '', category: 'outros', description: '', issue_date: '', expiry_date: '', alert_days_before: 30, notes: '', document_url: '' });
    }
  }, [obligation, open]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeUnit) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${activeUnit.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('legal-documents').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('legal-documents').getPublicUrl(path);
      setForm(f => ({ ...f, document_url: publicUrl }));
      toast.success('Documento enviado!');
    } catch {
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error('Informe o título'); return; }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        category: form.category,
        description: form.description || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        alert_days_before: form.alert_days_before,
        notes: form.notes || null,
        document_url: form.document_url || null,
      };
      if (obligation) payload.id = obligation.id;
      await onSave(payload);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-safe">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AppIcon name="ShieldCheck" size={20} />
            {obligation ? 'Editar Obrigação' : 'Nova Obrigação'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Laudo do Bombeiro" />
          </div>

          <div>
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OBLIGATION_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Observações..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data de emissão</Label>
              <Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
            </div>
            <div>
              <Label>Data de vencimento</Label>
              <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Alertar quantos dias antes</Label>
            <Input type="number" min={1} value={form.alert_days_before} onChange={e => setForm(f => ({ ...f, alert_days_before: parseInt(e.target.value) || 30 }))} />
          </div>

          <div>
            <Label>Documento (PDF, foto)</Label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
              {uploading && <AppIcon name="Loader2" size={16} className="animate-spin text-muted-foreground" />}
            </div>
            {form.document_url && (
              <a href={form.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 inline-block">
                Ver documento atual
              </a>
            )}
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>

          <div className="flex gap-2 pt-2">
            {obligation && onDelete && (
              <Button variant="destructive" size="sm" onClick={() => { onDelete(obligation.id); onOpenChange(false); }}>
                <AppIcon name="Trash2" size={14} className="mr-1" /> Excluir
              </Button>
            )}
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving && <AppIcon name="Loader2" size={16} className="animate-spin mr-2" />}
              {obligation ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
