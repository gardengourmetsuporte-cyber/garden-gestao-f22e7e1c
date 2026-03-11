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
  const containerRef = useRef<HTMLDivElement>(null);

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
        () => {} // ignore scan failures
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <div className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <AppIcon name="QrCode" size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Escanear Comanda</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {manualMode ? 'Digite o número da comanda' : 'Aponte a câmera para o QR code da comanda'}
          </p>
        </div>

        {!manualMode ? (
          <div className="px-5 pb-3">
            <div
              id="comanda-scanner-region"
              ref={containerRef}
              className="rounded-2xl overflow-hidden bg-black aspect-square w-full"
            />
          </div>
        ) : (
          <div className="px-5 pb-3 space-y-3">
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="Nº da comanda (1-100)"
              value={manualNumber}
              onChange={e => { setManualNumber(e.target.value); setError(null); }}
              className="h-14 text-center text-2xl font-bold rounded-xl"
              inputMode="numeric"
              autoFocus
            />
            <Button onClick={handleManualSubmit} className="w-full h-12 rounded-xl font-bold">
              <AppIcon name="Check" size={18} className="mr-2" />
              Confirmar
            </Button>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive font-medium text-center px-5 pb-2">{error}</p>
        )}

        <div className="px-5 pb-5 flex gap-2">
          {!manualMode && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => { scannerRef.current?.stop().catch(() => {}); setManualMode(true); setError(null); }}
            >
              <AppIcon name="Keyboard" size={16} className="mr-1.5" />
              Digitar
            </Button>
          )}
          {manualMode && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => { setManualMode(false); setError(null); }}
            >
              <AppIcon name="Camera" size={16} className="mr-1.5" />
              Câmera
            </Button>
          )}
          <Button variant="ghost" className="flex-1 rounded-xl" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
