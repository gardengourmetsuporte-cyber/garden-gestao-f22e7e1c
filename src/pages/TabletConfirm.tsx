import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';

type ConfirmStep = 'show_qr' | 'scanning' | 'success' | 'error';

export default function TabletConfirm() {
  const { unitId, orderId } = useParams<{ unitId: string; orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [step, setStep] = useState<ConfirmStep>('show_qr');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [confirming, setConfirming] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Timer countdown
  useEffect(() => {
    if (step !== 'show_qr') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStep('error');
          setError('QR Code expirado. Volte ao cardápio e refaça o pedido.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const qrContent = JSON.stringify({ order_id: orderId, token });

  const startScanning = async () => {
    setStep('scanning');
    try {
      const html5Qr = new Html5Qrcode('qr-reader');
      scannerRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleQRResult(decodedText);
          html5Qr.stop().catch(() => {});
        },
        () => {}
      );
    } catch (err: any) {
      setError('Não foi possível acessar a câmera: ' + err.message);
      setStep('error');
    }
  };

  const handleQRResult = async (decodedText: string) => {
    setConfirming(true);
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.order_id !== orderId || parsed.token !== token) {
        throw new Error('QR Code inválido para este pedido');
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tablet-order?action=confirm-qr`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ order_id: orderId, token }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na confirmação');

      setStep('success');
    } catch (err: any) {
      setError(err.message);
      setStep('error');
    } finally {
      setConfirming(false);
    }
  };

  // Direct confirm button (alternative to scanning)
  const handleDirectConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tablet-order?action=confirm-qr`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ order_id: orderId, token }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      setStep('success');
    } catch (err: any) {
      setError(err.message);
      setStep('error');
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {step === 'show_qr' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-6 animate-fade-in">
          <div className="space-y-2">
            <AppIcon name="QrCode" className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Confirme seu Pedido</h1>
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code abaixo ou clique em "Confirmar" para enviar o pedido à cozinha
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-2xl inline-block mx-auto">
            <QRCodeSVG value={qrContent} size={200} level="H" />
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <AppIcon name="Clock" className="w-4 h-4" />
            <span className={`text-sm font-mono font-bold ${timeLeft <= 30 ? 'text-destructive' : ''}`}>
              Expira em {formatTime(timeLeft)}
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={startScanning}
              variant="outline"
              className="w-full h-12 rounded-xl"
            >
              <AppIcon name="Camera" className="w-5 h-5 mr-2" />
              Escanear QR Code
            </Button>
            <Button
              onClick={handleDirectConfirm}
              className="w-full h-14 text-lg font-bold rounded-xl"
              disabled={confirming}
            >
              <AppIcon name="CheckCircle2" className="w-5 h-5 mr-2" />
              {confirming ? 'Confirmando...' : 'Confirmar Pedido'}
            </Button>
          </div>
        </div>
      )}

      {step === 'scanning' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          <h2 className="text-lg font-bold text-foreground">Escaneando QR Code...</h2>
          <div id="qr-reader" className="rounded-2xl overflow-hidden" />
          <Button variant="ghost" onClick={() => {
            scannerRef.current?.stop().catch(() => {});
            setStep('show_qr');
          }}>
            Cancelar
          </Button>
        </div>
      )}

      {step === 'success' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-6 animate-fade-in">
          <AppIcon name="PartyPopper" className="w-20 h-20 mx-auto text-success" />
          <h1 className="text-2xl font-bold text-foreground">Pedido Confirmado!</h1>
          <p className="text-muted-foreground">
            Seu pedido foi enviado para a cozinha. Aguarde na mesa {new URLSearchParams(window.location.search).get('mesa') || ''}.
          </p>
          <Button
            onClick={() => navigate(`/tablet/${unitId}/menu?mesa=${new URLSearchParams(window.location.search).get('mesa') || '1'}`)}
            className="w-full h-12 rounded-xl"
          >
            Fazer Novo Pedido
          </Button>
        </div>
      )}

      {step === 'error' && (
        <div className="w-full max-w-sm mx-auto text-center space-y-6 animate-fade-in">
          <AppIcon name="AlertCircle" className="w-16 h-16 mx-auto text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Erro</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => { setError(''); setStep('show_qr'); setTimeLeft(120); }}
              className="w-full h-12 rounded-xl"
            >
              <AppIcon name="RefreshCw" className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate(`/tablet/${unitId}/menu?mesa=${new URLSearchParams(window.location.search).get('mesa') || '1'}`)}
            >
              Voltar ao Cardápio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
