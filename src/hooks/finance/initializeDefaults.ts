import { supabase } from '@/integrations/supabase/client';

interface DefaultCategoryDef {
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export async function initializeDefaultsCore(
  userId: string,
  unitId: string | null,
  cats: { expense: DefaultCategoryDef[]; income: DefaultCategoryDef[] }
) {
  let accQuery = supabase.from('finance_accounts').select('id').eq('user_id', userId).limit(1);
  if (unitId) accQuery = accQuery.eq('unit_id', unitId);
  else accQuery = accQuery.is('unit_id', null);
  const { data: existingAccounts } = await accQuery;

  if (!existingAccounts || existingAccounts.length === 0) {
    await supabase.from('finance_accounts').upsert([
      {
        user_id: userId,
        name: unitId ? 'Carteira' : 'Carteira Pessoal',
        type: 'wallet',
        balance: 0,
        color: unitId ? '#3b82f6' : '#8b5cf6',
        icon: 'Wallet',
        unit_id: unitId,
      },
      {
        user_id: userId,
        name: unitId ? 'Banco' : 'Banco Pessoal',
        type: 'bank',
        balance: 0,
        color: '#22c55e',
        icon: 'Building2',
        unit_id: unitId,
      },
    ], { onConflict: 'user_id,unit_id,name,type', ignoreDuplicates: true });
  }

  let catQuery = supabase.from('finance_categories').select('id').eq('user_id', userId).limit(1);
  if (unitId) catQuery = catQuery.eq('unit_id', unitId);
  else catQuery = catQuery.is('unit_id', null);
  const { data: existingCategories } = await catQuery;

  if (!existingCategories || existingCategories.length === 0) {
    for (const [type, list] of [['expense', cats.expense], ['income', cats.income]] as const) {
      for (let i = 0; i < list.length; i++) {
        const cat = list[i];
        const { data: parentData } = await supabase
          .from('finance_categories')
          .insert({
            user_id: userId, name: cat.name, type,
            icon: cat.icon, color: cat.color, is_system: true, sort_order: i,
            unit_id: unitId,
          })
          .select()
          .single();

        if (parentData && cat.subcategories.length > 0) {
          const subs = cat.subcategories.map((name, j) => ({
            user_id: userId, name, type,
            icon: cat.icon, color: cat.color,
            parent_id: parentData.id, is_system: true, sort_order: j,
            unit_id: unitId,
          }));
          await supabase.from('finance_categories').insert(subs);
        }
      }
    }
  }
}
