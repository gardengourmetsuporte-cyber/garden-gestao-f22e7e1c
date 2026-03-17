import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, Loader2, User, MapPin, Hash, Package, DollarSign, CreditCard, CheckCircle2 } from 'lucide-react';
import type { IfoodScanResult, IfoodOrderItem } from '@/hooks/useIfoodScanner';
import { formatCurrency } from '@/lib/format';
import { takeNativePhoto } from '@/lib/native-camera';
import { InBrowserCamera } from '@/components/ui/InBrowserCamera';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: 'idle' | 'scanning' | 'review' | 'saving' | 'done' | 'error';
  result: IfoodScanResult | null;
  error: string | null;
  onScan: (file: File) => void;
  onConfirm: (data: IfoodScanResult) => void;
  onReset: () => void;
  onUpdateResult: (data: IfoodScanResult) => void;
}

export function IfoodScannerSheet({ open, onOpenChange, state, result, error, onScan, onConfirm, onReset, onUpdateResult }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleFile = (f: File) => {
    setPreview(URL.createObjectURL(f));
    onScan(f);
  };

  const handleClose = () => {
    setPreview(null);
    onReset();
    onOpenChange(false);
  };

  const updateField = (key: keyof IfoodScanResult, value: any) => {
    if (result) onUpdateResult({ ...result, [key]: value });
  };

  const updateItem = (index: number, key: keyof IfoodOrderItem, value: any) => {
    if (!result) return;
    const items = [...result.items];
    items[index] = { ...items[index], [key]: value };
    onUpdateResult({ ...result, items });
  };

  const removeItem = (index: number) => {
    if (!result) return;
    const items = result.items.filter((_, i) => i !== index);
    onUpdateResult({ ...result, items });
  };

  const showCapture = state === 'idle' || state === 'error';
  const showScanning = state === 'scanning';
  const showReview = state === 'review';
  const showSaving = state === 'saving';
  const showDone = state === 'done';

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-primary">📱</span>
            {showCapture && 'Scanner iFood'}
            {showScanning && 'Analisando pedido...'}
            {showReview && 'Confirmar Pedido'}
            {showSaving && 'Importando...'}
            {showDone && 'Pedido Importado!'}
          </SheetTitle>
        </SheetHeader>

        {/* Capture */}
        {showCapture && (
          <div className="flex flex-col items-center gap-4 py-8">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full max-w-xs rounded-xl object-cover max-h-60" />
            ) : (
              <div className="w-full max-w-xs aspect-video rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 bg-muted/20">
                <Package className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Tire uma foto ou screenshot da tela de pedido do iFood
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center px-4">{error}</p>
            )}

            <div className="flex gap-3 w-full max-w-xs">
              <Button variant="outline" className="flex-1" onClick={async () => {
                const nativeFile = await takeNativePhoto('camera');
                if (nativeFile) { handleFile(nativeFile); return; }
                setCameraOpen(true);
              }}>
                <Camera className="w-4 h-4 mr-2" /> Câmera
              </Button>
              <Button variant="outline" className="flex-1" onClick={async () => {
                const nativeFile = await takeNativePhoto('gallery');
                if (nativeFile) { handleFile(nativeFile); return; }
                galleryRef.current?.click();
              }}>
                <Upload className="w-4 h-4 mr-2" /> Galeria
              </Button>
            </div>

            <input ref={galleryRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />
          </div>
        )}

        {/* Scanning */}
        {showScanning && (
          <div className="flex flex-col items-center gap-4 py-12">
            {preview && <img src={preview} alt="Preview" className="w-full max-w-xs rounded-xl object-cover max-h-40 opacity-60" />}
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">IA analisando pedido iFood...</p>
          </div>
        )}

        {/* Review */}
        {showReview && result && (
          <div className="flex flex-col gap-4 py-4">
            {/* Order ID */}
            <div className="p-3 rounded-xl border-2 border-primary/30 bg-primary/5">
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Hash className="w-3.5 h-3.5" /> ID do Pedido
              </Label>
              <Input value={result.platform_display_id} onChange={(e) => updateField('platform_display_id', e.target.value)}
                placeholder="Ex: A1B2" className="font-bold text-lg" />
            </div>

            {/* Customer */}
            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-1.5 mb-1"><User className="w-3.5 h-3.5" /> Cliente</Label>
                <Input value={result.customer_name} onChange={(e) => updateField('customer_name', e.target.value)} placeholder="Nome" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5" /> Endereço</Label>
                <Input value={result.customer_address} onChange={(e) => updateField('customer_address', e.target.value)} placeholder="Endereço" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 mb-1"><CreditCard className="w-3.5 h-3.5" /> Pagamento</Label>
                <Input value={result.payment_method} onChange={(e) => updateField('payment_method', e.target.value)} placeholder="Forma de pagamento" />
              </div>
            </div>

            {/* Items */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2"><Package className="w-3.5 h-3.5" /> Itens ({result.items.length})</Label>
              <div className="space-y-2">
                {result.items.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Input value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)}
                          className="font-medium text-sm h-8 mb-1" />
                        <div className="flex gap-2">
                          <div className="w-16">
                            <Label className="text-[10px] text-muted-foreground">Qtd</Label>
                            <Input type="number" value={item.quantity} className="h-7 text-xs"
                              onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                          </div>
                          <div className="w-24">
                            <Label className="text-[10px] text-muted-foreground">Preço unit.</Label>
                            <Input type="number" step="0.01" value={item.unit_price} className="h-7 text-xs"
                              onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)} />
                          </div>
                          <div className="w-24">
                            <Label className="text-[10px] text-muted-foreground">Total</Label>
                            <Input type="number" step="0.01" value={item.total_price} className="h-7 text-xs"
                              onChange={(e) => updateItem(i, 'total_price', parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-muted-foreground mt-1 italic">📝 {item.notes}</p>
                        )}
                        {item.options?.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.options.map((opt, oi) => (
                              <p key={oi} className="text-[11px] text-muted-foreground">+ {opt.name}{opt.price ? ` (${formatCurrency(opt.price)})` : ''}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive/60"
                        onClick={() => removeItem(i)}>×</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-3 rounded-xl bg-secondary/20 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <Input type="number" step="0.01" value={result.subtotal} className="w-28 h-7 text-xs text-right"
                  onChange={(e) => updateField('subtotal', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <Input type="number" step="0.01" value={result.delivery_fee} className="w-28 h-7 text-xs text-right"
                  onChange={(e) => updateField('delivery_fee', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <Input type="number" step="0.01" value={result.discount} className="w-28 h-7 text-xs text-right"
                  onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/30">
                <span>Total</span>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <Input type="number" step="0.01" value={result.total} className="w-28 h-8 text-sm font-bold text-right"
                    onChange={(e) => updateField('total', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setPreview(null); onReset(); }}>
                Refazer
              </Button>
              <Button className="flex-1" onClick={() => onConfirm(result)}
                disabled={!result.customer_name.trim() || result.items.length === 0}>
                Importar Pedido
              </Button>
            </div>
          </div>
        )}

        {/* Saving */}
        {showSaving && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importando pedido...</p>
          </div>
        )}

        {/* Done */}
        {showDone && (
          <div className="flex flex-col items-center gap-4 py-12">
            <CheckCircle2 className="w-16 h-16 text-primary" />
            <p className="text-lg font-bold">Pedido importado!</p>
            <p className="text-sm text-muted-foreground">O pedido aparecerá na aba iFood do painel de pedidos.</p>
            <Button onClick={handleClose} className="mt-4">Fechar</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>

    <InBrowserCamera
      open={cameraOpen}
      onClose={() => setCameraOpen(false)}
      onCapture={(capturedFile) => {
        setCameraOpen(false);
        handleFile(capturedFile);
      }}
    />
    </>
  );
}
