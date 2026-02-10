import { useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FinanceTransaction, FinanceCategory, CategoryStats } from '@/types/finance';

export interface EntityStats {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

const ENTITY_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#84cc16', '#06b6d4', '#0ea5e9', '#a855f7', '#d946ef',
];

export function useFinanceStats(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[]
) {
  // Stats by category (for pie chart)
  const expensesByCategory = useMemo((): CategoryStats[] => {
    const expenseTransactions = transactions.filter(
      t => (t.type === 'expense' || t.type === 'credit_card') && t.is_paid
    );
    
    const totalExpense = expenseTransactions.reduce(
      (sum, t) => sum + Number(t.amount), 0
    );
    
    // Group by parent category
    const byCategory: Record<string, { amount: number; count: number; category: FinanceCategory }> = {};
    
    expenseTransactions.forEach(t => {
      let categoryData = t.category;
      
      // If subcategory, find parent
      if (categoryData?.parent_id) {
        const parent = categories.find(c => c.id === categoryData?.parent_id);
        if (parent) categoryData = parent;
      }
      
      if (categoryData) {
        if (!byCategory[categoryData.id]) {
          byCategory[categoryData.id] = { amount: 0, count: 0, category: categoryData };
        }
        byCategory[categoryData.id].amount += Number(t.amount);
        byCategory[categoryData.id].count += 1;
      }
    });
    
    return Object.values(byCategory)
      .map(item => ({
        category: item.category,
        amount: item.amount,
        percentage: totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0,
        transactionCount: item.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  // Stats by subcategory (for drill-down)
  const getSubcategoryStats = useMemo(() => {
    return (parentCategoryId: string): CategoryStats[] => {
      const expenseTransactions = transactions.filter(
        t => (t.type === 'expense' || t.type === 'credit_card') && t.is_paid
      );
      
      const relevantTransactions = expenseTransactions.filter(t => {
        if (!t.category) return false;
        if (t.category.id === parentCategoryId) return true;
        if (t.category.parent_id === parentCategoryId) return true;
        return false;
      });
      
      const total = relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      const bySubcategory: Record<string, { amount: number; count: number; category: FinanceCategory }> = {};
      
      relevantTransactions.forEach(t => {
        if (t.category) {
          const catId = t.category.id;
          if (!bySubcategory[catId]) {
            bySubcategory[catId] = { amount: 0, count: 0, category: t.category };
          }
          bySubcategory[catId].amount += Number(t.amount);
          bySubcategory[catId].count += 1;
        }
      });
      
      return Object.values(bySubcategory)
        .map(item => ({
          category: item.category,
          amount: item.amount,
          percentage: total > 0 ? (item.amount / total) * 100 : 0,
          transactionCount: item.count
        }))
        .sort((a, b) => b.amount - a.amount);
    };
  }, [transactions]);

  // Get entity stats (suppliers or employees) for a category
  const getSupplierStats = useCallback((categoryId: string): EntityStats[] => {
    const relevantTransactions = transactions.filter(t => {
      if (!t.is_paid) return false;
      if (t.type !== 'expense' && t.type !== 'credit_card') return false;
      if (!t.category) return false;
      return t.category.id === categoryId || t.category.parent_id === categoryId;
    });

    const total = relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const bySupplier: Record<string, { name: string; amount: number; count: number }> = {};

    relevantTransactions.forEach(t => {
      const supplierId = t.supplier_id || 'sem-fornecedor';
      const supplierName = t.supplier?.name || 'Sem fornecedor';
      if (!bySupplier[supplierId]) {
        bySupplier[supplierId] = { name: supplierName, amount: 0, count: 0 };
      }
      bySupplier[supplierId].amount += Number(t.amount);
      bySupplier[supplierId].count += 1;
    });

    return Object.entries(bySupplier)
      .map(([id, item], index) => ({
        id,
        name: item.name,
        amount: item.amount,
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
        count: item.count,
        color: ENTITY_COLORS[index % ENTITY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Get employee stats from employee_payments linked to finance transactions
  const getEmployeeStats = useCallback(async (categoryId: string): Promise<EntityStats[]> => {
    const relevantTransactions = transactions.filter(t => {
      if (!t.is_paid) return false;
      if (t.type !== 'expense' && t.type !== 'credit_card') return false;
      if (!t.category) return false;
      return t.category.id === categoryId || t.category.parent_id === categoryId;
    });

    const transactionIds = relevantTransactions.map(t => t.id);
    if (transactionIds.length === 0) return [];

    const { data: payments } = await supabase
      .from('employee_payments')
      .select('*, employee:employees(id, full_name)')
      .in('finance_transaction_id', transactionIds);

    if (!payments || payments.length === 0) {
      // Fallback: group by description
      const total = relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const byDesc: Record<string, { amount: number; count: number }> = {};
      relevantTransactions.forEach(t => {
        const key = t.description;
        if (!byDesc[key]) byDesc[key] = { amount: 0, count: 0 };
        byDesc[key].amount += Number(t.amount);
        byDesc[key].count += 1;
      });
      return Object.entries(byDesc)
        .map(([name, item], index) => ({
          id: name,
          name,
          amount: item.amount,
          percentage: total > 0 ? (item.amount / total) * 100 : 0,
          count: item.count,
          color: ENTITY_COLORS[index % ENTITY_COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount);
    }

    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const byEmployee: Record<string, { name: string; amount: number; count: number }> = {};

    payments.forEach((p: any) => {
      const empId = p.employee_id;
      const empName = p.employee?.full_name || 'Funcionário';
      if (!byEmployee[empId]) {
        byEmployee[empId] = { name: empName, amount: 0, count: 0 };
      }
      byEmployee[empId].amount += Number(p.amount);
      byEmployee[empId].count += 1;
    });

    return Object.entries(byEmployee)
      .map(([id, item], index) => ({
        id,
        name: item.name,
        amount: item.amount,
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
        count: item.count,
        color: ENTITY_COLORS[index % ENTITY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Income by category
  const incomeByCategory = useMemo((): CategoryStats[] => {
    const incomeTransactions = transactions.filter(
      t => t.type === 'income' && t.is_paid
    );
    
    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + Number(t.amount), 0
    );
    
    const byCategory: Record<string, { amount: number; count: number; category: FinanceCategory }> = {};
    
    incomeTransactions.forEach(t => {
      let categoryData = t.category;
      
      if (categoryData?.parent_id) {
        const parent = categories.find(c => c.id === categoryData?.parent_id);
        if (parent) categoryData = parent;
      }
      
      if (categoryData) {
        if (!byCategory[categoryData.id]) {
          byCategory[categoryData.id] = { amount: 0, count: 0, category: categoryData };
        }
        byCategory[categoryData.id].amount += Number(t.amount);
        byCategory[categoryData.id].count += 1;
      }
    });
    
    return Object.values(byCategory)
      .map(item => ({
        category: item.category,
        amount: item.amount,
        percentage: totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0,
        transactionCount: item.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  // Daily expenses for timeline
  const dailyExpenses = useMemo(() => {
    const byDate: Record<string, number> = {};
    
    transactions
      .filter(t => (t.type === 'expense' || t.type === 'credit_card') && t.is_paid)
      .forEach(t => {
        if (!byDate[t.date]) byDate[t.date] = 0;
        byDate[t.date] += Number(t.amount);
      });
    
    return Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  // Daily income for timeline
  const dailyIncome = useMemo(() => {
    const byDate: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'income' && t.is_paid)
      .forEach(t => {
        if (!byDate[t.date]) byDate[t.date] = 0;
        byDate[t.date] += Number(t.amount);
      });
    
    return Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  return {
    expensesByCategory,
    incomeByCategory,
    getSubcategoryStats,
    getSupplierStats,
    getEmployeeStats,
    dailyExpenses,
    dailyIncome
  };
}
