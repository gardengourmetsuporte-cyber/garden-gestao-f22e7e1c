import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MenuFavorite {
  id: string;
  user_id: string;
  product_id: string;
  unit_id: string;
  created_at: string;
}

export function useMenuFavorites(unitId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['menu-favorites', user?.id, unitId],
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_favorites' as any)
        .select('*')
        .eq('user_id', user!.id)
        .eq('unit_id', unitId!);
      return (data || []) as unknown as MenuFavorite[];
    },
    enabled: !!user && !!unitId,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (productId: string) => {
      const existing = favorites.find(f => f.product_id === productId);
      if (existing) {
        await supabase.from('menu_favorites' as any).delete().eq('id', existing.id);
      } else {
        await supabase.from('menu_favorites' as any).insert({
          user_id: user!.id,
          product_id: productId,
          unit_id: unitId,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-favorites'] }),
  });

  const isFavorite = (productId: string) => favorites.some(f => f.product_id === productId);

  return { favorites, isLoading, toggleFavorite, isFavorite };
}
