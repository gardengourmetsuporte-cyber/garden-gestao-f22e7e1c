import { useState, useEffect, useCallback } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerAddress {
  id: string;
  customer_id: string;
  unit_id: string;
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  complement: string | null;
  reference: string | null;
  is_primary: boolean;
}

interface Props {
  customerId: string;
  unitId: string;
  onSelect?: (address: CustomerAddress) => void;
  selectable?: boolean;
  selectedId?: string | null;
}

export function CustomerAddressManager({ customerId, unitId, onSelect, selectable, selectedId }: Props) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [label, setLabel] = useState('Casa');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_addresses' as any)
      .select('*')
      .eq('customer_id', customerId)
      .eq('unit_id', unitId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    if (!error && data) setAddresses(data as any as CustomerAddress[]);
    setLoading(false);
  }, [customerId, unitId]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const resetForm = () => {
    setLabel('Casa');
    setStreet('');
    setNumber('');
    setNeighborhood('');
    setCity('');
    setComplement('');
    setReference('');
    setAdding(false);
    setEditingId(null);
  };

  const populateForm = (a: CustomerAddress) => {
    setLabel(a.label);
    setStreet(a.street);
    setNumber(a.number);
    setNeighborhood(a.neighborhood);
    setCity(a.city);
    setComplement(a.complement || '');
    setReference(a.reference || '');
    setEditingId(a.id);
    setAdding(true);
  };

  const handleSave = async () => {
    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim()) {
      toast.error('Preencha rua, número, bairro e cidade');
      return;
    }
    setSaving(true);
    try {
      const isPrimary = addresses.length === 0;
      const payload = {
        customer_id: customerId,
        unit_id: unitId,
        label: label.trim() || 'Casa',
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        complement: complement.trim() || null,
        reference: reference.trim() || null,
        is_primary: isPrimary,
      };

      if (editingId) {
        const { error } = await supabase
          .from('customer_addresses' as any)
          .update({ ...payload, updated_at: new Date().toISOString() } as any)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Endereço atualizado!');
      } else {
        const { error } = await supabase
          .from('customer_addresses' as any)
          .insert(payload as any);
        if (error) throw error;
        toast.success('Endereço adicionado!');
      }
      resetForm();
      await fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar endereço');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    // Unset all, then set this one
    await supabase
      .from('customer_addresses' as any)
      .update({ is_primary: false } as any)
      .eq('customer_id', customerId)
      .eq('unit_id', unitId);
    await supabase
      .from('customer_addresses' as any)
      .update({ is_primary: true } as any)
      .eq('id', id);
    toast.success('Endereço principal atualizado');
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('customer_addresses' as any)
      .delete()
      .eq('id', id);
    if (error) { toast.error('Erro ao remover endereço'); return; }
    toast.success('Endereço removido');
    fetchAddresses();
  };

  const formatFullAddress = (a: CustomerAddress) => {
    let addr = `${a.street}, ${a.number}`;
    if (a.complement) addr += ` - ${a.complement}`;
    addr += ` · ${a.neighborhood}, ${a.city}`;
    return addr;
  };

  const labelOptions = ['Casa', 'Trabalho', 'Outro'];

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Address list */}
      {addresses.map(a => {
        const isSelected = selectable && selectedId === a.id;
        return (
          <div
            key={a.id}
            onClick={() => selectable && onSelect?.(a)}
            className={`rounded-2xl border p-4 transition-all ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border/30 bg-card'
            } ${selectable ? 'cursor-pointer active:scale-[0.98]' : ''}`}
          >
            <div className="flex items-start gap-3">
              {selectable && (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                  isSelected ? 'border-primary bg-primary' : 'border-border'
                }`}>
                  {isSelected && <AppIcon name="Check" size={12} className="text-primary-foreground" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AppIcon name={a.label === 'Trabalho' ? 'Briefcase' : 'Home'} size={14} className="text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground">{a.label}</span>
                  {a.is_primary && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Principal</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{formatFullAddress(a)}</p>
                {a.reference && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                    <AppIcon name="Info" size={10} />
                    {a.reference}
                  </p>
                )}
              </div>

              {!selectable && (
                <div className="flex items-center gap-1 shrink-0">
                  {!a.is_primary && (
                    <button onClick={() => handleSetPrimary(a.id)} className="p-2 rounded-lg hover:bg-secondary/50" title="Tornar principal">
                      <AppIcon name="Star" size={14} className="text-muted-foreground" />
                    </button>
                  )}
                  <button onClick={() => populateForm(a)} className="p-2 rounded-lg hover:bg-secondary/50" title="Editar">
                    <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-destructive/10" title="Remover">
                    <AppIcon name="Trash2" size={14} className="text-destructive/70" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {addresses.length === 0 && !adding && (
        <div className="text-center py-8">
          <AppIcon name="MapPin" size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Nenhum endereço salvo</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione um endereço para pedir delivery</p>
        </div>
      )}

      {/* Add/edit form */}
      {adding ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <AppIcon name="MapPin" size={16} className="text-primary" />
            {editingId ? 'Editar endereço' : 'Novo endereço'}
          </h4>

          {/* Label chips */}
          <div className="flex gap-2">
            {labelOptions.map(l => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  label === l ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <Input placeholder="Rua *" value={street} onChange={e => setStreet(e.target.value)} className="h-11 rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Número *" value={number} onChange={e => setNumber(e.target.value)} className="h-11 rounded-xl" />
            <Input placeholder="Complemento" value={complement} onChange={e => setComplement(e.target.value)} className="h-11 rounded-xl col-span-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Bairro *" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="h-11 rounded-xl" />
            <Input placeholder="Cidade *" value={city} onChange={e => setCity(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <Input placeholder="Referência (ex: perto do mercado)" value={reference} onChange={e => setReference(e.target.value)} className="h-11 rounded-xl" />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={resetForm}>Cancelar</Button>
            <Button className="flex-1 h-11 rounded-xl" onClick={handleSave} disabled={saving}>
              {saving && <AppIcon name="Loader2" size={16} className="animate-spin mr-2" />}
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-border/50 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors active:scale-[0.98]"
        >
          <AppIcon name="Plus" size={16} />
          Adicionar endereço
        </button>
      )}
    </div>
  );
}

export function useCustomerAddresses(customerId: string | null, unitId: string) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) { setAddresses([]); setLoading(false); return; }
    setLoading(true);
    supabase
      .from('customer_addresses' as any)
      .select('*')
      .eq('customer_id', customerId)
      .eq('unit_id', unitId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setAddresses((data as any as CustomerAddress[]) || []);
        setLoading(false);
      });
  }, [customerId, unitId]);

  const primaryAddress = addresses.find(a => a.is_primary) || addresses[0] || null;

  return { addresses, loading, primaryAddress, refetch: () => {
    if (!customerId) return;
    supabase
      .from('customer_addresses' as any)
      .select('*')
      .eq('customer_id', customerId)
      .eq('unit_id', unitId)
      .order('is_primary', { ascending: false })
      .then(({ data }) => setAddresses((data as any as CustomerAddress[]) || []));
  }};
}
