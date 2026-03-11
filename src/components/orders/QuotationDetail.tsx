import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuotations, Quotation, QuotationPrice } from '@/hooks/useQuotations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';

interface Props {
  quotation: Quotation;
  onBack: () => void;
}

export function QuotationDetail({ quotation: initialQ, onBack }: Props) {
  const { quotations, contestSupplier, resolveQuotation, fetchPrices, invalidate } = useQuotations();
  const quotation = quotations.find(q => q.id === initialQ.id) || initialQ;

  const [prices, setPrices] = useState<QuotationPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [manualWinners, setManualWinners] = useState<Record<string, string>>({});

  const loadPrices = async () => {
    try {
      const p = await fetchPrices(quotation.id);
      setPrices(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
    const channel = supabase
      .channel(`quotation-prices-${quotation.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotation_prices' }, () => {
        loadPrices();
        invalidate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotation_suppliers' }, () => {
        invalidate();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [quotation.id]);

  const suppliers = quotation.quotation_suppliers || [];
  const items = quotation.quotation_items || [];

  const comparison = useMemo(() => {
    return items.map(item => {
      const supplierPrices = suppliers.map(qs => {
        const itemPrices = prices
          .filter(p => p.quotation_item_id === item.id && p.quotation_supplier_id === qs.id)
          .sort((a, b) => b.round - a.round);
        return { supplier: qs, price: itemPrices[0] || null };
      });
      const respondedPrices = supplierPrices.filter(sp => sp.price);
      const minPrice = respondedPrices.length > 0
        ? Math.min(...respondedPrices.map(sp => sp.price!.unit_price))
        : null;
      return { item, supplierPrices, minPrice };
    });
  }, [items, suppliers, prices]);

  // Auto-populate winners with cheapest
  useEffect(() => {
    if (prices.length > 0 && Object.keys(manualWinners).length === 0) {
      const auto: Record<string, string> = {};
      comparison.forEach(row => {
        const responded = row.supplierPrices.filter(sp => sp.price);
        if (responded.length > 0) {
          const cheapest = responded.reduce((a, b) =>
            a.price!.unit_price <= b.price!.unit_price ? a : b
          );
          auto[row.item.id] = cheapest.supplier.id;
        }
      });
      setManualWinners(auto);
    }
  }, [prices, comparison]);

  const economy = useMemo(() => {
    let savings = 0;
    comparison.forEach(row => {
      const respondedPrices = row.supplierPrices.filter(sp => sp.price).map(sp => sp.price!.unit_price);
      if (respondedPrices.length >= 2) {
        const max = Math.max(...respondedPrices);
        const min = Math.min(...respondedPrices);
        savings += (max - min) * row.item.quantity;
      }
    });
    return savings;
  }, [comparison]);

  const getPublicUrl = (token: string) => {
    const publishedUrl = import.meta.env.VITE_PUBLISHED_URL || window.location.origin;
    return `${publishedUrl}/cotacao/${token}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getPublicUrl(token));
    toast.success('Link copiado!');
  };

  const sendWhatsApp = (qs: any) => {
    const phone = qs.supplier?.phone;
    if (!phone) { toast.error('Sem telefone cadastrado'); return; }
    const cleaned = phone.replace(/\D/g, '');
    const formatted = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    const itemCount = items.length;
    const deadlineStr = quotation.deadline
      ? new Date(quotation.deadline).toLocaleDateString('pt-BR')
      : '';
    const msg = `Olá! Temos uma cotação de preços para você:\n\n📋 ${itemCount} itens para cotar${deadlineStr ? `\n⏰ Prazo: ${deadlineStr}` : ''}\n\nAcesse e preencha seus preços:\n${getPublicUrl(qs.token)}\n\nObrigado!`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleContest = async (supplierId: string) => {
    await contestSupplier({ quotationId: quotation.id, supplierId });
    loadPrices();
  };

  const toggleWinner = (itemId: string, qsSupplierId: string) => {
    setManualWinners(prev => ({ ...prev, [itemId]: qsSupplierId }));
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveQuotation(quotation.id, manualWinners);
      toast.success('Pedidos gerados nos rascunhos!');
    } catch {
      toast.error('Erro ao gerar pedidos');
    } finally {
      setResolving(false);
    }
  };

  const allResponded = suppliers.every(s => s.status === 'responded');
  const canResolve = allResponded && prices.length > 0 && quotation.status !== 'resolved';
  const isResolved = quotation.status === 'resolved';
  const respondedCount = suppliers.filter(s => s.status === 'responded').length;

  const overrideCount = useMemo(() => {
    let count = 0;
    comparison.forEach(row => {
      const responded = row.supplierPrices.filter(sp => sp.price);
      if (responded.length > 0) {
        const cheapest = responded.reduce((a, b) =>
          a.price!.unit_price <= b.price!.unit_price ? a : b
        );
        if (manualWinners[row.item.id] && manualWinners[row.item.id] !== cheapest.supplier.id) {
          count++;
        }
      }
    });
    return count;
  }, [comparison, manualWinners]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center shrink-0 hover:bg-secondary/60 transition-colors"
        >
          <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base text-foreground truncate">
            {quotation.title || 'Cotação'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{items.length} itens</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-[11px] text-muted-foreground">{suppliers.length} fornecedores</span>
            {respondedCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[11px] text-success font-medium">{respondedCount} responderam</span>
              </>
            )}
          </div>
        </div>
        {isResolved && (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-success/15 text-success shrink-0">
            Resolvida
          </span>
        )}
      </div>

      {/* Resolved notice */}
      {isResolved && (
        <div className="card-glass rounded-xl p-3 flex items-center gap-3 ring-1 ring-inset ring-success/20">
          <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
            <AppIcon name="CheckCircle2" size={18} className="text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Pedidos gerados</p>
            <p className="text-[11px] text-muted-foreground">Os pedidos foram enviados para a aba de rascunhos na Central de Pedidos.</p>
          </div>
        </div>
      )}

      {/* Supplier Cards */}
      <section className="space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Fornecedores
        </p>
        <div className="space-y-2">
          {suppliers.map(qs => {
            const statusCfg = qs.status === 'responded'
              ? { color: 'text-success', bg: 'bg-success/15', icon: 'CheckCircle2', label: 'Respondeu' }
              : qs.status === 'contested'
              ? { color: 'text-warning', bg: 'bg-warning/15', icon: 'AlertTriangle', label: 'Contestado' }
              : { color: 'text-muted-foreground', bg: 'bg-secondary', icon: 'Clock', label: 'Aguardando' };

            return (
              <div key={qs.id} className="card-glass rounded-xl p-3 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', statusCfg.bg)}>
                  <AppIcon name={statusCfg.icon} size={16} className={statusCfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{qs.supplier?.name}</p>
                  <p className={cn('text-[11px] font-medium', statusCfg.color)}>{statusCfg.label}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyLink(qs.token)}
                    className="w-8 h-8 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <AppIcon name="Copy" size={14} className="text-muted-foreground" />
                  </button>
                  {qs.supplier?.phone && (
                    <button
                      onClick={() => sendWhatsApp(qs)}
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

      {/* Comparison */}
      {prices.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Comparação de Preços
            </p>
            {canResolve && (
              <p className="text-[10px] text-muted-foreground">
                Toque no preço para trocar
              </p>
            )}
          </div>

          {/* Economy + Override alerts */}
          <div className="grid grid-cols-2 gap-2">
            {economy > 0 && (
              <div className={cn(
                "card-glass rounded-xl p-3 ring-1 ring-inset ring-success/20",
                overrideCount > 0 ? 'col-span-1' : 'col-span-2'
              )}>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Economia</p>
                <p className="text-lg font-extrabold text-success font-display" style={{ letterSpacing: '-0.03em' }}>
                  R$ {economy.toFixed(2).replace('.', ',')}
                </p>
              </div>
            )}
            {overrideCount > 0 && (
              <div className="card-glass rounded-xl p-3 ring-1 ring-inset ring-warning/20">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Ajustes</p>
                <p className="text-lg font-extrabold text-warning font-display" style={{ letterSpacing: '-0.03em' }}>
                  {overrideCount} {overrideCount === 1 ? 'item' : 'itens'}
                </p>
              </div>
            )}
          </div>

          {/* Table-style comparison */}
          <div className="card-glass rounded-xl overflow-hidden">
            {/* Header row */}
            <div
              className="grid border-b border-border/30 bg-secondary/30"
              style={{ gridTemplateColumns: `1.5fr repeat(${suppliers.length}, 1fr)` }}
            >
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Item</p>
              </div>
              {suppliers.map(qs => (
                <div key={qs.id} className="px-2 py-2 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                    {qs.supplier?.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {comparison.map((row, idx) => (
              <div
                key={row.item.id}
                className={cn(
                  "grid",
                  idx < comparison.length - 1 && "border-b border-border/15"
                )}
                style={{ gridTemplateColumns: `1.5fr repeat(${suppliers.length}, 1fr)` }}
              >
                {/* Item name */}
                <div className="px-3 py-2.5 flex items-center gap-1.5 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate flex-1">
                    {row.item.item?.name}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">×{row.item.quantity}</span>
                </div>

                {/* Price cells */}
                {row.supplierPrices.map(sp => {
                  const isManualWinner = manualWinners[row.item.id] === sp.supplier.id;
                  const isLoser = sp.price && !isManualWinner && row.minPrice !== null && sp.price.unit_price > row.minPrice;
                  const canSelect = canResolve && sp.price;

                  return (
                    <button
                      key={sp.supplier.id}
                      className={cn(
                        'px-2 py-2.5 text-center transition-all relative flex items-center justify-center',
                        isManualWinner && 'bg-success/10',
                        canSelect && 'cursor-pointer hover:bg-secondary/40 active:scale-95',
                        !canSelect && 'cursor-default'
                      )}
                      onClick={() => canSelect && toggleWinner(row.item.id, sp.supplier.id)}
                      disabled={!canSelect}
                      type="button"
                    >
                      {sp.price ? (
                        <div className="flex items-center gap-1">
                          {isManualWinner && (
                            <AppIcon name="CheckCircle2" size={12} className="text-success shrink-0" />
                          )}
                          <span className={cn(
                            'text-[13px] font-bold tabular-nums',
                            isManualWinner ? 'text-success' : isLoser ? 'text-destructive' : 'text-foreground'
                          )}>
                            {sp.price.unit_price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-muted-foreground/40">—</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {suppliers.map(qs => {
              const hasLosing = comparison.some(row => {
                const sp = row.supplierPrices.find(s => s.supplier.id === qs.id);
                return sp?.price && row.minPrice !== null && sp.price.unit_price > row.minPrice;
              });

              if (!hasLosing || qs.status === 'contested' || isResolved) return null;

              return (
                <Button
                  key={qs.id}
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 border-warning/30 text-warning hover:bg-warning/10 w-full justify-center"
                  onClick={() => handleContest(qs.supplier_id)}
                >
                  <AppIcon name="AlertTriangle" size={14} />
                  Contestar {qs.supplier?.name}
                </Button>
              );
            })}

            {canResolve && (
              <Button
                onClick={handleResolve}
                disabled={resolving}
                className="rounded-xl gap-1.5 shadow-glow-primary w-full h-11"
              >
                {resolving ? (
                  <><AppIcon name="Loader2" size={16} className="animate-spin" /> Gerando pedidos...</>
                ) : (
                  <><AppIcon name="CheckCircle2" size={16} /> Gerar Pedidos nos Rascunhos{overrideCount > 0 ? ` (${overrideCount} ajustados)` : ''}</>
                )}
              </Button>
            )}
          </div>
        </section>
      )}

      {loading && prices.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <AppIcon name="Loader2" size={20} className="animate-spin" />
          <p className="text-sm">Carregando preços...</p>
        </div>
      )}
    </div>
  );
}
