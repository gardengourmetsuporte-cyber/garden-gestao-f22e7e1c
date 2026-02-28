import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDigitalMenu, DMProduct } from '@/hooks/useDigitalMenu';
import { useGamification } from '@/hooks/useGamification';
import { MenuLanding } from '@/components/digital-menu/MenuLanding';
import { MenuBottomNav, MenuTab } from '@/components/digital-menu/MenuBottomNav';
import { MenuProductList } from '@/components/digital-menu/MenuProductList';
import { MenuProductDetail } from '@/components/digital-menu/MenuProductDetail';
import { MenuCart } from '@/components/digital-menu/MenuCart';
import { MenuSearch } from '@/components/digital-menu/MenuSearch';
import { SlotMachine } from '@/components/gamification/SlotMachine';
import { PrizeResult } from '@/components/gamification/PrizeResult';
import { AppIcon } from '@/components/ui/app-icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { GamificationPrize } from '@/hooks/useGamification';

export default function DigitalMenu() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get('mesa');
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

  // Gamification
  const { prizes, prizesLoading, isEnabled, checkAlreadyPlayed, checkDailyCostExceeded, recordPlay } = useGamification(unitId);
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
    if (!gamePhone.trim() || gamePhone.replace(/\D/g, '').length < 10) { toast.error('Digite um telefone válido'); return; }
    setValidating(true);
    try {
      if (!isEnabled) { toast.error('Jogo desativado no momento'); return; }
      if (await checkAlreadyPlayed(gameOrderId.trim())) { toast.error('Este pedido já participou!'); return; }
      if (await checkDailyCostExceeded()) { toast.error('Limite diário atingido!'); return; }
      // Upsert customer
      if (unitId) {
        const { supabase } = await import('@/integrations/supabase/client');
        const phone = gamePhone.replace(/\D/g, '');
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('unit_id', unitId)
          .eq('phone', phone)
          .maybeSingle();
        if (!existing) {
          await supabase.from('customers').insert({
            unit_id: unitId,
            name: gameName.trim(),
            phone,
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

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border/40 shadow-lg flex items-center justify-center animate-pulse">
          <AppIcon name="MenuBook" size={28} className="text-primary" />
        </div>
        <div className="flex flex-col items-center gap-1">
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

  // Derive logo initials for fallback
  const unitInitials = unit?.name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="min-h-[100dvh] bg-background max-w-4xl mx-auto relative">
      {/* Home tab: Landing + search + featured */}
      {activeTab === 'home' && (
        <div>
          <MenuLanding unit={unit} unitInitials={unitInitials} />

          {/* Quick search bar */}
          <div className="px-4 md:px-8 mt-5">
            <button
              onClick={() => { setSearchOpen(true); setActiveTab('menu'); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border border-border/40 text-muted-foreground text-sm"
            >
              <AppIcon name="Search" size={16} />
              Buscar no cardápio...
            </button>
          </div>

          {/* Featured products */}
          {products.filter(p => p.is_highlighted).length > 0 && (
            <div className="mt-6 px-4 md:px-8">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                <AppIcon name="Whatshot" size={14} className="text-primary" />
                Destaques
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {products.filter(p => p.is_highlighted).slice(0, 8).map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="shrink-0 w-36 rounded-2xl bg-card border border-border/30 overflow-hidden active:scale-[0.97] transition-transform text-left"
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
            <div className="mt-6 px-4 md:px-8 pb-28">
              <h3 className="text-sm font-bold text-foreground mb-3">Categorias</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setActiveTab('menu'); }}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl bg-card border border-border/30 active:scale-[0.97] transition-transform text-left"
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
              <div className="px-4 md:px-8 mb-3 flex items-center justify-between">
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
            mesa={mesa}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
          />
        </div>
      )}

      {/* Game tab */}
      {activeTab === 'game' && (
        <div className="px-4 pt-6 pb-28 flex flex-col items-center gap-6">
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
      <MenuBottomNav active={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSearchOpen(false); }} cartCount={cartCount} />
    </div>
  );
}