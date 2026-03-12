import { AppIcon } from '@/components/ui/app-icon';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/format';
import type { HourlySale } from '@/hooks/useServiceDashboard';

export function ServiceHourlySales({ data }: { data: HourlySale[] }) {
  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
          <AppIcon name="bar_chart" size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Vendas por Hora</h3>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-1.5">
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
            <AppIcon name="bar_chart" size={20} className="text-muted-foreground/50" />
          </div>
          <p className="text-xs text-muted-foreground">Sem vendas registradas hoje</p>
        </div>
      ) : (
        <div className="-mx-2">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data}>
              <XAxis
                dataKey="hour"
                tickFormatter={(h: number) => `${h}h`}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Total']}
                labelFormatter={(h: number) => `${h}:00 - ${h}:59`}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: 'none',
                  background: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: '0 8px 24px -4px hsl(0 0% 0% / 0.3)',
                }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
