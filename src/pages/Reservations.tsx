import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useReservations, type Reservation } from '@/hooks/useReservations';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { WaitlistManager } from '@/components/reservations/WaitlistManager';
import { TableMapView } from '@/components/reservations/TableMapView';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmada', variant: 'default' },
  seated: { label: 'Sentada', variant: 'secondary' },
  completed: { label: 'Finalizada', variant: 'outline' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  no_show: { label: 'No-show', variant: 'destructive' },
};

export default function ReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { reservations, isLoading, create, update } = useReservations(selectedDate);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', party_size: 2, reservation_time: '19:00', table_number: '', notes: '' });

  const handleCreate = () => {
    create.mutate({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone || null,
      party_size: form.party_size,
      reservation_date: selectedDate,
      reservation_time: form.reservation_time,
      table_number: form.table_number || null,
      notes: form.notes || null,
    });
    setSheetOpen(false);
    setForm({ customer_name: '', customer_phone: '', party_size: 2, reservation_time: '19:00', table_number: '', notes: '' });
  };

  const handleStatusChange = (id: string, status: string) => {
    update.mutate({ id, status });
  };

  const displayDate = new Date(selectedDate + 'T12:00:00');

  return (
    <AppLayout>
      <div className="min-h-screen pb-36 lg:pb-12">
        <div className="px-4 py-4 lg:px-8 max-w-[1400px] mx-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold">Reservas & Mesas</h1>
            <p className="text-sm text-muted-foreground">Gerenciamento de reservas, fila de espera e mesas</p>
          </div>

          <Tabs defaultValue="reservas" className="space-y-4">
            <TabsList className="w-full flex gap-1 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="reservas" className="text-xs flex-1">Reservas</TabsTrigger>
              <TabsTrigger value="fila" className="text-xs flex-1">Fila de Espera</TabsTrigger>
              <TabsTrigger value="mesas" className="text-xs flex-1">Mapa de Mesas</TabsTrigger>
            </TabsList>

            <TabsContent value="reservas">
              <div className="flex items-center justify-between mb-4">
                <div />
                <Button onClick={() => setSheetOpen(true)} className="rounded-xl gap-2" size="sm">
                  <AppIcon name="Plus" size={14} />
                  Nova Reserva
                </Button>
              </div>

              {/* Date navigation */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(format(subDays(displayDate, 1), 'yyyy-MM-dd'))}>
                  <AppIcon name="ChevronLeft" size={20} />
                </Button>
                <h2 className="text-sm font-semibold capitalize">
                  {format(displayDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(format(addDays(displayDate, 1), 'yyyy-MM-dd'))}>
                  <AppIcon name="ChevronRight" size={20} />
                </Button>
              </div>

              {isLoading ? <PageSkeleton variant="list" /> : (
                <>
                  {/* Status summary */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
                    {Object.entries(STATUS_MAP).map(([key, { label }]) => {
                      const count = reservations.filter(r => r.status === key).length;
                      return (
                        <Card key={key} className="border-border/50">
                          <CardContent className="py-2 px-3 text-center">
                            <p className="text-lg font-bold">{count}</p>
                            <p className="text-[10px] text-muted-foreground">{label}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {reservations.length === 0 ? (
                    <Card className="border-border/50">
                      <CardContent className="py-12 text-center">
                        <AppIcon name="CalendarX" size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">Nenhuma reserva para este dia</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {reservations.map(r => {
                        const st = STATUS_MAP[r.status] || STATUS_MAP.confirmed;
                        return (
                          <Card key={r.id} className="border-border/50">
                            <CardContent className="py-3 px-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">{r.reservation_time.slice(0, 5)}</span>
                                    <span className="text-sm font-medium">{r.customer_name}</span>
                                    <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <AppIcon name="Users" size={12} /> {r.party_size}p
                                    </span>
                                    {r.table_number && <span>Mesa {r.table_number}</span>}
                                    {r.customer_phone && <span>{r.customer_phone}</span>}
                                  </div>
                                  {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
                                </div>
                                {r.status === 'confirmed' && (
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleStatusChange(r.id, 'seated')}>Sentar</Button>
                                    <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleStatusChange(r.id, 'no_show')}>No-show</Button>
                                  </div>
                                )}
                                {r.status === 'seated' && (
                                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleStatusChange(r.id, 'completed')}>Finalizar</Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Create reservation sheet */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
                  <SheetHeader><SheetTitle>Nova Reserva</SheetTitle></SheetHeader>
                  <div className="space-y-4 mt-4 pb-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Nome do cliente *</label>
                      <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Telefone</label>
                      <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Horário *</label>
                        <Input type="time" value={form.reservation_time} onChange={e => setForm(f => ({ ...f, reservation_time: e.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Pessoas</label>
                        <Input type="number" min={1} value={form.party_size} onChange={e => setForm(f => ({ ...f, party_size: Number(e.target.value) }))} className="rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Mesa</label>
                      <Input value={form.table_number} onChange={e => setForm(f => ({ ...f, table_number: e.target.value }))} className="rounded-xl" placeholder="Ex: 5" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Observações</label>
                      <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="rounded-xl" />
                    </div>
                    <Button onClick={handleCreate} disabled={!form.customer_name || create.isPending} className="w-full rounded-xl">
                      {create.isPending ? 'Criando...' : 'Criar Reserva'}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </TabsContent>

            <TabsContent value="fila">
              <WaitlistManager />
            </TabsContent>

            <TabsContent value="mesas">
              <TableMapView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
