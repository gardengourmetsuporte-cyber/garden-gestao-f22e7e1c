import { useUnit } from '@/contexts/UnitContext';
import {
  RecurringEditMode,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@/types/finance';
import { useFinanceCore } from './useFinanceCore';

export type { RecurringEditMode };

export function useFinance(selectedMonth: Date) {
  const { activeUnitId } = useUnit();

  return useFinanceCore({
    selectedMonth,
    unitId: activeUnitId,
    isPersonal: false,
    defaultCategories: {
      expense: DEFAULT_EXPENSE_CATEGORIES,
      income: DEFAULT_INCOME_CATEGORIES,
    },
    queryKeyPrefix: 'finance',
  });
}
