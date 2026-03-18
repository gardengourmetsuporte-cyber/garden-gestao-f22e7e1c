import { useEffect } from 'react';
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

export function FreelancerSheet({ open, onOpenChange, freelancer, onSave }: Props) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', sector: 'cozinha', notes: '', is_active: true },
  });

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

  const onSubmit = async (data: FormData) => {
    await onSave({ ...data, id: freelancer?.id });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{freelancer ? 'Editar Freelancer' : 'Novo Freelancer'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : freelancer ? 'Salvar' : 'Cadastrar'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
