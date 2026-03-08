import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const SESSION_KEY = 'supplier_portal_session';
const PUBLISHED_URL = import.meta.env.VITE_PUBLISHED_URL || '';
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

function getSession(): { supplierId: string; supplierName: string; expiresAt: number } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}

function saveSession(supplierId: string, supplierName: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    supplierId, supplierName, expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
  }));
}

function buildUrl(action?: string, extra?: Record<string, string>) {
  const base = `https://${PROJECT_ID}.supabase.co/functions/v1/supplier-portal`;
  const params = new URLSearchParams(extra || {});
  if (action) params.set('action', action);
  return `${base}?${params.toString()}`;
}

type Tab = 'resumo' | 'pedidos' | 'faturas';

interface Summary {
  total_orders_month: number;
  sent_orders: number;
  received_orders: number;
  total_sold_month: number;
  pending_invoices_count: number;
  pending_invoices_amount: number;
  overdue_invoices_count: number;
  overdue_invoices_amount: number;
  next_due_date: string | null;
}

interface Order {
  id: string;
  status: string;
  notes: string | null;
  sent_at: string | null;
  created_at: string;
  order_items: { id: string; quantity: number; notes: string | null; item: { name: string; unit_type: string } }[];
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  description: string;
  amount: number;
  issue_date: string;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
}

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (d: string) => {
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
};

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  received: 'Recebido',
  cancelled: 'Cancelado',
};
const statusColor: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/20 text-primary',
  received: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-destructive/20 text-destructive',
};

