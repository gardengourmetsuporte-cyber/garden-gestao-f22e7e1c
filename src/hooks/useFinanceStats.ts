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
  // Build a flat lookup map for finding parents (categories array only has parents with nested subs)
  // Also index by subcategory parent_id from transactions to handle cross-unit category references
  const parentLookup = useMemo(() => {
    const map: Record<string, FinanceCategory> = {};
    categories.forEach(c => {
      map[c.id] = c;
      // Also index subcategories so we can resolve their parent_id
      c.subcategories?.forEach(sub => {
        map[sub.id] = sub;
      });
    });
    return map;
  }, [categories]);

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
      
      // If subcategory, find parent from lookup or use parent_id from the joined category
      if (categoryData?.parent_id) {
        const parent = parentLookup[categoryData.parent_id];
        if (parent) {
          categoryData = parent;
        } else {
          // Cross-unit category: parent not in lookup. Find a matching parent by name from categories array.
          const parentName = categoryData.parent_id;
          const matchByName = categories.find(c => !c.parent_id && c.type === 'expense' && 
            c.subcategories?.some(sub => sub.name === categoryData!.name));
          if (matchByName) {
            categoryData = matchByName;
          }
          // If still not found, skip grouping under parent — it'll show as its own entry
        }
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
    return (parentCategoryId: string, type: 'expense' | 'income' = 'expense'): CategoryStats[] => {
      const filteredTransactions = type === 'income'
        ? transactions.filter(t => t.type === 'income' && t.is_paid)
        : transactions.filter(t => (t.type === 'expense' || t.type === 'credit_card') && t.is_paid);
      
      const relevantTransactions = filteredTransactions.filter(t => {
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

  // Get employee stats directly from employee_id on transactions
  const getEmployeeStats = useCallback((categoryId: string): EntityStats[] => {
    const relevantTransactions = transactions.filter(t => {
      if (!t.is_paid) return false;
      if (t.type !== 'expense' && t.type !== 'credit_card') return false;
      if (!t.category) return false;
      return t.category.id === categoryId || t.category.parent_id === categoryId;
    });

    const total = relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const byEmployee: Record<string, { name: string; amount: number; count: number }> = {};

    relevantTransactions.forEach(t => {
      const empId = t.employee_id || 'sem-funcionario';
      const empName = t.employee?.full_name || 'Sem funcionário';
      if (!byEmployee[empId]) {
        byEmployee[empId] = { name: empName, amount: 0, count: 0 };
      }
      byEmployee[empId].amount += Number(t.amount);
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
        const parent = parentLookup[categoryData.parent_id];
        if (parent) {
          categoryData = parent;
        } else {
          const matchByName = categories.find(c => !c.parent_id && c.type === 'income' && 
            c.subcategories?.some(sub => sub.name === categoryData!.name));
          if (matchByName) {
            categoryData = matchByName;
          }
        }
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
