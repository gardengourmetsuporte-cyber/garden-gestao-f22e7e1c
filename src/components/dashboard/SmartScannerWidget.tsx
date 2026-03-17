import { useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { SmartScannerSheet } from './SmartScannerSheet';
import { useSmartScanner } from '@/hooks/useSmartScanner';
import scannerHero from '@/assets/scanner-hero.png';
import { takeNativePhoto } from '@/lib/native-camera';
import { InBrowserCamera } from '@/components/ui/InBrowserCamera';

export function SmartScannerWidget() {
  const galleryRef = useRef<HTMLInputElement>(null);
  const scanner = useSmartScanner();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

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

  const handleCameraClick = async () => {
    const nativeFile = await takeNativePhoto('camera');
    if (nativeFile) { setSheetOpen(true); scanner.scanDocument(nativeFile); return; }
    // On web: use in-browser camera
    setCameraOpen(true);
  };

  const handleGalleryClick = async () => {
    const nativeFile = await takeNativePhoto('gallery');
    if (nativeFile) { setSheetOpen(true); scanner.scanDocument(nativeFile); return; }
    galleryRef.current?.click();
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl scanner-card-glow" style={{ minHeight: 70 }}>
        <img src={scannerHero} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent scanner-shimmer pointer-events-none" />

        <div className="relative flex items-center justify-between p-3 h-full" style={{ minHeight: 70 }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary drop-shadow-sm">IA Scanner</span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            <p className="text-base font-bold text-white leading-tight drop-shadow-md">Scanner Inteligente</p>
            <p className="text-xs text-white/70 mt-0.5">Foto → lançamento automático</p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCameraClick}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 active:scale-90 transition-all backdrop-blur-md"
              title="Câmera"
            >
              <AppIcon name="Camera" size={18} className="text-white" />
            </button>
            <button
              onClick={handleGalleryClick}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 active:scale-90 transition-all backdrop-blur-md"
              title="Galeria"
            >
              <AppIcon name="Image" size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <SmartScannerSheet
        open={sheetOpen}
        onOpenChange={(open) => { if (!open) handleClose(); }}
        scanner={scanner}
      />

      <InBrowserCamera
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          setCameraOpen(false);
          setSheetOpen(true);
          scanner.scanDocument(file);
        }}
      />
    </>
  );
}
