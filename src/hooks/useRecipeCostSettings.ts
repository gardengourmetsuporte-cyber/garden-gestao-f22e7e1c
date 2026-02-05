 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export interface RecipeCostSettings {
   id: string;
   user_id: string;
   monthly_products_sold: number;
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
 
 interface FinanceCategory {
   id: string;
   name: string;
   type: string;
   parent_id: string | null;
 }
 
 const defaultSettings: Omit<RecipeCostSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
   monthly_products_sold: 1000,
   tax_percentage: 0,
   card_fee_percentage: 0,
   packaging_cost_per_unit: 0,
   fixed_cost_category_ids: [],
 };
 
 export function useRecipeCostSettings() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   // Buscar configurações do usuário
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
       
       // Retornar configuração existente ou valores padrão
       if (data) {
         return {
           ...data,
           fixed_cost_category_ids: data.fixed_cost_category_ids || [],
         } as RecipeCostSettings;
       }
       
       return null;
     },
     enabled: !!user?.id,
   });
 
   // Buscar categorias de despesa do financeiro
   const { data: expenseCategories = [] } = useQuery({
     queryKey: ['finance-expense-categories', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
       
       const { data, error } = await supabase
         .from('finance_categories')
         .select('id, name, type, parent_id')
         .eq('user_id', user.id)
         .eq('type', 'expense')
         .is('parent_id', null)
         .order('sort_order');
       
       if (error) throw error;
       return data as FinanceCategory[];
     },
     enabled: !!user?.id,
   });
 
   // Buscar total de gastos fixos mensais baseado nas categorias selecionadas
   const { data: monthlyFixedCost = 0 } = useQuery({
     queryKey: ['monthly-fixed-cost', user?.id, settings?.fixed_cost_category_ids],
     queryFn: async () => {
       if (!user?.id || !settings?.fixed_cost_category_ids?.length) return 0;
       
       const now = new Date();
       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
       const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
       
       // Buscar todas as subcategorias das categorias selecionadas
       const { data: subCategories } = await supabase
         .from('finance_categories')
         .select('id')
         .eq('user_id', user.id)
         .in('parent_id', settings.fixed_cost_category_ids);
       
       const allCategoryIds = [
         ...settings.fixed_cost_category_ids,
         ...(subCategories?.map(c => c.id) || []),
       ];
       
       const { data, error } = await supabase
         .from('finance_transactions')
         .select('amount')
         .eq('user_id', user.id)
         .eq('type', 'expense')
         .eq('is_paid', true)
         .gte('date', startOfMonth)
         .lte('date', endOfMonth)
         .in('category_id', allCategoryIds);
       
       if (error) throw error;
       
       return data.reduce((sum, t) => sum + Number(t.amount), 0);
     },
     enabled: !!user?.id && !!settings?.fixed_cost_category_ids?.length,
   });
 
   // Salvar configurações
   const saveMutation = useMutation({
     mutationFn: async (newSettings: Partial<RecipeCostSettings>) => {
       if (!user?.id) throw new Error('User not logged in');
       
       const payload = {
         user_id: user.id,
         monthly_products_sold: newSettings.monthly_products_sold ?? defaultSettings.monthly_products_sold,
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
       queryClient.invalidateQueries({ queryKey: ['monthly-fixed-cost'] });
       toast.success('Configurações salvas!');
     },
     onError: () => {
       toast.error('Erro ao salvar configurações');
     },
   });
 
   // Calcular custos operacionais para um custo de ingredientes específico
   const calculateOperationalCosts = (ingredientCost: number): OperationalCosts => {
     const effectiveSettings = settings || defaultSettings;
     const monthlyProducts = effectiveSettings.monthly_products_sold || 1000;
     
     const fixedCostPerProduct = monthlyProducts > 0 ? monthlyFixedCost / monthlyProducts : 0;
     const taxAmount = ingredientCost * (effectiveSettings.tax_percentage / 100);
     const cardFeeAmount = ingredientCost * (effectiveSettings.card_fee_percentage / 100);
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
     expenseCategories,
     monthlyFixedCost,
     saveSettings: saveMutation.mutate,
     isSaving: saveMutation.isPending,
     calculateOperationalCosts,
   };
 }