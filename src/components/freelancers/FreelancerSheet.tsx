import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SECTORS, type Freelancer } from '@/hooks/useFreelancers';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { InBrowserCamera } from '@/components/ui/InBrowserCamera';
import { takeNativePhoto } from '@/lib/native-camera';
import { isNative, platform } from '@/lib/native';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(100),
  phone: z.string().trim().min(8, 'Telefone inválido').max(20),
  sector: z.string().min(1),
  notes: z.string().max(500).optional(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freelancer?: Freelancer | null;
  onSave: (data: FormData & { id?: string }) => Promise<void>;
}

async function fileToBase64(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, type: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function FreelancerSheet({ open, onOpenChange, freelancer, onSave }: Props) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', sector: 'cozinha', notes: '', is_active: true },
  });

  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (freelancer) {
        reset({
          name: freelancer.name,
          phone: freelancer.phone,
          sector: freelancer.sector,
          notes: freelancer.notes || '',
          is_active: freelancer.is_active,
        });
      } else {
        reset({ name: '', phone: '', sector: 'cozinha', notes: '', is_active: true });
      }
    }
  }, [open, freelancer, reset]);

  const processImage = useCallback(async (file: File) => {
    setScanning(true);
    try {
      const { base64, type } = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('freelancer-ocr', {
        body: { image_base64: base64, image_type: type },
      });

      if (error) throw error;
      if (!data?.success || !data?.data) throw new Error(data?.error || 'Falha na extração');

      const extracted = data.data;
      if (extracted.name) setValue('name', extracted.name);
      if (extracted.phone) setValue('phone', extracted.phone);
      if (extracted.sector && ['cozinha', 'salao', 'entregador', 'bar', 'outros'].includes(extracted.sector)) {
        setValue('sector', extracted.sector);
      }
      if (extracted.notes) setValue('notes', extracted.notes);

      toast.success('Dados extraídos! Revise antes de salvar.');
    } catch (err: any) {
      console.error('OCR error:', err);
      toast.error(err?.message || 'Erro ao processar imagem');
    } finally {
      setScanning(false);
    }
  }, [setValue]);

  const handleCameraCapture = useCallback((file: File) => {
    processImage(file);
  }, [processImage]);

  const handleOpenCamera = useCallback(async () => {
    if (isNative && platform === 'ios') {
      const file = await takeNativePhoto('camera');
      if (file) processImage(file);
      return;
    }
    setCameraOpen(true);
  }, [processImage]);

  const handleOpenGallery = useCallback(async () => {
    if (isNative && platform === 'ios') {
      const file = await takeNativePhoto('gallery');
      if (file) processImage(file);
      return;
    }
    fileInputRef.current?.click();
  }, [processImage]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processImage]);

  const onSubmit = async (data: FormData) => {
    await onSave({ ...data, id: freelancer?.id });
    onOpenChange(false);
  };

  const isNew = !freelancer;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{freelancer ? 'Editar Freelancer' : 'Novo Freelancer'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {isNew && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleOpenCamera}
                  disabled={scanning}
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Câmera
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleOpenGallery}
                  disabled={scanning}
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  Galeria
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {scanning && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground bg-muted/50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando imagem com IA...
              </div>
            )}

            <div>
              <Label>Nome *</Label>
              <Input {...register('name')} placeholder="Nome completo" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label>Telefone *</Label>
              <Input {...register('phone')} placeholder="(11) 99999-9999" inputMode="tel" />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <Label>Setor *</Label>
              <Select value={watch('sector')} onValueChange={v => setValue('sector', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTORS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea {...register('notes')} placeholder="Experiência, disponibilidade..." rows={3} />
            </div>

            {freelancer && (
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch checked={watch('is_active')} onCheckedChange={v => setValue('is_active', v)} />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || scanning}>
              {isSubmitting ? 'Salvando...' : freelancer ? 'Salvar' : 'Cadastrar'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <InBrowserCamera
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
