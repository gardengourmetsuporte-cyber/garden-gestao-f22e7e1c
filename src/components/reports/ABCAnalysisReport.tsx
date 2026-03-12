import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useReportABC } from '@/hooks/useReportABC';
import { formatCurrency } from '@/lib/format';
import { AppIcon } from '@/components/ui/app-icon';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/page-skeleton';

const CLASS_COLORS = { A: 'default', B: 'secondary', C: 'outline' } as const;

export function ABCAnalysisReport() {
  const now = new Date();
  const [startDate, setStartDate] = useState<Date>(startOfMonth(now));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(now));

  const { data, isLoading } = useReportABC(
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd'),
  );

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
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <span className="text-xs text-muted-foreground">Receita Total</span>
                <p className="text-lg font-bold">{formatCurrency(data.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <span className="text-xs text-muted-foreground">Classe A (80%)</span>
                <p className="text-lg font-bold text-emerald-500">{data.classA} produtos</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <span className="text-xs text-muted-foreground">Classe B (15%)</span>
                <p className="text-lg font-bold text-amber-500">{data.classB} produtos</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 px-4">
                <span className="text-xs text-muted-foreground">Classe C (5%)</span>
                <p className="text-lg font-bold text-muted-foreground">{data.classC} produtos</p>
              </CardContent>
            </Card>
          </div>

          {data.products.length > 0 ? (
            <Card className="border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Acum. %</TableHead>
                    <TableHead>Classe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((p, i) => (
                    <TableRow key={p.product_id}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{p.product_name}</TableCell>
                      <TableCell className="text-right text-xs">{p.qty_sold}</TableCell>
                      <TableCell className="text-right text-xs">{formatCurrency(p.revenue)}</TableCell>
                      <TableCell className="text-right text-xs hidden sm:table-cell">{p.cumulative_pct.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant={CLASS_COLORS[p.classification]} className="text-xs font-bold">
                          {p.classification}
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
                <p className="text-sm text-muted-foreground">Nenhum dado de vendas no período</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
