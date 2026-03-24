import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Supplier } from '@/types/database';
import { cn } from '@/lib/utils';
import { normalizePhone } from '@/lib/normalizePhone';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { GenerateOrdersFromSurveySheet, SurveyOrderItem } from './GenerateOrdersFromSurveySheet';
import { usePriceSurveys } from '@/hooks/usePriceSurveys';

interface Props {
  survey: any;
  suppliers: Supplier[];
  onBack: () => void;
}

export function PriceSurveyDetail({ survey, suppliers, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);

  const inventoryItems: any[] = survey.inventoryItems || [];
  const surveySuppliers = survey.price_survey_suppliers || [];
  const responses = survey.responses || [];

  const respondedSuppliers = surveySuppliers.filter((s: any) => s.status === 'responded');
  const pendingSuppliers = surveySuppliers.filter((s: any) => s.status === 'pending');
  const respondedCount = respondedSuppliers.length;

  // Build price map: item_id → supplier prices
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

  const allItems = useMemo(() => {
    const itemIds = [...new Set(responses.map((r: any) => r.item_id as string))];
    return itemIds
      .map((id: string) => {
        const inv = inventoryItems.find((i: any) => i.id === id);
        return { id, name: (inv?.name || id.slice(0, 8)) as string, unitType: (inv?.unit_type || '') as string };
      })
      .filter(item => {
        if (!search.trim()) return true;
        return item.name.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [responses, inventoryItems, search]);

  // Economy calc
  const economy = useMemo(() => {
    let savings = 0;
    allItems.forEach(item => {
      const prices = (itemPriceMap[item.id] || []).filter(p => p.hasItem && p.unitPrice > 0);
      if (prices.length >= 2) {
        const max = Math.max(...prices.map(p => p.unitPrice));
        const min = Math.min(...prices.map(p => p.unitPrice));
        savings += max - min;
      }
    });
    return savings;
  }, [allItems, itemPriceMap]);

  // Build order items: best price per item + inventory data
  const orderItems: SurveyOrderItem[] = useMemo(() => {
    return allItems.map(item => {
      const prices = (itemPriceMap[item.id] || []).filter(p => p.hasItem && p.unitPrice > 0);
      if (prices.length === 0) return null;
      const best = prices.reduce((a, b) => a.unitPrice <= b.unitPrice ? a : b);
      const inv = inventoryItems.find((i: any) => i.id === item.id);
      const minStock = inv?.min_stock ?? 0;
      const currentStock = inv?.current_stock ?? 0;
      const suggestedQty = Math.max(0, minStock - currentStock);
      return {
        itemId: item.id,
        itemName: item.name,
        unitType: item.unitType,
        currentStock,
        minStock,
        suggestedQty,
        unitPrice: best.unitPrice,
        supplierId: best.supplierId,
        supplierName: best.supplierName,
      } as SurveyOrderItem;
    }).filter(Boolean) as SurveyOrderItem[];
  }, [allItems, itemPriceMap, inventoryItems]);

  const handleResendToSupplier = (ss: any) => {
    const phone = normalizePhone(ss.supplier?.phone);
    if (!phone) { toast.error('Sem telefone cadastrado'); return; }
    const surveyUrl = `${window.location.origin}/pesquisa/${ss.token}`;
    const message = `Olá ${ss.supplier?.name || ''}! 🛒\n\nLembrete: sua pesquisa de preços ainda está pendente.\n\n${surveyUrl}`;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyLink = (token: string) => {
    const publishedUrl = import.meta.env.VITE_PUBLISHED_URL || window.location.origin;
    navigator.clipboard.writeText(`${publishedUrl}/pesquisa/${token}`);
    toast.success('Link copiado!');
  };

  const sendWhatsApp = (ss: any) => {
    const phone = normalizePhone(ss.supplier?.phone);
    if (!phone) { toast.error('Sem telefone cadastrado'); return; }
    const surveyUrl = `${window.location.origin}/pesquisa/${ss.token}`;
    const msg = `Olá ${ss.supplier?.name || ''}! 🛒\n\nResponda nossa pesquisa de preços:\n\n${surveyUrl}\n\nObrigado!`;
    window.open(`https://wa.me/${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header — same as QuotationDetail */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center shrink-0 hover:bg-secondary/60 transition-colors"
        >
          <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base text-foreground truncate">
            {survey.title || 'Pesquisa de Preços'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{surveySuppliers.length} fornecedores</span>
            {respondedCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[11px] text-success font-medium">{respondedCount} responderam</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Supplier Cards — same pattern as QuotationDetail */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Fornecedores
        </p>
        <div className="space-y-2">
          {surveySuppliers.map((ss: any) => {
            const isResponded = ss.status === 'responded';
            const statusCfg = isResponded
              ? { color: 'text-success', bg: 'bg-success/15', icon: 'CheckCircle2', label: 'Respondeu' }
              : { color: 'text-warning', bg: 'bg-warning/15', icon: 'Clock', label: 'Aguardando' };

            return (
              <div key={ss.id} className="card-glass rounded-xl p-3 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', statusCfg.bg)}>
                  <AppIcon name={statusCfg.icon} size={16} className={statusCfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ss.supplier?.name}</p>
                  <p className={cn('text-[11px] font-medium', statusCfg.color)}>{statusCfg.label}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyLink(ss.token)}
                    className="w-8 h-8 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <AppIcon name="Copy" size={14} className="text-muted-foreground" />
                  </button>
                  {ss.supplier?.phone && (
                    <button
                      onClick={() => isResponded ? sendWhatsApp(ss) : handleResendToSupplier(ss)}
                      className="w-8 h-8 rounded-xl bg-primary/15 hover:bg-primary/25 flex items-center justify-center transition-colors"
                    >
                      <AppIcon name="MessageCircle" size={14} className="text-primary" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison — same grid pattern as QuotationDetail */}
      {respondedSuppliers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Comparação de Preços
            </p>
          </div>

          {/* Economy */}
          {economy > 0 && (
            <div className="card-glass rounded-xl p-3 ring-1 ring-inset ring-success/20">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Economia</p>
              <p className="text-lg font-extrabold text-success font-display" style={{ letterSpacing: '-0.03em' }}>
                R$ {economy.toFixed(2).replace('.', ',')}
              </p>
            </div>
          )}

          {/* Search */}
          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl h-10"
          />

          {/* Grid comparison table */}
          <div className="card-glass rounded-xl overflow-hidden">
            {/* Header */}
            <div
              className="grid border-b border-border/30 bg-secondary/30"
              style={{ gridTemplateColumns: `1.5fr repeat(${respondedSuppliers.length}, 1fr)` }}
            >
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Item</p>
              </div>
              {respondedSuppliers.map((ss: any) => (
                <div key={ss.id} className="px-2 py-2 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                    {ss.supplier?.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Rows */}
            {allItems.map((item, idx) => {
              const prices = itemPriceMap[item.id] || [];
              const availablePrices = prices.filter(p => p.hasItem && p.unitPrice > 0);
              const minPrice = availablePrices.length > 0
                ? Math.min(...availablePrices.map(p => p.unitPrice))
                : 0;

              return (
                <div
                  key={item.id}
                  className={cn("grid", idx < allItems.length - 1 && "border-b border-border/15")}
                  style={{ gridTemplateColumns: `1.5fr repeat(${respondedSuppliers.length}, 1fr)` }}
                >
                  <div className="px-3 py-2.5 flex items-center gap-1.5 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate flex-1">{item.name}</p>
                    {item.unitType && (
                      <span className="text-[10px] text-muted-foreground shrink-0">({item.unitType})</span>
                    )}
                  </div>

                  {respondedSuppliers.map((ss: any) => {
                    const entry = prices.find(p => p.supplierId === ss.supplier_id);
                    if (!entry || !entry.hasItem) {
                      return (
                        <div key={ss.id} className="flex items-center justify-center px-2 py-2.5">
                          <span className="text-[13px] text-muted-foreground/40">—</span>
                        </div>
                      );
                    }
                    const isMin = entry.unitPrice === minPrice && minPrice > 0 && availablePrices.length > 1;
                    return (
                      <div key={ss.id} className={cn(
                        "flex flex-col items-center justify-center px-2 py-2.5",
                        isMin && "bg-success/10"
                      )}>
                        <div className="flex items-center gap-1">
                          {isMin && <AppIcon name="Trophy" size={11} className="text-warning shrink-0" />}
                          <span className={cn(
                            'text-[13px] font-bold tabular-nums',
                            isMin ? 'text-success' : 'text-foreground'
                          )}>
                            {entry.unitPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        {entry.brand && (
                          <span className="text-[9px] text-muted-foreground">{entry.brand}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {allItems.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <AppIcon name="ClipboardList" size={20} />
              <p className="text-sm">Nenhuma resposta com preços ainda</p>
            </div>
          )}

          {/* Generate Orders Button */}
          {allItems.length > 0 && (
            <Button
              onClick={() => setGenerateOpen(true)}
              className="w-full h-12 text-sm font-bold gap-2"
            >
              <AppIcon name="ShoppingCart" size={16} />
              Gerar Pedidos com Melhor Preço
            </Button>
          )}
        </section>
      )}

      <GenerateOrdersFromSurveySheet
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        items={orderItems}
      />
    </div>
  );
}
