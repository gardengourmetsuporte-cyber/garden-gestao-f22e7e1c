import { useState, useRef } from 'react';
import { useEmployeeDocuments, DOCUMENT_TYPES, type EmployeeDocument } from '@/hooks/useEmployeeDocuments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { format, isBefore, addDays } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Props {
  employeeId: string;
}

export function EmployeeDocumentsTab({ employeeId }: Props) {
  const { documents, isLoading, upload, remove } = useEmployeeDocuments(employeeId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'other', expiryDate: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!selectedFile || !form.title) return;
    upload.mutate({
      file: selectedFile,
      title: form.title,
      type: form.type,
      expiryDate: form.expiryDate || undefined,
    });
    setSheetOpen(false);
    setForm({ title: '', type: 'other', expiryDate: '' });
    setSelectedFile(null);
  };

  const getTypeLabel = (type: string) => DOCUMENT_TYPES.find(d => d.value === type)?.label || type;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Documentos</h3>
        <Button onClick={() => setSheetOpen(true)} variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
          <AppIcon name="Upload" size={14} />
          Enviar
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhum documento enviado</p>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => {
            const isExpiring = doc.expiry_date && isBefore(new Date(doc.expiry_date), addDays(new Date(), 30));
            const isExpired = doc.expiry_date && isBefore(new Date(doc.expiry_date), new Date());
            return (
              <Card key={doc.id} className="border-border/50">
                <CardContent className="py-2.5 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <AppIcon name="FileText" size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{doc.title}</span>
                        <Badge variant="secondary" className="text-[9px]">{getTypeLabel(doc.type)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {doc.file_name && <span className="truncate max-w-[120px]">{doc.file_name}</span>}
                        {doc.expiry_date && (
                          <span className={isExpired ? 'text-destructive font-medium' : isExpiring ? 'text-amber-600 font-medium' : ''}>
                            {isExpired ? '⚠ Vencido' : `Vence ${format(new Date(doc.expiry_date), 'dd/MM/yyyy')}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <AppIcon name="ExternalLink" size={14} />
                        </a>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
                            <AppIcon name="Trash2" size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(doc.id)}>Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          <SheetHeader><SheetTitle>Enviar Documento</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4 pb-8">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Título *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" placeholder="Ex: RG - Frente" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tipo</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(dt => (
                    <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Data de Validade</label>
              <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Arquivo *</label>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="text-sm" />
            </div>
            <Button onClick={handleUpload} disabled={!selectedFile || !form.title || upload.isPending} className="w-full rounded-xl">
              {upload.isPending ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
