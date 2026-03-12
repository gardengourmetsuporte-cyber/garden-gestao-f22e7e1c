import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useReportCMV } from '@/hooks/useReportCMV';
import { formatCurrency } from '@/lib/format';
import { AppIcon } from '@/components/ui/app-icon';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/page-skeleton';

export function CMVReport() {
  const now = new Date();
  const [startDate, setStartDate] = useState<Date>(startOfMonth(now));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(now));

  const { data, isLoading } = useReportCMV({
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data início</label>
              <DatePicker date={startDate} onSelect={setStartDate} formatStr="dd/MM/yyyy" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data fim</label>
              <DatePicker date={endDate} onSelect={setEndDate} formatStr="dd/MM/yyyy" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <PageSkeleton variant="list" /> : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Receita Total', value: data.totalRevenue, icon: 'DollarSign' as const },
              { label: 'Custo Total (CMV)', value: data.totalCost, icon: 'TrendingDown' as const },
              { label: 'Margem Bruta', value: data.grossMargin, icon: 'TrendingUp' as const },
              { label: 'CMV %', value: data.cmvPercent, icon: 'Percent' as const, isPct: true },
            ].map(kpi => (
              <Card key={kpi.label} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AppIcon name={kpi.icon} size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {kpi.isPct ? `${kpi.value.toFixed(1)}%` : formatCurrency(kpi.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.products.length > 0 ? (
            <Card className="border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Receita</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Custo</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.slice(0, 50).map(p => (
                    <TableRow key={p.product_id}>
                      <TableCell className="text-xs font-medium">{p.product_name}</TableCell>
                      <TableCell className="text-right text-xs">{p.qty_sold}</TableCell>
                      <TableCell className="text-right text-xs hidden sm:table-cell">{formatCurrency(p.revenue)}</TableCell>
                      <TableCell className="text-right text-xs hidden sm:table-cell">{formatCurrency(p.total_cost)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.margin_pct >= 60 ? 'default' : p.margin_pct >= 40 ? 'secondary' : 'destructive'} className="text-xs">
                          {p.margin_pct.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <AppIcon name="FileX" size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum dado de CMV no período</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
