import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductCard } from '@/components/rewards/ProductCard';
import { RedemptionHistory } from '@/components/rewards/RedemptionHistory';
import { usePoints } from '@/hooks/usePoints';
import { useRewards, RewardProduct } from '@/hooks/useRewards';
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

  const [selectedProduct, setSelectedProduct] = useState<RewardProduct | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const activeProducts = products.filter(p => p.is_active);

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
        <div className="px-4 py-4 lg:px-6 space-y-4">
          {/* Points Balance */}
          <div className="card-command-warning p-6">
            <p className="text-sm text-muted-foreground mb-1">Seu saldo</p>
            <div className="flex items-center gap-3">
              <div className="icon-glow icon-glow-lg icon-glow-warning">
                <AppIcon name="Star" size={24} className="text-warning" />
              </div>
              <span className="text-4xl font-extrabold text-foreground font-display" style={{ letterSpacing: '-0.03em' }}>{balance}</span>
              <span className="text-lg text-muted-foreground">pontos</span>
            </div>
          </div>

          {/* Products Grid */}
          <section>
            <h2 className="section-title mb-4 font-display">Prêmios Disponíveis</h2>
            {activeProducts.length === 0 ? (
              <EmptyState
                icon="Gift"
                title="Nenhum prêmio disponível"
                subtitle="Acumule pontos completando tarefas. Novos prêmios serão adicionados em breve!"
                accent="warning"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProducts.map((product, idx) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    <ProductCard product={product} userBalance={balance} onRedeem={setSelectedProduct} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Redemption History */}
          <section>
            <h2 className="section-title mb-4 font-display">Meus Resgates</h2>
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
