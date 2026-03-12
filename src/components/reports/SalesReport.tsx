import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReportSales } from '@/hooks/useReportSales';
import { exportSalesExcel } from '@/lib/exportSalesReport';
import { formatCurrency } from '@/lib/format';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/page-skeleton';

const SOURCE_LABELS: Record<string, string> = {
  counter: 'Balcão', delivery: 'Delivery', tablet: 'Tablet', whatsapp: 'WhatsApp',
};
const METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro', debit: 'Débito', credit: 'Crédito', pix: 'Pix',
  meal_voucher: 'Vale Refeição', delivery: 'Delivery',
};

export function SalesReport() {
  const now = new Date();
  const [startDate, setStartDate] = useState<Date>(startOfMonth(now));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(now));
  const [source, setSource] = useState('all');
  const [status, setStatus] = useState('paid');

  const { data, isLoading } = useReportSales({
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    source,
    status,
  });

  const summary = data?.summary;
  const sales = data?.sales || [];

  const handleExport = () => {
    if (!data) return;
    const label = `${format(startDate, 'dd-MM-yyyy')}_${format(endDate, 'dd-MM-yyyy')}`;
    exportSalesExcel(data.sales, data.summary, label);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data início</label>
              <DatePicker date={startDate} onSelect={setStartDate} formatStr="dd/MM/yyyy" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data fim</label>
              <DatePicker date={endDate} onSelect={setEndDate} formatStr="dd/MM/yyyy" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Origem</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="counter">Balcão</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} disabled={!data || sales.length === 0} className="w-full h-12 rounded-xl gap-2">
                <AppIcon name="Download" size={16} />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <PageSkeleton variant="list" />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Vendas', value: summary?.totalSales ?? 0, icon: 'ShoppingCart' as const, format: (v: number) => String(v) },
              { label: 'Receita Total', value: summary?.totalRevenue ?? 0, icon: 'DollarSign' as const, format: formatCurrency },
              { label: 'Ticket Médio', value: summary?.avgTicket ?? 0, icon: 'TrendingUp' as const, format: formatCurrency },
              { label: 'Descontos', value: summary?.totalDiscount ?? 0, icon: 'Percent' as const, format: formatCurrency },
            ].map((kpi) => (
              <Card key={kpi.label} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AppIcon name={kpi.icon} size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-lg font-bold">{kpi.format(kpi.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment breakdown */}
          {summary && Object.keys(summary.byPaymentMethod).length > 0 && (
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <h3 className="text-sm font-semibold mb-3">Formas de Pagamento</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.byPaymentMethod).map(([method, total]) => (
                    <Badge key={method} variant="secondary" className="text-xs py-1 px-3">
                      {METHOD_LABELS[method] || method}: {formatCurrency(total)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          {sales.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <AppIcon name="FileX" size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma venda encontrada no período</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Origem</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.slice(0, 100).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">#{sale.sale_number}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(sale.created_at), "dd/MM HH:mm")}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs">{sale.customer_name || '-'}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">{SOURCE_LABELS[sale.source] || sale.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={sale.status === 'paid' ? 'default' : sale.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-xs">
                          {sale.status === 'paid' ? 'Pago' : sale.status === 'cancelled' ? 'Cancelado' : sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {sales.length > 100 && (
                <div className="p-3 text-center text-xs text-muted-foreground border-t border-border/40">
                  Mostrando 100 de {sales.length} vendas. Exporte para ver todas.
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
