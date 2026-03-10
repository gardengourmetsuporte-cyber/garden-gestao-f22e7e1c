import { useState, useRef, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

interface FinanceImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshAll: () => Promise<void>;
}

interface ImportAdjustment {
  accountName: string;
  oldBalance: number;
  newBalance: number;
  adjustmentAmount: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  unmatchedCategories: string[];
  unmatchedAccounts: string[];
  adjustments: ImportAdjustment[];
}

type FieldKey = 'date' | 'description' | 'category' | 'subcategory' | 'account' | 'amount';

const FIELD_LABELS: Record<FieldKey, string> = {
  date: 'Data',
  description: 'Descrição',
  category: 'Categoria',
  subcategory: 'Subcategoria',
  account: 'Conta',
  amount: 'Valor',
};

const REQUIRED_FIELDS: FieldKey[] = ['date', 'amount'];

// Aliases for auto-detection (normalized, no accents, lowercase)
const FIELD_ALIASES: Record<FieldKey, string[]> = {
  date: ['data', 'date', 'dt', 'dia'],
  description: ['descricao', 'descrição', 'description', 'desc', 'titulo', 'title', 'nome'],
  category: ['categoria', 'category', 'cat', 'tipo'],
  subcategory: ['subcategoria', 'subcategory', 'sub', 'detalhe'],
  account: ['conta', 'account', 'banco', 'bank', 'carteira', 'wallet'],
  amount: ['valor', 'amount', 'value', 'total', 'quantia', 'price', 'preco'],
};

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/"/g, '');
}

function detectDelimiter(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  if (tabs > semicolons && tabs > commas) return '\t';
  if (semicolons >= commas) return ';';
  return ',';
}

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

function autoDetectMapping(headers: string[]): Record<FieldKey, number> {
  const mapping: Record<FieldKey, number> = {
    date: -1, description: -1, category: -1, subcategory: -1, account: -1, amount: -1,
  };

  const normalizedHeaders = headers.map(normalize);

  for (const field of Object.keys(FIELD_ALIASES) as FieldKey[]) {
    for (const alias of FIELD_ALIASES[field]) {
      const idx = normalizedHeaders.findIndex(h => h === alias);
      if (idx !== -1 && mapping[field] === -1) {
        mapping[field] = idx;
        break;
      }
    }
  }

  return mapping;
}

