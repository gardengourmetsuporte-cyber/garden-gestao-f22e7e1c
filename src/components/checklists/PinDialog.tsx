import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pin: string) => Promise<boolean>;
  title?: string;
  subtitle?: string;
}

export function PinDialog({ open, onOpenChange, onSubmit, title = 'Digite seu PIN', subtitle = 'PIN de 4 dígitos' }: PinDialogProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setPin(''); setError(false); }
  }, [open]);

  // Auto-submit when 4 digits reached
  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  const handleSubmit = async () => {
    if (pin.length !== 4 || loading) return;
    setLoading(true);
    setError(false);
    try {
      const ok = await onSubmit(pin);
      if (!ok) {
        setError(true);
        setPin('');
        try { navigator.vibrate?.(200); } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (digit: string) => {
    if (pin.length >= 4) return;
    setError(false);
    setPin(prev => prev + digit);
    try { navigator.vibrate?.(10); } catch {}
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="text-center">
          <SheetTitle className="flex items-center justify-center gap-2">
            <AppIcon name="Lock" size={20} className="text-primary" />
            {title}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </SheetHeader>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 my-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full transition-all duration-200",
                i < pin.length
                  ? error ? "bg-destructive scale-110" : "bg-primary scale-110"
                  : "bg-muted border-2 border-border"
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-destructive font-medium mb-4 animate-fade-in">
            PIN inválido. Tente novamente.
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map((key) => {
            if (key === '') return <div key="empty" />;
            if (key === 'back') {
              return (
                <button
                  key="back"
                  onClick={handleBackspace}
                  className="h-14 rounded-2xl flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
                >
                  <AppIcon name="Delete" className="w-6 h-6 text-muted-foreground" />
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleKey(key)}
                disabled={loading}
                className="h-14 rounded-2xl bg-secondary/50 hover:bg-secondary text-xl font-bold text-foreground transition-all active:scale-95 active:bg-primary/20"
              >
                {key}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex justify-center mt-4">
            <AppIcon name="Loader2" className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
