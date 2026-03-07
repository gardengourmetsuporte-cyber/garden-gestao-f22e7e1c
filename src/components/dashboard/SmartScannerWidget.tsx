import { useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { SmartScannerSheet } from './SmartScannerSheet';
import { useSmartScanner } from '@/hooks/useSmartScanner';
import scannerHero from '@/assets/scanner-hero.png';

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
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[hsl(225_25%_6%)] scanner-card-glow">
        {/* Animated glow orbs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ background: 'hsl(var(--neon-amber) / 0.15)' }} />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ background: 'hsl(var(--neon-purple) / 0.12)', animationDelay: '1s' }} />

        <div className="relative flex items-center gap-3 p-3">
          {/* Hero image */}
          <div className="relative w-24 h-20 shrink-0 rounded-xl overflow-hidden">
            <img
              src={scannerHero}
              alt="Scanner IA"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Subtle shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent scanner-shimmer" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">IA Scanner</span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            <p className="text-sm font-bold text-foreground leading-tight">
              Scanner Inteligente
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Foto → lançamento automático
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/15 hover:border-primary/30 active:scale-90 transition-all backdrop-blur-sm"
              title="Câmera"
            >
              <AppIcon name="Camera" size={17} className="text-primary" />
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/15 hover:border-primary/30 active:scale-90 transition-all backdrop-blur-sm"
              title="Galeria"
            >
              <AppIcon name="Image" size={17} className="text-primary" />
            </button>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      {/* Camera input */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      {/* Gallery input */}
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <SmartScannerSheet
        open={sheetOpen}
        onOpenChange={(open) => { if (!open) handleClose(); }}
        scanner={scanner}
      />
    </>
  );
}
