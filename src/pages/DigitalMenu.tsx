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

  const {
    unit, categories, groups, products, loading,
    getProductOptionGroups, getGroupProducts,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount,
  } = useDigitalMenu(unitId);

  const [activeTab, setActiveTab] = useState<MenuTab>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DMProduct | null>(null);

  // Gamification
  const { prizes, prizesLoading, isEnabled, checkAlreadyPlayed, checkDailyCostExceeded, recordPlay } = useGamification(unitId);
  const [gamePhase, setGamePhase] = useState<'input' | 'wheel' | 'result'>('input');
  const [gameOrderId, setGameOrderId] = useState('');
  const [gameName, setGameName] = useState('');
  const [wonPrize, setWonPrize] = useState<GamificationPrize | null>(null);
  const [validating, setValidating] = useState(false);

  const handleProductSelect = (product: DMProduct) => {
    setSelectedProduct(product);
  };

  const handleGameStart = async () => {
    if (!gameOrderId.trim()) { toast.error('Digite o número do pedido'); return; }
    setValidating(true);
    try {
      if (!isEnabled) { toast.error('Jogo desativado no momento'); return; }
      if (await checkAlreadyPlayed(gameOrderId.trim())) { toast.error('Este pedido já participou!'); return; }
      if (await checkDailyCostExceeded()) { toast.error('Limite diário atingido!'); return; }
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

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <AppIcon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background max-w-lg mx-auto">
      {/* Landing header - always visible */}
      <MenuLanding unit={unit} />

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'menu' && (
          <MenuProductList
            categories={categories}
            groups={groups}
            products={products}
            getGroupProducts={getGroupProducts}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectProduct={handleProductSelect}
          />
        )}

        {activeTab === 'search' && (
          <MenuSearch products={products} onSelectProduct={handleProductSelect} />
        )}

        {activeTab === 'cart' && unitId && (
          <MenuCart
            cart={cart}
            cartTotal={cartTotal}
            unitId={unitId}
            mesa={mesa}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
          />
        )}

        {activeTab === 'game' && (
          <div className="px-4 pb-20 flex flex-col items-center gap-6">
            <h2 className="text-lg font-bold text-foreground">🎰 Roleta Garden</h2>
            <p className="text-sm text-muted-foreground text-center">
              Gire a roleta e concorra a prêmios!
            </p>

            {gamePhase === 'input' && (
              <div className="w-full max-w-sm space-y-4">
                <Input
                  placeholder="Número do pedido *"
                  value={gameOrderId}
                  onChange={e => setGameOrderId(e.target.value)}
                  className="text-center h-12"
                />
                <Input
                  placeholder="Seu nome (opcional)"
                  value={gameName}
                  onChange={e => setGameName(e.target.value)}
                  className="text-center h-12"
                />
                <Button size="lg" className="w-full" onClick={handleGameStart} disabled={validating || !isEnabled}>
                  {validating ? <AppIcon name="Loader2" size={20} className="animate-spin mr-2" /> : <AppIcon name="Dices" size={20} className="mr-2" />}
                  GIRAR ROLETA
                </Button>
              </div>
            )}

            {gamePhase === 'wheel' && (
              <SlotMachine prizes={prizes} onResult={handleGameResult} />
            )}

            {gamePhase === 'result' && wonPrize && (
              <PrizeResult prize={wonPrize} onFinish={() => { setGamePhase('input'); setGameOrderId(''); setGameName(''); setWonPrize(null); }} />
            )}
          </div>
        )}
      </div>

      {/* Product detail sheet */}
      <MenuProductDetail
        product={selectedProduct}
        optionGroups={selectedProduct ? getProductOptionGroups(selectedProduct.id) : []}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      {/* Bottom nav */}
      <MenuBottomNav active={activeTab} onTabChange={setActiveTab} cartCount={cartCount} />
    </div>
  );
}
