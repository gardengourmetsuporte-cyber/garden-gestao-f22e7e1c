import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  unit_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export function useCoupons() {
  const { activeUnit } = useUnit();
  const unitId = activeUnit?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['coupons', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('unit_id', unitId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Coupon[];
    },
    enabled: !!unitId,
  });

  const create = useMutation({
    mutationFn: async (data: Partial<Coupon>) => {
      const { error } = await supabase.from('discount_coupons').insert({
        unit_id: unitId!,
        code: (data.code || '').toUpperCase(),
        discount_type: data.discount_type || 'percentage',
        discount_value: data.discount_value || 0,
        min_order_value: data.min_order_value || 0,
        max_uses: data.max_uses,
        valid_until: data.valid_until,
        is_active: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cupom criado');
      qc.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (e: any) => toast.error(e.message?.includes('unique') ? 'Código já existe' : 'Erro ao criar cupom'),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Coupon> & { id: string }) => {
      const { error } = await supabase.from('discount_coupons').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cupom atualizado');
      qc.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discount_coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cupom removido');
      qc.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  const validate = async (code: string, orderTotal: number): Promise<{ valid: boolean; discount: number; message: string }> => {
    const { data, error } = await supabase
      .from('discount_coupons')
      .select('*')
      .eq('unit_id', unitId!)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) return { valid: false, discount: 0, message: 'Cupom inválido' };

    const coupon = data as unknown as Coupon;
    const now = new Date();
    if (coupon.valid_until && new Date(coupon.valid_until) < now) return { valid: false, discount: 0, message: 'Cupom expirado' };
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) return { valid: false, discount: 0, message: 'Cupom esgotado' };
    if (orderTotal < Number(coupon.min_order_value || 0)) return { valid: false, discount: 0, message: `Pedido mínimo: R$ ${coupon.min_order_value}` };

    const discount = coupon.discount_type === 'percentage'
      ? (orderTotal * coupon.discount_value) / 100
      : Math.min(coupon.discount_value, orderTotal);

    return { valid: true, discount, message: `Desconto de ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : 'R$ ' + coupon.discount_value}` };
  };

  return { coupons: query.data || [], isLoading: query.isLoading, create, update, remove, validate };
}
