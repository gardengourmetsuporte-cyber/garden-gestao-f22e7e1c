import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useQuotations, Quotation } from '@/hooks/useQuotations';
import { QuotationSheet } from './QuotationSheet';
import { QuotationDetail } from './QuotationDetail';
import { AppIcon } from '@/components/ui/app-icon';

const statusConfig: Record<string, { label: string; variant: string; icon: string }> = {
  draft: { label: 'Rascunho', variant: 'muted', icon: 'Clock' },
  sent: { label: 'Aguardando', variant: 'warning', icon: 'Clock' },
  comparing: { label: 'Comparando', variant: 'primary', icon: 'ArrowLeftRight' },
  contested: { label: 'Contestada', variant: 'warning', icon: 'AlertTriangle' },
  resolved: { label: 'Resolvida', variant: 'success', icon: 'CheckCircle2' },
};

export function QuotationList() {
  const { quotations, isLoading, deleteQuotation } = useQuotations();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  if (selectedQuotation) {
    return (
      <QuotationDetail
        quotation={selectedQuotation}
        onBack={() => { setSelectedQuotation(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setSheetOpen(true)} className="w-full gap-2 rounded-xl h-12 shadow-glow-primary">
        <AppIcon name="Plus" className="w-4 h-4" />
        Nova Cotação
      </Button>

      {quotations.length === 0 ? (
        <EmptyState
          icon="Scale"
          title="Nenhuma cotação"
          subtitle="Crie uma cotação para comparar preços entre fornecedores"
        />
      ) : (
        <div className="space-y-3">
          {quotations.map((q, i) => {
            const status = statusConfig[q.status] || statusConfig.draft;
            const responded = q.quotation_suppliers?.filter(s => s.status === 'responded').length || 0;
            const total = q.quotation_suppliers?.length || 0;
            const itemCount = q.quotation_items?.length || 0;

            return (
              <div
                key={q.id}
                onClick={() => setSelectedQuotation(q)}
                className="card-glass rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.98] animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      status.variant === 'success' ? 'bg-success/15' :
                      status.variant === 'warning' ? 'bg-warning/15' :
                      status.variant === 'primary' ? 'bg-primary/15' :
                      'bg-secondary'
                    )}>
                      <AppIcon name="Scale" className={cn(
                        "w-5 h-5",
                        status.variant === 'success' ? 'text-success' :
                        status.variant === 'warning' ? 'text-warning' :
                        status.variant === 'primary' ? 'text-primary' :
                        'text-muted-foreground'
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm">
                        {q.title || `Cotação #${q.id.slice(0, 6)}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {itemCount} ite{itemCount !== 1 ? 'ns' : 'm'} · {responded}/{total} responderam
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full',
                      status.variant === 'success' ? 'bg-success/15 text-success' :
                      status.variant === 'warning' ? 'bg-warning/15 text-warning' :
                      status.variant === 'primary' ? 'bg-primary/15 text-primary' :
                      'bg-secondary text-muted-foreground'
                    )}>
                      {status.label}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteQuotation(q.id); }}
                    >
                      <AppIcon name="Trash2" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Supplier chips */}
                {(q.quotation_suppliers?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {q.quotation_suppliers?.map(qs => (
                      <span
                        key={qs.id}
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg font-semibold',
                          qs.status === 'responded' ? 'bg-success/10 text-success' :
                          qs.status === 'contested' ? 'bg-warning/10 text-warning' :
                          'bg-secondary/60 text-muted-foreground'
                        )}
                      >
                        {qs.supplier?.name}
                        <AppIcon
                          name={qs.status === 'responded' ? 'CheckCircle2' : qs.status === 'contested' ? 'AlertTriangle' : 'Clock'}
                          size={12}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <QuotationSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
