import { useState, useEffect, useCallback } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export type PaymentBillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

interface PaymentData {
  payment_id: string;
  status: string;
  invoice_url: string | null;
  bank_slip_url: string | null;
  pix_qr_code: string | null; // base64 encoded image
  pix_copia_e_cola: string | null;
  due_date: string;
}

interface Props {
  orderId: string;
  orderNumber: string;
  total: number;
  unitId: string;
  billingType: PaymentBillingType;
  onPaymentConfirmed: () => void;
  onCancel: () => void;
}

export function OnlinePaymentSheet({ orderId, orderNumber, total, unitId, billingType, onPaymentConfirmed, onCancel }: Props) {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min for PIX

  // Create payment on mount
  useEffect(() => {
    const createPayment = async () => {
      try {
        setLoading(true);
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const res = await fetch(
          `${supabaseUrl}/functions/v1/asaas-payment?action=create-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: apiKey },
            body: JSON.stringify({ order_id: orderId, billing_type: billingType }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar pagamento');
        setPaymentData(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao criar pagamento');
      } finally {
        setLoading(false);
      }
    };
    createPayment();
  }, [orderId, billingType]);

  // Poll for status
  useEffect(() => {
    if (!paymentData || paymentStatus === 'confirmed') return;
    const interval = setInterval(async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/asaas-payment?action=check-status`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: apiKey },
            body: JSON.stringify({ order_id: orderId }),
          }
        );
        const data = await res.json();
        if (data.payment_status) {
          setPaymentStatus(data.payment_status);
          if (data.payment_status === 'confirmed') {
            toast.success('Pagamento confirmado! ✅');
            onPaymentConfirmed();
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [paymentData, paymentStatus, orderId, onPaymentConfirmed]);

  // Timer for PIX
  useEffect(() => {
    if (billingType !== 'PIX' || paymentStatus === 'confirmed') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [billingType, paymentStatus]);

  const copyPixCode = useCallback(() => {
    if (paymentData?.pix_copia_e_cola) {
      navigator.clipboard.writeText(paymentData.pix_copia_e_cola);
      setCopied(true);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  }, [paymentData]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Confirmed state
  if (paymentStatus === 'confirmed') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/12 flex items-center justify-center">
            <AppIcon name="CheckCircle2" size={40} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Pagamento confirmado!</h2>
            <p className="text-sm text-muted-foreground mt-2">Pedido #{orderNumber}</p>
          </div>
          <Button className="w-full h-12 rounded-xl" onClick={onPaymentConfirmed}>
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border/30">
        <button onClick={onCancel} className="w-9 h-9 rounded-xl flex items-center justify-center">
          <AppIcon name="X" size={20} className="text-foreground" />
        </button>
        <h2 className="text-sm font-bold text-foreground">Pagamento Online</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AppIcon name="Loader2" size={32} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Gerando pagamento...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AppIcon name="AlertTriangle" size={28} className="text-destructive" />
            </div>
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" onClick={onCancel} className="rounded-xl">
              Voltar
            </Button>
          </div>
        )}

        {!loading && !error && paymentData && (
          <div className="space-y-6 max-w-sm mx-auto">
            {/* Order summary */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Pedido #{orderNumber}</p>
              <p className="text-3xl font-black text-foreground mt-1">{formatCurrency(total)}</p>
            </div>

            {/* PIX payment */}
            {billingType === 'PIX' && (
              <div className="space-y-4">
                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <AppIcon name="Clock" size={14} className="text-amber-500" />
                  <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-destructive' : 'text-foreground'}`}>
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-muted-foreground">para pagar</span>
                </div>

                {/* QR Code */}
                {paymentData.pix_qr_code && (
                  <div className="bg-white rounded-2xl p-6 flex items-center justify-center mx-auto w-fit">
                    <img
                      src={`data:image/png;base64,${paymentData.pix_qr_code}`}
                      alt="QR Code Pix"
                      className="w-52 h-52"
                    />
                  </div>
                )}

                {/* Copy code */}
                {paymentData.pix_copia_e_cola && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Ou copie o código Pix:</p>
                    <button
                      onClick={copyPixCode}
                      className="w-full flex items-center gap-2 p-3 rounded-xl border border-border/40 bg-card active:scale-[0.98] transition-transform"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {paymentData.pix_copia_e_cola.slice(0, 40)}...
                        </p>
                      </div>
                      <AppIcon
                        name={copied ? 'Check' : 'Copy'}
                        size={16}
                        className={copied ? 'text-emerald-500' : 'text-primary'}
                      />
                    </button>
                  </div>
                )}

                {/* Instructions */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <p className="text-xs font-bold text-foreground">Como pagar:</p>
                  <div className="space-y-1.5">
                    {['Abra o app do seu banco', 'Escolha pagar com Pix', 'Escaneie o QR Code ou cole o código', 'Confirme o pagamento'].map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Credit card / Boleto — redirect to invoice URL */}
            {(billingType === 'CREDIT_CARD' || billingType === 'BOLETO') && paymentData.invoice_url && (
              <div className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <AppIcon
                      name={billingType === 'CREDIT_CARD' ? 'CreditCard' : 'FileText'}
                      size={24}
                      className="text-primary"
                    />
                  </div>
                  <p className="text-sm text-foreground font-semibold">
                    {billingType === 'CREDIT_CARD' ? 'Pagar com Cartão' : 'Pagar com Boleto'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clique no botão abaixo para abrir a página de pagamento segura
                  </p>
                </div>
                <a
                  href={paymentData.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
                >
                  <AppIcon name="ExternalLink" size={16} />
                  Abrir página de pagamento
                </a>
              </div>
            )}

            {/* Waiting indicator */}
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <AppIcon name="Loader2" size={16} className="text-amber-500 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Aguardando pagamento</p>
                <p className="text-[10px] text-muted-foreground">A confirmação é automática</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border/20 p-4 bg-card">
        <Button variant="outline" className="w-full h-12 rounded-xl" onClick={onCancel}>
          Cancelar pagamento
        </Button>
      </div>
    </div>
  );
}
