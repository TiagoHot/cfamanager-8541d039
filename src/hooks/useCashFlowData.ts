import { useMemo } from 'react';
import { IncomeExpense, MONTHS } from '@/types';

interface CashFlowMonthData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  accumulatedBalance: number;
}

interface CashFlowBreakdown {
  [key: string]: number;
}

interface CashFlowData {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalProfit: number;
  months: CashFlowMonthData[];
  incomeBreakdown: CashFlowBreakdown;
  expenseBreakdown: CashFlowBreakdown;
}

// Helper para obter o número do mês (0 para Jan, 11 para Dez)
const getMonthIndex = (month: string): number => {
  if (!month) return -1;
  // Normaliza a string do mês (pega a primeira parte se for composta)
  const normalized = month.toLowerCase().split('/')[0].trim();
  return MONTHS.map(m => m.toLowerCase()).findIndex(m => m === normalized);
};

export function useCashFlowData(incomeExpenses: IncomeExpense[], selectedYear: number): CashFlowData {
  const data = useMemo(() => {
    const yearItems = incomeExpenses.filter(item => item.year === selectedYear);

    // 1. Calculate Monthly Totals
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    
    yearItems.forEach(item => {
      // Use a string do mês completa para a chave do mapa
      const monthKey = item.month; 
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
      
      if (item.type === 'income') {
        monthlyMap.set(monthKey, { ...current, income: current.income + item.amount });
      } else {
        monthlyMap.set(monthKey, { ...current, expenses: current.expenses + item.amount });
      }
    });

    // 2. Sort and Calculate Accumulated Balance
    const rawMonths = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      ...data,
      balance: data.income - data.expenses,
      monthIndex: getMonthIndex(month),
    })).filter(m => m.monthIndex !== -1); // Remove entries where month name couldn't be parsed
    
    // Sort by month index (0-11) chronologically
    rawMonths.sort((a, b) => a.monthIndex - b.monthIndex);

    let accumulatedBalance = 0;
    const months: CashFlowMonthData[] = rawMonths.map(m => {
      accumulatedBalance += m.balance;
      return {
        month: m.month,
        income: m.income,
        expenses: m.expenses,
        balance: m.balance,
        accumulatedBalance,
      };
    });

    // 3. Calculate Annual Totals
    const totalIncome = months.reduce((sum, m) => sum + m.income, 0);
    const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0);
    const totalProfit = totalIncome - totalExpenses;

    // 4. Calculate Breakdowns
    const incomeBreakdown: CashFlowBreakdown = {};
    const expenseBreakdown: CashFlowBreakdown = {};

    yearItems.forEach(item => {
      if (item.type === 'income') {
        incomeBreakdown[item.source] = (incomeBreakdown[item.source] || 0) + item.amount;
      } else {
        expenseBreakdown[item.source] = (expenseBreakdown[item.source] || 0) + item.amount;
      }
    });

    return {
      year: selectedYear,
      totalIncome,
      totalExpenses,
      totalProfit,
      months,
      incomeBreakdown,
      expenseBreakdown,
    };
  }, [incomeExpenses, selectedYear]);

  return data;
}