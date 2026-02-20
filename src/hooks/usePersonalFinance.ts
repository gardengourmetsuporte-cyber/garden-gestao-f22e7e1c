import {
  RecurringEditMode,
  DEFAULT_PERSONAL_EXPENSE_CATEGORIES,
  DEFAULT_PERSONAL_INCOME_CATEGORIES,
} from '@/types/finance';
import { useFinanceCore } from './useFinanceCore';

export type { RecurringEditMode };

export function usePersonalFinance(selectedMonth: Date) {
  return useFinanceCore({
    selectedMonth,
    unitId: null,
    isPersonal: true,
    defaultCategories: {
      expense: DEFAULT_PERSONAL_EXPENSE_CATEGORIES,
      income: DEFAULT_PERSONAL_INCOME_CATEGORIES,
    },
    queryKeyPrefix: 'personal-finance',
  });
}
