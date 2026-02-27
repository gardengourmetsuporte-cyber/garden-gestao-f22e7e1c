import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { useQueryClient } from '@tanstack/react-query';

interface ParsedRow {
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
  total_orders?: number;
  total_spent?: number;
  last_purchase_at?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: { name: string; phone?: string; email?: string }[]) => void;
  isImporting?: boolean;
}

function parseDateBR(dateStr: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})(?:,?\s*(\d{2}):(\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, mi, ss] = match;
  return `${yyyy}-${mm}-${dd}T${hh || '00'}:${mi || '00'}:${ss || '00'}`;
}

function parseBirthdayBR(dateStr: string): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function parseGoomerCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Detect Goomer format: semicolon-delimited with "Nome";"Telefone" header
  const isGoomer = lines[0].includes('"Nome"') && lines[0].includes(';');
  if (!isGoomer) return [];

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ';' && !inQuotes) { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    fields.push(current.trim());

    const name = fields[0]?.trim();
    if (!name) continue;

    rows.push({
      name,
      phone: fields[1]?.trim() || undefined,
      email: fields[2]?.trim() || undefined,
      birthday: parseBirthdayBR(fields[3] || '') || undefined,
      total_spent: parseFloat(fields[5]?.replace(',', '.') || '0') || 0,
      total_orders: parseInt(fields[6] || '0', 10) || 0,
      last_purchase_at: parseDateBR(fields[8] || '') || undefined,
      notes: fields[9]?.trim() || undefined,
    });
  }
  return rows;
}

function parseSimpleCSV(text: string): ParsedRow[] {
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

export function CustomerImportCSV({ open, onOpenChange, onImport, isImporting: externalImporting }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isGoomer, setIsGoomer] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState('');
  const { activeUnit } = useUnit();
  const qc = useQueryClient();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);

      // Try Goomer format first
      const goomerRows = parseGoomerCSV(text);
      if (goomerRows.length > 0) {
        setRows(goomerRows);
        setIsGoomer(true);
        return;
      }

      // Fallback to simple CSV
      const simpleRows = parseSimpleCSV(text);
      setRows(simpleRows);
      setIsGoomer(false);
      if (simpleRows.length === 0) toast.error('Nenhum cliente encontrado no CSV');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (isGoomer && activeUnit) {
      // Use edge function for Goomer format (has full data)
      setImporting(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke('import-customers-csv', {
          body: { csvText: rawText, unitId: activeUnit.id },
        });
        if (res.error) throw res.error;
        const result = res.data;
        if (result?.error) throw new Error(result.error);
        toast.success(`${result.inserted} clientes importados com histórico!`);
        qc.invalidateQueries({ queryKey: ['customers'] });
        setRows([]);
        setRawText('');
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err.message || 'Erro na importação');
      } finally {
        setImporting(false);
      }
    } else {
      // Simple format
      onImport(rows.map(r => ({ name: r.name, phone: r.phone, email: r.email })));
      setRows([]);
      setRawText('');
    }
  };

  const isProcessing = importing || externalImporting;

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRows([]); setRawText(''); } }}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Importar Clientes (CSV)</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Suporta CSV simples (nome, telefone, email) e <strong>relatórios do Goomer</strong> com histórico de pedidos completo.
          </p>

          <input ref={inputRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          <Button variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
            <AppIcon name="Upload" size={16} className="mr-2" />
            Selecionar arquivo CSV
          </Button>

          {rows.length > 0 && (
            <>
              {isGoomer && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>verified</span>
                  Formato Goomer detectado — histórico de pedidos será importado
                </div>
              )}
              <div className="rounded-xl border bg-secondary/30 p-3 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground mb-2">{rows.length} clientes encontrados</p>
                {rows.slice(0, 20).map((r, i) => (
                  <div key={i} className="text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="font-medium">{r.name}</span>
                    {r.phone && <span className="text-muted-foreground ml-2">· {r.phone}</span>}
                    {isGoomer && r.total_orders ? (
                      <span className="text-muted-foreground ml-2">· {r.total_orders} pedidos · R${r.total_spent?.toFixed(0)}</span>
                    ) : null}
                  </div>
                ))}
                {rows.length > 20 && <p className="text-[10px] text-muted-foreground mt-1">e mais {rows.length - 20}...</p>}
              </div>
              <Button className="w-full" onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? 'Importando...' : `Importar ${rows.length} clientes`}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
