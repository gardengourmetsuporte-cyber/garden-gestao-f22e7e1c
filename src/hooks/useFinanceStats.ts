import { useMemo } from 'react';
import { FinanceTransaction, FinanceCategory, CategoryStats } from '@/types/finance';

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
      
      // Filter transactions that belong to this parent category or its subcategories
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
    dailyExpenses,
    dailyIncome
  };
}
