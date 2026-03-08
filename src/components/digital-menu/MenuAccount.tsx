import { useState, useEffect } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface Props {
  customerUser: User | null;
  unitId: string;
  unitName?: string;
  logoUrl?: string;
  onLogin: () => void;
  onLogout: () => void;
}

export function MenuAccount({ customerUser, unitId, unitName, logoUrl, onLogin, onLogout }: Props) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!customerUser) {
      setLoading(false);
      return;
    }
    fetchCustomer();
  }, [customerUser, unitId]);

  const fetchCustomer = async () => {
    if (!customerUser) return;
    setLoading(true);
    try {
      const email = customerUser.email;
      const phone = customerUser.phone;
      
      // Try by email first, then by phone
      let query = supabase
        .from('customers')
        .select('id, name, phone, email, birthday, loyalty_points, total_orders, total_spent, segment, notes')
        .eq('unit_id', unitId);
      
      if (email) {
        query = query.eq('email', email);
      } else if (phone) {
        query = query.eq('phone', phone);
      } else {
        // No email or phone — can't find customer
        setLoading(false);
        return;
      }

      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Failed to fetch customer:', error);
        setLoading(false);
        return;
      }

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

  const formatPhoneDisplay = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatBirthdayDisplay = (val: string) => {
    if (!val) return '';
    // ISO date to dd/mm/yyyy
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
        if (parts.length === 3 && parts[2]?.length === 4) {
          birthdayISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      await supabase
        .from('customers')
        .update({
          name: name.trim(),
          phone: phoneDigits || null,
          birthday: birthdayISO,
          notes: address.trim() || null,
        })
        .eq('id', customer.id);

      toast.success('Dados atualizados!');
      setEditing(false);
      await fetchCustomer();
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // Not logged in
  if (!customerUser) {
    return (
      <div className="px-5 pt-8 pb-28 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border/30 shadow-lg bg-white flex items-center justify-center p-2">
          {logoUrl ? (
            <img src={logoUrl} alt={unitName || 'Logo'} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
          )}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Minha Conta</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Faça login para ver seus pontos e gerenciar seus dados.
          </p>
        </div>
        <Button size="lg" className="w-full max-w-xs h-14 text-base font-bold rounded-xl" onClick={onLogin}>
          <AppIcon name="LogIn" size={20} className="mr-2" />
          Entrar
        </Button>
      </div>
    );
  }

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

  const initials = (customer?.name || customerUser.user_metadata?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="px-5 pt-6 pb-28">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
          <span className="text-2xl font-bold text-primary">{initials}</span>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">{customer?.name || 'Cliente'}</h2>
          <p className="text-sm text-muted-foreground">{customerUser.email}</p>
        </div>
      </div>

      {/* Loyalty points card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <AppIcon name="Star" size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Seus pontos</p>
            <p className="text-3xl font-extrabold text-foreground">{customer?.loyalty_points || 0}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card/60 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{customer?.total_orders || 0}</p>
            <p className="text-[11px] text-muted-foreground">Pedidos</p>
          </div>
          <div className="rounded-xl bg-card/60 p-3 text-center">
            <p className="text-lg font-bold text-foreground">
              {(customer?.total_spent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-[11px] text-muted-foreground">Total gasto</p>
          </div>
        </div>
      </div>

      {/* Personal data */}
      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden mb-4">
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <h3 className="font-semibold text-foreground text-sm">Meus dados</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-xs text-primary font-semibold flex items-center gap-1">
              <AppIcon name="Pencil" size={12} />
              Editar
            </button>
          ) : (
            <button onClick={() => { setEditing(false); fetchCustomer(); }} className="text-xs text-muted-foreground font-semibold">
              Cancelar
            </button>
          )}
        </div>

        {editing ? (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Celular</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhoneInput(e.target.value))}
                inputMode="tel"
                className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Data de nascimento</label>
              <input
                type="text"
                value={birthday}
                onChange={e => setBirthday(formatBirthdayInput(e.target.value))}
                placeholder="__/__/____"
                inputMode="numeric"
                className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Endereço de entrega</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, complemento..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <Button className="w-full h-12 rounded-xl font-semibold" onClick={handleSave} disabled={saving}>
              {saving && <AppIcon name="Loader2" size={16} className="animate-spin mr-2" />}
              Salvar alterações
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            <DataRow icon="User" label="Nome" value={customer?.name} />
            <DataRow icon="Phone" label="Celular" value={customer?.phone ? formatPhoneDisplay(customer.phone) : null} />
            <DataRow icon="Mail" label="E-mail" value={customer?.email} />
            <DataRow icon="Cake" label="Nascimento" value={birthday || null} />
            <DataRow icon="MapPin" label="Endereço" value={customer?.notes} />
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm active:scale-[0.98] transition-transform"
      >
        <AppIcon name="LogOut" size={16} />
        Sair da conta
      </button>
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
