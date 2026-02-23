import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SlotMachine } from '@/components/gamification/SlotMachine';
import { PrizeResult } from '@/components/gamification/PrizeResult';
import { useGamification, type GamificationPrize } from '@/hooks/useGamification';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AppIcon } from '@/components/ui/app-icon';

type Phase = 'input' | 'wheel' | 'result';

export default function GamificationPlay() {
  const { unitId } = useParams<{ unitId: string }>();
  const { prizes, prizesLoading, settings, isEnabled, checkAlreadyPlayed, checkDailyCostExceeded, recordPlay } = useGamification(unitId);

  const [phase, setPhase] = useState<Phase>('input');
  const [orderId, setOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [wonPrize, setWonPrize] = useState<GamificationPrize | null>(null);
  const [validating, setValidating] = useState(false);

  const handleStart = async () => {
    if (!orderId.trim()) {
      toast.error('Digite o número do pedido');
      return;
    }
    setValidating(true);
    try {
      if (!isEnabled) {
        toast.error('O jogo está desativado no momento');
        return;
      }
      const already = await checkAlreadyPlayed(orderId.trim());
      if (already) {
        toast.error('Este pedido já participou da roleta!');
        return;
      }
      const costExceeded = await checkDailyCostExceeded();
      if (costExceeded) {
        toast.error('Limite diário atingido. Tente novamente amanhã!');
        return;
      }
      setPhase('wheel');
    } catch {
      toast.error('Erro ao validar. Tente novamente.');
    } finally {
      setValidating(false);
    }
  };

  const handleResult = async (prize: GamificationPrize) => {
    setWonPrize(prize);
    try {
      await recordPlay.mutateAsync({
        order_id: orderId.trim(),
        customer_name: customerName.trim() || undefined,
        prize,
      });
    } catch {
      // silently fail recording — prize is shown regardless
    }
    setPhase('result');
  };

  const handleFinish = () => {
    setPhase('input');
    setOrderId('');
    setCustomerName('');
    setWonPrize(null);
  };

  if (prizesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppIcon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <img
          src="/lovable-uploads/de20fd02-0c1c-4431-a4da-9c4611d2eb0e.jpg"
          alt="Atlas"
          className="w-16 h-16 rounded-xl mx-auto mb-3 object-contain border border-border/20"
        />
        <h1 className="text-2xl font-bold text-foreground">Atlas</h1>
        {phase === 'input' && (
          <p className="text-muted-foreground mt-1">
            Enquanto seu pedido fica pronto, gire a roleta 🎉
          </p>
        )}
      </div>

      {/* INPUT Phase */}
      {phase === 'input' && (
        <div className="w-full max-w-sm space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Número do pedido *</label>
            <Input
              placeholder="Ex: 42"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="text-center text-lg h-12"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Seu nome (opcional)</label>
            <Input
              placeholder="Como quer ser chamado?"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="text-center h-12"
            />
          </div>
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={handleStart}
            disabled={validating || !isEnabled}
          >
            {validating ? (
              <AppIcon name="Loader2" size={20} className="animate-spin mr-2" />
            ) : (
              <AppIcon name="Dices" size={20} className="mr-2" />
            )}
            GIRAR ROLETA
          </Button>
          {!isEnabled && settings !== undefined && (
            <p className="text-sm text-destructive text-center">Jogo desativado no momento</p>
          )}
        </div>
      )}

      {/* WHEEL Phase */}
      {phase === 'wheel' && (
        <div className="flex flex-col items-center gap-4">
          <SlotMachine prizes={prizes} onResult={handleResult} />
        </div>
      )}

      {/* RESULT Phase */}
      {phase === 'result' && wonPrize && (
        <PrizeResult prize={wonPrize} onFinish={handleFinish} />
      )}
    </div>
  );
}
