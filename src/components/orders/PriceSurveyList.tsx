import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PriceSurvey, usePriceSurveys } from '@/hooks/usePriceSurveys';
import { PriceSurveySheet } from './PriceSurveySheet';
import { PriceSurveyDetail } from './PriceSurveyDetail';
import { Supplier } from '@/types/database';
import { cn } from '@/lib/utils';
import { normalizePhone } from '@/lib/normalizePhone';

const statusConfig: Record<string, { label: string; variant: string }> = {
  draft: { label: 'Rascunho', variant: 'muted' },
  sent: { label: 'Enviada', variant: 'primary' },
  completed: { label: 'Completa', variant: 'success' },
};

interface Props {
  suppliers: Supplier[];
}

export function PriceSurveyList({ suppliers }: Props) {
  const { surveys, isLoading, createSurvey, deleteSurvey, fetchSurveyDetail } = usePriceSurveys();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailSurvey, setDetailSurvey] = useState<any>(null);

  const handleCreate = async (data: { title: string; supplierIds: string[]; notes?: string }) => {
    return await createSurvey.mutateAsync(data);
  };

  const handleOpenDetail = async (survey: PriceSurvey) => {
    const detail = await fetchSurveyDetail(survey.id);
    setDetailSurvey(detail);
  };

  if (detailSurvey) {
    return (
      <PriceSurveyDetail
        survey={detailSurvey}
        suppliers={suppliers}
        onBack={() => setDetailSurvey(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => setSheetOpen(true)} className="w-full gap-2 rounded-xl h-12 shadow-glow-primary">
        <AppIcon name="Plus" className="w-4 h-4" />
        Nova Pesquisa de Preços
      </Button>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : surveys.length === 0 ? (
        <EmptyState
          icon="ClipboardList"
          title="Nenhuma pesquisa"
          subtitle="Crie uma pesquisa para captar preços dos fornecedores"
        />
      ) : (
        <div className="space-y-3">
          {surveys.map((survey, i) => {
            const sc = statusConfig[survey.status] || statusConfig.draft;
            const suppliersList = survey.price_survey_suppliers || [];
            const respondedCount = suppliersList.filter(s => s.status === 'responded').length;
            const total = suppliersList.length;

            return (
              <div
                key={survey.id}
                onClick={() => handleOpenDetail(survey)}
                className="card-glass rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.98] animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      sc.variant === 'success' ? 'bg-success/15' :
                      sc.variant === 'primary' ? 'bg-primary/15' :
                      'bg-secondary'
                    )}>
                      <AppIcon name="search" className={cn(
                        "w-5 h-5",
                        sc.variant === 'success' ? 'text-success' :
                        sc.variant === 'primary' ? 'text-primary' :
                        'text-muted-foreground'
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm">
                        {survey.title || 'Pesquisa de Preços'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {total} fornecedor{total !== 1 ? 'es' : ''} • {respondedCount}/{total} responderam
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full',
                      sc.variant === 'success' ? 'bg-success/15 text-success' :
                      sc.variant === 'primary' ? 'bg-primary/15 text-primary' :
                      'bg-secondary text-muted-foreground'
                    )}>
                      {sc.label}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteSurvey.mutate(survey.id); }}
                    >
                      <AppIcon name="Trash2" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${total > 0 ? (respondedCount / total) * 100 : 0}%` }}
                  />
                </div>

                {/* Supplier chips */}
                {total > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {suppliersList.map(ss => (
                      <span
                        key={ss.id}
                        className={cn(
                          'inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg font-semibold',
                          ss.status === 'responded' ? 'bg-success/10 text-success' :
                          'bg-secondary/60 text-muted-foreground'
                        )}
                      >
                        {ss.supplier?.name}
                        <AppIcon
                          name={ss.status === 'responded' ? 'CheckCircle2' : 'Clock'}
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

      <PriceSurveySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        suppliers={suppliers}
        onSubmit={handleCreate}
      />
    </div>
  );
}
