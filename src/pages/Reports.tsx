import { AppLayout } from '@/components/layout/AppLayout';
import { SalesReport } from '@/components/reports/SalesReport';

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="min-h-screen pb-36 lg:pb-12">
        <div className="px-4 py-4 lg:px-8 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-bold">Relatório de Vendas</h1>
            <p className="text-sm text-muted-foreground">Análise consolidada de todas as vendas do PDV</p>
          </div>
          <SalesReport />
        </div>
      </div>
    </AppLayout>
  );
}
