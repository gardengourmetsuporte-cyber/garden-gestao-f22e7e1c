import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, MapPin, User, Package, DollarSign } from 'lucide-react';
import type { OcrDeliveryResult } from '@/hooks/useDeliveries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: OcrDeliveryResult, file: File) => void;
  processImage: (file: File) => Promise<OcrDeliveryResult>;
  isProcessing: boolean;
}

export function DeliveryOcrSheet({ open, onOpenChange, onConfirm, processImage, isProcessing }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<OcrDeliveryResult | null>(null);
  const [step, setStep] = useState<'photo' | 'review'>('photo');
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setOcrData(null);
    setStep('photo');
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    try {
      const result = await processImage(f);
      setOcrData(result);
      setStep('review');
    } catch (err: any) {
      setOcrData(null);
    }
  };

  const handleConfirm = () => {
    if (ocrData && file) {
      onConfirm(ocrData, file);
      reset();
      onOpenChange(false);
    }
  };

  const updateField = (key: keyof OcrDeliveryResult, value: string | number) => {
    if (ocrData) setOcrData({ ...ocrData, [key]: value });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{step === 'photo' ? 'Nova Entrega' : 'Confirmar Dados'}</SheetTitle>
        </SheetHeader>

        {step === 'photo' && (
          <div className="flex flex-col items-center gap-4 py-8">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full max-w-xs rounded-xl object-cover aspect-[3/4]" />
            ) : (
              <div className="w-full max-w-xs aspect-[3/4] rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 bg-muted/20">
                <Camera className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tire foto ou selecione imagem do pedido</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">IA analisando imagem...</span>
              </div>
            )}

            <div className="flex gap-3 w-full max-w-xs">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => cameraRef.current?.click()}
                disabled={isProcessing}
              >
                <Camera className="w-4 h-4 mr-2" /> Câmera
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => inputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" /> Galeria
              </Button>
            </div>

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {step === 'review' && ocrData && (
          <div className="flex flex-col gap-4 py-4">
            {preview && (
              <img src={preview} alt="Pedido" className="w-full max-h-40 rounded-xl object-cover" />
            )}

            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-1.5 mb-1"><User className="w-3.5 h-3.5" /> Cliente</Label>
                <Input
                  value={ocrData.customer_name}
                  onChange={(e) => updateField('customer_name', e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5" /> Endereço</Label>
                <Textarea
                  value={ocrData.full_address}
                  onChange={(e) => updateField('full_address', e.target.value)}
                  placeholder="Endereço completo"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1">Bairro</Label>
                  <Input
                    value={ocrData.neighborhood}
                    onChange={(e) => updateField('neighborhood', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label className="mb-1">Cidade</Label>
                  <Input
                    value={ocrData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">Ponto de referência</Label>
                <Input
                  value={ocrData.reference}
                  onChange={(e) => updateField('reference', e.target.value)}
                  placeholder="Próximo a..."
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1"><Package className="w-3.5 h-3.5" /> Itens</Label>
                <Textarea
                  value={ocrData.items_summary}
                  onChange={(e) => updateField('items_summary', e.target.value)}
                  placeholder="Resumo dos itens"
                  rows={2}
                />
              </div>

              <div>
                <Label className="flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5" /> Valor</Label>
                <Input
                  type="number"
                  value={ocrData.total}
                  onChange={(e) => updateField('total', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Refazer
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                Confirmar Entrega
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
