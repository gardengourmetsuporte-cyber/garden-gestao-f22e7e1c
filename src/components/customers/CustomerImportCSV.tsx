import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';

interface ParsedRow {
  name: string;
  phone?: string;
  email?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ParsedRow[]) => void;
  isImporting?: boolean;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(/[;,\t]/);
  const nameIdx = header.findIndex(h => h.includes('nome') || h.includes('name'));
  const phoneIdx = header.findIndex(h => h.includes('telefone') || h.includes('phone') || h.includes('celular'));
  const emailIdx = header.findIndex(h => h.includes('email') || h.includes('e-mail'));

  if (nameIdx === -1) {
    toast.error('CSV precisa ter uma coluna "nome"');
    return [];
  }

  return lines.slice(1).map(line => {
    const cols = line.split(/[;,\t]/);
    return {
      name: cols[nameIdx]?.trim() || '',
      phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() : undefined,
      email: emailIdx >= 0 ? cols[emailIdx]?.trim() : undefined,
    };
  }).filter(r => r.name);
}

export function CustomerImportCSV({ open, onOpenChange, onImport, isImporting }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      if (parsed.length === 0) toast.error('Nenhum cliente encontrado no CSV');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    onImport(rows);
    setRows([]);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setRows([]); }}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Importar Clientes (CSV)</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            O CSV deve ter pelo menos a coluna <strong>nome</strong>. Colunas opcionais: <strong>telefone</strong>, <strong>email</strong>.
          </p>

          <input ref={inputRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
            <AppIcon name="Upload" size={16} className="mr-2" />
            Selecionar arquivo CSV
          </Button>

          {rows.length > 0 && (
            <>
              <div className="rounded-xl border bg-secondary/30 p-3 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground mb-2">{rows.length} clientes encontrados</p>
                {rows.slice(0, 20).map((r, i) => (
                  <div key={i} className="text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="font-medium">{r.name}</span>
                    {r.phone && <span className="text-muted-foreground ml-2">· {r.phone}</span>}
                    {r.email && <span className="text-muted-foreground ml-2">· {r.email}</span>}
                  </div>
                ))}
                {rows.length > 20 && <p className="text-[10px] text-muted-foreground mt-1">e mais {rows.length - 20}...</p>}
              </div>
              <Button className="w-full" onClick={handleImport} disabled={isImporting}>
                {isImporting ? 'Importando...' : `Importar ${rows.length} clientes`}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
