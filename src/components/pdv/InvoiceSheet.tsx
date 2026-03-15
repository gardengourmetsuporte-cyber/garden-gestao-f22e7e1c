import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

interface InvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
  total: number;
  customerName: string;
  payments: { method: string; amount: number }[];
  items: { name: string; quantity: number; unit_price: number }[];
}

interface FoundCustomer {
  id: string;
  name: string;
  phone: string | null;
  segment: string | null;
  loyalty_points: number | null;
  total_spent: number | null;
  total_orders: number | null;
}

export function InvoiceSheet({
  open, onOpenChange, saleId, total, customerName: initialName, payments, items,
}: InvoiceSheetProps) {
  const { activeUnitId } = useUnit();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(initialName || '');
  const [searching, setSearching] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<FoundCustomer | null>(null);
  const [linked, setLinked] = useState(false);
  const [linking, setLinking] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setPhone('');
      setName(initialName || '');
      setFoundCustomer(null);
      setLinked(false);
      setLinking(false);
    }
  }, [open, initialName]);

  // Debounced phone search
  useEffect(() => {
    if (!activeUnitId || phone.length < 8) {
      setFoundCustomer(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const cleanPhone = phone.replace(/\D/g, '');
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, segment, loyalty_points, total_spent, total_orders')
        .eq('unit_id', activeUnitId)
        .or(`phone.ilike.%${cleanPhone}%`)
        .is('deleted_at', null)
        .limit(1)
        .single();

      setFoundCustomer(data || null);
      if (data) setName(data.name);
      setSearching(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [phone, activeUnitId]);

  const handleLink = useCallback(async () => {
    if (!activeUnitId || !saleId) return;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim()) { toast.error('Informe o nome do cliente'); return; }
    if (!cleanPhone || cleanPhone.length < 8) { toast.error('Informe um telefone válido'); return; }

    setLinking(true);
    try {
      let customerId = foundCustomer?.id;

      // Create customer if not found
      if (!customerId) {
        const { data: newCustomer, error: custErr } = await supabase
          .from('customers')
          .insert({
            unit_id: activeUnitId,
            name: name.trim(),
            phone: cleanPhone,
            origin: 'pdv',
            score: 0,
            segment: 'new',
            loyalty_points: 0,
            total_spent: 0,
            total_orders: 0,
          })
          .select('id')
          .single();
        if (custErr) throw custErr;
        customerId = newCustomer.id;
        toast.success('Cliente cadastrado!');
      }

      // Update sale with customer info
      await supabase
        .from('pos_sales')
        .update({
          customer_name: name.trim(),
          customer_phone: cleanPhone,
          customer_document: cleanPhone,
        })
        .eq('id', saleId);

      // Update customer stats
      await supabase
        .from('customers')
        .update({
          total_spent: (foundCustomer?.total_spent || 0) + total,
          total_orders: (foundCustomer?.total_orders || 0) + 1,
          last_purchase_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      setLinked(true);
      toast.success(foundCustomer ? 'Cliente vinculado à venda!' : 'Cliente cadastrado e vinculado!');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setLinking(false);
    }
  }, [activeUnitId, saleId, name, phone, foundCustomer, total]);

  const methodLabels: Record<string, string> = {
    cash_amount: 'Dinheiro', debit_amount: 'Débito', credit_amount: 'Crédito',
    pix_amount: 'Pix', meal_voucher_amount: 'Vale Refeição',
    signed_account_amount: 'Conta Assinada', delivery_amount: 'Delivery',
  };

  const handleWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Informe um telefone válido para enviar');
      return;
    }
    const itemsList = items.map(i => `• ${i.quantity}x ${i.name} - ${formatCurrency(i.quantity * i.unit_price)}`).join('\n');
    const paymentsList = payments.map(p => `${methodLabels[p.method] || p.method}: ${formatCurrency(p.amount)}`).join(', ');
    const msg = `🧾 *Nota Fiscal*\n\n${itemsList}\n\n💰 *Total: ${formatCurrency(total)}*\nPagamento: ${paymentsList}\n\nObrigado pela preferência! 🙏`;
    const encoded = encodeURIComponent(msg);
    const phoneFormatted = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${phoneFormatted}?text=${encoded}`, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] overflow-y-auto px-4 pb-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-1 pt-2 pb-4">
          <div className="w-8 h-1 rounded-full bg-border mb-2" />
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <AppIcon name="Receipt" size={24} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground">Nota Fiscal</h3>
          <p className="text-xs text-muted-foreground">Vincule um cliente para emitir e compartilhar</p>
        </div>

        {/* Sale summary */}
        <div className="bg-secondary/30 rounded-xl p-3 mb-4 space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-foreground">{item.quantity}x {item.name}</span>
              <span className="text-muted-foreground font-medium">{formatCurrency(item.quantity * item.unit_price)}</span>
            </div>
          ))}
          <div className="border-t border-border/40 pt-1.5 flex justify-between">
            <span className="text-sm font-bold text-foreground">Total</span>
            <span className="text-sm font-bold text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Customer section */}
        {!linked ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Identificar Cliente</p>

            <div className="relative">
              <AppIcon name="Phone" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Telefone do cliente"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl"
                inputMode="tel"
              />
              {searching && (
                <AppIcon name="Loader2" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Found customer card */}
            {foundCustomer && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}>
                  <AppIcon name="UserCheck" size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{foundCustomer.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {foundCustomer.segment && <span className="capitalize">{foundCustomer.segment}</span>}
                    <span>🪙 {foundCustomer.loyalty_points || 0} moedas</span>
                    <span>{foundCustomer.total_orders || 0} pedidos</span>
                  </div>
                </div>
              </div>
            )}

            {/* Name field (shown when no customer found or to confirm) */}
            {!foundCustomer && phone.length >= 8 && !searching && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AppIcon name="UserPlus" size={12} />
                  <span>Cliente não encontrado — cadastro rápido</span>
                </div>
                <Input
                  placeholder="Nome do cliente"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-10 text-sm rounded-xl"
                />
              </div>
            )}

            <Button
              onClick={handleLink}
              disabled={linking || phone.replace(/\D/g, '').length < 8}
              className="w-full h-11 rounded-xl text-sm font-bold"
            >
              {linking ? (
                <AppIcon name="Loader2" size={16} className="animate-spin mr-2" />
              ) : (
                <AppIcon name={foundCustomer ? 'Link' : 'UserPlus'} size={16} className="mr-2" />
              )}
              {foundCustomer ? 'Vincular Cliente' : 'Cadastrar e Vincular'}
            </Button>
          </div>
        ) : (
          /* After linking */
          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <AppIcon name="CheckCircle" size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-[10px] text-muted-foreground">Cliente vinculado • Pontos adicionados</p>
              </div>
            </div>

            <Button
              onClick={handleWhatsApp}
              variant="outline"
              className="w-full h-11 rounded-xl text-sm font-semibold border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
            >
              <AppIcon name="share" size={16} className="mr-2" />
              Enviar via WhatsApp
            </Button>
          </div>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="w-full h-10 rounded-xl text-sm text-muted-foreground mt-3"
        >
          {linked ? 'Concluir' : 'Pular'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
