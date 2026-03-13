import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useMonitoredClients, useClientActivity, MonitoredClient } from '@/hooks/useClientMonitor';
import { getActionLabel } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Activity, LogIn, Clock, ArrowLeft, Shield } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ActionTimeline({ userId }: { userId: string }) {
  const { data: activities, isLoading } = useClientActivity(userId);

  if (isLoading) return <div className="text-sm text-muted-foreground py-4">Carregando atividades...</div>;
  if (!activities?.length) return <div className="text-sm text-muted-foreground py-4">Nenhuma atividade registrada.</div>;

  // Group by date
  const grouped: Record<string, typeof activities> = {};
  activities.forEach(a => {
    const day = format(new Date(a.created_at), 'yyyy-MM-dd');
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(a);
  });

  return (
    <ScrollArea className="h-[60vh]">
      <div className="space-y-4 pr-3">
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              {format(new Date(day), "dd 'de' MMMM", { locale: ptBR })}
            </h4>
            <div className="space-y-1">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    item.action === 'user_login' ? 'bg-success' :
                    item.action.includes('created') ? 'bg-blue-500' :
                    item.action.includes('deleted') ? 'bg-red-500' :
                    'bg-muted-foreground'
                  }`} />
                  <span className="text-sm font-medium">{getActionLabel(item.action)}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(item.created_at), 'HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function ClientCard({ client, onSelect }: { client: MonitoredClient; onSelect: () => void }) {
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">{client.label || client.user_name}</h3>
            <p className="text-xs text-muted-foreground">{client.unit_name}</p>
          </div>
          <Badge variant={client.plan === 'pro' ? 'default' : client.plan === 'business' ? 'default' : 'secondary'}>
            {(client.plan || 'free').toUpperCase()}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/50 p-2">
            <LogIn className="w-3.5 h-3.5 mx-auto mb-1 text-success" />
            <p className="text-lg font-bold">{client.login_count}</p>
            <p className="text-[10px] text-muted-foreground">Logins</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <Activity className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{client.action_count}</p>
            <p className="text-[10px] text-muted-foreground">Ações</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-medium mt-1">
              {client.last_login
                ? formatDistanceToNow(new Date(client.last_login), { addSuffix: true, locale: ptBR })
                : 'Nunca'}
            </p>
            <p className="text-[10px] text-muted-foreground">Último login</p>
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          {client.notify_on_login && <Badge variant="outline" className="text-[10px]">🔔 Login</Badge>}
          {client.notify_on_actions && <Badge variant="outline" className="text-[10px]">🔔 Ações</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminMonitor() {
  const { isSuperAdmin } = useAuth();
  const { data: clients, isLoading } = useMonitoredClients();
  const [selectedClient, setSelectedClient] = useState<MonitoredClient | null>(null);

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <AppLayout>
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          {selectedClient && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Monitoramento de Clientes</h1>
          </div>
        </div>

        {!selectedClient ? (
          <>
            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!isLoading && (!clients || clients.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhuma conta monitorada.</p>
            )}
            <div className="grid gap-3">
              {clients?.map(client => (
                <ClientCard key={client.id} client={client} onSelect={() => setSelectedClient(client)} />
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {selectedClient.label || selectedClient.user_name}
                </CardTitle>
                <Badge>{(selectedClient.plan || 'free').toUpperCase()}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{selectedClient.unit_name} • {selectedClient.login_count} logins • {selectedClient.action_count} ações</p>
            </CardHeader>
            <CardContent>
              <ActionTimeline userId={selectedClient.user_id} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
