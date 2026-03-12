import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/components/ui/page-skeleton';

const SalesReport = lazy(() => import('@/components/reports/SalesReport').then(m => ({ default: m.SalesReport })));
const CMVReport = lazy(() => import('@/components/reports/CMVReport').then(m => ({ default: m.CMVReport })));
const InventoryValuationReport = lazy(() => import('@/components/reports/InventoryValuationReport').then(m => ({ default: m.InventoryValuationReport })));
const ABCAnalysisReport = lazy(() => import('@/components/reports/ABCAnalysisReport').then(m => ({ default: m.ABCAnalysisReport })));
const EmployeeReport = lazy(() => import('@/components/reports/EmployeeReport').then(m => ({ default: m.EmployeeReport })));

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="min-h-screen pb-36 lg:pb-12">
        <div className="px-4 py-4 lg:px-8 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-bold">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Análise consolidada de vendas, custos e operação</p>
          </div>

          <Tabs defaultValue="vendas" className="space-y-4">
            <TabsList className="w-full flex overflow-x-auto gap-1 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="vendas" className="text-xs flex-1 min-w-0">Vendas</TabsTrigger>
              <TabsTrigger value="cmv" className="text-xs flex-1 min-w-0">CMV</TabsTrigger>
              <TabsTrigger value="estoque" className="text-xs flex-1 min-w-0">Estoque</TabsTrigger>
              <TabsTrigger value="abc" className="text-xs flex-1 min-w-0">Curva ABC</TabsTrigger>
              <TabsTrigger value="funcionarios" className="text-xs flex-1 min-w-0">Funcionários</TabsTrigger>
            </TabsList>

            <Suspense fallback={<PageSkeleton variant="list" />}>
              <TabsContent value="vendas"><SalesReport /></TabsContent>
              <TabsContent value="cmv"><CMVReport /></TabsContent>
              <TabsContent value="estoque"><InventoryValuationReport /></TabsContent>
              <TabsContent value="abc"><ABCAnalysisReport /></TabsContent>
              <TabsContent value="funcionarios"><EmployeeReport /></TabsContent>
            </Suspense>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
