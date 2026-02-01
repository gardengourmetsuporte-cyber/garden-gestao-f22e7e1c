import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  profile?: {
    full_name: string;
  };
}

export function useRewards() {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<RewardProduct[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [allRedemptions, setAllRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchRedemptions();
      if (isAdmin) {
        fetchAllRedemptions();
      }
    }
  }, [user, isAdmin]);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('reward_products')
        .select('*')
        .order('points_cost', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRedemptions() {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          product:reward_products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRedemptions(data || []);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    }
  }

  async function fetchAllRedemptions() {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          product:reward_products(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const redemptionsWithProfiles = (data || []).map(r => ({
        ...r,
        profile: profiles?.find(p => p.user_id === r.user_id),
      }));

      setAllRedemptions(redemptionsWithProfiles);
    } catch (error) {
      console.error('Error fetching all redemptions:', error);
    }
  }

  async function createProduct(product: Omit<RewardProduct, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { error } = await supabase
        .from('reward_products')
        .insert(product);

      if (error) throw error;
      await fetchProducts();
    } catch (error) {
      throw new Error('Erro ao criar produto');
    }
  }

  async function updateProduct(id: string, updates: Partial<RewardProduct>) {
    try {
      const { error } = await supabase
        .from('reward_products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (error) {
      throw new Error('Erro ao atualizar produto');
    }
  }

  async function deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('reward_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (error) {
      throw new Error('Erro ao excluir produto');
    }
  }

  async function redeemProduct(productId: string, pointsCost: number) {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { error } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: user.id,
          product_id: productId,
          points_spent: pointsCost,
          status: 'pending',
        });

      if (error) throw error;
      await fetchRedemptions();
    } catch (error) {
      throw new Error('Erro ao resgatar produto');
    }
  }

  async function updateRedemptionStatus(id: string, status: RewardRedemption['status'], notes?: string) {
    try {
      const { error } = await supabase
        .from('reward_redemptions')
        .update({ status, notes })
        .eq('id', id);

      if (error) throw error;
      await fetchAllRedemptions();
      await fetchRedemptions();
    } catch (error) {
      throw new Error('Erro ao atualizar status');
    }
  }

  async function deleteRedemption(id: string) {
    try {
      const { error } = await supabase
        .from('reward_redemptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAllRedemptions();
      await fetchRedemptions();
    } catch (error) {
      throw new Error('Erro ao excluir resgate');
    }
  }

  return {
    products,
    redemptions,
    allRedemptions,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    redeemProduct,
    updateRedemptionStatus,
    deleteRedemption,
    refetch: () => {
      fetchProducts();
      fetchRedemptions();
      if (isAdmin) fetchAllRedemptions();
    },
  };
}
