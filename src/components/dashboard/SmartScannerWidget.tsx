import { useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { SmartScannerSheet } from './SmartScannerSheet';
import { useSmartScanner } from '@/hooks/useSmartScanner';
import { cn } from '@/lib/utils';

export function SmartScannerWidget() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const scanner = useSmartScanner();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSheetOpen(true);
    scanner.scanDocument(file);
    e.target.value = '';
  };

  const handleClose = () => {
    setSheetOpen(false);
    scanner.reset();
  };

  return (
    <>
      <div className={cn(
        'w-full flex items-center gap-3 p-4 rounded-2xl',
        'bg-gradient-to-r from-primary/15 via-primary/10 to-transparent',
        'border border-primary/20',
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 shrink-0">
          <AppIcon name="ScanLine" size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Scanner Inteligente</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Foto → lançamento automático
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 active:scale-95 transition-all"
            title="Câmera"
          >
            <AppIcon name="Camera" size={18} className="text-primary" />
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary/20 active:scale-95 transition-all"
            title="Galeria / Arquivos"
          >
            <AppIcon name="Image" size={18} className="text-primary" />
          </button>
        </div>
      </div>

      {/* Camera input (with capture) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Gallery/file input (no capture = shows gallery + file picker) */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <SmartScannerSheet
        open={sheetOpen}
        onOpenChange={(open) => { if (!open) handleClose(); }}
        scanner={scanner}
      />
    </>
  );
}
