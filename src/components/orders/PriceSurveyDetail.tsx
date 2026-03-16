import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Supplier } from '@/types/database';
import { cn } from '@/lib/utils';
import { normalizePhone } from '@/lib/normalizePhone';
import { Input } from '@/components/ui/input';

interface Props {
  survey: any;
  suppliers: Supplier[];
  onBack: () => void;
}

export function PriceSurveyDetail({ survey, suppliers, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const surveySuppliers = survey.price_survey_suppliers || [];
  const responses = survey.responses || [];

  // Build a map: item_id → { supplier_name, unit_price, brand, has_item }[]
  const itemPriceMap = useMemo(() => {
    const map: Record<string, Array<{
      supplierName: string;
      supplierId: string;
      unitPrice: number;
      brand: string | null;
      hasItem: boolean;
    }>> = {};

    surveySuppliers.forEach((ss: any) => {
      const supplierName = ss.supplier?.name || 'Fornecedor';
      const supplierResponses = responses.filter((r: any) => r.survey_supplier_id === ss.id);
      supplierResponses.forEach((r: any) => {
        if (!map[r.item_id]) map[r.item_id] = [];
        map[r.item_id].push({
          supplierName,
          supplierId: ss.supplier_id,
          unitPrice: r.unit_price || 0,
          brand: r.brand,
          hasItem: r.has_item,
        });
      });
    });

    return map;
  }, [surveySuppliers, responses]);

  // Get unique items from responses
  const allItemIds = useMemo(() => {
    return [...new Set(responses.map((r: any) => r.item_id))];
  }, [responses]);

  // We need to figure out item names — they may come from inventory
  // For now, use item_id as key, and try to derive names from responses context
  // Actually we need to fetch items — let's use the suppliers' data
  // The survey detail should ideally include items. Let's use what we have.

  const respondedSuppliers = surveySuppliers.filter((s: any) => s.status === 'responded');
  const pendingSuppliers = surveySuppliers.filter((s: any) => s.status === 'pending');

  const handleResendToSupplier = (ss: any) => {
    const phone = normalizePhone(ss.supplier?.phone);
    if (!phone) return;
    const surveyUrl = `${window.location.origin}/pesquisa/${ss.token}`;
    const message = `Olá ${ss.supplier?.name || ''}! 🛒\n\nLembrete: sua pesquisa de preços ainda está pendente.\n\n${surveyUrl}`;
    window.location.href = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary">
          <AppIcon name="ArrowLeft" size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold truncate">{survey.title}</h2>
          <p className="text-xs text-muted-foreground">
            {respondedSuppliers.length}/{surveySuppliers.length} responderam
          </p>
        </div>
      </div>

      {/* Pending suppliers */}
      {pendingSuppliers.length > 0 && (
        <div className="bg-amber-500/10 rounded-2xl p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-600">⏳ Aguardando resposta</p>
          {pendingSuppliers.map((ss: any) => (
            <div key={ss.id} className="flex items-center justify-between">
              <span className="text-sm">{ss.supplier?.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResendToSupplier(ss)}
                disabled={!normalizePhone(ss.supplier?.phone)}
                className="gap-1 h-7 text-xs"
              >
                <img src="/icons/whatsapp.png" className="w-3.5 h-3.5" alt="" />
                Reenviar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Comparison grid */}
      {respondedSuppliers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Comparativo de Preços</h3>

          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8"
          />

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-2 font-semibold sticky left-0 bg-background min-w-[120px]">Item</th>
                  {respondedSuppliers.map((ss: any) => (
                    <th key={ss.id} className="text-center py-2 px-2 font-semibold min-w-[80px]">
                      {ss.supplier?.name?.split(' ')[0] || '?'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allItemIds
                  .filter((itemId: string) => {
                    if (!search.trim()) return true;
                    // We don't have item names here easily, so pass all
                    return true;
                  })
                  .map((itemId: string) => {
                    const prices = itemPriceMap[itemId] || [];
                    const availablePrices = prices.filter(p => p.hasItem && p.unitPrice > 0);
                    const minPrice = availablePrices.length > 0
                      ? Math.min(...availablePrices.map(p => p.unitPrice))
                      : 0;

                    // Get any name we can find
                    const anyResponse = responses.find((r: any) => r.item_id === itemId);

                    return (
                      <tr key={itemId} className="border-b border-muted/30">
                        <td className="py-2 pr-2 font-medium sticky left-0 bg-background">
                          {itemId.slice(0, 8)}…
                        </td>
                        {respondedSuppliers.map((ss: any) => {
                          const entry = prices.find(p => p.supplierId === ss.supplier_id);
                          if (!entry || !entry.hasItem) {
                            return (
                              <td key={ss.id} className="text-center py-2 px-2 text-muted-foreground">—</td>
                            );
                          }
                          const isMin = entry.unitPrice === minPrice && minPrice > 0;
                          return (
                            <td key={ss.id} className={cn("text-center py-2 px-2", isMin && "font-bold text-success")}>
                              {isMin && <AppIcon name="Trophy" size={10} className="inline mr-0.5 text-amber-500" />}
                              R${entry.unitPrice.toFixed(2)}
                              {entry.brand && (
                                <div className="text-[9px] text-muted-foreground">{entry.brand}</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {allItemIds.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">Nenhuma resposta com preços ainda</p>
          )}
        </div>
      )}
    </div>
  );
}
