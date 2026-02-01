import { useState } from 'react';
import { Star, Gift } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProductCard } from '@/components/rewards/ProductCard';
import { RedemptionHistory } from '@/components/rewards/RedemptionHistory';
import { usePoints } from '@/hooks/usePoints';
import { useRewards, RewardProduct } from '@/hooks/useRewards';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
      toast({
        title: 'Resgate solicitado!',
        description: `Seu pedido de ${selectedProduct.name} foi enviado para aprovação.`,
      });
      refetchPoints();
      refetchRewards();
    } catch (error) {
      toast({
        title: 'Erro ao resgatar',
        description: 'Não foi possível processar seu resgate. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsRedeeming(false);
      setSelectedProduct(null);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="bg-card border-b sticky top-0 lg:top-0 z-40">
          <div className="px-4 py-4 lg:px-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Loja de Recompensas</h1>
                <p className="text-sm text-muted-foreground">
                  Troque seus pontos por prêmios!
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-6 space-y-8">
          {/* Points Balance */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
            <p className="text-amber-100 text-sm mb-1">Seu saldo</p>
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 fill-current" />
              <span className="text-4xl font-bold">{balance}</span>
              <span className="text-lg text-amber-100">pontos</span>
            </div>
          </div>

          {/* Products Grid */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Prêmios Disponíveis
            </h2>
            
            {activeProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum prêmio disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    userBalance={balance}
                    onRedeem={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Redemption History */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Meus Resgates
            </h2>
            <RedemptionHistory redemptions={redemptions} />
          </section>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Resgate</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja resgatar <strong>{selectedProduct?.name}</strong> por{' '}
              <strong>{selectedProduct?.points_cost} pontos</strong>?
              <br /><br />
              Após o resgate, o administrador irá aprovar e entregar seu prêmio.
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
