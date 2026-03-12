import { useReportInventoryValuation } from '@/hooks/useReportInventoryValuation';
import { formatCurrency } from '@/lib/format';
import { AppIcon } from '@/components/ui/app-icon';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Progress } from '@/components/ui/progress';

export function InventoryValuationReport() {
  const { data, isLoading } = useReportInventoryValuation();

  if (isLoading) return <PageSkeleton variant="list" />;
  if (!data) return null;

  const maxCatValue = Math.max(...data.categories.map(c => c.total_value), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <AppIcon name="Package" size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Valor Total do Estoque</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(data.totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <AppIcon name="BarChart3" size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total de Itens</span>
            </div>
            <p className="text-lg font-bold">{data.totalItems}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <AppIcon name="AlertTriangle" size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Abaixo do Mínimo</span>
            </div>
            <p className="text-lg font-bold text-destructive">{data.belowMinCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* By category */}
      {data.categories.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <h3 className="text-sm font-semibold mb-3">Por Categoria</h3>
            <div className="space-y-3">
              {data.categories.map(c => (
                <div key={c.category_id || 'none'} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{c.category_name} ({c.item_count})</span>
                    <span className="font-medium">{formatCurrency(c.total_value)}</span>
                  </div>
                  <Progress value={(c.total_value / maxCatValue) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items table */}
      {data.items.length > 0 && (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Preço Unit.</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.slice(0, 100).map(item => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    <span className="font-medium">{item.name}</span>
                    {item.is_below_min && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">Baixo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">{item.current_stock} {item.unit_type}</TableCell>
                  <TableCell className="text-right text-xs hidden sm:table-cell">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{formatCurrency(item.total_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