export default function SupplierPortal() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState(getSession());
  const [phone, setPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [hasPhone, setHasPhone] = useState(true);
  const [supplierName, setSupplierName] = useState('');
  const [tab, setTab] = useState<Tab>('resumo');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if supplier has phone (needs login)
  useEffect(() => {
    if (!token) return;
    fetch(buildUrl('summary', { token }))
      .then(r => r.json())
      .then(data => {
        if (data.error) return;
        setHasPhone(data.has_phone);
        setSupplierName(data.supplier_name);
        if (!data.has_phone) {
          // No phone = no login required, auto-session
          saveSession(data.supplier_id, data.supplier_name);
          setSession({ supplierId: data.supplier_id, supplierName: data.supplier_name, expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000 });
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Load data based on tab
  const loadData = useCallback(async () => {
    if (!token || !session) return;
    setLoading(true);
    try {
      if (tab === 'resumo') {
        const r = await fetch(buildUrl('summary', { token }));
        const data = await r.json();
        setSummary(data.summary);
        setSupplierName(data.supplier_name);
      } else if (tab === 'pedidos') {
        const r = await fetch(buildUrl('orders', { token }));
        const data = await r.json();
        setOrders(data.orders || []);
      } else if (tab === 'faturas') {
        const r = await fetch(buildUrl('invoices', { token }));
        const data = await r.json();
        setInvoices(data.invoices || []);
      }
    } catch {
      toast.error('Erro ao carregar dados');
    }
    setLoading(false);
  }, [token, session, tab]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime for invoices
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('supplier-invoices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_invoices' }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, loadData]);

  const handleVerifyPhone = async () => {
    if (!token || !phone.trim()) return;
    setVerifying(true);
    try {
      const r = await fetch(buildUrl('verify-phone', { token, phone: phone.trim() }));
      const data = await r.json();
      if (data.valid) {
        saveSession(data.supplier_id, data.supplier_name);
        setSession({ supplierId: data.supplier_id, supplierName: data.supplier_name, expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000 });
        toast.success('Bem-vindo!');
      } else {
        toast.error(data.error || 'Telefone não corresponde');
      }
    } catch {
      toast.error('Erro ao verificar');
    }
    setVerifying(false);
  };

  // ========== LOGIN SCREEN ==========
  if (!session && hasPhone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Sonner />
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <AppIcon size={40} />
            <h1 className="text-xl font-bold text-foreground">Portal do Fornecedor</h1>
            {supplierName && <p className="text-muted-foreground text-sm">{supplierName}</p>}
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Digite seu telefone cadastrado para acessar:
            </p>
            <Input
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerifyPhone()}
              className="text-center text-lg"
            />
            <Button onClick={handleVerifyPhone} disabled={verifying || !phone.trim()} className="w-full">
              {verifying ? 'Verificando...' : 'Entrar'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ========== PORTAL DASHBOARD ==========
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      <Sonner />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppIcon size="sm" />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Portal do Fornecedor</h1>
              <p className="text-xs text-muted-foreground">{session?.supplierName || supplierName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { localStorage.removeItem(SESSION_KEY); setSession(null); }}
            className="text-xs text-muted-foreground"
          >
            Sair
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[57px] z-10 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto flex">
          {(['resumo', 'pedidos', 'faturas'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2',
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {!loading && tab === 'resumo' && summary && (
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon="DollarSign"
              label="Vendas do mês"
              value={formatCurrency(summary.total_sold_month)}
              accent="text-green-400"
            />
            <SummaryCard
              icon="Package"
              label="Pedidos do mês"
              value={String(summary.total_orders_month)}
              sub={`${summary.received_orders} recebidos`}
            />
            <SummaryCard
              icon="Clock"
              label="Boletos pendentes"
              value={formatCurrency(summary.pending_invoices_amount)}
              sub={`${summary.pending_invoices_count} boleto(s)`}
              accent="text-yellow-400"
            />
            <SummaryCard
              icon="AlertTriangle"
              label="Vencidos"
              value={formatCurrency(summary.overdue_invoices_amount)}
              sub={`${summary.overdue_invoices_count} boleto(s)`}
              accent={summary.overdue_invoices_count > 0 ? 'text-destructive' : 'text-muted-foreground'}
            />
            {summary.next_due_date && (
              <div className="col-span-2 bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <AppIcon name="CalendarClock" className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Próximo vencimento</p>
                  <p className="text-sm font-semibold text-foreground">{formatDate(summary.next_due_date)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && tab === 'pedidos' && (
          orders.length === 0 ? (
            <EmptyState icon="Package" text="Nenhum pedido encontrado" />
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[order.status] || 'bg-muted text-muted-foreground')}>
                      {statusLabel[order.status] || order.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.created_at.split('T')[0])}
                    </span>
                  </div>
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="space-y-1">
                      {order.order_items.map(oi => (
                        <div key={oi.id} className="flex justify-between text-sm">
                          <span className="text-foreground">{oi.item?.name || '—'}</span>
                          <span className="text-muted-foreground">{oi.quantity} {oi.item?.unit_type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {order.notes && <p className="text-xs text-muted-foreground italic">{order.notes}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {!loading && tab === 'faturas' && (
          invoices.length === 0 ? (
            <EmptyState icon="Receipt" text="Nenhuma fatura encontrada" />
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => {
                const isOverdue = !inv.is_paid && inv.due_date < today;
                return (
                  <div key={inv.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {inv.is_paid ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/20 text-green-400">Pago</span>
                        ) : isOverdue ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-destructive/20 text-destructive">Vencido</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-500/20 text-yellow-400">Pendente</span>
                        )}
                        {inv.invoice_number && (
                          <span className="text-xs text-muted-foreground">#{inv.invoice_number}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(inv.amount)}</span>
                    </div>
                    <p className="text-sm text-foreground">{inv.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Emissão: {formatDate(inv.issue_date)}</span>
                      <span>Venc: {formatDate(inv.due_date)}</span>
                      {inv.is_paid && inv.paid_at && (
                        <span className="text-green-400">Pago em {formatDate(inv.paid_at.split('T')[0])}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-1">
      <div className="flex items-center gap-2">
        <AppIcon name={icon} className={cn('h-4 w-4', accent || 'text-primary')} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-lg font-bold', accent || 'text-foreground')}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <AppIcon name={icon} className="h-10 w-10 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
