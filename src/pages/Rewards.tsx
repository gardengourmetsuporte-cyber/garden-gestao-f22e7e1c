import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { ProductCard } from '@/components/rewards/ProductCard';
import { RedemptionHistory } from '@/components/rewards/RedemptionHistory';
import { usePoints } from '@/hooks/usePoints';
import { useRewards, RewardProduct } from '@/hooks/useRewards';
import { useCountUp } from '@/hooks/useCountUp';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RewardsPage() {
  const { balance, refetch: refetchPoints } = usePoints();
  const { products, redemptions, redeemProduct, refetch: refetchRewards } = useRewards();
  const { toast } = useToast();
  const animatedBalance = useCountUp(balance);

  const [selectedProduct, setSelectedProduct] = useState<RewardProduct | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const activeProducts = products.filter(p => p.is_active);

  // Find cheapest affordable or next target prize
  const nextPrize = useMemo(() => {
    const affordable = activeProducts.filter(p => (p.stock === null || p.stock > 0));
    if (affordable.length === 0) return null;
    const sorted = [...affordable].sort((a, b) => a.points_cost - b.points_cost);
    // Find the cheapest one the user can't yet afford, or the cheapest overall
    const target = sorted.find(p => p.points_cost > balance) || sorted[0];
    return target;
  }, [activeProducts, balance]);

  const progressPercent = nextPrize ? Math.min((balance / nextPrize.points_cost) * 100, 100) : 100;

  const handleRedeem = async () => {
    if (!selectedProduct) return;
    setIsRedeeming(true);
    try {
      await redeemProduct(selectedProduct.id, selectedProduct.points_cost);
      toast({ title: 'Resgate solicitado!', description: `Seu pedido de ${selectedProduct.name} foi enviado para aprovação.` });
      refetchPoints();
      refetchRewards();
    } catch {
      toast({ title: 'Erro ao resgatar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setIsRedeeming(false);
      setSelectedProduct(null);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          {/* Hero — Saldo */}
          <div className="card-surface p-5">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Seu saldo</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--neon-amber) / 0.12)' }}>
                <AppIcon name="Star" size={24} style={{ color: 'hsl(var(--neon-amber))' }} />
              </div>
              <span className="text-5xl font-black text-foreground font-display" style={{ letterSpacing: '-0.04em' }}>
                {animatedBalance}
              </span>
              <span className="text-base text-muted-foreground mt-2">pontos</span>
            </div>

            {/* Progress to next prize */}
            {nextPrize && balance < nextPrize.points_cost && (
              <div className="space-y-2 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Próximo: {nextPrize.name}</span>
                  <span className="font-bold text-foreground">{balance}/{nextPrize.points_cost}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </div>

          {/* Products */}
          <section>
            <h2 className="section-title mb-3 font-display">Prêmios Disponíveis</h2>
            {activeProducts.length === 0 ? (
              <EmptyState
                icon="Gift"
                title="Nenhum prêmio disponível"
                subtitle="Acumule pontos completando tarefas. Novos prêmios serão adicionados em breve!"
                accent="warning"
              />
            ) : (
              <div className="space-y-2">
                {activeProducts.map((product, idx) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                    <ProductCard product={product} userBalance={balance} onRedeem={setSelectedProduct} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Redemptions */}
          <section>
            <h2 className="section-title mb-3 font-display">Meus Resgates</h2>
            <RedemptionHistory redemptions={redemptions} />
          </section>
        </div>
      </div>

      <AlertDialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Resgate</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja resgatar <strong>{selectedProduct?.name}</strong> por <strong>{selectedProduct?.points_cost} pontos</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRedeeming}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRedeem} disabled={isRedeeming}>
              {isRedeeming ? 'Resgatando...' : 'Confirmar Resgate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
