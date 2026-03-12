import { useState } from 'react';
import { useReportEmployees } from '@/hooks/useReportEmployees';
import { formatCurrency } from '@/lib/format';
import { AppIcon } from '@/components/ui/app-icon';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageSkeleton } from '@/components/ui/page-skeleton';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function EmployeeReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useReportEmployees(month, year);

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mês</label>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ano</label>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <PageSkeleton variant="list" /> : data && (
        <>
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <AppIcon name="Users" size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Custo Total com Pessoal</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(data.totalCost)}</p>
              <p className="text-xs text-muted-foreground mt-1">{data.employees.length} funcionários ativos</p>
            </CardContent>
          </Card>

          {data.employees.length > 0 ? (
            <Card className="border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead className="hidden sm:table-cell">Cargo</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Salário Base</TableHead>
                    <TableHead className="text-right">Pagamentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.employees.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs font-medium">{e.name}</TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{e.role}</TableCell>
                      <TableCell className="text-right text-xs hidden sm:table-cell">{formatCurrency(e.base_salary)}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{formatCurrency(e.total_payments)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <AppIcon name="Users" size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum funcionário ativo</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
