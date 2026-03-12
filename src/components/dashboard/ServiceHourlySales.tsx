import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/format';
import type { HourlySale } from '@/hooks/useServiceDashboard';

export function ServiceHourlySales({ data }: { data: HourlySale[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          <AppIcon name="bar_chart" size={32} className="mx-auto mb-2 opacity-40" />
          Sem vendas registradas hoje
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AppIcon name="bar_chart" size={18} className="text-primary" />
          Vendas por Hora
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data}>
            <XAxis
              dataKey="hour"
              tickFormatter={(h: number) => `${h}h`}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Total']}
              labelFormatter={(h: number) => `${h}:00 - ${h}:59`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none' }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
