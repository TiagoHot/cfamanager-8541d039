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
    // Handle dd/mm/yy or mm/dd/yy format
    const parts = value.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) {
        year = parseInt(year) > 50 ? '19' + year : '20' + year;
      }
      return `${year}-${month}-${day}`;
    }
  }
  return String(value);
};

const parseNumber = (value: any): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  // Remove R$, €, $, spaces, and handle Brazilian number format
  const cleaned = String(value)
    .replace(/[R$€$\s]/g, '')
    .replace(/\./g, '') // Remove thousand separators
    .replace(',', '.') // Convert decimal separator
    .replace(/-$/, '') // Handle trailing negative sign
    .trim();
  
  // Handle percentage
  if (String(value).includes('%')) {
    return parseFloat(cleaned.replace('%', '')) || 0;
  }
  
  return parseFloat(cleaned) || 0;
};

const parsePercentage = (value: any): number => {
  if (!value) return 0;
  if (typeof value === 'number') {
    // If already a decimal (0.5 = 50%), convert to percentage
    return value > 1 ? value : value * 100;
  }
  const cleaned = String(value).replace('%', '').replace(',', '.').trim();
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

  // Page 1: Análise de Produtos
  // Columns: Data | Produto N° | Nome | Plataforma | País | Moeda | Ticket Médio | Comissão % | Comissão R$
  // Data starts at row 5 (0-indexed: row 4), header is at row 4 (0-indexed: row 3)
  const parseProducts = (sheet: XLSX.WorkSheet): Product[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const products: Product[] = [];
    
    // Find the header row that contains "Data" and "Nome do Produto"
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some((cell: any) => String(cell).includes('Nome do Produto') || String(cell).includes('Data'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    // Data starts after header
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[1] || !row[2]) continue; // Skip if no product number or name
      
      // Skip if product number is not a valid number
      const productNumber = parseNumber(row[1]);
      if (productNumber === 0 || isNaN(productNumber)) continue;
      
      const name = String(row[2] || '').trim();
      if (!name) continue;
      
      const currency = String(row[5] || 'Real').trim();
      const averageTicket = parseNumber(row[6]);
      const commissionPercent = parsePercentage(row[7]);
      
      products.push({
        id: String(i),
        date: parseExcelDate(row[0]),
        productNumber,
        name,
        niche: '', // Not in this spreadsheet
        platform: String(row[3] || '').trim(),
        country: String(row[4] || 'Brasil').trim(),
        currency,
        averageTicket,
        commissionPercent,
        commissionBRL: parseNumber(row[8]) || calculateCommissionBRL(averageTicket, commissionPercent, currency),
      });
    }
    
    return products;
  };

  // Page 2: Controle dos Resultados
  // Columns: Mês | Início | Fim | Dias | Produto | Local | Estratégia | Comissão R$ | Impressões | Cliques | Vendas | CPC | Ganhos | Custos | Lucro | ROI
  const parseCampaigns = (sheet: XLSX.WorkSheet): CampaignResult[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const campaigns: CampaignResult[] = [];
    
    // Find header row
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some((cell: any) => String(cell).includes('Nome do Produto') || String(cell).includes('Mês'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    const monthNames: { [key: string]: number } = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
      'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
      'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    };
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0] || !row[4]) continue; // Skip if no month or product
      
      const monthStr = String(row[0] || '').toLowerCase().trim();
      if (!monthNames[monthStr]) continue; // Skip invalid months
      
      const productName = String(row[4] || '').trim();
      if (!productName) continue;
      
      const startDateStr = parseExcelDate(row[1]);
      const year = startDateStr ? parseInt(startDateStr.substring(0, 4)) : 2024;
      
      const earnings = parseNumber(row[12]);
      const costs = parseNumber(row[13]);
      const clicks = parseNumber(row[9]);
      
      campaigns.push({
        id: String(campaigns.length + 1),
        year,
        monthNumber: monthNames[monthStr],
        month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
        startDate: startDateStr,
        endDate: parseExcelDate(row[2]),
        daysRunning: parseNumber(row[3]),
        productName,
        niche: '',
        location: String(row[5] || 'Brasil').trim(),
        strategy: String(row[6] || 'Pesquisa').trim(),
        commissionBRL: parseNumber(row[7]),
        impressions: parseNumber(row[8]),
        clicks,
        sales: parseNumber(row[10]),
        cpc: parseNumber(row[11]) || (clicks > 0 ? costs / clicks : 0),
        earnings,
        costs,
        profitLoss: parseNumber(row[14]) || (earnings - costs),
        roi: parsePercentage(row[15]) || (costs > 0 ? ((earnings - costs) / costs) * 100 : -100),
      });
    }
    
    return campaigns;
  };

  // Page 3: Resultados da Semana
  // Columns: Semana | Ano | Mês | Período | Custo Campanhas | N° vendas | Ganhos Campanhas | Ganhos Orgânico | Adsense | Faturamento | Lucro
  const parseWeekly = (sheet: XLSX.WorkSheet): WeeklyResult[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const results: WeeklyResult[] = [];
    
    // Find header row
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some((cell: any) => String(cell).includes('Semana') && String(cell) !== 'Resultados da Semana')) {
        headerRowIndex = i;
        break;
      }
    }
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row[0]) continue;
      
      const week = String(row[0] || '').trim();
      // Skip summary rows or empty weeks
      if (!week || !week.startsWith('S')) continue;
      
      const year = parseNumber(row[1]);
      if (!year || year < 2000) continue; // Skip invalid years
      
      const campaignCosts = parseNumber(row[4]);
      const campaignEarnings = parseNumber(row[6]);
      const organicEarnings = parseNumber(row[7]);
      const adsenseEarnings = parseNumber(row[8]);
      const revenue = parseNumber(row[9]) || (campaignEarnings + organicEarnings + adsenseEarnings);
      
      results.push({
        id: String(results.length + 1),
        week,
        year,
        month: String(row[2] || '').trim(),
        period: String(row[3] || '').trim(),
        campaignCosts,
        sales: parseNumber(row[5]),
        campaignEarnings,
        organicEarnings,
        adsenseEarnings,
        revenue,
        profitLoss: parseNumber(row[10]) || (revenue - campaignCosts),
      });
    }
    
    return results;
  };

  // Page 4: Receitas e Despesas
  // Layout: Receitas (cols 0-4) | gap | Despesas (cols 6-10)
  // Receitas: Mês | Data | Fonte | Detalhamento | Valor
  // Despesas: Mês | Data | Fonte | Detalhamento | Valor
  const parseIncomeExpenses = (sheet: XLSX.WorkSheet): IncomeExpense[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const items: IncomeExpense[] = [];
    
    // Find header row
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some((cell: any) => String(cell).includes('Fonte da Receita'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    const monthNames: { [key: string]: number } = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
      'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
      'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    };
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Parse income (left side: columns 0-4)
      const incomeMonth = String(row[0] || '').toLowerCase().trim();
      if (incomeMonth && monthNames[incomeMonth]) {
        const incomeAmount = parseNumber(row[4]);
        if (incomeAmount > 0) {
          const dateStr = parseExcelDate(row[1]);
          const year = dateStr ? parseInt(dateStr.substring(0, 4)) : 2024;
          
          items.push({
            id: `income-${items.length + 1}`,
            type: 'income',
            year,
            month: incomeMonth.charAt(0).toUpperCase() + incomeMonth.slice(1),
            date: dateStr,
            source: String(row[2] || '').trim(),
            details: String(row[3] || '').trim(),
            amount: incomeAmount,
          });
        }
      }
      
      // Parse expenses (right side: columns 6-10)
      const expenseMonth = String(row[6] || '').toLowerCase().trim();
      if (expenseMonth && monthNames[expenseMonth]) {
        const expenseAmount = parseNumber(row[10]);
        if (expenseAmount > 0) {
          const dateStr = parseExcelDate(row[7]);
          const year = dateStr ? parseInt(dateStr.substring(0, 4)) : 2024;
          
          items.push({
            id: `expense-${items.length + 1}`,
            type: 'expense',
            year,
            month: expenseMonth.charAt(0).toUpperCase() + expenseMonth.slice(1),
            date: dateStr,
            source: String(row[8] || '').trim(),
            details: String(row[9] || '').trim(),
            amount: expenseAmount,
          });
        }
      }
    }
    
    return items;
  };

  // Detect sheet type by analyzing headers and content
  const detectSheetType = (sheet: XLSX.WorkSheet): 'products' | 'campaigns' | 'weekly' | 'incomeExpenses' | 'unknown' => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    // Check first 15 rows for identifying headers
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      const rowText = row.map((cell: any) => String(cell || '').toLowerCase()).join(' ');
      
      // Income/Expenses: Has "Fonte da Receita" or "Fonte da Despesa" (check first - most specific)
      if (rowText.includes('fonte da receita') || rowText.includes('fonte da despesa') || 
          rowText.includes('receitas e despesas')) {
        return 'incomeExpenses';
      }
      
      // Weekly: Has "Semana" column with "Ano", "Período", "Custo Campanhas" or "Ganhos Orgânico"
      if ((rowText.includes('semana') && rowText.includes('ano') && rowText.includes('período')) ||
          (rowText.includes('custo campanhas') || rowText.includes('ganhos orgânico') || rowText.includes('adsense'))) {
        return 'weekly';
      }
      
      // Products: Has "Ticket Médio", "Comissão %", or "Análise de Produtos"
      if (rowText.includes('ticket médio') || rowText.includes('comissão %') || 
          rowText.includes('análise de produtos') ||
          (rowText.includes('nome do produto') && rowText.includes('plataforma') && !rowText.includes('início'))) {
        return 'products';
      }
      
      // Campaigns: Has "Início" + "Fim" + "Estratégia" OR "Impressões" + "Cliques" + "ROI"
      // Also check for "Controle dos Resultados"
      if (rowText.includes('controle dos resultados') ||
          (rowText.includes('início') && rowText.includes('fim') && rowText.includes('estratégia')) ||
          (rowText.includes('impressões') && rowText.includes('cliques') && rowText.includes('roi')) ||
          (rowText.includes('mês') && rowText.includes('produto') && rowText.includes('local') && rowText.includes('estratégia'))) {
        return 'campaigns';
      }
    }
    
    return 'unknown';
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

      const sheetNames = workbook.SheetNames;
      console.log('Sheet names found:', sheetNames);
      
      const progressPerSheet = 50 / sheetNames.length;
      
      // Process each sheet by detecting its type from headers
      for (let i = 0; i < sheetNames.length; i++) {
        const sheetName = sheetNames[i];
        const sheet = workbook.Sheets[sheetName];
        const sheetType = detectSheetType(sheet);
        
        console.log(`Sheet "${sheetName}" detected as: ${sheetType}`);
        
        switch (sheetType) {
          case 'products':
            const products = parseProducts(sheet);
            if (products.length > 0) {
              result.products = [...result.products, ...products];
              console.log(`Products parsed from "${sheetName}":`, products.length);
            }
            break;
            
          case 'campaigns':
            const campaigns = parseCampaigns(sheet);
            if (campaigns.length > 0) {
              result.campaigns = [...result.campaigns, ...campaigns];
              console.log(`Campaigns parsed from "${sheetName}":`, campaigns.length);
            }
            break;
            
          case 'weekly':
            const weekly = parseWeekly(sheet);
            if (weekly.length > 0) {
              result.weekly = [...result.weekly, ...weekly];
              console.log(`Weekly results parsed from "${sheetName}":`, weekly.length);
            }
            break;
            
          case 'incomeExpenses':
            const incomeExpenses = parseIncomeExpenses(sheet);
            if (incomeExpenses.length > 0) {
              result.incomeExpenses = [...result.incomeExpenses, ...incomeExpenses];
              console.log(`Income/Expenses parsed from "${sheetName}":`, incomeExpenses.length);
            }
            break;
            
          default:
            console.log(`Sheet "${sheetName}" type not recognized, skipping`);
        }
        
        setProgress(40 + (i + 1) * progressPerSheet);
      }
      
      setProgress(100);
      return result;
    } catch (err) {
      console.error('Import error:', err);
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
