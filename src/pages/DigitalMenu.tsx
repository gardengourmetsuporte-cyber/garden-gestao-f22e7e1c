import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDigitalMenu, DMProduct } from '@/hooks/useDigitalMenu';
import { useGamification } from '@/hooks/useGamification';
import { MenuLanding } from '@/components/digital-menu/MenuLanding';
import { MenuBottomNav, MenuTab } from '@/components/digital-menu/MenuBottomNav';
import { MenuProductList } from '@/components/digital-menu/MenuProductList';
import { MenuProductDetail } from '@/components/digital-menu/MenuProductDetail';
import { MenuCart } from '@/components/digital-menu/MenuCart';
import { MenuSearch } from '@/components/digital-menu/MenuSearch';
import { MenuCustomerAuth } from '@/components/digital-menu/MenuCustomerAuth';
import { MenuCustomerProfile } from '@/components/digital-menu/MenuCustomerProfile';
import { MenuAccount } from '@/components/digital-menu/MenuAccount';
import { SlotMachine } from '@/components/gamification/SlotMachine';
import { PrizeResult } from '@/components/gamification/PrizeResult';
import { AppIcon } from '@/components/ui/app-icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { normalizePhone } from '@/lib/normalizePhone';
import { supabase } from '@/integrations/supabase/client';
import gardenLogo from '@/assets/logo.png';
import type { GamificationPrize } from '@/hooks/useGamification';
import type { User } from '@supabase/supabase-js';

