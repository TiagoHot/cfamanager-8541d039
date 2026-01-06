import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Product, CampaignResult, WeeklyResult, IncomeExpense, CURRENCY_RATES } from '@/types';

export type ImportDataType = 'products' | 'campaigns' | 'weekly' | 'income' | 'expenses';

interface ImportResult {
  products: Product[];
  campaigns: CampaignResult[];
  weekly: WeeklyResult[];
  incomeExpenses: IncomeExpense[];
}

const parseExcelDate = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  if (typeof value === 'string') {
    const parts = value.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return String(value);
};

const parseNumber = (value: any): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[R$€$\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const calculateCommissionBRL = (
  averageTicket: number,
  commissionPercent: number,
  currency: string
): number => {
  const commission = averageTicket * (commissionPercent / 100);
  const rate = CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES] || 1;
  return commission * rate;
};

export const useExcelImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const parseProducts = (sheet: XLSX.WorkSheet): Product[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const products: Product[] = [];
    
    // Skip header row, find data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[1]) continue; // Skip empty rows
      
      const currency = row[6] || 'Real';
      const averageTicket = parseNumber(row[7]);
      const commissionPercent = parseNumber(row[8]);
      
      products.push({
        id: String(i),
        date: parseExcelDate(row[0]),
        productNumber: parseNumber(row[1]),
        name: String(row[2] || ''),
        niche: String(row[3] || ''),
        platform: String(row[4] || ''),
        country: String(row[5] || 'Brasil'),
        currency,
        averageTicket,
        commissionPercent,
        commissionBRL: calculateCommissionBRL(averageTicket, commissionPercent, currency),
      });
    }
    
    return products.filter(p => p.name);
  };

  const parseCampaigns = (sheet: XLSX.WorkSheet): CampaignResult[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const campaigns: CampaignResult[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;
      
      const earnings = parseNumber(row[15]);
      const costs = parseNumber(row[16]);
      const clicks = parseNumber(row[12]);
      
      campaigns.push({
        id: String(i),
        year: parseNumber(row[0]),
        monthNumber: parseNumber(row[1]),
        month: String(row[2] || ''),
        startDate: parseExcelDate(row[3]),
        endDate: parseExcelDate(row[4]),
        daysRunning: parseNumber(row[5]),
        productName: String(row[6] || ''),
        niche: String(row[7] || ''),
        location: String(row[8] || 'Brasil'),
        strategy: String(row[9] || 'Pesquisa'),
        commissionBRL: parseNumber(row[10]),
        impressions: parseNumber(row[11]),
        clicks,
        sales: parseNumber(row[13]),
        cpc: clicks > 0 ? costs / clicks : 0,
        earnings,
        costs,
        profitLoss: earnings - costs,
        roi: costs > 0 ? ((earnings - costs) / costs) * 100 : -100,
      });
    }
    
    return campaigns.filter(c => c.productName);
  };

  const parseWeekly = (sheet: XLSX.WorkSheet): WeeklyResult[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const results: WeeklyResult[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;
      
      const campaignCosts = parseNumber(row[4]);
      const campaignEarnings = parseNumber(row[6]);
      const organicEarnings = parseNumber(row[7]);
      const adsenseEarnings = parseNumber(row[8]);
      const revenue = campaignEarnings + organicEarnings + adsenseEarnings;
      
      results.push({
        id: String(i),
        week: String(row[0] || ''),
        year: parseNumber(row[1]),
        month: String(row[2] || ''),
        period: String(row[3] || ''),
        campaignCosts,
        sales: parseNumber(row[5]),
        campaignEarnings,
        organicEarnings,
        adsenseEarnings,
        revenue,
        profitLoss: revenue - campaignCosts,
      });
    }
    
    return results.filter(r => r.week);
  };

  const parseIncomeExpenses = (sheet: XLSX.WorkSheet, type: 'income' | 'expense'): IncomeExpense[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const items: IncomeExpense[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;
      
      items.push({
        id: String(i),
        type,
        year: parseNumber(row[0]),
        month: String(row[2] || ''),
        date: parseExcelDate(row[3]),
        source: String(row[4] || ''),
        details: String(row[5] || ''),
        amount: parseNumber(row[6]),
      });
    }
    
    return items.filter(item => item.amount > 0);
  };

  const importFromFile = async (file: File): Promise<ImportResult> => {
    setIsImporting(true);
    setError(null);
    setProgress(0);

    try {
      const buffer = await file.arrayBuffer();
      setProgress(20);
      
      const workbook = XLSX.read(buffer, { type: 'array' });
      setProgress(40);
      
      const result: ImportResult = {
        products: [],
        campaigns: [],
        weekly: [],
        incomeExpenses: [],
      };

      // Parse each sheet based on expected structure
      const sheetNames = workbook.SheetNames;
      
      // Sheet 1: Produtos (Products)
      if (sheetNames[0]) {
        result.products = parseProducts(workbook.Sheets[sheetNames[0]]);
        setProgress(50);
      }
      
      // Sheet 2: Resultados Campanhas (Campaign Results)
      if (sheetNames[1]) {
        result.campaigns = parseCampaigns(workbook.Sheets[sheetNames[1]]);
        setProgress(60);
      }
      
      // Sheet 3: Resultados Semanais (Weekly Results)
      if (sheetNames[2]) {
        result.weekly = parseWeekly(workbook.Sheets[sheetNames[2]]);
        setProgress(70);
      }
      
      // Sheet 4: Receitas & Despesas (Income & Expenses)
      if (sheetNames[3]) {
        const incomeSheet = workbook.Sheets[sheetNames[3]];
        result.incomeExpenses = [
          ...parseIncomeExpenses(incomeSheet, 'income'),
        ];
        setProgress(80);
      }

      // Check if there's a separate expenses section or sheet
      if (sheetNames[4]) {
        result.incomeExpenses = [
          ...result.incomeExpenses,
          ...parseIncomeExpenses(workbook.Sheets[sheetNames[4]], 'expense'),
        ];
      }
      
      setProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar arquivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importFromFile,
    isImporting,
    progress,
    error,
  };
};
