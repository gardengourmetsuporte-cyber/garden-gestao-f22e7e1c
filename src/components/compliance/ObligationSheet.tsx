import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { Obligation, OBLIGATION_TEMPLATES, getCategoryConfig } from '@/hooks/useObligations';

interface ObligationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation?: Obligation | null;
  template?: typeof OBLIGATION_TEMPLATES[number] | null;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function ObligationSheet({ open, onOpenChange, obligation, template, onSave, onDelete }: ObligationSheetProps) {
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
    } else if (template) {
      setForm({
        title: template.title,
        category: template.category,
        description: template.description,
        issue_date: '',
        expiry_date: '',
        alert_days_before: template.defaultAlertDays,
        notes: '',
        document_url: '',
      });
    } else {
      setForm({ title: '', category: 'outros', description: '', issue_date: '', expiry_date: '', alert_days_before: 30, notes: '', document_url: '' });
    }
  }, [obligation, template, open]);

  const cat = getCategoryConfig(form.category);

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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
              <AppIcon name={template?.icon as any || 'ShieldCheck'} size={18} style={{ color: cat.color }} />
            </div>
            <div className="text-left">
              <div className="text-base">{form.title || 'Nova Obrigação'}</div>
              <div className="text-xs font-normal text-muted-foreground">{cat.label}</div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Key dates - the main action */}
          <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Emissão</Label>
                <Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Vencimento</Label>
                <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Alertar quantos dias antes</Label>
              <Input type="number" min={1} value={form.alert_days_before} onChange={e => setForm(f => ({ ...f, alert_days_before: parseInt(e.target.value) || 30 }))} />
            </div>
          </div>

          {/* Document upload */}
          <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento</h3>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
              {uploading && <AppIcon name="Loader2" size={16} className="animate-spin text-muted-foreground" />}
            </div>
            {form.document_url && (
              <a href={form.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline inline-flex items-center gap-1">
                <AppIcon name="ExternalLink" size={12} /> Ver documento
              </a>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Anotações, responsável, contato..." />
          </div>

          <div className="flex gap-2 pt-2">
            {obligation && onDelete && (
              <Button variant="destructive" size="sm" onClick={() => { onDelete(obligation.id); onOpenChange(false); }}>
                <AppIcon name="Trash2" size={14} className="mr-1" /> Excluir
              </Button>
            )}
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving && <AppIcon name="Loader2" size={16} className="animate-spin mr-2" />}
              <AppIcon name="Check" size={16} className="mr-1" />
              {obligation ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