export function FinanceImportSheet({ open, onOpenChange, onRefreshAll }: FinanceImportSheetProps) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const fileRef = useRef<HTMLInputElement>(null);

  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [delimiter, setDelimiter] = useState(';');
  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [totalLines, setTotalLines] = useState(0);
  const [columnMapping, setColumnMapping] = useState<Record<FieldKey, number>>({
    date: -1, description: -1, category: -1, subcategory: -1, account: -1, amount: -1,
  });
  const [compensateBalance, setCompensateBalance] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const missingRequired = REQUIRED_FIELDS.filter(f => columnMapping[f] === -1);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);

    const buffer = await file.arrayBuffer();
    let text: string;

    const bytes = new Uint8Array(buffer);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      text = new TextDecoder('utf-16le').decode(buffer);
    } else {
      text = new TextDecoder('utf-8').decode(buffer);
    }

    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      toast.error('Arquivo vazio ou inválido');
      return;
    }

    const det = detectDelimiter(lines[0]);
    setDelimiter(det);

    const hdrs = splitCSVLine(lines[0], det);
    setHeaders(hdrs);

    const rows: string[][] = [];
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      rows.push(splitCSVLine(lines[i], det));
    }
    setSampleRows(rows);
    setTotalLines(lines.length - 1);
    setCsvText(text);

    // Auto-detect column mapping
    const autoMap = autoDetectMapping(hdrs);
    setColumnMapping(autoMap);
  };

  const handleMappingChange = (field: FieldKey, value: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: value === 'none' ? -1 : parseInt(value) }));
  };

  const handleImport = async () => {
    if (!csvText || !user || !activeUnitId) return;
    if (missingRequired.length > 0) {
      toast.error(`Mapeie as colunas obrigatórias: ${missingRequired.map(f => FIELD_LABELS[f]).join(', ')}`);
      return;
    }
    setIsImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-finance-csv', {
        body: {
          csvText,
          unitId: activeUnitId,
          compensateBalance,
          delimiter,
          columnMapping,
        },
      });

      if (error) throw error;

      setResult(data as ImportResult);
      toast.success(`${data.imported} transações importadas com sucesso!`);
      await onRefreshAll();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Erro ao importar CSV');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setCsvText(null);
    setFileName('');
    setHeaders([]);
    setSampleRows([]);
    setTotalLines(0);
    setResult(null);
    setColumnMapping({ date: -1, description: -1, category: -1, subcategory: -1, account: -1, amount: -1 });
    if (fileRef.current) fileRef.current.value = '';
  };

  // Preview using current mapping
  const previewMapped = useMemo(() => {
    return sampleRows.map(cols => ({
      date: columnMapping.date >= 0 ? cols[columnMapping.date] || '' : '',
      description: columnMapping.description >= 0 ? cols[columnMapping.description] || '' : '',
      category: columnMapping.category >= 0 ? cols[columnMapping.category] || '' : '',
      subcategory: columnMapping.subcategory >= 0 ? cols[columnMapping.subcategory] || '' : '',
      account: columnMapping.account >= 0 ? cols[columnMapping.account] || '' : '',
      amount: columnMapping.amount >= 0 ? cols[columnMapping.amount] || '' : '',
    }));
  }, [sampleRows, columnMapping]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Importar CSV</SheetTitle>
          <SheetDescription>
            Importe transações de qualquer planilha ou app financeiro (Mobills, Organizze, etc).
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Backup warning */}
          <div className="flex items-start gap-2 rounded-lg bg-accent/10 border border-accent/30 p-3">
            <AppIcon name="AlertTriangle" size={16} className="text-accent mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Recomendado:</strong> Faça um backup antes de importar. Acesse{' '}
              <strong>Mais → Backups</strong> para criar um snapshot de segurança.
            </p>
          </div>

          {!result && (
            <>
              {/* File upload */}
              <div>
                <Label className="text-sm font-medium">Arquivo CSV</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                {fileName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {fileName} — {totalLines} linhas · delimitador: <code className="bg-secondary/50 px-1 rounded">{delimiter === '\t' ? 'TAB' : delimiter}</code>
                  </p>
                )}
              </div>

              {/* Column mapping */}
              {headers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mapeamento de colunas</Label>
                  <p className="text-xs text-muted-foreground">
                    Associe cada campo à coluna correspondente do seu CSV. Campos com <span className="text-destructive">*</span> são obrigatórios.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(FIELD_LABELS) as FieldKey[]).map(field => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs">
                          {FIELD_LABELS[field]}
                          {REQUIRED_FIELDS.includes(field) && <span className="text-destructive ml-0.5">*</span>}
                        </Label>
                        <Select
                          value={columnMapping[field] === -1 ? 'none' : String(columnMapping[field])}
                          onValueChange={(v) => handleMappingChange(field, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Não mapeado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Ignorar —</SelectItem>
                            {headers.map((h, idx) => (
                              <SelectItem key={idx} value={String(idx)}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {previewMapped.length > 0 && columnMapping.date >= 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Preview ({previewMapped.length} linhas)
                  </Label>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-secondary/50">
                            <th className="px-2 py-1.5 text-left font-medium">Data</th>
                            <th className="px-2 py-1.5 text-left font-medium">Descrição</th>
                            <th className="px-2 py-1.5 text-left font-medium">Categoria</th>
                            <th className="px-2 py-1.5 text-left font-medium">Conta</th>
                            <th className="px-2 py-1.5 text-right font-medium">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {previewMapped.map((row, i) => (
                            <tr key={i} className="hover:bg-secondary/20">
                              <td className="px-2 py-1 whitespace-nowrap">{row.date}</td>
                              <td className="px-2 py-1 max-w-[120px] truncate">{row.description}</td>
                              <td className="px-2 py-1 max-w-[100px] truncate">
                                {row.subcategory ? `${row.category} > ${row.subcategory}` : row.category}
                              </td>
                              <td className="px-2 py-1 whitespace-nowrap">{row.account}</td>
                              <td className="px-2 py-1 text-right whitespace-nowrap">{row.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode selection */}
              {csvText && headers.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Modo de importação</Label>
                  <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-2">
                    <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/20 transition-colors">
                      <RadioGroupItem value="historical" className="mt-0.5" />
                      <div>
                        <span className="text-sm font-medium">📋 Somente Histórico</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Transações ficam como <strong>não pagas</strong>. Seus saldos atuais não mudam.
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/20 transition-colors">
                      <RadioGroupItem value="full_migration" className="mt-0.5" />
                      <div>
                        <span className="text-sm font-medium">🔄 Migração Completa</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Transações entram como <strong>pagas</strong>. Saldos recalculados do zero.
                        </p>
                      </div>
                    </label>
                  </RadioGroup>

                  {mode === 'full_migration' && (
                    <div className="flex items-start gap-2 rounded-lg bg-accent/10 border border-accent/30 p-3">
                      <AppIcon name="AlertTriangle" size={16} className="text-accent mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <strong>Atenção:</strong> Os saldos atuais das suas contas serão afetados pelas transações
                        importadas. Recomendamos fortemente criar um backup antes.
                      </p>
                    </div>
                  )}

                  {missingRequired.length > 0 && (
                    <p className="text-xs text-destructive">
                      Mapeie as colunas obrigatórias: {missingRequired.map(f => FIELD_LABELS[f]).join(', ')}
                    </p>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={isImporting || !csvText || missingRequired.length > 0}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <AppIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <AppIcon name="Upload" size={16} className="mr-2" />
                        Importar {totalLines} transações
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
                <AppIcon name="CheckCircle2" size={32} className="text-primary mx-auto mb-2" />
                <p className="text-lg font-semibold text-foreground">{result.imported} importadas</p>
                {result.skipped > 0 && (
                  <p className="text-xs text-muted-foreground">{result.skipped} linhas ignoradas</p>
                )}
              </div>

              {result.unmatchedCategories.length > 0 && (
                <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
                  <p className="text-xs font-medium text-accent-foreground mb-1">Categorias não encontradas:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.unmatchedCategories.map((c) => (
                      <span key={c} className="text-xs bg-accent/20 px-2 py-0.5 rounded-full text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.unmatchedAccounts.length > 0 && (
                <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
                  <p className="text-xs font-medium text-accent-foreground mb-1">Contas não encontradas:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.unmatchedAccounts.map((a) => (
                      <span key={a} className="text-xs bg-accent/20 px-2 py-0.5 rounded-full text-muted-foreground">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={handleReset} className="w-full">
                Importar outro arquivo
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
