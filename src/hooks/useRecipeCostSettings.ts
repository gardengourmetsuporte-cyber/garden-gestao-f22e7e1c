import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RecipeCostSettings {
  id: string;
  user_id: string;
  monthly_products_sold: number;
  monthly_revenue: number;
  monthly_fixed_cost_manual: number;
  tax_percentage: number;
  card_fee_percentage: number;
  packaging_cost_per_unit: number;
  fixed_cost_category_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface OperationalCosts {
  fixedCostPerProduct: number;
  taxAmount: number;
  cardFeeAmount: number;
  packagingCost: number;
  totalOperational: number;
  monthlyFixedCost: number;
}

const defaultSettings: Omit<RecipeCostSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  monthly_products_sold: 1000,
  monthly_revenue: 50000,
  monthly_fixed_cost_manual: 0,
  tax_percentage: 0,
  card_fee_percentage: 0,
  packaging_cost_per_unit: 0,
  fixed_cost_category_ids: [],
};

export function useRecipeCostSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['recipe-cost-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('recipe_cost_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          ...data,
          monthly_revenue: (data as any).monthly_revenue ?? 50000,
          monthly_fixed_cost_manual: (data as any).monthly_fixed_cost_manual ?? 0,
          fixed_cost_category_ids: data.fixed_cost_category_ids || [],
        } as RecipeCostSettings;
      }

      return null;
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (newSettings: Partial<RecipeCostSettings>) => {
      if (!user?.id) throw new Error('User not logged in');

      const payload = {
        user_id: user.id,
        monthly_products_sold: newSettings.monthly_products_sold ?? defaultSettings.monthly_products_sold,
        monthly_revenue: newSettings.monthly_revenue ?? defaultSettings.monthly_revenue,
        monthly_fixed_cost_manual: newSettings.monthly_fixed_cost_manual ?? defaultSettings.monthly_fixed_cost_manual,
        tax_percentage: newSettings.tax_percentage ?? defaultSettings.tax_percentage,
        card_fee_percentage: newSettings.card_fee_percentage ?? defaultSettings.card_fee_percentage,
        packaging_cost_per_unit: newSettings.packaging_cost_per_unit ?? defaultSettings.packaging_cost_per_unit,
        fixed_cost_category_ids: newSettings.fixed_cost_category_ids ?? defaultSettings.fixed_cost_category_ids,
      };

      const { error } = await supabase
        .from('recipe_cost_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe-cost-settings'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    },
  });

  const calculateOperationalCosts = (ingredientCost: number, sellingPrice?: number): OperationalCosts => {
    const effectiveSettings = settings || defaultSettings;
    const monthlyRevenue = effectiveSettings.monthly_revenue || 50000;
    const monthlyFixedCost = effectiveSettings.monthly_fixed_cost_manual || 0;

    let fixedCostPerProduct: number;
    if (sellingPrice && sellingPrice > 0 && monthlyRevenue > 0) {
      fixedCostPerProduct = (sellingPrice / monthlyRevenue) * monthlyFixedCost;
    } else {
      const monthlyProducts = effectiveSettings.monthly_products_sold || 1000;
      fixedCostPerProduct = monthlyProducts > 0 ? monthlyFixedCost / monthlyProducts : 0;
    }

    const baseForSalesFees = sellingPrice && sellingPrice > 0 ? sellingPrice : ingredientCost;
    const taxAmount = baseForSalesFees * (effectiveSettings.tax_percentage / 100);
    const cardFeeAmount = baseForSalesFees * (effectiveSettings.card_fee_percentage / 100);
    const packagingCost = effectiveSettings.packaging_cost_per_unit;

    return {
      fixedCostPerProduct,
      taxAmount,
      cardFeeAmount,
      packagingCost,
      totalOperational: fixedCostPerProduct + taxAmount + cardFeeAmount + packagingCost,
      monthlyFixedCost,
    };
  };

  return {
    settings: settings || defaultSettings,
    isLoading: isLoadingSettings,
    monthlyFixedCost: (settings || defaultSettings).monthly_fixed_cost_manual || 0,
    saveSettings: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    calculateOperationalCosts,
  };
}
