 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export interface PaymentMethodSetting {
   id: string;
   user_id: string;
   method_key: string;
   method_name: string;
   settlement_type: 'immediate' | 'business_days' | 'weekly_day';
   settlement_days: number;
   settlement_day_of_week: number | null;
   fee_percentage: number;
   is_active: boolean;
  create_transaction: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export const DEFAULT_PAYMENT_SETTINGS: Omit<PaymentMethodSetting, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  { method_key: 'cash_amount', method_name: 'Dinheiro', settlement_type: 'immediate', settlement_days: 0, settlement_day_of_week: null, fee_percentage: 0, is_active: true, create_transaction: true },
   { method_key: 'debit_amount', method_name: 'Débito', settlement_type: 'business_days', settlement_days: 1, settlement_day_of_week: null, fee_percentage: 0.72, is_active: true, create_transaction: true },
   { method_key: 'credit_amount', method_name: 'Crédito', settlement_type: 'business_days', settlement_days: 1, settlement_day_of_week: null, fee_percentage: 2.5, is_active: true, create_transaction: true },
   { method_key: 'pix_amount', method_name: 'Pix', settlement_type: 'immediate', settlement_days: 0, settlement_day_of_week: null, fee_percentage: 0, is_active: true, create_transaction: true },
   { method_key: 'meal_voucher_amount', method_name: 'Vale Alimentação', settlement_type: 'business_days', settlement_days: 30, settlement_day_of_week: null, fee_percentage: 3.5, is_active: true, create_transaction: true },
  { method_key: 'delivery_amount', method_name: 'iFood/Delivery', settlement_type: 'weekly_day', settlement_days: 0, settlement_day_of_week: 3, fee_percentage: 12, is_active: true, create_transaction: true },
  { method_key: 'signed_account_amount', method_name: 'Conta Assinada', settlement_type: 'business_days', settlement_days: 30, settlement_day_of_week: null, fee_percentage: 0, is_active: true, create_transaction: true },
];
 
 export function usePaymentSettings() {
   const { user } = useAuth();
   const [settings, setSettings] = useState<PaymentMethodSetting[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchSettings = useCallback(async () => {
     if (!user) return;
     setIsLoading(true);
 
     try {
       const { data, error } = await supabase
         .from('payment_method_settings' as any)
         .select('*')
         .eq('user_id', user.id)
         .order('method_key');
 
       if (error) throw error;
 
       // If no settings exist, create defaults
       if (!data || data.length === 0) {
         await initializeDefaults();
         return;
       }
 
       setSettings(data as unknown as PaymentMethodSetting[]);
     } catch (error) {
       console.error('Error fetching payment settings:', error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   const initializeDefaults = async () => {
     if (!user) return;
 
     try {
       const settingsToInsert = DEFAULT_PAYMENT_SETTINGS.map(s => ({
         ...s,
         user_id: user.id,
       }));
 
       const { error } = await supabase
         .from('payment_method_settings' as any)
         .insert(settingsToInsert as any);
 
       if (error) throw error;
 
       await fetchSettings();
     } catch (error) {
       console.error('Error initializing payment settings:', error);
     }
   };
 
   useEffect(() => {
     fetchSettings();
   }, [fetchSettings]);
 
   const updateSetting = async (id: string, updates: Partial<PaymentMethodSetting>) => {
     if (!user) return false;
 
     try {
       const { error } = await supabase
         .from('payment_method_settings' as any)
         .update(updates as any)
         .eq('id', id);
 
       if (error) throw error;

       await fetchSettings();
       return true;
     } catch (error) {
       toast.error('Erro ao salvar configuração');
       return false;
     }
   };
 
   const getSettingByKey = (methodKey: string): PaymentMethodSetting | undefined => {
     return settings.find(s => s.method_key === methodKey);
   };
 
   return {
     settings,
     isLoading,
     updateSetting,
     getSettingByKey,
     refetch: fetchSettings,
   };
 }