import { useState, useEffect, useRef } from 'react';
import { CartItem } from '@/hooks/useDigitalMenu';
import { AppIcon } from '@/components/ui/app-icon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency as formatPrice } from '@/lib/format';
import { useDeliveryFeeCalculator } from '@/hooks/useDeliveryZones';
import { CustomerAddressManager, useCustomerAddresses, type CustomerAddress } from './CustomerAddressManager';
import type { User } from '@supabase/supabase-js';

interface Props {
  cart: CartItem[];
  cartTotal: number;
  unitId: string;
  autoConfirm?: boolean;
  customerUser?: User | null;
  source?: string;
  onUpdateQuantity: (index: number, qty: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onLogin?: () => void;
  onBackToMenu?: () => void;
}

export function MenuCart({ cart, cartTotal, unitId, autoConfirm = false, customerUser, source, onUpdateQuantity, onRemove, onClear, onLogin, onBackToMenu }: Props) {
  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState<string | null>(null);
  const isQrCode = source === 'qrcode';
  const isDelivery = !isQrCode;

  // Customer data
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | null>(null);

  // Address selection for delivery
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const { addresses, loading: loadingAddresses, primaryAddress, refetch: refetchAddresses } = useCustomerAddresses(customerId, unitId);

  // Fee calculation
  const { calculateFee, calculating, result: feeResult, reset: resetFee } = useDeliveryFeeCalculator();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load customer data
  useEffect(() => {
    if (!customerUser) {
      setCustomerId(null);
      setCustomerName('');
      setCustomerPhone('');
      return;
    }
    const name = customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || '';
    setCustomerName(prev => prev || name);
    const email = customerUser.email;
    if (email) {
      supabase
        .from('customers')
        .select('id, phone')
        .eq('unit_id', unitId)
        .eq('email', email)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setCustomerId(data.id);
            if (data.phone) setCustomerPhone(prev => prev || formatPhone(data.phone!));
          }
        });
    }
  }, [customerUser, unitId]);

  // Auto-select primary address
  useEffect(() => {
    if (!selectedAddress && primaryAddress) setSelectedAddress(primaryAddress);
  }, [primaryAddress, selectedAddress]);

  // Calculate fee when address selected
  useEffect(() => {
    if (selectedAddress && orderType === 'delivery') {
      const fullAddr = `${selectedAddress.street}, ${selectedAddress.number}, ${selectedAddress.neighborhood}, ${selectedAddress.city}`;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => calculateFee(unitId, fullAddr), 500);
    } else {
      resetFee();
    }
  }, [selectedAddress, unitId, orderType]);

  const deliveryFee = orderType === 'delivery' ? (feeResult?.fee ?? 0) : 0;
  const grandTotal = cartTotal + deliveryFee;

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // ===== Order sent success =====
  if (orderSent) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-emerald-500/12 flex items-center justify-center animate-in zoom-in-50 duration-300">
          <AppIcon name="CheckCircle2" size={40} className="text-emerald-500" />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-foreground">Pedido enviado!</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Pedido <span className="font-mono font-bold text-foreground">#{orderSent}</span>
          </p>
        </div>
        <button
          onClick={() => { setOrderSent(null); onClear(); resetFee(); }}
          className="h-14 w-full max-w-xs rounded-xl bg-foreground text-background font-bold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <AppIcon name="Plus" size={18} />
          Fazer novo pedido
        </button>
      </div>
    );
  }

  // ===== Empty cart =====
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center">
          <AppIcon name="ShoppingBag" size={32} className="text-muted-foreground/30" />
        </div>
        <div>
          <p className="text-foreground font-semibold">Seu pedido está vazio</p>
          <p className="text-xs text-muted-foreground mt-1">Volte ao cardápio e adicione itens</p>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (isQrCode) {
      if (!customerName.trim()) { toast.error('Informe seu nome'); return; }
      if (!tableNumber.trim() || parseInt(tableNumber) <= 0) { toast.error('Informe o número da mesa'); return; }
    } else {
      if (!customerUser) { toast.error('Faça login para pedir'); return; }
      if (!customerName.trim()) { toast.error('Informe seu nome'); return; }
      if (!customerPhone.replace(/\D/g, '') || customerPhone.replace(/\D/g, '').length < 10) { toast.error('Informe um celular válido'); return; }
      if (!orderType) { toast.error('Escolha Entrega ou Retirada'); return; }
      if (orderType === 'delivery' && !selectedAddress) { toast.error('Selecione um endereço de entrega'); return; }
      if (orderType === 'delivery' && feeResult?.out_of_range) { toast.error('Endereço fora da área de entrega'); return; }
    }
    setSending(true);
    try {
      const fullAddress = selectedAddress && orderType === 'delivery'
        ? `${selectedAddress.street}, ${selectedAddress.number}${selectedAddress.complement ? ' - ' + selectedAddress.complement : ''}, ${selectedAddress.neighborhood}, ${selectedAddress.city}${selectedAddress.reference ? ' (Ref: ' + selectedAddress.reference + ')' : ''}`
        : null;

      const orderData = isQrCode
        ? {
            unit_id: unitId, table_number: parseInt(tableNumber),
            status: 'awaiting_confirmation', total: cartTotal,
            source: 'qrcode' as string, customer_name: customerName.trim(),
            customer_phone: null as string | null, customer_address: null as string | null,
          }
        : {
            unit_id: unitId, table_number: 0,
            status: 'confirmed', total: grandTotal,
            source: (orderType === 'pickup' ? 'pickup' : 'delivery') as string,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.replace(/\D/g, ''),
            customer_address: fullAddress,
            customer_email: customerUser?.email || null,
          };

      const { data: order, error: orderError } = await supabase.from('tablet_orders').insert(orderData).select('id').single();
      if (orderError || !order) throw new Error(orderError?.message || 'Erro');

      const items = cart.map(c => ({
        order_id: (order as any).id,
        product_id: c.product.id,
        quantity: c.quantity,
        notes: [c.notes, c.selectedOptions.map(o => o.name).join(', ')].filter(Boolean).join(' | ') || null,
        unit_price: c.product.price + c.selectedOptions.reduce((s, o) => s + o.price, 0),
      }));
      const { error: itemsError } = await supabase.from('tablet_order_items').insert(items);
      if (itemsError) throw new Error(itemsError.message);

      if (!isQrCode) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tablet-order?action=send-to-pdv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: JSON.stringify({ order_id: (order as any).id }),
          });
        } catch (e) { console.warn('[MenuCart] send-to-pdv failed:', e); }
      }

      toast.success('Pedido enviado com sucesso!');
      setOrderSent((order as any).order_number ? `${(order as any).order_number}` : (order as any).id.slice(0, 8));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido');
    } finally {
      setSending(false);
    }
  };

  const canSend = isQrCode
    ? !!customerName.trim() && !!tableNumber.trim()
    : !!customerUser && !!customerName.trim() && customerPhone.replace(/\D/g, '').length >= 10 && !!orderType && (orderType === 'pickup' || (!!selectedAddress && !feeResult?.out_of_range));

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/30 px-4 h-14 flex items-center gap-3">
        {onBackToMenu && (
          <button onClick={onBackToMenu} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
            <AppIcon name="ArrowLeft" size={20} className="text-foreground" />
          </button>
        )}
        <h1 className="text-base font-bold text-foreground flex-1">Meu pedido</h1>
        <button onClick={onClear} className="text-xs text-destructive font-medium px-2 py-1">Limpar</button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Cart items */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-border/40 divide-y divide-border/30 overflow-hidden">
            {cart.map((item, i) => {
              const unitPrice = item.product.price + item.selectedOptions.reduce((s, o) => s + o.price, 0);
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-card">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                      <AppIcon name="Package" size={18} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatPrice(unitPrice)}</p>
                    {item.selectedOptions.length > 0 && (
                      <p className="text-[11px] text-muted-foreground/70 truncate">{item.selectedOptions.map(o => o.name).join(', ')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(i, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-border/40 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <AppIcon name={item.quantity === 1 ? 'Trash2' : 'Minus'} size={14} className={item.quantity === 1 ? 'text-destructive' : 'text-foreground'} />
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(i, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-border/40 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <AppIcon name="Plus" size={14} className="text-foreground" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add more items */}
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="w-full mt-3 h-12 rounded-xl border border-border/50 text-sm font-semibold text-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Adicionar mais itens
            </button>
          )}

          {/* Total line */}
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-sm font-bold text-foreground">Total</span>
            <span className="text-sm font-bold text-foreground">{formatPrice(isQrCode ? cartTotal : grandTotal)}</span>
          </div>
        </div>

        {/* Dotted divider */}
        <div className="my-5 border-t-2 border-dashed border-border/40" />

        {/* ===== Order type selection (delivery only) ===== */}
        {isDelivery && (
          <div className="px-4 space-y-6">
            {/* Order type */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground">Escolha uma opção</h3>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Obrigatório</span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
                    orderType === 'delivery' ? 'border-primary bg-primary/5' : 'border-border/40'
                  }`}
                >
                  <span className="text-sm font-semibold text-foreground">Entrega</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    orderType === 'delivery' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {orderType === 'delivery' && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </div>
                </button>
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
                    orderType === 'pickup' ? 'border-primary bg-primary/5' : 'border-border/40'
                  }`}
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground">Retirada no local</span>
                    <p className="text-xs text-muted-foreground mt-0.5">(30min)</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    orderType === 'pickup' ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {orderType === 'pickup' && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Address picker (delivery) */}
            {orderType === 'delivery' && customerUser && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-foreground">Endereço de entrega</h3>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Obrigatório</span>
                </div>
                {loadingAddresses ? (
                  <div className="h-16 rounded-xl bg-muted animate-pulse" />
                ) : addresses.length === 0 || showAddAddress ? (
                  customerId ? (
                    <CustomerAddressManager
                      customerId={customerId} unitId={unitId}
                      onSelect={(a) => { setSelectedAddress(a); setShowAddAddress(false); }}
                      selectable selectedId={selectedAddress?.id || null}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Cadastre um endereço abaixo</p>
                  )
                ) : (
                  <div className="space-y-2">
                    {addresses.map(a => {
                      const isSelected = selectedAddress?.id === a.id;
                      const fullAddr = `${a.street}, ${a.number}${a.complement ? ' - ' + a.complement : ''} · ${a.neighborhood}, ${a.city}`;
                      return (
                        <button key={a.id} onClick={() => setSelectedAddress(a)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all active:scale-[0.98] text-left ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border/40'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <AppIcon name={a.label === 'Trabalho' ? 'Briefcase' : 'Home'} size={12} className="text-primary shrink-0" />
                              <span className="text-xs font-bold text-foreground">{a.label}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{fullAddr}</p>
                          </div>
                        </button>
                      );
                    })}
                    <button onClick={() => setShowAddAddress(true)}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border/50 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      <AppIcon name="Plus" size={14} />
                      Adicionar novo endereço
                    </button>
                  </div>
                )}

                {/* Fee info */}
                {feeResult && !feeResult.out_of_range && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <AppIcon name="MapPin" size={12} />
                    <span>{feeResult.distance_km} km · {feeResult.duration}</span>
                    <span>· Taxa: {feeResult.fee === 0 ? 'Grátis' : formatPrice(feeResult.fee!)}</span>
                  </div>
                )}
                {feeResult?.out_of_range && (
                  <div className="mt-3 rounded-xl bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2">
                    <AppIcon name="AlertTriangle" size={14} className="text-destructive shrink-0" />
                    <p className="text-xs text-destructive">Fora da área de entrega ({feeResult.distance_km} km)</p>
                  </div>
                )}
              </div>
            )}

            {/* Login CTA */}
            {!customerUser && (
              <div className="rounded-2xl border border-border/40 p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <AppIcon name="Receipt" size={24} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Entre e tenha seus dados salvos para a próxima compra!</p>
                <button onClick={onLogin}
                  className="w-full h-12 rounded-xl border border-foreground/20 text-sm font-bold text-foreground active:scale-[0.98] transition-transform"
                >
                  Entrar ou cadastrar
                </button>
              </div>
            )}

            {/* Customer fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-foreground">Nome e sobrenome</label>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Obrigatório</span>
              </div>
              <input
                placeholder="Como vamos te chamar"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full h-12 rounded-xl border border-border/40 bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-foreground">Número do seu celular</label>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Obrigatório</span>
              </div>
              <input
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={e => setCustomerPhone(formatPhone(e.target.value))}
                inputMode="numeric"
                className="w-full h-12 rounded-xl border border-border/40 bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                O número do celular será utilizado para te atualizar sobre o status do seu pedido.
              </p>
            </div>
          </div>
        )}

        {/* QR Code fields */}
        {isQrCode && (
          <div className="px-4 space-y-4">
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">Seu nome</label>
              <input
                placeholder="Como vamos te chamar"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full h-12 rounded-xl border border-border/40 bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-foreground mb-2 block">Número da mesa</label>
              <input
                placeholder="Ex: 5"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                className="w-full h-12 rounded-xl border border-border/40 bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border/30 px-4 pb-[env(safe-area-inset-bottom,8px)] pt-3 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-primary">{formatPrice(isQrCode ? cartTotal : grandTotal)}</span>
            {isDelivery && deliveryFee > 0 && (
              <AppIcon name="ChevronUp" size={16} className="text-muted-foreground" />
            )}
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !canSend}
          className="w-full h-14 rounded-xl bg-foreground text-background font-bold text-sm flex items-center justify-between px-5 disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          <span>{sending ? 'Enviando...' : 'Fazer pedido'}</span>
          {sending ? (
            <AppIcon name="Loader2" size={20} className="animate-spin" />
          ) : (
            <AppIcon name="ArrowRight" size={20} />
          )}
        </button>
      </div>
    </div>
  );
}

// Extracted cart items list (shared visual for tablet)
export function CartItemsList({ cart, onUpdateQuantity }: { cart: CartItem[]; onUpdateQuantity: (i: number, qty: number) => void }) {
  return (
    <div className="space-y-2">
      {cart.map((item, i) => {
        const unitPrice = item.product.price + item.selectedOptions.reduce((s, o) => s + o.price, 0);
        return (
          <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border/30">
            {item.product.image_url ? (
              <img src={item.product.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                <AppIcon name="Package" size={18} className="text-muted-foreground/30" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
              {item.selectedOptions.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {item.selectedOptions.map(o => o.name).join(', ')}
                </p>
              )}
              {item.notes && <p className="text-[11px] text-muted-foreground/70 italic truncate">{item.notes}</p>}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdateQuantity(i, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                    <AppIcon name={item.quantity === 1 ? 'Trash2' : 'Minus'} size={13} className={item.quantity === 1 ? 'text-destructive' : ''} />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(i, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                    <AppIcon name="Plus" size={13} />
                  </button>
                </div>
                <p className="text-sm font-bold text-foreground">{formatPrice(unitPrice * item.quantity)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
