import { Product, CampaignResult, WeeklyResult, IncomeExpense, CURRENCY_RATES } from '@/types';

export const mockProducts: Product[] = [
  { id: '1', date: '2023-01-01', productNumber: 1, name: 'Hidraliso', platform: 'Monetizze', country: 'Brasil', currency: 'Real', averageTicket: 197, commissionPercent: 50, commissionBRL: 98.50 },
  { id: '2', date: '2023-01-01', productNumber: 2, name: 'Trinoxidiu', platform: 'Monetizze', country: 'Brasil', currency: 'Real', averageTicket: 297, commissionPercent: 50, commissionBRL: 148.50 },
  { id: '3', date: '2023-01-01', productNumber: 3, name: 'Top hair gummy', platform: 'Monetizze', country: 'Brasil', currency: 'Real', averageTicket: 297, commissionPercent: 50, commissionBRL: 148.50 },
  { id: '4', date: '2023-07-12', productNumber: 4, name: 'O especialista de robalo', platform: 'Hotmart', country: 'Brasil', currency: 'Real', averageTicket: 449, commissionPercent: 50, commissionBRL: 224.50 },
  { id: '5', date: '2023-07-12', productNumber: 5, name: 'Monografis orientador tcc', platform: 'Hotmart', country: 'Brasil', currency: 'Real', averageTicket: 397, commissionPercent: 51, commissionBRL: 200.49 },
  { id: '6', date: '2023-07-12', productNumber: 6, name: 'Fábrica de laços e tiaras', platform: 'Hotmart', country: 'Brasil', currency: 'Real', averageTicket: 197, commissionPercent: 80, commissionBRL: 157.60 },
  { id: '7', date: '2023-09-05', productNumber: 21, name: 'Experto em datos DP', platform: 'Hotmart', country: 'Gringa', currency: 'Dólar', averageTicket: 297, commissionPercent: 50, commissionBRL: 802.78 },
  { id: '8', date: '2024-01-18', productNumber: 48, name: 'UGC Rafaela Chagas', platform: 'Hotmart', country: 'Brasil', currency: 'Real', averageTicket: 497, commissionPercent: 40, commissionBRL: 198.80 },
  { id: '9', date: '2025-09-16', productNumber: 90, name: 'Flash Burn', platform: 'BuyGoods', country: 'Gringa', currency: 'Dólar', averageTicket: 207, commissionPercent: 60, commissionBRL: 671.41 },
  { id: '10', date: '2025-10-11', productNumber: 98, name: 'Fit Burn', platform: 'BuyGoods', country: 'Gringa', currency: 'Dólar', averageTicket: 207, commissionPercent: 65, commissionBRL: 727.36 },
];

export const mockCampaignResults: CampaignResult[] = [
  { id: '1', year: 2023, monthNumber: 1, month: 'Janeiro', startDate: '2023-01-10', endDate: '2023-01-31', daysRunning: 21, productName: 'Perfect lizz', location: 'Brasil', strategy: 'Pesquisa', commissionBRL: 58.80, impressions: 254, clicks: 58, sales: 1, cpc: 1.00, earnings: 110.20, costs: 57.99, profitLoss: 52.21, roi: 90 },
  { id: '2', year: 2023, monthNumber: 1, month: 'Janeiro', startDate: '2023-01-10', endDate: '2023-02-01', daysRunning: 22, productName: 'Hidraliso', location: 'Brasil', strategy: 'Pesquisa', commissionBRL: 98.50, impressions: 544, clicks: 55, sales: 0, cpc: 1.70, earnings: 0, costs: 93.50, profitLoss: -93.50, roi: -100 },
  { id: '3', year: 2024, monthNumber: 4, month: 'Abril', startDate: '2024-04-01', endDate: '2024-04-30', daysRunning: 29, productName: 'UGC Rafaela Chagas', location: 'Brasil', strategy: 'Pesquisa', commissionBRL: 198.80, impressions: 662, clicks: 86, sales: 6, cpc: 6.45, earnings: 1469, costs: 554.27, profitLoss: 914.73, roi: 165 },
  { id: '4', year: 2025, monthNumber: 8, month: 'Agosto', startDate: '2025-08-01', endDate: '2025-08-31', daysRunning: 30, productName: 'Lipozem', location: 'Gringa', strategy: 'Pesquisa', commissionBRL: 574.11, impressions: 4200, clicks: 320, sales: 8, cpc: 6.50, earnings: 4592.88, costs: 2080.00, profitLoss: 2512.88, roi: 121 },
  { id: '5', year: 2025, monthNumber: 10, month: 'Outubro', startDate: '2025-10-01', endDate: '2025-10-31', daysRunning: 30, productName: 'Fit Burn', location: 'Gringa', strategy: 'Pesquisa', commissionBRL: 727.36, impressions: 3895, clicks: 513, sales: 7, cpc: 14.29, earnings: 7686.00, costs: 6822.73, profitLoss: 863.27, roi: 12.7 },
  { id: '6', year: 2025, monthNumber: 12, month: 'Dezembro', startDate: '2025-12-01', endDate: '2025-12-31', daysRunning: 30, productName: 'Boostaro', location: 'Gringa', strategy: 'Pesquisa', commissionBRL: 648.71, impressions: 5200, clicks: 680, sales: 12, cpc: 8.50, earnings: 7784.52, costs: 5780.00, profitLoss: 2004.52, roi: 34.7 },
];

