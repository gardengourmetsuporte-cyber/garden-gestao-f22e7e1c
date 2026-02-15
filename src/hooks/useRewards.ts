import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnit } from '@/contexts/UnitContext';

export interface RewardProduct {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  is_active: boolean;
  stock: number | null;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  product_id: string;
  points_spent: number;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: RewardProduct;
  profile?: { full_name: string };
}

async function fetchProducts(unitId: string | null): Promise<RewardProduct[]> {
  let query = supabase
    .from('reward_products')
    .select('*')
    .order('points_cost', { ascending: true });
  if (unitId) query = query.eq('unit_id', unitId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchUserRedemptions(userId: string, unitId: string | null): Promise<RewardRedemption[]> {
  let query = supabase
    .from('reward_redemptions')
    .select('*, product:reward_products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (unitId) query = query.eq('unit_id', unitId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchAllRedemptionsData(unitId: string | null): Promise<RewardRedemption[]> {
  let query = supabase
    .from('reward_redemptions')
    .select('*, product:reward_products(*)')
    .order('created_at', { ascending: false });
  if (unitId) query = query.eq('unit_id', unitId);
  const { data, error } = await query;
  if (error) throw error;

  const userIds = [...new Set(data?.map(r => r.user_id) || [])];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', userIds);

  return (data || []).map(r => ({
    ...r,
    profile: profiles?.find(p => p.user_id === r.user_id),
  }));
}

export function useRewards() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { activeUnitId } = useUnit();

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['reward-products', activeUnitId],
    queryFn: () => fetchProducts(activeUnitId),
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['reward-redemptions', user?.id, activeUnitId],
    queryFn: () => fetchUserRedemptions(user!.id, activeUnitId),
    enabled: !!user,
  });

  const { data: allRedemptions = [] } = useQuery({
    queryKey: ['reward-all-redemptions', activeUnitId],
    queryFn: () => fetchAllRedemptionsData(activeUnitId),
    enabled: !!user && isAdmin,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['reward-products'] });
    queryClient.invalidateQueries({ queryKey: ['reward-redemptions'] });
    queryClient.invalidateQueries({ queryKey: ['reward-all-redemptions'] });
  };

  const createProductMut = useMutation({
    mutationFn: async (product: Omit<RewardProduct, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('reward_products').insert({
        ...product,
        unit_id: activeUnitId,
      });
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const updateProductMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RewardProduct> }) => {
      const { error } = await supabase.from('reward_products').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const deleteProductMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reward_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const redeemProductMut = useMutation({
    mutationFn: async ({ productId, pointsCost }: { productId: string; pointsCost: number }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('reward_redemptions').insert({
        user_id: user.id,
        product_id: productId,
        points_spent: pointsCost,
        status: 'pending',
        unit_id: activeUnitId,
      });
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const updateRedemptionStatusMut = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: RewardRedemption['status']; notes?: string }) => {
      const { error } = await supabase.from('reward_redemptions').update({ status, notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const deleteRedemptionMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reward_redemptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  return {
    products,
    redemptions,
    allRedemptions,
    isLoading: isLoadingProducts,
    createProduct: (product: Omit<RewardProduct, 'id' | 'created_at' | 'updated_at'>) =>
      createProductMut.mutateAsync(product),
    updateProduct: (id: string, updates: Partial<RewardProduct>) =>
      updateProductMut.mutateAsync({ id, updates }),
    deleteProduct: (id: string) => deleteProductMut.mutateAsync(id),
    redeemProduct: (productId: string, pointsCost: number) =>
      redeemProductMut.mutateAsync({ productId, pointsCost }),
    updateRedemptionStatus: (id: string, status: RewardRedemption['status'], notes?: string) =>
      updateRedemptionStatusMut.mutateAsync({ id, status, notes }),
    deleteRedemption: (id: string) => deleteRedemptionMut.mutateAsync(id),
    refetch: invalidateAll,
  };
}
