import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

interface FinanceImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefreshAll: () => Promise<void>;
}

interface PreviewRow {
  date: string;
  description: string;
  category: string;
  subcategory: string;
  account: string;
  amount: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  unmatchedCategories: string[];
  unmatchedAccounts: string[];
}

function parseCSVPreview(text: string): PreviewRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h =>
    h.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/"/g, '')
  );

  const idxDate = headers.findIndex(h => h === 'data');
  const idxDesc = headers.findIndex(h => h === 'descricao' || h === 'descrição');
  const idxCat = headers.findIndex(h => h === 'categoria');
  const idxSubcat = headers.findIndex(h => h === 'subcategoria');
  const idxAccount = headers.findIndex(h => h === 'conta');
  const idxAmount = headers.findIndex(h => h === 'valor');

  const rows: PreviewRow[] = [];
  for (let i = 1; i < Math.min(lines.length, 11); i++) {
    const cols = lines[i].split(';').map(c => c.replace(/"/g, '').trim());
    rows.push({
      date: cols[idxDate] || '',
      description: cols[idxDesc] || '',
      category: cols[idxCat] || '',
      subcategory: cols[idxSubcat] || '',
      account: cols[idxAccount] || '',
      amount: cols[idxAmount] || '',
    });
  }
  return rows;
}

function countCSVLines(text: string): number {
  return text.split(/\r?\n/).filter(l => l.trim()).length - 1; // minus header
}

export function FinanceImportSheet({ open, onOpenChange, onRefreshAll }: FinanceImportSheetProps) {
  const { user } = useAuth();
  const { activeUnitId } = useUnit();
  const fileRef = useRef<HTMLInputElement>(null);

  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [totalLines, setTotalLines] = useState(0);
  const [mode, setMode] = useState<'historical' | 'full_migration'>('historical');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);

    const buffer = await file.arrayBuffer();
    let text: string;

    // Try UTF-16 LE (common in Mobills exports)
    const bytes = new Uint8Array(buffer);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      text = new TextDecoder('utf-16le').decode(buffer);
    } else {
      text = new TextDecoder('utf-8').decode(buffer);
    }

    setCsvText(text);
    setPreview(parseCSVPreview(text));
    setTotalLines(countCSVLines(text));
  };

  const handleImport = async () => {
    if (!csvText || !user || !activeUnitId) return;
    setIsImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-finance-csv', {
        body: { csvText, unitId: activeUnitId, mode },
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
    setPreview([]);
    setTotalLines(0);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Importar CSV (Mobills)</SheetTitle>
          <SheetDescription>
            Importe suas transações do Mobills para o sistema financeiro.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Backup warning */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
            <AppIcon name="AlertTriangle" size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/80">
              <strong>Recomendado:</strong> Faça um backup antes de importar. Acesse{' '}
              <strong>Mais → Backups</strong> para criar um snapshot de segurança.
            </p>
          </div>

          {/* File upload */}
          {!result && (
            <>
              <div>
                <Label className="text-sm font-medium">Arquivo CSV</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                {fileName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {fileName} — {totalLines} transações encontradas
                  </p>
                )}
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Preview (primeiras {preview.length} linhas)
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
                          {preview.map((row, i) => (
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
              {csvText && (
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
                    <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                      <AppIcon name="AlertTriangle" size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-200/80">
                        <strong>Atenção:</strong> Os saldos atuais das suas contas serão afetados pelas transações
                        importadas. Recomendamos fortemente criar um backup antes.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={isImporting || !csvText}
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
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
                <AppIcon name="CheckCircle2" size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-foreground">{result.imported} importadas</p>
                {result.skipped > 0 && (
                  <p className="text-xs text-muted-foreground">{result.skipped} linhas ignoradas</p>
                )}
              </div>

              {result.unmatchedCategories.length > 0 && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                  <p className="text-xs font-medium text-amber-300 mb-1">Categorias não encontradas:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.unmatchedCategories.map((c) => (
                      <span key={c} className="text-xs bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.unmatchedAccounts.length > 0 && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                  <p className="text-xs font-medium text-amber-300 mb-1">Contas não encontradas:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.unmatchedAccounts.map((a) => (
                      <span key={a} className="text-xs bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-200">
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
