import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDigitalMenu, DMProduct } from '@/hooks/useDigitalMenu';
import { MenuProductDetail } from '@/components/digital-menu/MenuProductDetail';
import { MenuSearch } from '@/components/digital-menu/MenuSearch';
import { TabletMenuCart } from '@/components/digital-menu/TabletMenuCart';
import { MenuCustomerAuth } from '@/components/digital-menu/MenuCustomerAuth';
import { MenuCustomerProfile } from '@/components/digital-menu/MenuCustomerProfile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { formatCurrency as formatPrice } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import gardenLogo from '@/assets/logo.png';
import type { User } from '@supabase/supabase-js';

export default function TabletDigitalMenu() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const {
    unit, categories, groups, products, loading, hasVisibleProducts,
    getProductOptionGroups, getGroupProducts,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
  } = useDigitalMenu(unitId, 'tablet');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DMProduct | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Auth state for customer login
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Signup bonus points from store_info
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
        // Ensure customer record and grant signup bonus
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

      // Grant signup bonus (fire-and-forget)
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
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center p-3 animate-pulse" style={{ animationDuration: '2s' }}>
          <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
        </div>
        <p className="text-sm font-semibold text-foreground">Carregando cardápio...</p>
      </div>
    );
  }

  // Se não há produtos visíveis, mostrar tela de cardápio indisponível
  if (!hasVisibleProducts) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-5 px-8">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center p-3">
          <img src={gardenLogo} alt="Garden" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <AppIcon name="UtensilsCrossed" size={44} className="text-muted-foreground/30" />
          <div>
            <p className="text-lg font-bold text-foreground">Cardápio temporariamente indisponível</p>
            <p className="text-sm text-muted-foreground mt-1">Nosso cardápio está sendo atualizado. Volte em breve!</p>
          </div>
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
            {unit?.store_info?.opening_hours && (
              <p>🕒 Horários: {unit.store_info.opening_hours.map((h: any) => `${h.open} - ${h.close}`).join(', ')}</p>
            )}
            {unit?.store_info?.address && (
              <p>📍 {unit.store_info.address}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Auto-select first category
  const activeCategory = selectedCategory || categories[0]?.id || null;

  // Get products for active category (via groups or direct category match)
  const categoryGroups = groups.filter(g => g.category_id === activeCategory);
  const categoryProducts = activeCategory
    ? categoryGroups.length > 0
      ? categoryGroups.flatMap(g => getGroupProducts(g.id))
      : products.filter(p => p.category === activeCategory)
    : products;

  const logoUrl = unit?.store_info?.logo_url;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
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

      {/* Profile completion modal */}
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
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-border/30 bg-card/80 backdrop-blur-sm shrink-0">
        {/* Back button */}
        <button
          onClick={() => navigate(`/tablet/${unitId}`)}
          className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0"
        >
          <AppIcon name="ArrowLeft" size={20} className="text-muted-foreground" />
        </button>

        {/* Logo */}
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border/30 bg-white flex items-center justify-center shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={unit?.name} className="w-full h-full object-cover" />
          ) : (
            <img src={gardenLogo} alt="Garden" className="w-9 h-9 object-contain" />
          )}
        </div>

        <h1 className="text-lg font-bold text-foreground truncate">{unit?.name || 'Cardápio'}</h1>

        <div className="flex-1" />

        {/* Search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center"
        >
          <AppIcon name={searchOpen ? 'Close' : 'Search'} size={20} className="text-muted-foreground" />
        </button>

        {/* Cart button */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative h-10 px-4 rounded-xl bg-primary text-primary-foreground flex items-center gap-2 font-semibold text-sm"
        >
          <AppIcon name="ShoppingCart" size={18} />
          {cartCount > 0 && (
            <>
              <span>{formatPrice(cartTotal)}</span>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </>
          )}
        </button>
      </header>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-6 py-3 border-b border-border/30 bg-card/50">
          <MenuSearch products={products} onSelectProduct={(p) => { setSelectedProduct(p); setSearchOpen(false); }} />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar categories */}
        <aside className="w-48 lg:w-56 border-r border-border/30 bg-card/30 overflow-y-auto shrink-0">
          <nav className="py-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                  activeCategory === cat.id
                    ? 'bg-primary/10 text-primary border-r-2 border-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/50'
                )}
              >
                {cat.icon && <AppIcon name={cat.icon} size={18} />}
                <span className="text-sm truncate">{cat.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Products grid */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {/* Category title */}
          {activeCategory && (
            <h2 className="text-xl font-bold text-foreground mb-4">
              {categories.find(c => c.id === activeCategory)?.name}
            </h2>
          )}

          {/* Group headers + products */}
          {categoryGroups.length > 0 ? (
            categoryGroups.map(group => {
              const groupProducts = getGroupProducts(group.id);
              if (groupProducts.length === 0) return null;
              return (
                <div key={group.id} className="mb-6">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">{group.name}</h3>
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
        </main>
      </div>

      {/* Product detail sheet */}
      <MenuProductDetail
        product={selectedProduct}
        optionGroups={selectedProduct ? getProductOptionGroups(selectedProduct.id) : []}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => { addToCart(item); setSelectedProduct(null); }}
      />

      {/* Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full max-w-md p-0 pt-6">
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
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProductCard({ product, onSelect }: { product: DMProduct; onSelect: (p: DMProduct) => void }) {
  return (
    <button
      onClick={() => onSelect(product)}
      className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border/30 text-left hover:border-primary/30 active:scale-[0.99] transition-all w-full"
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
      <div className="shrink-0 mt-auto">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <AppIcon name="Add" size={18} className="text-primary" />
        </div>
      </div>
    </button>
  );
}
