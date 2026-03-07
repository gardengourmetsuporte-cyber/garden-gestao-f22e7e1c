import { useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { SmartScannerSheet } from './SmartScannerSheet';
import { useSmartScanner } from '@/hooks/useSmartScanner';
import { cn } from '@/lib/utils';

export function SmartScannerWidget() {
  const inputRef = useRef<HTMLInputElement>(null);
  const scanner = useSmartScanner();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSheetOpen(true);
    scanner.scanDocument(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleClose = () => {
    setSheetOpen(false);
    scanner.reset();
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300',
          'bg-gradient-to-r from-primary/15 via-primary/10 to-transparent',
          'border border-primary/20 hover:border-primary/40',
          'hover:shadow-lg hover:shadow-primary/10',
          'active:scale-[0.98] group'
        )}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors shrink-0">
          <AppIcon name="ScanLine" size={24} className="text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">Scanner Inteligente</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Foto → lançamento automático
          </p>
        </div>
        <AppIcon name="Camera" size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
