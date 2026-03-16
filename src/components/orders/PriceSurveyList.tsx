import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PriceSurvey, PriceSurveySupplier, usePriceSurveys } from '@/hooks/usePriceSurveys';
import { PriceSurveySheet } from './PriceSurveySheet';
import { PriceSurveyDetail } from './PriceSurveyDetail';
import { Supplier } from '@/types/database';
import { cn } from '@/lib/utils';
import { normalizePhone } from '@/lib/normalizePhone';

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

  const handleResend = (survey: PriceSurvey) => {
    const ss = survey.price_survey_suppliers || [];
    if (ss.length === 0) return;
    // Open WhatsApp for first pending supplier
    const pending = ss.find(s => s.status === 'pending') || ss[0];
    const phone = normalizePhone(pending.supplier?.phone);
    if (!phone) return;
    const surveyUrl = `${window.location.origin}/pesquisa/${pending.token}`;
    const message = `Olá ${pending.supplier?.name || ''}! 🛒\n\nLembrete: sua pesquisa de preços ainda está pendente.\n\n${surveyUrl}`;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return { label: 'Rascunho', color: 'text-muted-foreground', bg: 'bg-muted' };
      case 'sent': return { label: 'Enviada', color: 'text-primary', bg: 'bg-primary/10' };
      case 'completed': return { label: 'Completa', color: 'text-success', bg: 'bg-success/10' };
      default: return { label: status, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
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
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => setSheetOpen(true)}
      >
        <AppIcon name="Search" size={16} />
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
        surveys.map(survey => {
          const sc = getStatusConfig(survey.status);
          const suppliersList = survey.price_survey_suppliers || [];
          const respondedCount = suppliersList.filter(s => s.status === 'responded').length;

          return (
            <button
              key={survey.id}
              onClick={() => handleOpenDetail(survey)}
              className="w-full bg-card rounded-2xl p-4 text-left transition-colors hover:bg-secondary/30 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{survey.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {suppliersList.length} fornecedor{suppliersList.length !== 1 ? 'es' : ''} •{' '}
                    {respondedCount}/{suppliersList.length} responderam
                  </p>
                </div>
                <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", sc.bg, sc.color)}>
                  {sc.label}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${suppliersList.length > 0 ? (respondedCount / suppliersList.length) * 100 : 0}%` }}
                />
              </div>

              {/* Supplier avatars */}
              <div className="flex items-center gap-1 mt-2">
                {suppliersList.slice(0, 5).map(ss => (
                  <div
                    key={ss.id}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold",
                      ss.status === 'responded' ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    )}
                    title={ss.supplier?.name}
                  >
                    {ss.supplier?.name?.charAt(0) || '?'}
                  </div>
                ))}
                {suppliersList.length > 5 && (
                  <span className="text-xs text-muted-foreground">+{suppliersList.length - 5}</span>
                )}
              </div>
            </button>
          );
        })
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