export const mockWeeklyResults: WeeklyResult[] = [
  { id: '1', week: 'S1', year: 2025, month: 'Janeiro', period: '05/01 - 11/01', campaignCosts: 635.31, sales: 8, campaignEarnings: 1014.74, organicEarnings: 876.08, adsenseEarnings: 130.00, revenue: 2020.82, profitLoss: 1385.51 },
  { id: '2', week: 'S2', year: 2025, month: 'Janeiro', period: '12/01 - 18/01', campaignCosts: 1179.33, sales: 9, campaignEarnings: 562.74, organicEarnings: 718.44, adsenseEarnings: 126.00, revenue: 1407.18, profitLoss: 227.85 },
  { id: '3', week: 'S34', year: 2025, month: 'Agosto', period: '24/08 - 30/08', campaignCosts: 2128.94, sales: 28, campaignEarnings: 5538.22, organicEarnings: 932.39, adsenseEarnings: 100.00, revenue: 6570.61, profitLoss: 4441.67 },
  { id: '4', week: 'S44', year: 2025, month: 'Novembro', period: '02/11 - 08/11', campaignCosts: 3526.47, sales: 12, campaignEarnings: 6862.84, organicEarnings: 163.46, adsenseEarnings: 75.00, revenue: 7101.31, profitLoss: 3574.84 },
  { id: '5', week: 'S51', year: 2025, month: 'Dezembro', period: '21/12 - 27/12', campaignCosts: 2696.45, sales: 9, campaignEarnings: 7078.50, organicEarnings: 97.80, adsenseEarnings: 65.00, revenue: 7241.30, profitLoss: 4544.85 },
  { id: '6', week: 'S52', year: 2025, month: 'Dezembro', period: '28/12 - 03/01', campaignCosts: 6041.25, sales: 15, campaignEarnings: 9001.70, organicEarnings: 462.76, adsenseEarnings: 0, revenue: 9464.46, profitLoss: 3423.21 },
];

export const mockIncomeExpenses: IncomeExpense[] = [
  // Income 2025
  { id: '1', type: 'income', year: 2025, month: 'Janeiro', date: '2025-01-31', source: 'Campanhas', details: 'Google ads', amount: 4820.40 },
  { id: '2', type: 'income', year: 2025, month: 'Janeiro', date: '2025-01-31', source: 'Orgânico', details: 'Youtube/Instagram', amount: 2548.63 },
  { id: '3', type: 'income', year: 2025, month: 'Janeiro', date: '2025-01-31', source: 'Adsense', details: 'Canal Youtube', amount: 589.00 },
  { id: '4', type: 'income', year: 2025, month: 'Agosto', date: '2025-08-31', source: 'Campanhas', details: 'Google ads', amount: 14284.25 },
  { id: '5', type: 'income', year: 2025, month: 'Agosto', date: '2025-08-31', source: 'Orgânico', details: 'Youtube/Instagram', amount: 2015.46 },
  { id: '6', type: 'income', year: 2025, month: 'Dezembro', date: '2025-12-31', source: 'Campanhas', details: 'Google ads', amount: 17571.78 },
  // Expenses 2025
  { id: '7', type: 'expense', year: 2025, month: 'Janeiro', date: '2025-01-31', source: 'Tráfego Pago', details: 'Google ads', amount: 3931.03 },
  { id: '8', type: 'expense', year: 2025, month: 'Agosto', date: '2025-08-31', source: 'Tráfego Pago', details: 'Google ads', amount: 5450.19 },
  { id: '9', type: 'expense', year: 2025, month: 'Setembro', date: '2025-09-30', source: 'Mentorias', details: 'Mentoria Celis', amount: 2500.00 },
  { id: '10', type: 'expense', year: 2025, month: 'Outubro', date: '2025-10-31', source: 'Ferramentas', details: 'Ratoeira ads', amount: 1212.30 },
  { id: '11', type: 'expense', year: 2025, month: 'Dezembro', date: '2025-12-31', source: 'Tráfego Pago', details: 'Google ads', amount: 13763.01 },
];

