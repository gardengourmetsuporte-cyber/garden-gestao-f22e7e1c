import { useState, useEffect, useRef, useCallback } from 'react';
import { CartItem } from '@/hooks/useDigitalMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

export function MenuCart({ cart, cartTotal, unitId, autoConfirm = false, customerUser, source, onUpdateQuantity, onRemove, onClear, onLogin }: Props) {
  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState<string | null>(null);
  const [sentAutoConfirmed, setSentAutoConfirmed] = useState(false);
  const isQrCode = source === 'qrcode';
  const isDelivery = !isQrCode;

  // Customer data
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');

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

    // Fetch customer record
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
    if (!selectedAddress && primaryAddress) {
      setSelectedAddress(primaryAddress);
    }
  }, [primaryAddress, selectedAddress]);

  // Calculate fee when address selected
  useEffect(() => {
    if (selectedAddress && isDelivery) {
      const fullAddr = `${selectedAddress.street}, ${selectedAddress.number}, ${selectedAddress.neighborhood}, ${selectedAddress.city}`;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        calculateFee(unitId, fullAddr);
      }, 500);
    } else {
      resetFee();
    }
  }, [selectedAddress, unitId, isDelivery]);

  const deliveryFee = feeResult?.fee ?? 0;
  const grandTotal = cartTotal + deliveryFee;

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

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
          <p className="text-muted-foreground text-xs mt-1">
            {customerName || 'Delivery'} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 p-4 w-full max-w-xs mt-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-3 text-sm">
            <div className={`w-10 h-10 rounded-xl ${isQrCode ? 'bg-primary/12' : 'bg-amber-500/12'} flex items-center justify-center shrink-0`}>
              <AppIcon name={isQrCode ? 'HourglassEmpty' : 'Schedule'} size={20} className={isQrCode ? 'text-primary' : 'text-amber-500'} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">
                {isQrCode ? 'Aguardando aprovação' : 'Aguardando preparo'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isQrCode ? 'Seu pedido será confirmado pelo restaurante' : 'Seu pedido foi confirmado automaticamente'}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="lg" className="rounded-xl mt-2" onClick={() => { setOrderSent(null); setSentAutoConfirmed(false); onClear(); resetFee(); }}>
          <AppIcon name="Plus" size={18} className="mr-2" />
          Fazer novo pedido
        </Button>
      </div>
    );
  }

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
      // Delivery requires login
      if (!customerUser) { toast.error('Faça login para pedir delivery'); return; }
      if (!selectedAddress) { toast.error('Selecione um endereço de entrega'); return; }
      if (feeResult?.out_of_range) { toast.error('Endereço fora da área de entrega'); return; }
    }

    setSending(true);

    try {
      const fullAddress = selectedAddress
        ? `${selectedAddress.street}, ${selectedAddress.number}${selectedAddress.complement ? ' - ' + selectedAddress.complement : ''}, ${selectedAddress.neighborhood}, ${selectedAddress.city}${selectedAddress.reference ? ' (Ref: ' + selectedAddress.reference + ')' : ''}`
        : null;

      const orderData = isQrCode
        ? {
            unit_id: unitId,
            table_number: parseInt(tableNumber),
            status: 'awaiting_confirmation',
            total: cartTotal,
            source: 'qrcode' as string,
            customer_name: customerName.trim(),
            customer_phone: null as string | null,
            customer_address: null as string | null,
          }
        : {
            unit_id: unitId,
            table_number: 0,
            status: 'confirmed',
            total: grandTotal,
            source: 'delivery' as string,
            customer_name: customerName.trim() || customerUser?.user_metadata?.full_name || 'Cliente',
            customer_phone: customerPhone.replace(/\D/g, ''),
            customer_address: fullAddress,
            customer_email: customerUser?.email || null,
          };

      const { data: order, error: orderError } = await supabase
        .from('tablet_orders')
        .insert(orderData)
        .select('id')
        .single();

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

      // Auto send to PDV (skip for qrcode)
      if (!isQrCode) {
        try {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tablet-order?action=send-to-pdv`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({ order_id: (order as any).id }),
            }
          );
        } catch (e) {
          console.warn('[MenuCart] send-to-pdv failed:', e);
        }
      }

      toast.success('Pedido enviado com sucesso!');
      setSentAutoConfirmed(true);
      setOrderSent((order as any).order_number ? `${(order as any).order_number}` : (order as any).id.slice(0, 8));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 pb-28 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Seu Pedido
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({cart.reduce((s, i) => s + i.quantity, 0)} itens)
          </span>
        </h2>
        <button onClick={onClear} className="text-xs text-destructive font-medium">Limpar</button>
      </div>

      <CartItemsList cart={cart} onUpdateQuantity={onUpdateQuantity} />

      {/* Summary */}
      <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-sm font-semibold text-foreground">{formatPrice(cartTotal)}</span>
        </div>

        {isDelivery && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                Taxa de entrega
                {calculating && <AppIcon name="Loader2" size={12} className="animate-spin text-muted-foreground" />}
              </span>
              {feeResult?.out_of_range ? (
                <span className="text-xs font-medium text-destructive">Fora da área</span>
              ) : feeResult && feeResult.fee !== null ? (
                <span className="text-sm font-semibold text-foreground">
                  {feeResult.fee === 0 ? 'Grátis' : formatPrice(feeResult.fee)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
            {feeResult && !feeResult.out_of_range && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <AppIcon name="MapPin" size={10} />
                <span>{feeResult.distance_km} km · {feeResult.duration}</span>
                {feeResult.zone_name && <span>· {feeResult.zone_name}</span>}
              </div>
            )}
          </>
        )}

        <div className="border-t border-border/30" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">Total</span>
          <span className="text-xl font-bold text-primary">{formatPrice(isQrCode ? cartTotal : grandTotal)}</span>
        </div>
      </div>

      {/* Out of range warning */}
      {isDelivery && feeResult?.out_of_range && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2">
          <AppIcon name="AlertTriangle" size={16} className="text-destructive shrink-0" />
          <p className="text-xs text-destructive">
            Infelizmente não entregamos neste endereço ({feeResult.distance_km} km). Tente outro endereço.
          </p>
        </div>
      )}

      {/* QR Code dine-in info */}
      {isQrCode && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-2">
          <AppIcon name="RestaurantMenu" size={16} className="text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Pedido para <span className="font-semibold text-foreground">comer no restaurante</span>. Será confirmado pelo atendente.
          </p>
        </div>
      )}

      {/* ===== DELIVERY: Require login ===== */}
      {isDelivery && !customerUser && (
        <div className="rounded-2xl bg-card border border-primary/30 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <AppIcon name="LogIn" size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Faça login para continuar</p>
              <p className="text-xs text-muted-foreground">Precisamos da sua conta para delivery</p>
            </div>
          </div>
          <Button className="w-full h-12 rounded-xl font-bold" onClick={onLogin}>
            <AppIcon name="LogIn" size={18} className="mr-2" />
            Entrar na minha conta
          </Button>
        </div>
      )}

      {/* ===== DELIVERY: Logged in — show address picker ===== */}
      {isDelivery && customerUser && (
        <>
          {/* User info */}
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <AppIcon name="Person" size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || customerUser.email}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{customerUser.email}</p>
            </div>
            <AppIcon name="Check" size={16} className="text-primary shrink-0" />
          </div>

          {/* Address selection */}
          <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AppIcon name="MapPin" size={16} className="text-primary" />
              Endereço de entrega
            </h3>

            {loadingAddresses ? (
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-muted animate-pulse" />
              </div>
            ) : addresses.length === 0 || showAddAddress ? (
              <>
                {customerId && (
                  <CustomerAddressManager
                    customerId={customerId}
                    unitId={unitId}
                    onSelect={(a) => { setSelectedAddress(a); setShowAddAddress(false); }}
                    selectable
                    selectedId={selectedAddress?.id || null}
                  />
                )}
                {!customerId && (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">Faça seu primeiro pedido para cadastrar endereços</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Address cards for selection */}
                {addresses.map(a => {
                  const isSelected = selectedAddress?.id === a.id;
                  const fullAddr = `${a.street}, ${a.number}${a.complement ? ' - ' + a.complement : ''} · ${a.neighborhood}, ${a.city}`;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAddress(a)}
                      className={`rounded-xl border p-3 cursor-pointer transition-all active:scale-[0.98] ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {isSelected && <AppIcon name="Check" size={12} className="text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <AppIcon name={a.label === 'Trabalho' ? 'Briefcase' : 'Home'} size={12} className="text-primary shrink-0" />
                            <span className="text-xs font-bold text-foreground">{a.label}</span>
                            {a.is_primary && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Principal</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{fullAddr}</p>
                          {a.reference && (
                            <p className="text-[10px] text-muted-foreground/60 truncate">Ref: {a.reference}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => setShowAddAddress(true)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-border/50 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <AppIcon name="Plus" size={14} />
                  Adicionar novo endereço
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* QR Code fields */}
      {isQrCode && (
        <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <AppIcon name="RestaurantMenu" size={16} className="text-primary" />
            Dados para o pedido
          </h3>
          <Input
            placeholder="Seu nome *"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="h-12 rounded-xl"
          />
          <Input
            placeholder="Número da mesa *"
            value={tableNumber}
            onChange={e => setTableNumber(e.target.value.replace(/\D/g, ''))}
            className="h-12 rounded-xl"
            inputMode="numeric"
            type="number"
            min={1}
          />
        </div>
      )}

      <Button
        className="w-full h-14 text-base font-bold rounded-xl"
        onClick={handleSend}
        disabled={sending || (isDelivery && !customerUser) || (isDelivery && feeResult?.out_of_range)}
      >
        {sending ? (
          <AppIcon name="Loader2" size={20} className="animate-spin mr-2" />
        ) : (
          <AppIcon name="Send" size={20} className="mr-2" />
        )}
        {isQrCode ? `Enviar Pedido • ${formatPrice(cartTotal)}` : `Finalizar Pedido • ${formatPrice(grandTotal)}`}
      </Button>
    </div>
  );
}

// Extracted cart items list (shared visual)
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
                  <button
                    onClick={() => onUpdateQuantity(i, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <AppIcon name={item.quantity === 1 ? 'Trash2' : 'Minus'} size={13} className={item.quantity === 1 ? 'text-destructive' : ''} />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(i, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
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
