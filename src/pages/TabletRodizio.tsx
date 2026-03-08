import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDigitalMenu, DMProduct } from '@/hooks/useDigitalMenu';
import { MenuProductDetail } from '@/components/digital-menu/MenuProductDetail';
import { MenuSearch } from '@/components/digital-menu/MenuSearch';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency as formatPrice } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import gardenLogo from '@/assets/logo.png';

interface RodizioConfig {
  price: number;
  time_limit_minutes: number;
  max_item_quantity: number;
  description: string;
  allowed_category_ids: string[];
  allowed_group_ids: string[];
}

export default function TabletRodizio() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mesa = searchParams.get('mesa') || '1';

  const {
    unit, categories, groups, products, loading,
    getProductOptionGroups, getGroupProducts,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
  } = useDigitalMenu(unitId, 'tablet');

  const [config, setConfig] = useState<RodizioConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DMProduct | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [ordersSent, setOrdersSent] = useState(0);

  // Fetch rodizio config
  useEffect(() => {
    if (!unitId) return;
    supabase
      .from('rodizio_settings')
      .select('price, time_limit_minutes, max_item_quantity, description, allowed_category_ids, allowed_group_ids')
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setConfig(data as any);
      });
  }, [unitId]);

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(interval);
        toast.error('Tempo do rodízio encerrado!');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Start rodizio session
  const startSession = async () => {
    if (!customerName.trim()) { toast.error('Informe seu nome'); return; }
    if (!config || !unitId) return;

    const expires = new Date(Date.now() + config.time_limit_minutes * 60 * 1000);
    const { data, error } = await supabase
      .from('rodizio_sessions')
      .insert({
        unit_id: unitId,
        table_number: mesa,
        customer_name: customerName.trim(),
        expires_at: expires.toISOString(),
        status: 'active',
      } as any)
      .select('id')
      .single();

    if (error) { toast.error('Erro ao iniciar rodízio'); console.error(error); return; }

    setSessionId((data as any).id);
    setExpiresAt(expires);
    setSessionStarted(true);
    toast.success('Rodízio iniciado! Bom apetite! 🎉');
  };

  // Filter products by rodízio allowed categories/groups
  const rodizioCategories = config
    ? categories.filter(c => (config.allowed_category_ids || []).length === 0 || config.allowed_category_ids.includes(c.id))
    : categories;

  const rodizioGroups = config
    ? groups.filter(g => {
        const catAllowed = (config.allowed_category_ids || []).length === 0 || config.allowed_category_ids.includes(g.category_id);
        const groupAllowed = (config.allowed_group_ids || []).length === 0 || config.allowed_group_ids.includes(g.id);
        return catAllowed || groupAllowed;
      })
    : groups;

  const activeCategory = selectedCategory || rodizioCategories[0]?.id || null;
  const categoryGroups = rodizioGroups.filter(g => g.category_id === activeCategory);
  const categoryProducts = activeCategory
    ? categoryGroups.length > 0
      ? categoryGroups.flatMap(g => getGroupProducts(g.id))
      : products.filter(p => p.category === activeCategory)
    : [];

  // Enforce max quantity per item
  const addToCartWithLimit = useCallback((item: typeof cart[0]) => {
    if (!config) return;
    const existingQty = cart
      .filter(c => c.product.id === item.product.id)
      .reduce((s, c) => s + c.quantity, 0);
    
    if (existingQty + item.quantity > config.max_item_quantity) {
      toast.error(`Limite de ${config.max_item_quantity} unidades por item`);
      return;
    }
    addToCart(item);
  }, [cart, config, addToCart]);

  // Send rodizio order
  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    if (timeLeft !== null && timeLeft <= 0) {
      toast.error('Tempo do rodízio encerrado');
      return;
    }

    setSending(true);
    try {
      const { data: order, error } = await supabase
        .from('tablet_orders')
        .insert({
          unit_id: unitId,
          table_number: parseInt(mesa) || 0,
          status: 'awaiting_confirmation',
          total: 0, // Rodízio — no additional charge
          source: 'mesa',
          customer_name: customerName.trim(),
          notes: `RODÍZIO #${ordersSent + 1} | Sessão: ${sessionId?.slice(0, 8)}`,
        } as any)
        .select('id')
        .single();

      if (error || !order) throw new Error(error?.message || 'Erro');

      const items = cart.map(c => ({
        order_id: (order as any).id,
        product_id: c.product.id,
        quantity: c.quantity,
        notes: [c.notes, c.selectedOptions.map(o => o.name).join(', ')].filter(Boolean).join(' | ') || null,
        unit_price: 0,
      }));

      await supabase.from('tablet_order_items').insert(items);

      // Update session total items
      if (sessionId) {
        await supabase
          .from('rodizio_sessions')
          .update({ total_items_ordered: ordersSent + cart.reduce((s, i) => s + i.quantity, 0) } as any)
          .eq('id', sessionId);
      }

      setOrdersSent(prev => prev + 1);
      clearCart();
      setCartOpen(false);
      toast.success(`Pedido #${ordersSent + 1} enviado! 🍽️`);
    } catch (err) {
      toast.error('Erro ao enviar pedido');
      console.error(err);
    }
    setSending(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading || !config) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '2s' }}>
          <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
        </div>
        <p className="text-sm font-semibold text-foreground">Carregando rodízio...</p>
      </div>
    );
  }

  // ==================== START SCREEN ====================
  if (!sessionStarted) {
    const logoUrl = unit?.store_info?.logo_url;
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6 text-center">
          {/* Logo */}
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-border/30 bg-white flex items-center justify-center shadow-lg mx-auto">
            {logoUrl ? (
              <img src={logoUrl} alt={unit?.name} className="w-full h-full object-cover" />
            ) : (
              <img src={gardenLogo} alt="Garden" className="w-16 h-16 object-contain" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Rodízio</h1>
            <p className="text-muted-foreground text-sm mt-1">{unit?.name}</p>
          </div>

          {/* Price card */}
          <div className="card-base p-5 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <AppIcon name="AllInclusive" size={24} className="text-warning" />
              <span className="text-3xl font-bold text-foreground">{formatPrice(config.price)}</span>
            </div>
            <p className="text-xs text-muted-foreground">por pessoa</p>
            {config.description && (
              <p className="text-sm text-muted-foreground mt-2">{config.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-3">
              <span className="flex items-center gap-1">
                <AppIcon name="Clock" size={14} /> {config.time_limit_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <AppIcon name="AlertCircle" size={14} /> Máx {config.max_item_quantity} por item
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block text-left">Seu nome</label>
              <Input
                placeholder="Como deseja ser chamado?"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block text-left">Quantidade de pessoas</label>
              <Input
                type="number"
                min={1}
                value={peopleCount}
                onChange={e => setPeopleCount(parseInt(e.target.value) || 1)}
                className="h-12 rounded-xl text-center text-xl font-bold"
              />
            </div>

            {peopleCount > 0 && (
              <div className="text-sm font-semibold text-foreground bg-secondary/50 rounded-xl p-3">
                Total: {formatPrice(config.price * peopleCount)} ({peopleCount} {peopleCount === 1 ? 'pessoa' : 'pessoas'})
              </div>
            )}
          </div>

          <Button onClick={startSession} className="w-full h-14 text-base font-bold rounded-xl" disabled={!customerName.trim()}>
            <AppIcon name="PlayCircle" size={22} className="mr-2" />
            Iniciar Rodízio
          </Button>

          <button onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  // ==================== ORDERING SCREEN ====================
  const isExpired = timeLeft !== null && timeLeft <= 0;
  const logoUrl = unit?.store_info?.logo_url;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-2.5 border-b border-border/30 bg-card/80 backdrop-blur-sm shrink-0">
        <button onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)} className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
          <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
        </button>

        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border/30 bg-white flex items-center justify-center shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={unit?.name} className="w-full h-full object-cover" />
          ) : (
            <img src={gardenLogo} alt="Garden" className="w-7 h-7 object-contain" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">Rodízio • Mesa {mesa}</p>
          <p className="text-[10px] text-muted-foreground">{customerName} • Pedidos: {ordersSent}</p>
        </div>

        {/* Timer */}
        {timeLeft !== null && (
          <div className={cn(
            "px-3 py-1.5 rounded-xl font-mono text-sm font-bold",
            timeLeft < 300 ? "bg-destructive/15 text-destructive" :
            timeLeft < 600 ? "bg-warning/15 text-warning" :
            "bg-primary/15 text-primary"
          )}>
            <AppIcon name="Clock" size={14} className="inline mr-1" />
            {formatTime(timeLeft)}
          </div>
        )}

        {/* Search */}
        <button onClick={() => setSearchOpen(!searchOpen)} className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
          <AppIcon name={searchOpen ? 'Close' : 'Search'} size={18} className="text-muted-foreground" />
        </button>

        {/* Cart */}
        <button
          onClick={() => setCartOpen(true)}
          disabled={isExpired}
          className="relative h-9 px-3.5 rounded-xl bg-primary text-primary-foreground flex items-center gap-2 font-semibold text-sm disabled:opacity-50"
        >
          <AppIcon name="ShoppingCart" size={16} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      {/* Expired banner */}
      {isExpired && (
        <div className="px-5 py-3 bg-destructive/10 border-b border-destructive/20 text-center">
          <p className="text-sm font-bold text-destructive">⏰ Tempo do rodízio encerrado</p>
          <p className="text-xs text-muted-foreground">Você não pode fazer mais pedidos</p>
        </div>
      )}

      {/* Search */}
      {searchOpen && (
        <div className="px-5 py-3 border-b border-border/30 bg-card/50">
          <MenuSearch products={products} onSelectProduct={(p) => { setSelectedProduct(p); setSearchOpen(false); }} />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-44 lg:w-52 border-r border-border/30 bg-card/30 overflow-y-auto shrink-0">
          <nav className="py-2">
            {rodizioCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-3 text-left transition-colors',
                  activeCategory === cat.id
                    ? 'bg-primary/10 text-primary border-r-2 border-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/50'
                )}
              >
                {cat.icon && <AppIcon name={cat.icon} size={16} />}
                <span className="text-sm truncate">{cat.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Products */}
        <main className="flex-1 overflow-y-auto p-5">
          {activeCategory && (
            <h2 className="text-lg font-bold text-foreground mb-3">
              {rodizioCategories.find(c => c.id === activeCategory)?.name}
            </h2>
          )}

          {categoryGroups.length > 0 ? (
            categoryGroups.map(group => {
              const gProducts = getGroupProducts(group.id);
              if (gProducts.length === 0) return null;
              return (
                <div key={group.id} className="mb-5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{group.name}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                    {gProducts.map(product => (
                      <RodizioProductCard
                        key={product.id}
                        product={product}
                        maxQty={config.max_item_quantity}
                        currentQty={cart.filter(c => c.product.id === product.id).reduce((s, c) => s + c.quantity, 0)}
                        onSelect={setSelectedProduct}
                        disabled={isExpired}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {categoryProducts.map(product => (
                <RodizioProductCard
                  key={product.id}
                  product={product}
                  maxQty={config.max_item_quantity}
                  currentQty={cart.filter(c => c.product.id === product.id).reduce((s, c) => s + c.quantity, 0)}
                  onSelect={setSelectedProduct}
                  disabled={isExpired}
                />
              ))}
            </div>
          )}

          {categoryProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <AppIcon name="Restaurant" size={36} className="text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Nenhum produto nesta categoria</p>
            </div>
          )}
        </main>
      </div>

      {/* Product detail */}
      <MenuProductDetail
        product={selectedProduct}
        optionGroups={selectedProduct ? getProductOptionGroups(selectedProduct.id) : []}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => { addToCartWithLimit(item); setSelectedProduct(null); }}
        hidePrice
      />

      {/* Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full max-w-md p-0 pt-6">
          <div className="px-4 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Pedido #{ordersSent + 1}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({cart.reduce((s, i) => s + i.quantity, 0)} itens)
                </span>
              </h2>
              <button onClick={clearCart} className="text-xs text-destructive font-medium">Limpar</button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center gap-3">
                <AppIcon name="ShoppingBag" size={32} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Adicione itens do cardápio</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30">
                      {item.product.image_url && (
                        <img src={item.product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
                        {item.selectedOptions.length > 0 && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.selectedOptions.map(o => o.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateCartQuantity(idx, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                          <AppIcon name="Minus" size={14} />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => {
                            const totalQty = cart.filter(c => c.product.id === item.product.id).reduce((s, c) => s + c.quantity, 0);
                            if (totalQty >= config.max_item_quantity) {
                              toast.error(`Limite de ${config.max_item_quantity} por item`);
                              return;
                            }
                            updateCartQuantity(idx, item.quantity + 1);
                          }}
                          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                        >
                          <AppIcon name="Plus" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-warning/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-warning font-semibold">🍽️ Rodízio — Sem custo adicional</p>
                </div>

                <Button className="w-full h-14 text-base font-bold rounded-xl" onClick={handleSendOrder} disabled={sending || isExpired}>
                  {sending ? (
                    <AppIcon name="Loader2" size={20} className="animate-spin mr-2" />
                  ) : (
                    <AppIcon name="Send" size={20} className="mr-2" />
                  )}
                  Enviar Pedido #{ordersSent + 1}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RodizioProductCard({ product, maxQty, currentQty, onSelect, disabled }: {
  product: DMProduct;
  maxQty: number;
  currentQty: number;
  onSelect: (p: DMProduct) => void;
  disabled: boolean;
}) {
  const atLimit = currentQty >= maxQty;

  return (
    <button
      onClick={() => !disabled && onSelect(product)}
      disabled={disabled}
      className={cn(
        "flex items-start gap-3 p-3 rounded-2xl bg-card border text-left active:scale-[0.99] transition-all w-full",
        atLimit ? "border-warning/30 opacity-70" : "border-border/30 hover:border-primary/30",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-18 h-18 rounded-xl object-cover shrink-0" loading="lazy" />
      ) : (
        <div className="w-18 h-18 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
          <AppIcon name="Image" size={22} className="text-muted-foreground/20" />
        </div>
      )}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold text-foreground">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
        {currentQty > 0 && (
          <p className="text-[10px] font-semibold text-warning mt-1.5">
            {currentQty}/{maxQty} no pedido
          </p>
        )}
      </div>
      <div className="shrink-0 mt-auto">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          atLimit ? "bg-warning/10" : "bg-primary/10"
        )}>
          <AppIcon name={atLimit ? "Check" : "Add"} size={18} className={atLimit ? "text-warning" : "text-primary"} />
        </div>
      </div>
    </button>
  );
}
