import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDigitalMenu, DMProduct } from '@/hooks/useDigitalMenu';
import { useMenuTranslation } from '@/hooks/useMenuTranslation';
import { TabletProductDetail } from '@/components/digital-menu/TabletProductDetail';
import { MenuSearch } from '@/components/digital-menu/MenuSearch';
import { TabletMenuCart } from '@/components/digital-menu/TabletMenuCart';
import { MenuCustomerAuth } from '@/components/digital-menu/MenuCustomerAuth';
import { MenuCustomerProfile } from '@/components/digital-menu/MenuCustomerProfile';
import { LanguageSwitcher } from '@/components/digital-menu/LanguageSwitcher';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency as formatPrice } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import gardenLogo from '@/assets/logo.png';
import { MenuLoadingScreen } from '@/components/digital-menu/MenuLoadingScreen';
import type { User } from '@supabase/supabase-js';

export default function TabletDigitalMenu() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa') || '1';

  const {
    unit, categories, groups, products, loading, hasVisibleProducts,
    getProductOptionGroups, getGroupProducts,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
  } = useDigitalMenu(unitId, 'tablet');

  const { tt, translateTexts, isTranslating, locale } = useMenuTranslation();
  const [, forceRerender] = useState(0);

  // Trigger translation when locale/data changes
  useEffect(() => {
    if (locale === 'pt' || loading) return;
    const texts: string[] = [];
    categories.forEach(c => { if (c.name) texts.push(c.name); });
    groups.forEach(g => { if (g.name) texts.push(g.name); if (g.description) texts.push(g.description); });
    products.forEach(p => { if (p.name) texts.push(p.name); if (p.description) texts.push(p.description); });
    if (texts.length > 0) translateTexts(texts);
  }, [locale, loading, categories, groups, products, translateTexts]);

  // Translated data
  const tCategories = useMemo(() =>
    locale === 'pt' ? categories : categories.map(c => ({ ...c, name: tt(c.name) })),
    [categories, tt, locale]
  );
  const tGroups = useMemo(() =>
    locale === 'pt' ? groups : groups.map(g => ({ ...g, name: tt(g.name), description: tt(g.description) || null })),
    [groups, tt, locale]
  );
  const tProducts = useMemo(() =>
    locale === 'pt' ? products : products.map(p => ({ ...p, name: tt(p.name), description: tt(p.description) || null })),
    [products, tt, locale]
  );
  const tGetGroupProducts = useMemo(() => {
    if (locale === 'pt') return getGroupProducts;
    const tMap = new Map<string, DMProduct[]>();
    for (const p of tProducts) {
      if (!p.group_id) continue;
      const arr = tMap.get(p.group_id) ?? [];
      arr.push(p);
      tMap.set(p.group_id, arr);
    }
    return (groupId: string) => tMap.get(groupId) ?? [];
  }, [locale, tProducts, getGroupProducts]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DMProduct | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Auth state for customer login
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const signupBonus = (unit?.store_info as any)?.signup_bonus_points ?? 0;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCustomerUser(session?.user ?? null);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCustomerUser(user);
      setAuthChecked(true);

      if (user && unitId && _event === 'SIGNED_IN') {
        setShowAuth(false);
        await ensureCustomerRecord(user, unitId);
        const needsProfile = await checkNeedsProfile(user, unitId);
        if (needsProfile) setShowProfile(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [unitId]);

  const checkNeedsProfile = async (user: User, uid: string): Promise<boolean> => {
    try {
      const email = user.email;
      if (!email) return true;
      const { data } = await supabase
        .from('customers')
        .select('phone')
        .eq('unit_id', uid)
        .eq('email', email)
        .maybeSingle();
      return !data || !data.phone;
    } catch { return true; }
  };

  const ensureCustomerRecord = async (user: User, uid: string) => {
    try {
      const email = user.email;
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email?.split('@')[0] || 'Cliente';
      if (!email) return;

      const { data: customerId } = await supabase.rpc('upsert_menu_customer', {
        p_unit_id: uid,
        p_name: fullName,
        p_email: email,
        p_phone: user.phone || null,
        p_birthday: null,
      });

      if (customerId) {
        supabase.rpc('grant_signup_bonus', {
          p_customer_id: customerId,
          p_unit_id: uid,
        }).then(({ data: pts }) => {
          if (pts && pts > 0) {
            toast.success(`🎁 Você ganhou ${pts} pontos de boas-vindas!`);
          }
        });
      }
    } catch (err) {
      console.error('[TabletMenu] ensureCustomerRecord:', err);
    }
  };

  const handleProfileComplete = async (data: { name: string; phone: string; birthday: string | null }) => {
    if (!unitId || !customerUser) return;
    try {
      const { error } = await supabase.rpc('upsert_menu_customer', {
        p_unit_id: unitId,
        p_name: data.name,
        p_email: customerUser.email || null,
        p_phone: data.phone || null,
        p_birthday: data.birthday,
      });
      if (error) throw error;
      setShowProfile(false);
      toast.success('Cadastro completo!');
    } catch {
      toast.error('Erro ao salvar dados.');
    }
  };

  if (loading) {
    return <MenuLoadingScreen />;
  }

  if (!hasVisibleProducts) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col items-center justify-center gap-5 px-8">
        <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center p-3">
          <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <AppIcon name="UtensilsCrossed" size={44} className="text-muted-foreground/30" />
          <div>
            <p className="text-lg font-bold text-foreground">Cardápio temporariamente indisponível</p>
            <p className="text-sm text-muted-foreground mt-1">Nosso cardápio está sendo atualizado. Volte em breve!</p>
          </div>
        </div>
      </div>
    );
  }

  const activeCategory = selectedCategory || tCategories[0]?.id || null;
  const categoryGroups = tGroups.filter(g => g.category_id === activeCategory);
  const categoryProducts = activeCategory
    ? categoryGroups.length > 0
      ? categoryGroups.flatMap(g => tGetGroupProducts(g.id))
      : tProducts.filter(p => p.category === activeCategory)
    : tProducts;

  const logoUrl = unit?.store_info?.logo_url;

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Auth modal */}
      {showAuth && (
        <MenuCustomerAuth
          unitName={unit?.name}
          logoUrl={unit?.store_info?.logo_url}
          cuisineType={unit?.store_info?.cuisine_type}
          city={unit?.store_info?.city}
          isOpen={true}
          bonusPoints={signupBonus}
          onSkip={() => setShowAuth(false)}
          onEmailLogin={() => setShowAuth(false)}
        />
      )}

      {showProfile && customerUser && (
        <MenuCustomerProfile
          unitName={unit?.name}
          logoUrl={unit?.store_info?.logo_url}
          defaultName={customerUser.user_metadata?.full_name || customerUser.user_metadata?.name || ''}
          defaultEmail={customerUser.email}
          onComplete={handleProfileComplete}
          onBack={() => setShowProfile(false)}
        />
      )}

      {/* ─── Fixed Top Bar (Mobills-inspired, discreet) ─── */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border/20 bg-background/95 backdrop-blur-sm shrink-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/tablet/${unitId}?mesa=${mesa}`)}
            className="w-8 h-8 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} className="text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground">{unit?.name || 'Cardápio'}</span>
          <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full font-medium">Mesa {mesa}</span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher onChange={() => forceRerender(n => n + 1)} />
          {isTranslating && <span className="text-[9px] text-muted-foreground animate-pulse">Traduzindo...</span>}
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-8 h-8 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors"
          >
            <AppIcon name={searchOpen ? 'Close' : 'Search'} size={17} className="text-muted-foreground" />
          </button>
          {/* Cart */}
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className="relative w-8 h-8 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors"
          >
            <AppIcon name="ShoppingCart" size={17} className="text-muted-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Search bar (collapsible) */}
      {searchOpen && (
        <div className="px-4 py-2.5 border-b border-border/20 bg-background/95 backdrop-blur-sm shrink-0 z-10">
          <MenuSearch products={tProducts} onSelectProduct={(p) => { setSelectedProduct(p); setSearchOpen(false); }} />
        </div>
      )}

      {/* ─── Main: Sidebar + Products + Cart Panel ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed sidebar */}
        <aside className="w-52 lg:w-56 flex flex-col border-r border-border/20 bg-card/30 shrink-0 h-full overflow-hidden">
          {/* Logo */}
          <div className="px-5 pt-5 pb-4 shrink-0 flex justify-center">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-border/20 bg-white flex items-center justify-center shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt={unit?.name} className="w-full h-full object-cover" />
              ) : (
                <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain p-1.5" />
              )}
            </div>
          </div>


          {/* Category list */}
          <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-1.5">
            {tCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl text-left transition-all',
                  activeCategory === cat.id
                    ? 'bg-primary/15 text-primary font-bold shadow-md shadow-primary/10 border border-primary/20'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent'
                )}
              >
                {cat.icon && (
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    activeCategory === cat.id
                      ? 'bg-primary/20'
                      : 'bg-secondary/60'
                  )}>
                    <AppIcon name={cat.icon} size={20} />
                  </div>
                )}
                <span className="text-sm leading-tight truncate">{cat.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Scrollable products area */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Overlay when cart is open */}
          {cartOpen && cartCount > 0 && (
            <button
              onClick={() => setCartOpen(false)}
              className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
              style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(4px)' }}
            >
              <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <AppIcon name="Restaurant" size={32} className="text-primary" />
                </div>
                <p className="text-base font-bold text-foreground">Clique aqui para continuar pedindo</p>
                <p className="text-xs text-muted-foreground">O carrinho será minimizado</p>
              </div>
            </button>
          )}

          <div className="p-5 lg:p-6">
            {/* Pending cart banner */}
            {cartCount > 0 && !cartOpen && (
              <button
                onClick={() => setCartOpen(true)}
                className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-left hover:bg-primary/15 transition-colors"
              >
                <AppIcon name="ShoppingCart" size={18} className="text-primary" />
                <span className="flex-1 text-sm font-semibold text-foreground">
                  Existem pedidos não enviados. Gostaria de enviar agora?
                </span>
                <AppIcon name="ArrowRight" size={16} className="text-primary" />
              </button>
            )}

            {/* Category title */}
            {activeCategory && (
              <div className="mb-5">
                <h2 className="text-lg font-bold text-foreground">
                  {tCategories.find(c => c.id === activeCategory)?.name}
                </h2>
              </div>
            )}

            {/* Group headers + products */}
            {categoryGroups.length > 0 ? (
              categoryGroups.map(group => {
                const groupProducts = tGetGroupProducts(group.id);
                if (groupProducts.length === 0) return null;
                return (
                  <div key={group.id} className="mb-6">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{group.name}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {groupProducts.map(product => (
                        <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {categoryProducts.map(product => (
                  <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
                ))}
              </div>
            )}

            {categoryProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <AppIcon name="Restaurant" size={40} className="text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Nenhum produto nesta categoria</p>
              </div>
            )}
          </div>
        </main>

        {/* ─── Right Cart Panel (persistent, Goomer-style) ─── */}
        {cartOpen && (cartCount > 0 || cartOpen) && (
          <aside className="w-[380px] flex flex-col border-l border-border/20 bg-card shrink-0 animate-in slide-in-from-right-5 duration-300">
            <TabletMenuCart
              cart={cart}
              cartTotal={cartTotal}
              unitId={unitId!}
              autoConfirm={(unit?.store_info as any)?.auto_confirm?.mesa ?? false}
              customerUser={customerUser}
              signupBonusPoints={signupBonus}
              onUpdateQuantity={updateCartQuantity}
              onRemove={removeFromCart}
              onClear={clearCart}
              onClose={() => setCartOpen(false)}
              onLoginClick={() => { setCartOpen(false); setShowAuth(true); }}
            />
          </aside>
        )}
      </div>

      {/* Product detail */}
      <TabletProductDetail
        product={selectedProduct}
        optionGroups={selectedProduct ? getProductOptionGroups(selectedProduct.id) : []}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => { addToCart(item); setSelectedProduct(null); setCartOpen(true); }}
      />
    </div>
  );
}

function ProductCard({ product, onSelect }: { product: DMProduct; onSelect: (p: DMProduct) => void }) {
  return (
    <button
      onClick={() => onSelect(product)}
      className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border/20 text-left hover:border-primary/20 active:scale-[0.99] transition-all w-full group"
    >
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-xl object-cover shrink-0" loading="lazy" />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
          <AppIcon name="Image" size={24} className="text-muted-foreground/20" />
        </div>
      )}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold text-foreground">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
        <p className="text-sm font-bold text-primary mt-2">{formatPrice(product.price)}</p>
      </div>
      <div className="shrink-0 self-center opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <AppIcon name="Add" size={18} className="text-primary" />
        </div>
      </div>
    </button>
  );
}
