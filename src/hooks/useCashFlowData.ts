import { useMemo } from 'react';
import { IncomeExpense, MONTHS } from '@/types';
import { normalizeMonthToAbbreviation } from '@/lib/formatters'; // Import the new utility

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
  // Normaliza a string do mês para sua abreviação antes de encontrar o índice
  const abbrMonth = normalizeMonthToAbbreviation(month.split('/')[0].trim()); // Pega a primeira parte para lookup
  return MONTHS.findIndex(m => m === abbrMonth);
};

export function useCashFlowData(incomeExpenses: IncomeExpense[], selectedYear: number): CashFlowData {
  const data = useMemo(() => {
    const yearItems = incomeExpenses.filter(item => item.year === selectedYear);

    // 1. Calculate Monthly Totals
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    
    yearItems.forEach(item => {
      // Usa a string do mês normalizada (ex: 'Jan', 'Fev', ou 'Jan/Fev') como chave do mapa
      const normalizedMonthForMap = normalizeMonthToAbbreviation(item.month);
      const current = monthlyMap.get(normalizedMonthForMap) || { income: 0, expenses: 0 };
      
      if (item.type === 'income') {
        monthlyMap.set(normalizedMonthForMap, { ...current, income: current.income + item.amount });
      } else {
        monthlyMap.set(normalizedMonthForMap, { ...current, expenses: current.expenses + item.amount });
      }
    });

    // 2. Sort and Calculate Accumulated Balance
    const rawMonths = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month, // Esta string 'month' pode ser 'Jan', 'Fev', ou 'Jan/Fev'
      ...data,
      balance: data.income - data.expenses,
      monthIndex: getMonthIndex(month), // Usa o helper para obter o índice para ordenação
    })).filter(m => m.monthIndex !== -1); // Remove entradas onde o mês não pôde ser parseado
    
    // Ordena pelo índice do mês (0-11) cronologicamente
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