import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PriceTrackingItem } from '@/hooks/usePriceTracking';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AppIcon } from '@/components/ui/app-icon';

interface Props {
  item: PriceTrackingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceDetailSheet({ item, open, onOpenChange }: Props) {
  if (!item) return null;

  const chartData = item.history.map(h => ({
    date: format(new Date(h.date), 'dd/MM', { locale: ptBR }),
    fullDate: format(new Date(h.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    price: h.price,
    supplier: h.supplier_name || '—',
  }));

  const variation = item.variation_pct;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{item.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Current Price + Variation */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              <AppIcon name="TrendingUp" size={22} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                R$ {item.current_price.toFixed(2)}
              </p>
              {variation !== null && (
                <span className={`text-sm font-semibold ${variation > 0 ? 'text-destructive' : variation < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                  {variation > 0 ? '↑' : variation < 0 ? '↓' : '='} {Math.abs(variation).toFixed(1)}%
                  {item.previous_price !== null && (
                    <span className="text-muted-foreground font-normal ml-1">
                      (era R$ {item.previous_price.toFixed(2)})
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Chart */}
          {chartData.length >= 2 ? (
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Histórico de Preços</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      tickFormatter={v => `R$${v}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">Dados insuficientes para gráfico</p>
            </div>
          )}

          {/* History List */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Registros</p>
            {item.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
            ) : (
              [...item.history].reverse().map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground">R$ {h.price.toFixed(2)}</p>
                    <p className="text-[11px] text-muted-foreground">{h.supplier_name || 'Sem fornecedor'}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(h.date), "dd/MM/yy", { locale: ptBR })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