export const mockCashFlow2025 = {
  year: 2025,
  totalIncome: 117745.77,
  totalExpenses: 72976.38,
  totalProfit: 44769.39,
  months: [
    { month: 'Janeiro', income: 8120.33, expenses: 4322.53, balance: 3797.80, accumulatedBalance: 3797.80 },
    { month: 'Fevereiro', income: 5606.75, expenses: 2414.84, balance: 3191.91, accumulatedBalance: 6989.71 },
    { month: 'Março', income: 5378.47, expenses: 2007.66, balance: 3370.81, accumulatedBalance: 10360.52 },
    { month: 'Abril', income: 2938.21, expenses: 125.57, balance: 2812.64, accumulatedBalance: 13173.16 },
    { month: 'Maio', income: 2933.65, expenses: 896.61, balance: 2037.04, accumulatedBalance: 15210.21 },
    { month: 'Junho', income: 5596.48, expenses: 2787.15, balance: 2809.33, accumulatedBalance: 18019.54 },
    { month: 'Julho', income: 10366.19, expenses: 5169.64, balance: 5196.55, accumulatedBalance: 23216.09 },
    { month: 'Agosto', income: 16669.71, expenses: 5611.35, balance: 11058.36, accumulatedBalance: 34274.45 },
    { month: 'Setembro', income: 13849.32, expenses: 9896.13, balance: 3953.19, accumulatedBalance: 38227.63 },
    { month: 'Outubro', income: 14184.84, expenses: 15279.47, balance: -1094.63, accumulatedBalance: 37133.01 },
    { month: 'Novembro', income: 13685.52, expenses: 10339.75, balance: 3345.77, accumulatedBalance: 40478.78 },
    { month: 'Dezembro', income: 18416.29, expenses: 14125.68, balance: 4290.61, accumulatedBalance: 44769.39 },
  ],
  incomeBreakdown: {
    campaigns: 95874.10,
    organic: 14500.31,
    adsense: 6975.32,
    other: 396.04,
  },
  expenseBreakdown: {
    paidTraffic: 66610.15,
    courses: 311.50,
    tools: 2524.13,
    accounting: 950.60,
    mentoring: 2500.00,
    equipment: 80.00,
    other: 0,
  }
};

export const getBusinessLevel = (profit: number): { level: string; message: string; color: string } => {
  if (profit < 0) {
    return { 
      level: 'NÍVEL INVESTIDOR', 
      message: 'Você ainda está negativo, mas não desista! Você está apenas começando, continue investindo!',
      color: 'destructive'
    };
  } else if (profit === 0) {
    return { 
      level: 'NÍVEL BREAKEVEN', 
      message: 'Parabéns pelo seu avanço! Você alcançou o ponto de equilíbrio.',
      color: 'warning'
    };
  } else if (profit > 0 && profit < 60000) {
    return { 
      level: 'NÍVEL PAYBACK', 
      message: 'Parabéns! Seus resultados geram lucro, mas você ainda não atingiu a independência financeira!',
      color: 'info'
    };
  } else {
    return { 
      level: 'NÍVEL RETIRADA', 
      message: 'Pode comemorar! Você é oficialmente um Liberto!',
      color: 'success'
    };
  }
};
