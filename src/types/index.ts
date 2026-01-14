export interface Product {
  id: string;
  date: string;
  productNumber: number;
  name: string;
  type: string; // New field for product type (e.g., Nutra, Infoproduto)
  niche: string; // Changed from optional to required string
  platform: string;
  country: string;
  currency: string;
  averageTicket: number;
  commissionPercent: number;
  commissionBRL: number;
  notes: string; // New field for quick notes
}

export interface CampaignResult {
  id: string;
  year: number;
  monthNumber: number;
  month: string;
  startDate: string;
  endDate: string;
  daysRunning: number;
  productName: string;
  niche?: string;
  location: string;
  strategy: string;
  commissionBRL: number;
  impressions: number;
  clicks: number;
  sales: number;
  cpc: number;
  earnings: number;
  costs: number;
  profitLoss: number;
  roi: number;
}

export interface WeeklyResult {
  id: string;
  week: string;
  year: number;
  month: string;
  period: string;
  campaignCosts: number;
  sales: number;
  campaignEarnings: number;
  organicEarnings: number;
  adsenseEarnings: number;
  revenue: number;
  profitLoss: number;
}

export interface IncomeExpense {
  id: string;
  type: 'income' | 'expense';
  year: number;
  month: string;
  date: string;
  source: string;
  details: string;
  amount: number;
}

export interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  accumulatedBalance: number;
  incomeBySource: {
    campaigns: number;
    organic: number;
    adsense: number;
    other: number;
  };
  expensesBySource: {
    paidTraffic: number;
    courses: number;
    tools: number;
    accounting: number;
    other: number;
  };
}

export type BusinessLevel = 'INVESTIDOR' | 'BREAKEVEN' | 'PAYBACK' | 'RETIRADA';

// Default lists moved to useSettings, but keeping CURRENCY_RATES and MONTHS here
export const CURRENCY_RATES = {
  'Real': 1,
  'Dólar': 5.4059,
  'Euro': 6.3384
};

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Default values for settings management
export const DEFAULT_PLATFORMS = [
  'Hotmart', 'Monetizze', 'Eduzz', 'Braip', 'Kiwify', 
  'ClickBank', 'BuyGoods', 'Digistore24', 'MaxWebb', 
  'Gurumedia', 'Terra Leads', 'Media Scalers', 'Doppus'
];

export const INCOME_SOURCES = [
  'Campanhas', 'Orgânico', 'Mentorias', 'Prestação de Serviço',
  'Rendimentos', 'Salário', 'Investimentos', 'Adsense', 'Outras Receitas'
];

export const EXPENSE_SOURCES = [
  'Tráfego Pago', 'Cursos', 'Ferramentas', 'Eventos',
  'Equipamentos', 'Contabilidade', 'Internet', 'Mentorias', 'Outras Despesas'
];

export const NICHES = [
  'Articulação',
  'Diabetes',
  'Disfunção Erétil',
  'Edema',
  'Emagrecimento',
  'Energia',
  'Fungus',
  'Herpes',
  'Insônia',
  'Memória',
  'Nervos',
  'Outro',
  'Próstata',
  'Saúde Bucal',
  'Saúde Cardiovascular',
  'Saúde da Pele',
  'Saúde dos Pets',
  'Saúde Feminina',
  'Saúde Intestinal',
  'Tinnitus',
  'Vertigem',
  'Visão'
];

export const PRODUCT_TYPES = [
  'Nutra', 'Digital', 'Ecommerce'
];