export default function DigitalMenu() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as MenuTab) || 'home';

  const {
    unit, categories, groups, products, loading,
    getProductOptionGroups, getGroupProducts,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
  } = useDigitalMenu(unitId);

  const [activeTab, setActiveTab] = useState<MenuTab>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DMProduct | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Auth state for customer login
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState<MenuTab | null>(null);
  const [menuEntered, setMenuEntered] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCustomerUser(session?.user ?? null);
      if (session?.user) setMenuEntered(true);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCustomerUser(user);
      setAuthChecked(true);

      // After OAuth login, check if customer profile is complete
      if (user && unitId && _event === 'SIGNED_IN') {
        setShowAuth(false);
        setMenuEntered(true);
        const needsProfile = await checkNeedsProfile(user, unitId);
        if (needsProfile) {
          setShowProfile(true);
        } else {
          if (pendingTabAfterAuth) {
            setActiveTab(pendingTabAfterAuth);
            setPendingTabAfterAuth(null);
          }
        }
        await ensureCustomerRecord(user, unitId);
      }

      // If user already logged in (page refresh), just proceed
      if (user && !showAuth && pendingTabAfterAuth && _event !== 'SIGNED_IN') {
        setActiveTab(pendingTabAfterAuth);
        setPendingTabAfterAuth(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [unitId, pendingTabAfterAuth, showAuth]);

  // Check if customer needs to complete their profile (no phone)
  const checkNeedsProfile = async (user: User, unitId: string): Promise<boolean> => {
    try {
      const email = user.email;
      if (!email) return true;
      const { data } = await supabase
        .from('customers')
        .select('phone')
        .eq('unit_id', unitId)
        .eq('email', email)
        .maybeSingle();
      // If no customer record or no phone, needs profile
      return !data || !data.phone;
    } catch {
      return true;
    }
  };

  // Create/update customer record from OAuth user data
  const ensureCustomerRecord = async (user: User, unitId: string) => {
    try {
      const email = user.email;
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email?.split('@')[0] || 'Cliente';
      const phone = user.phone || null;

      // Check if customer already exists by email
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('unit_id', unitId)
        .eq('email', email || '')
        .maybeSingle();

      if (!existing) {
        await supabase.from('customers').insert({
          unit_id: unitId,
          name: fullName,
          email: email || null,
          phone,
          origin: 'whatsapp' as any, // closest to "online/social"
          score: 0,
          segment: 'new',
          loyalty_points: 0,
          total_spent: 0,
          total_orders: 0,
        });
      }
    } catch (err) {
      console.error('[DigitalMenu] Failed to create customer record:', err);
    }
  };

  // Intercept tab changes — require auth for cart
  const handleTabChange = (tab: MenuTab) => {
    if ((tab === 'cart' || tab === 'account') && !customerUser && authChecked) {
      setPendingTabAfterAuth(tab);
      setShowAuth(true);
      return;
    }
    setActiveTab(tab);
    setSearchOpen(false);
  };

  // Gamification
  const { prizes, prizesLoading, isEnabled, checkAlreadyPlayed, checkDailyCostExceeded, recordPlay } = useGamification(activeTab === 'game' ? unitId : undefined);
  const [gamePhase, setGamePhase] = useState<'input' | 'wheel' | 'result'>('input');
  const [gameOrderId, setGameOrderId] = useState('');
  const [gameName, setGameName] = useState('');
  const [gamePhone, setGamePhone] = useState('');
  const [wonPrize, setWonPrize] = useState<GamificationPrize | null>(null);
  const [validating, setValidating] = useState(false);

  const handleProductSelect = (product: DMProduct) => {
    setSelectedProduct(product);
  };

  const handleGameStart = async () => {
    if (!gameOrderId.trim()) { toast.error('Digite o número do pedido'); return; }
    if (!gameName.trim()) { toast.error('Digite seu nome'); return; }
    const normalizedPhone = normalizePhone(gamePhone);
    if (!normalizedPhone) { toast.error('Digite um telefone válido'); return; }
    setValidating(true);
    try {
      if (!isEnabled) { toast.error('Jogo desativado no momento'); return; }
      if (await checkAlreadyPlayed(gameOrderId.trim())) { toast.error('Este pedido já participou!'); return; }
      if (await checkDailyCostExceeded()) { toast.error('Limite diário atingido!'); return; }
      if (unitId) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('unit_id', unitId)
          .eq('phone', normalizedPhone)
          .maybeSingle();
        if (!existing) {
          await supabase.from('customers').insert({
            unit_id: unitId,
            name: gameName.trim(),
            phone: normalizedPhone,
            origin: 'mesa',
            score: 0,
            segment: 'new',
            loyalty_points: 0,
            total_spent: 0,
            total_orders: 0,
          });
        }
      }
      setGamePhase('wheel');
    } catch { toast.error('Erro ao validar'); } finally { setValidating(false); }
  };

  const handleGameResult = async (prize: GamificationPrize) => {
    setWonPrize(prize);
    try {
      await recordPlay.mutateAsync({ order_id: gameOrderId.trim(), customer_name: gameName.trim() || undefined, prize });
    } catch {}
    setGamePhase('result');
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Compute open/closed status for welcome screen
  const isOpen = (() => {
    const hours = unit?.store_info?.opening_hours;
    if (!hours?.length) return true;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return hours.some(h => currentTime >= h.open && currentTime <= h.close);
  })();

  // Welcome gate: show auth/entry screen before entering the menu
  if (!menuEntered && !showProfile && authChecked && !customerUser) {
    return (
      <MenuCustomerAuth
        unitName={unit?.name}
        logoUrl={unit?.store_info?.logo_url}
        cuisineType={unit?.store_info?.cuisine_type}
        city={unit?.store_info?.city}
        isOpen={isOpen}
      />
    );
  }

  // Show auth screen (from cart/account requiring login)
  if (showAuth) {
    return (
      <MenuCustomerAuth
        unitName={unit?.name}
        logoUrl={unit?.store_info?.logo_url}
        cuisineType={unit?.store_info?.cuisine_type}
        city={unit?.store_info?.city}
        isOpen={isOpen}
        onSkip={() => {
          setShowAuth(false);
          if (pendingTabAfterAuth) {
            setActiveTab(pendingTabAfterAuth);
            setPendingTabAfterAuth(null);
          }
        }}
      />
    );
  }

  // Show profile completion screen
  if (showProfile && customerUser) {
    const handleProfileComplete = async (data: { name: string; phone: string; birthday: string | null }) => {
      if (!unitId) return;
      try {
        const email = customerUser.email || '';
        
        // Try to find existing customer by email or phone
        let existing: { id: string } | null = null;
        
        if (email) {
          const { data: byEmail } = await supabase
            .from('customers')
            .select('id')
            .eq('unit_id', unitId)
            .eq('email', email)
            .maybeSingle();
          existing = byEmail;
        }
        
        if (!existing && data.phone) {
          const { data: byPhone } = await supabase
            .from('customers')
            .select('id')
            .eq('unit_id', unitId)
            .eq('phone', data.phone)
            .maybeSingle();
          existing = byPhone;
        }

        if (existing) {
          const { error } = await supabase.from('customers').update({
            name: data.name,
            phone: data.phone,
            birthday: data.birthday,
            email: email || undefined,
          }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('customers').insert({
            unit_id: unitId,
            name: data.name,
            email: email || null,
            phone: data.phone,
            birthday: data.birthday,
            origin: 'whatsapp' as any,
            score: 0,
            segment: 'new',
            loyalty_points: 0,
            total_spent: 0,
            total_orders: 0,
          });
          if (error) throw error;
        }

        setShowProfile(false);
        if (pendingTabAfterAuth) {
          setActiveTab(pendingTabAfterAuth);
          setPendingTabAfterAuth(null);
        }
        toast.success('Cadastro completo!');
      } catch (err) {
        console.error('[DigitalMenu] Profile save error:', err);
        toast.error('Erro ao salvar dados. Tente novamente.');
        throw err;
      }
    };

    return (
      <MenuCustomerProfile
        unitName={unit?.name}
        logoUrl={unit?.store_info?.logo_url}
        defaultName={customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || ''}
        defaultEmail={customerUser.email}
        onComplete={handleProfileComplete}
        onBack={() => {
          setShowProfile(false);
          if (pendingTabAfterAuth) {
            setActiveTab(pendingTabAfterAuth);
            setPendingTabAfterAuth(null);
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '2s' }}>
          <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">Carregando cardápio...</p>
          <div className="flex gap-1 mt-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  const unitInitials = unit?.name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="min-h-[100dvh] bg-background max-w-4xl mx-auto relative">
      {/* Home tab */}
      {activeTab === 'home' && (
        <div>
          <MenuLanding unit={unit} unitInitials={unitInitials} />

          {/* Quick search bar */}
          <div className="px-5 md:px-8 mt-5">
            <button
              onClick={() => { setSearchOpen(true); setActiveTab('menu'); }}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-card border border-border/40 text-muted-foreground text-sm active:scale-[0.98] transition-transform"
            >
              <AppIcon name="Search" size={16} />
              Buscar no cardápio...
            </button>
          </div>

          {/* Featured products */}
          {products.filter(p => p.is_highlighted).length > 0 && (
            <div className="mt-6 px-5 md:px-8">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                <AppIcon name="Whatshot" size={14} className="text-primary" />
                Destaques
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
                {products.filter(p => p.is_highlighted).slice(0, 8).map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="shrink-0 w-[140px] rounded-2xl bg-card border border-border/30 overflow-hidden active:scale-[0.97] transition-transform text-left"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-24 bg-secondary/50 flex items-center justify-center">
                        <AppIcon name="Image" size={24} className="text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                      <p className="text-xs font-bold text-primary mt-1">
                        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick category access */}
          {categories.length > 0 && (
            <div className="mt-6 px-5 md:px-8 pb-28">
              <h3 className="text-sm font-bold text-foreground mb-3">Categorias</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setActiveTab('menu'); }}
                    className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-card border border-border/30 active:scale-[0.97] transition-transform text-left"
                  >
                    {cat.icon && <AppIcon name={cat.icon} size={20} className="text-muted-foreground" />}
                    <span className="text-sm font-semibold text-foreground truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menu tab */}
      {activeTab === 'menu' && (
        <div className="pt-4">
          {searchOpen ? (
            <div className="px-4 md:px-8 mb-4">
              <MenuSearch products={products} onSelectProduct={handleProductSelect} />
            </div>
          ) : (
            <>
              <div className="px-5 md:px-8 mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Cardápio</h2>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center"
                >
                  <AppIcon name="Search" size={16} className="text-muted-foreground" />
                </button>
              </div>
              <MenuProductList
                categories={categories}
                groups={groups}
                products={products}
                getGroupProducts={getGroupProducts}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onSelectProduct={handleProductSelect}
              />
            </>
          )}
        </div>
      )}

      {/* Cart tab */}
      {activeTab === 'cart' && unitId && (
        <div className="pt-4">
          <MenuCart
            cart={cart}
            cartTotal={cartTotal}
            unitId={unitId}
            customerUser={customerUser}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
          />
        </div>
      )}

      {/* Account tab */}
      {activeTab === 'account' && unitId && (
        <div className="pt-4">
          <MenuAccount
            customerUser={customerUser}
            unitId={unitId}
            unitName={unit?.name}
            logoUrl={unit?.store_info?.logo_url}
            onLogin={() => {
              setPendingTabAfterAuth('account');
              setShowAuth(true);
            }}
            onLogout={() => {
              setCustomerUser(null);
              setActiveTab('home');
            }}
          />
        </div>
      )}

      {/* Game tab */}
      {activeTab === 'game' && (
        <div className="px-5 pt-6 pb-28 flex flex-col items-center gap-6">
          {/* Unit logo */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border/30 shadow-lg bg-white flex items-center justify-center p-2">
            {unit?.store_info?.logo_url ? (
              <img src={unit.store_info.logo_url} alt={unit.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
            )}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">🎰 Roleta da Sorte</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gire a roleta e concorra a prêmios!
            </p>
          </div>

          {gamePhase === 'input' && (
            <div className="w-full max-w-sm space-y-4">
              <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
                <Input
                  placeholder="Número do pedido *"
                  value={gameOrderId}
                  onChange={e => setGameOrderId(e.target.value)}
                  className="text-center h-13 text-base rounded-xl"
                />
                <Input
                  placeholder="Seu nome *"
                  value={gameName}
                  onChange={e => setGameName(e.target.value)}
                  className="text-center h-13 text-base rounded-xl"
                />
                <Input
                  placeholder="Telefone *"
                  value={gamePhone}
                  onChange={e => setGamePhone(formatPhone(e.target.value))}
                  className="text-center h-13 text-base rounded-xl"
                  inputMode="tel"
                />
              </div>
              <Button size="lg" className="w-full h-14 text-base font-bold rounded-xl" onClick={handleGameStart} disabled={validating || !isEnabled}>
                {validating ? <AppIcon name="Loader2" size={20} className="animate-spin mr-2" /> : <AppIcon name="Dices" size={20} className="mr-2" />}
                GIRAR ROLETA
              </Button>
              {!isEnabled && (
                <p className="text-xs text-muted-foreground text-center">A roleta está desativada no momento</p>
              )}
            </div>
          )}

          {gamePhase === 'wheel' && (
            <SlotMachine prizes={prizes} onResult={handleGameResult} />
          )}

          {gamePhase === 'result' && wonPrize && (
            <PrizeResult prize={wonPrize} onFinish={() => { setGamePhase('input'); setGameOrderId(''); setGameName(''); setGamePhone(''); setWonPrize(null); }} />
          )}
        </div>
      )}

      {/* Product detail sheet */}
      <MenuProductDetail
        product={selectedProduct}
        optionGroups={selectedProduct ? getProductOptionGroups(selectedProduct.id) : []}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      {/* Bottom nav */}
      <MenuBottomNav active={activeTab} onTabChange={handleTabChange} cartCount={cartCount} />
    </div>
  );
}
