import { useState, useEffect } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import gardenLogo from '@/assets/logo.png';
import type { User } from '@supabase/supabase-js';

interface CustomerData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  loyalty_points: number;
  total_orders: number;
  total_spent: number;
  segment: string | null;
  notes: string | null;
}

interface LoyaltyEvent {
  id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
}

interface OrderRecord {
  id: string;
  total: number;
  status: string;
  source: string;
  created_at: string;
  customer_name: string | null;
}

interface Props {
  customerUser: User | null;
  unitId: string;
  unitName?: string;
  logoUrl?: string;
  onLogin: () => void;
  onLogout: () => void;
}

type AccountTab = 'overview' | 'orders' | 'history' | 'data';

export function MenuAccount({ customerUser, unitId, unitName, logoUrl, onLogin, onLogout }: Props) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [loyaltyEvents, setLoyaltyEvents] = useState<LoyaltyEvent[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!customerUser) {
      setLoading(false);
      setCustomer(null);
      return;
    }
    fetchCustomer();
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, [customerUser, unitId]);

  // Fetch extra data when customer loads
  useEffect(() => {
    if (customer?.id) {
      fetchLoyaltyEvents(customer.id);
      fetchOrders();
    }
  }, [customer?.id]);

  const fetchCustomer = async () => {
    if (!customerUser) return;
    setLoading(true);
    try {
      const email = customerUser.email;
      const userPhone = customerUser.phone;

      let query = supabase
        .from('customers')
        .select('id, name, phone, email, birthday, loyalty_points, total_orders, total_spent, segment, notes')
        .eq('unit_id', unitId);

      if (email) query = query.eq('email', email);
      else if (userPhone) query = query.eq('phone', userPhone);
      else { setLoading(false); return; }

      const { data, error } = await query.maybeSingle();
      if (error) { console.error('Failed to fetch customer:', error); setLoading(false); return; }

      if (data) {
        setCustomer(data as CustomerData);
        setName(data.name || '');
        setPhone(formatPhoneDisplay(data.phone || ''));
        setBirthday(formatBirthdayDisplay(data.birthday || ''));
        setAddress(data.notes || '');
      }
    } catch (err) {
      console.error('Failed to fetch customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoyaltyEvents = async (customerId: string) => {
    setLoadingExtra(true);
    try {
      const { data } = await supabase
        .from('loyalty_events')
        .select('id, type, points, description, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);
      setLoyaltyEvents((data as LoyaltyEvent[]) || []);
    } catch { /* ignore */ }
    setLoadingExtra(false);
  };

  const fetchOrders = async () => {
    if (!customerUser?.email) return;
    try {
      // Find orders by customer email or name
      const customerName = customerUser.user_metadata?.full_name || customerUser.user_metadata?.name;
      let query = supabase
        .from('tablet_orders')
        .select('id, total, status, source, created_at, customer_name')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false })
        .limit(30);

      // Match by email column if it exists, otherwise by name
      if (customerUser.email) {
        query = query.or(`customer_email.eq.${customerUser.email}${customerName ? `,customer_name.ilike.${customerName}` : ''}`);
      }

      const { data } = await query;
      setOrders((data as OrderRecord[]) || []);
    } catch { /* ignore */ }
  };

  const formatPhoneDisplay = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatBirthdayDisplay = (val: string) => {
    if (!val) return '';
    if (val.includes('-')) {
      const [y, m, d] = val.split('-');
      return `${d}/${m}/${y}`;
    }
    return val;
  };

  const formatPhoneInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatBirthdayInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const phoneDigits = phone.replace(/\D/g, '');
      let birthdayISO: string | null = null;
      if (birthday) {
        const parts = birthday.split('/');
        if (parts.length === 3 && parts[2]?.length === 4) birthdayISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const { error } = await supabase.rpc('upsert_menu_customer', {
        p_unit_id: unitId, p_name: name.trim(),
        p_email: customerUser?.email || null, p_phone: phoneDigits || null, p_birthday: birthdayISO,
      });
      if (error) throw error;
      toast.success('Dados atualizados!');
      setEditing(false);
      await fetchCustomer();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // ========== NOT LOGGED IN ==========
  if (!customerUser) {
    return (
      <div className="px-5 pt-8 pb-28 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border/30 shadow-lg bg-card flex items-center justify-center p-2">
          {logoUrl ? (
            <img src={logoUrl} alt={unitName || 'Logo'} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
          )}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Minha Conta</h2>
          <p className="text-sm text-muted-foreground mt-1">Faça login para ver seus pontos e gerenciar seus dados.</p>
        </div>

        {/* How it works */}
        <CoinSystemExplainer />

        <Button size="lg" className="w-full max-w-xs h-14 text-base font-bold rounded-xl" onClick={onLogin}>
          <AppIcon name="LogIn" size={20} className="mr-2" />
          Entrar
        </Button>
      </div>
    );
  }

  // ========== LOADING ==========
  if (loading) {
    return (
      <div className="px-5 pt-8 pb-28 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
        <div className="w-40 h-5 rounded bg-muted animate-pulse" />
        <div className="w-full max-w-sm space-y-3 mt-4">
          <div className="h-20 rounded-2xl bg-muted animate-pulse" />
          <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  // ========== NO CUSTOMER PROFILE YET ==========
  if (!customer) {
    const displayName = customerUser.user_metadata?.full_name || customerUser.email || 'Cliente';
    const displayInitials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div className="px-5 pt-6 pb-28">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <span className="text-2xl font-bold text-primary">{displayInitials}</span>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{customerUser.email}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/30 p-5 text-center mb-4">
          <span className="text-3xl mb-2 block">🪙</span>
          <p className="text-sm font-semibold text-foreground mb-1">Bem-vindo ao programa de fidelidade!</p>
          <p className="text-xs text-muted-foreground">
            Faça seu primeiro pedido para ativar seu perfil e começar a acumular moedas.
          </p>
        </div>

        <CoinSystemExplainer />

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm active:scale-[0.98] transition-transform mt-4"
        >
          <AppIcon name="LogOut" size={16} />
          Sair da conta
        </button>
      </div>
    );
  }

  // ========== FULL PROFILE ==========
  const initials = (customer?.name || 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const tabs: { key: AccountTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Resumo', icon: 'Home' },
    { key: 'orders', label: 'Pedidos', icon: 'Receipt' },
    { key: 'history', label: 'Moedas', icon: 'History' },
    { key: 'data', label: 'Dados', icon: 'User' },
  ];

  return (
    <div className="px-5 pt-6 pb-28">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-2 mb-5">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
          <span className="text-2xl font-bold text-primary">{initials}</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">{customer.name}</h2>
        <p className="text-xs text-muted-foreground">{customerUser.email}</p>

        {/* Coin balance hero */}
        <div className="flex items-center gap-2 mt-1 px-5 py-2.5 rounded-full bg-amber-500/12 border border-amber-500/20">
          <span className="text-xl">🪙</span>
          <span className="text-2xl font-extrabold text-amber-500 tabular-nums">{customer.loyalty_points || 0}</span>
          <span className="text-sm text-amber-500/70 font-medium">moedas</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-secondary/50 rounded-2xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === t.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <AppIcon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab customer={customer} />
      )}

      {activeTab === 'orders' && (
        <OrdersTab orders={orders} />
      )}

      {activeTab === 'history' && (
        <HistoryTab events={loyaltyEvents} loading={loadingExtra} />
      )}

      {activeTab === 'data' && (
        <DataTab
          customer={customer}
          editing={editing}
          saving={saving}
          name={name}
          phone={phone}
          birthday={birthday}
          address={address}
          onSetEditing={setEditing}
          onSetName={setName}
          onSetPhone={(v) => setPhone(formatPhoneInput(v))}
          onSetBirthday={(v) => setBirthday(formatBirthdayInput(v))}
          onSetAddress={setAddress}
          onSave={handleSave}
          onCancel={() => { setEditing(false); fetchCustomer(); }}
          formatPhoneDisplay={formatPhoneDisplay}
        />
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm active:scale-[0.98] transition-transform mt-5"
      >
        <AppIcon name="LogOut" size={16} />
        Sair da conta
      </button>
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

function CoinSystemExplainer() {
  const steps = [
    { emoji: '🛒', title: 'Faça pedidos', desc: 'Cada R$1 gasto = 1 moeda Garden' },
    { emoji: '🪙', title: 'Acumule moedas', desc: 'Ganhe bônus em datas especiais e primeiro pedido' },
    { emoji: '🎁', title: 'Troque por produtos', desc: 'Use suas moedas para pagar 100% do pedido' },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3 w-full">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <span className="text-base">🪙</span>
        Como funciona o programa de moedas
      </h3>
      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-lg">
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="absolute ml-5 mt-10 w-px h-2 bg-border/50" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTab({ customer }: { customer: CustomerData }) {
  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="🛒" label="Total de pedidos" value={String(customer.total_orders || 0)} />
        <StatCard icon="💰" label="Total gasto" value={formatCurrency(customer.total_spent || 0)} />
        <StatCard icon="🪙" label="Moedas acumuladas" value={String(customer.loyalty_points || 0)} />
        <StatCard
          icon="🏷️"
          label="Segmento"
          value={
            customer.segment === 'vip' ? '⭐ VIP'
            : customer.segment === 'frequent' ? 'Frequente'
            : customer.segment === 'occasional' ? 'Ocasional'
            : customer.segment === 'new' ? 'Novo'
            : customer.segment || 'Novo'
          }
        />
      </div>

      {/* How it works */}
      <CoinSystemExplainer />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border/30 p-4">
      <span className="text-xl block mb-2">{icon}</span>
      <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function OrdersTab({ orders }: { orders: OrderRecord[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">📋</span>
        <p className="text-sm font-semibold text-foreground">Nenhum pedido ainda</p>
        <p className="text-xs text-muted-foreground mt-1">Seus pedidos aparecerão aqui</p>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    'awaiting_confirmation': { label: 'Aguardando', color: 'text-amber-500 bg-amber-500/10' },
    'confirmed': { label: 'Confirmado', color: 'text-blue-500 bg-blue-500/10' },
    'preparing': { label: 'Preparando', color: 'text-orange-500 bg-orange-500/10' },
    'ready': { label: 'Pronto', color: 'text-emerald-500 bg-emerald-500/10' },
    'delivered': { label: 'Entregue', color: 'text-emerald-600 bg-emerald-500/10' },
    'completed': { label: 'Concluído', color: 'text-emerald-600 bg-emerald-500/10' },
    'cancelled': { label: 'Cancelado', color: 'text-destructive bg-destructive/10' },
  };

  return (
    <div className="space-y-2">
      {orders.map(order => {
        const s = statusMap[order.status] || { label: order.status, color: 'text-muted-foreground bg-muted' };
        const date = new Date(order.created_at);
        return (
          <div key={order.id} className="rounded-2xl bg-card border border-border/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-foreground">#{order.id.slice(0, 8)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
                  {s.label}
                </span>
              </div>
              <span className="text-sm font-bold text-foreground">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{date.toLocaleDateString('pt-BR')}</span>
              <span>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="capitalize">{order.source === 'mesa' ? '🍽️ Mesa' : order.source === 'delivery' ? '🛵 Delivery' : order.source}</span>
            </div>
            {order.total > 0 && (
              <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-500">
                <span>🪙</span>
                <span className="font-semibold">+{Math.floor(order.total)} moedas ganhas</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HistoryTab({ events, loading }: { events: LoyaltyEvent[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">🪙</span>
        <p className="text-sm font-semibold text-foreground">Nenhuma movimentação</p>
        <p className="text-xs text-muted-foreground mt-1">Seu histórico de moedas aparecerá aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map(ev => {
        const isPositive = ev.points > 0;
        const date = new Date(ev.created_at);
        const typeLabel =
          ev.type === 'earned' ? 'Compra'
          : ev.type === 'redeemed' ? 'Resgate'
          : ev.type === 'signup_bonus' ? 'Bônus cadastro'
          : ev.type === 'birthday_bonus' ? 'Bônus aniversário'
          : ev.type;

        return (
          <div key={ev.id} className="rounded-2xl bg-card border border-border/30 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isPositive ? 'bg-emerald-500/10' : 'bg-destructive/10'
            }`}>
              <span className="text-lg">{isPositive ? '🪙' : '🎁'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{typeLabel}</span>
                <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-emerald-500' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{ev.points}
                </span>
              </div>
              {ev.description && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{ev.description}</p>
              )}
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DataTab({
  customer, editing, saving, name, phone, birthday, address,
  onSetEditing, onSetName, onSetPhone, onSetBirthday, onSetAddress,
  onSave, onCancel, formatPhoneDisplay,
}: {
  customer: CustomerData;
  editing: boolean;
  saving: boolean;
  name: string; phone: string; birthday: string; address: string;
  onSetEditing: (v: boolean) => void;
  onSetName: (v: string) => void;
  onSetPhone: (v: string) => void;
  onSetBirthday: (v: string) => void;
  onSetAddress: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  formatPhoneDisplay: (v: string) => string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border/30 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <h3 className="font-semibold text-foreground text-sm">Meus dados</h3>
        {!editing ? (
          <button onClick={() => onSetEditing(true)} className="text-xs text-primary font-semibold flex items-center gap-1">
            <AppIcon name="Pencil" size={12} />
            Editar
          </button>
        ) : (
          <button onClick={onCancel} className="text-xs text-muted-foreground font-semibold">Cancelar</button>
        )}
      </div>

      {editing ? (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome</label>
            <input type="text" value={name} onChange={e => onSetName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Celular</label>
            <input type="tel" value={phone} onChange={e => onSetPhone(e.target.value)} inputMode="tel"
              className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Data de nascimento</label>
            <input type="text" value={birthday} onChange={e => onSetBirthday(e.target.value)} placeholder="__/__/____" inputMode="numeric"
              className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Endereço de entrega</label>
            <textarea value={address} onChange={e => onSetAddress(e.target.value)} placeholder="Rua, número, bairro..." rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <Button className="w-full h-12 rounded-xl font-semibold" onClick={onSave} disabled={saving}>
            {saving && <AppIcon name="Loader2" size={16} className="animate-spin mr-2" />}
            Salvar alterações
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/20">
          <DataRow icon="User" label="Nome" value={customer.name} />
          <DataRow icon="Phone" label="Celular" value={customer.phone ? formatPhoneDisplay(customer.phone) : null} />
          <DataRow icon="Mail" label="E-mail" value={customer.email} />
          <DataRow icon="Cake" label="Nascimento" value={birthday || null} />
          <DataRow icon="MapPin" label="Endereço" value={customer.notes} />
        </div>
      )}
    </div>
  );
}

function DataRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <AppIcon name={icon} size={16} className="text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value || '—'}</p>
      </div>
    </div>
  );
}
