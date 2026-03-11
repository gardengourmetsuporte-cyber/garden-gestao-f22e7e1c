import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTabletOrder, CartItem } from '@/hooks/useTabletOrder';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { ComandaScanner } from '@/components/digital-menu/ComandaScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function TabletMenu() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const tableNumber = parseInt(searchParams.get('mesa') || '1');
  const navigate = useNavigate();
  const {
    products, cart, cartTotal, loading, orderStatus,
    fetchProducts, addToCart, removeFromCart, updateQuantity, updateNotes, createOrder,
  } = useTabletOrder(unitId || '');
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [comandaNumber, setComandaNumber] = useState<number | null>(null);
  const [orderSent, setOrderSent] = useState<string | null>(null);

  useEffect(() => {
    if (unitId) fetchProducts();
  }, [unitId, fetchProducts]);

  const categories = [...new Set(products.map(p => p.category))];
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    if (!comandaNumber) {
      setShowScanner(true);
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder(tableNumber, comandaNumber);
      setOrderSent(result.orderId?.toString().slice(0, 8) || 'OK');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <AppIcon name="ChefHat" className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Cardápio</h1>
              <p className="text-xs text-muted-foreground">Mesa {tableNumber}</p>
            </div>
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button className="relative p-3 rounded-xl bg-primary/10 border border-primary/20 active:scale-95 transition-transform">
                <AppIcon name="ShoppingCart" className="w-6 h-6 text-primary" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AppIcon name="ShoppingCart" className="w-5 h-5" />
                  Seu Pedido
                </SheetTitle>
              </SheetHeader>

              {orderSent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/12 flex items-center justify-center animate-in zoom-in-50 duration-300">
                    <AppIcon name="CheckCircle2" size={40} className="text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Pedido enviado!</h2>
                    <p className="text-muted-foreground text-sm mt-2">
                      Comanda <span className="font-mono font-bold text-foreground">#{comandaNumber}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="lg" className="rounded-xl mt-2" onClick={() => {
                    setOrderSent(null);
                    setComandaNumber(null);
                    setCartOpen(false);
                  }}>
                    <AppIcon name="Plus" size={18} className="mr-2" />
                    Fazer novo pedido
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto mt-4 space-y-3">
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-12">Carrinho vazio</p>
                    ) : (
                      cart.map((item) => (
                        <CartItemCard
                          key={item.product.id}
                          item={item}
                          onUpdateQuantity={(q) => updateQuantity(item.product.id, q)}
                          onUpdateNotes={(n) => updateNotes(item.product.id, n)}
                          onRemove={() => removeFromCart(item.product.id)}
                          formatPrice={formatPrice}
                        />
                      ))
                    )}
                  </div>
                  {cart.length > 0 && (
                    <div className="pt-4 border-t border-border/30 mt-4 space-y-3">
                      {/* Comanda section */}
                      <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <AppIcon name="QrCode" size={16} className="text-primary" />
                          Comanda
                        </h3>
                        {comandaNumber ? (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-black text-primary">#{comandaNumber}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-foreground">Comanda #{comandaNumber}</p>
                              <p className="text-[11px] text-muted-foreground">Escaneada com sucesso</p>
                            </div>
                            <button onClick={() => setComandaNumber(null)} className="p-2 rounded-lg hover:bg-secondary/50">
                              <AppIcon name="X" size={16} className="text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full h-14 rounded-xl text-base font-semibold"
                            onClick={() => setShowScanner(true)}
                          >
                            <AppIcon name="Camera" size={20} className="mr-2" />
                            Escanear Comanda
                          </Button>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-2xl font-bold text-primary">{formatPrice(cartTotal)}</span>
                      </div>
                      <Button
                        className="w-full h-14 text-lg font-bold rounded-xl"
                        onClick={handleFinalize}
                        disabled={submitting}
                      >
                        <AppIcon name="Send" className="w-5 h-5 mr-2" />
                        {submitting ? 'Enviando...' : comandaNumber ? 'Enviar Pedido' : 'Escanear Comanda'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="px-4 pt-2"><SyncStatusIndicator /></div>

      {/* Products by category */}
      <main className="pb-24 px-4 pt-4">
        {loading && products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Carregando cardápio...</div>
        ) : (
          categories.map(cat => (
            <div key={cat} className="mb-6">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {cat}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products
                  .filter(p => p.category === cat)
                  .map(product => {
                    const inCart = cart.find(c => c.product.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className="card-base p-4 flex gap-3 items-center"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                            <AppIcon name="ChefHat" className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
                          )}
                          <p className="text-primary font-bold mt-1">{formatPrice(product.price)}</p>
                        </div>
                        <div className="shrink-0">
                          {inCart ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(product.id, inCart.quantity - 1)}
                                className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center active:scale-90"
                              >
                                <AppIcon name="Minus" className="w-4 h-4" />
                              </button>
                              <span className="w-6 text-center font-bold text-sm">{inCart.quantity}</span>
                              <button
                                onClick={() => addToCart(product)}
                                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-90"
                              >
                                <AppIcon name="Plus" className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <AppIcon name="Plus" className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Floating cart bar */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-primary text-primary-foreground active:scale-[0.98] transition-transform"
            style={{ boxShadow: '0 8px 32px hsl(var(--primary) / 0.4)' }}
          >
            <div className="flex items-center gap-3">
              <AppIcon name="ShoppingCart" className="w-5 h-5" />
              <span className="font-bold">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
            </div>
            <span className="font-bold text-lg">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Comanda Scanner Modal */}
      {showScanner && unitId && (
        <ComandaScanner
          unitId={unitId}
          onScan={(num) => {
            setComandaNumber(num);
            setShowScanner(false);
          }}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

function CartItemCard({
  item, onUpdateQuantity, onUpdateNotes, onRemove, formatPrice,
}: {
  item: CartItem;
  onUpdateQuantity: (q: number) => void;
  onUpdateNotes: (n: string) => void;
  onRemove: () => void;
  formatPrice: (v: number) => string;
}) {
  const [showNotes, setShowNotes] = useState(!!item.notes);
  return (
    <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{item.product.name}</p>
          <p className="text-xs text-muted-foreground">{formatPrice(item.product.price)} cada</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onUpdateQuantity(item.quantity - 1)} className="w-7 h-7 rounded-lg bg-card flex items-center justify-center">
            <AppIcon name="Minus" className="w-3.5 h-3.5" />
          </button>
          <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
          <button onClick={() => onUpdateQuantity(item.quantity + 1)} className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <AppIcon name="Plus" className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="font-bold text-sm w-16 text-right">{formatPrice(item.product.price * item.quantity)}</p>
        <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-destructive/10">
          <AppIcon name="Trash2" className="w-4 h-4 text-destructive" />
        </button>
      </div>
      <button onClick={() => setShowNotes(!showNotes)} className="text-xs text-primary flex items-center gap-1">
        <AppIcon name="StickyNote" className="w-3 h-3" />
        {showNotes ? 'Fechar observação' : 'Adicionar observação'}
      </button>
      {showNotes && (
        <Input
          placeholder="Ex: sem cebola, bem passado..."
          value={item.notes}
          onChange={e => onUpdateNotes(e.target.value)}
          className="text-sm h-9"
        />
      )}
    </div>
  );
}
