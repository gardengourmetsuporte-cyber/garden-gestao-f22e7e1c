import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  unitId: string;
  onScan: (comandaNumber: number) => void;
  onCancel: () => void;
}

export function ComandaScanner({ unitId, onScan, onCancel }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (manualMode) return;

    const scanner = new Html5Qrcode('comanda-scanner-region');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (typeof data.comanda === 'number' && data.unit_id === unitId) {
              scanner.stop().catch(() => {});
              onScan(data.comanda);
            } else if (typeof data.comanda === 'number') {
              setError('QR code de outra unidade');
            } else {
              setError('QR code inválido');
            }
          } catch {
            setError('QR code não reconhecido');
          }
        },
        () => {}
      )
      .catch(() => {
        setError('Câmera não disponível');
        setManualMode(true);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [unitId, onScan, manualMode]);

  const handleManualSubmit = () => {
    const num = parseInt(manualNumber);
    if (!num || num < 1 || num > 100) {
      setError('Número da comanda inválido (1-100)');
      return;
    }
    onScan(num);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex">
      {/* Left: Camera / Manual */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {/* Back button */}
        <button
          onClick={onCancel}
          className="absolute top-6 left-6 z-10 flex items-center gap-2 text-white text-sm font-semibold hover:opacity-80 transition-opacity"
        >
          <AppIcon name="ArrowLeft" size={18} />
          Voltar
        </button>

        {!manualMode ? (
          <>
            {/* Scanner container */}
            <div
              id="comanda-scanner-region"
              className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
            />

            {/* Corner guides overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 relative">
                {/* Top-left */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
              </div>
            </div>

            {/* Toggle to manual */}
            <button
              onClick={() => { scannerRef.current?.stop().catch(() => {}); setManualMode(true); setError(null); }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 relative px-4 py-2 rounded-xl bg-white/10 backdrop-blur-lg text-white text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              <AppIcon name="Keyboard" size={14} className="inline mr-1.5" />
              Digitar manualmente
            </button>
          </>
        ) : (
          <div className="w-full max-w-xs space-y-4 px-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <AppIcon name="Hash" size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Número da comanda</h3>
              <p className="text-xs text-white/60 mt-1">Digite o número impresso na comanda</p>
            </div>
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="1 – 100"
              value={manualNumber}
              onChange={e => { setManualNumber(e.target.value); setError(null); }}
              className="h-16 text-center text-3xl font-bold rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30"
              inputMode="numeric"
              autoFocus
            />
            <Button onClick={handleManualSubmit} className="w-full h-12 rounded-xl font-bold">
              <AppIcon name="Check" size={18} className="mr-2" />
              Confirmar
            </Button>
            <button
              onClick={() => { setManualMode(false); setError(null); }}
              className="w-full text-center text-xs text-white/60 hover:text-white transition-colors py-2"
            >
              <AppIcon name="Camera" size={14} className="inline mr-1.5" />
              Usar câmera
            </button>
          </div>
        )}
      </div>

      {/* Right: Instructions panel — hidden on small screens */}
      <div className="hidden lg:flex w-[45%] max-w-[420px] bg-card flex-col items-center justify-center px-10 py-8 text-center shrink-0">
        <h2 className="text-xl font-bold text-foreground leading-snug">
          Posicione o QR Code com o código virado para a frente do tablet no local indicado
        </h2>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          Utilize a câmera frontal do tablet e aproxime a comanda a 10cm de distância
        </p>

        {/* QR code illustration */}
        <div className="mt-8 relative">
          <div className="w-40 h-40 relative">
            {/* Corner guides */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-foreground/30 rounded-tl-md" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-foreground/30 rounded-tr-md" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-foreground/30 rounded-bl-md" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-foreground/30 rounded-br-md" />
            {/* QR icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AppIcon name="QrCode" size={80} className="text-foreground/20" />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive font-semibold mt-6">{error}</p>
        )}
      </div>
    </div>
  );
}
