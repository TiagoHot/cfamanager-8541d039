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

// Parse Excel serial date or string date to YYYY-MM-DD format
const parseExcelDate = (value: any): string => {
  if (!value) return '';
  
  // Excel serial number date
  if (typeof value === 'number') {
    try {
      const date = XLSX.SSF.parse_date_code(value);
      if (date && date.y && date.m && date.d) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    } catch (e) {
      console.warn('Failed to parse date:', value);
    }
    return '';
  }
  
  // String date formats
  if (typeof value === 'string') {
    const str = value.trim();
    
    // Handle dd/mm/yy or dd/mm/yyyy format
    const slashParts = str.split('/');
    if (slashParts.length === 3) {
      let day = slashParts[0].padStart(2, '0');
      let month = slashParts[1].padStart(2, '0');
      let year = slashParts[2];
      
      // Handle 2-digit year
      if (year.length === 2) {
        year = parseInt(year) > 50 ? '19' + year : '20' + year;
      }
      
      return `${year}-${month}-${day}`;
    }
    
    // Handle m/d/yy format (US format that Excel sometimes uses)
    const usParts = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (usParts) {
      let month = usParts[1].padStart(2, '0');
      let day = usParts[2].padStart(2, '0');
      let year = usParts[3];
      if (year.length === 2) {
        year = parseInt(year) > 50 ? '19' + year : '20' + year;
      }
      return `${year}-${month}-${day}`;
    }
  }
  
  return String(value);
};

// Parse number handling Brazilian format (R$ 1.234,56)
const parseNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  
  // Handle special values
  if (str === '-' || str === '#DIV/0!' || str === '#VALUE!' || str.toLowerCase() === 'nan') return 0;
  
  // Remove currency symbols and spaces
  let cleaned = str
    .replace(/R\$/g, '')
    .replace(/€/g, '')
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .trim();
  
  // Handle percentage
  if (cleaned.includes('%')) {
    cleaned = cleaned.replace('%', '');
  }
  
  // Handle Brazilian number format (1.234,56 -> 1234.56)
  if (cleaned.includes(',')) {
    // Check if comma is decimal separator (Brazilian format)
    const commaPos = cleaned.lastIndexOf(',');
    const dotPos = cleaned.lastIndexOf('.');
    
    if (commaPos > dotPos) {
      // Comma is decimal separator: 1.234,56 or 234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  }
  
  // Handle negative numbers with trailing minus sign
  if (cleaned.endsWith('-')) {
    cleaned = '-' + cleaned.slice(0, -1);
  }
  
  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
};

// Parse percentage value
const parsePercentage = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  
  if (typeof value === 'number') {
    // If already a decimal less than 1, convert to percentage
    if (value > -1 && value < 1 && value !== 0) {
      return value * 100;
    }
    return value;
  }
  
  const str = String(value).trim();
  if (str === '-' || str === '#DIV/0!' || str === '#VALUE!') return 0;
  
  const cleaned = str.replace('%', '').replace(',', '.').trim();
  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
};

// Calculate commission in BRL based on currency
const calculateCommissionBRL = (
  averageTicket: number,
  commissionPercent: number,
  currency: string
): number => {
  const commission = averageTicket * (commissionPercent / 100);
  const rate = CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES] || 1;
  return commission * rate;
};

// Month name to number mapping
const MONTH_MAP: { [key: string]: number } = {
  'janeiro': 1, 'jan': 1,
  'fevereiro': 2, 'fev': 2,
  'março': 3, 'mar': 3,
  'abril': 4, 'abr': 4,
  'maio': 5, 'mai': 5,
  'junho': 6, 'jun': 6,
  'julho': 7, 'jul': 7,
  'agosto': 8, 'ago': 8,
  'setembro': 9, 'set': 9,
  'outubro': 10, 'out': 10,
  'novembro': 11, 'nov': 11,
  'dezembro': 12, 'dez': 12
};

// Get month number from string
const getMonthNumber = (monthStr: string): number | null => {
  if (!monthStr) return null;
  const normalized = monthStr.toLowerCase().trim();
  
  // Handle compound months like "Jan/Fev" - take the first one
  const parts = normalized.split('/');
  const firstMonth = parts[0].trim();
  
  return MONTH_MAP[firstMonth] || null;
};

// Capitalize first letter
const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const useExcelImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Find header row index by searching for specific keywords
  const findHeaderRow = (data: any[][], keywords: string[]): number => {
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      const rowText = row.map((cell: any) => String(cell || '').toLowerCase()).join(' ');
      const hasKeywords = keywords.some(keyword => rowText.includes(keyword.toLowerCase()));
      
      if (hasKeywords) {
        return i;
      }
    }
    return 0;
  };

  // Page 1: Análise de Produtos
  // Columns: Data | Produto N° | Nome do Produto | Plataforma | País | Moeda | Ticket Médio | Comissão % | Comissão em R$
  const parseProducts = (sheet: XLSX.WorkSheet): Product[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const products: Product[] = [];
    
    const headerRowIndex = findHeaderRow(data, ['nome do produto', 'ticket médio', 'comissão']);
    console.log('Products - Header row index:', headerRowIndex);
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Skip empty rows or rows without product number
      const productNumber = parseNumber(row[1]);
      if (!productNumber || productNumber === 0) continue;
      
      const name = String(row[2] || '').trim();
      if (!name) continue;
      
      const currency = String(row[5] || 'Real').trim();
      const averageTicket = parseNumber(row[6]);
      const commissionPercent = parsePercentage(row[7]);
      const commissionBRL = parseNumber(row[8]) || calculateCommissionBRL(averageTicket, commissionPercent, currency);
      
      products.push({
        id: `prod-${i}`,
        date: parseExcelDate(row[0]),
        productNumber,
        name,
        niche: '',
        platform: String(row[3] || '').trim(),
        country: String(row[4] || 'Brasil').trim(),
        currency,
        averageTicket,
        commissionPercent,
        commissionBRL,
      });
    }
    
    console.log('Products parsed:', products.length);
    return products;
  };

  // Page 2: Controle dos Resultados
  // Columns: Mês | Início | Fim | Dias | Produto | Local | Estratégia | Comissão R$ | Impressões | Cliques | Vendas | CPC | Ganhos | Custos | Lucro | ROI
  // Index:    0  |   1    |  2  |  3   |    4    |   5   |     6      |      7      |     8      |    9    |   10   |  11 |   12   |   13   |  14   |  15
  const parseCampaigns = (sheet: XLSX.WorkSheet): CampaignResult[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const campaigns: CampaignResult[] = [];
    
    const headerRowIndex = findHeaderRow(data, ['mês', 'início', 'impressões', 'cliques', 'roi']);
    console.log('Campaigns - Header row index:', headerRowIndex);
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Get month from first column
      const monthStr = String(row[0] || '').toLowerCase().trim();
      const monthNumber = getMonthNumber(monthStr);
      if (!monthNumber) continue; // Skip if not a valid month
      
      // Get product name from column 4
      const productName = String(row[4] || '').trim();
      if (!productName) continue; // Skip if no product name
      
      // Parse dates and extract year
      const startDateStr = parseExcelDate(row[1]);
      const endDateStr = parseExcelDate(row[2]);
      
      // Extract year from start date
      let year = 2024;
      if (startDateStr && startDateStr.includes('-')) {
        year = parseInt(startDateStr.substring(0, 4));
      }
      
      const earnings = parseNumber(row[12]);
      const costs = parseNumber(row[13]);
      const clicks = parseNumber(row[9]);
      const profitLoss = parseNumber(row[14]) || (earnings - costs);
      const roi = parsePercentage(row[15]) || (costs > 0 ? ((earnings - costs) / costs) * 100 : 0);
      
      campaigns.push({
        id: `camp-${campaigns.length + 1}`,
        year,
        monthNumber,
        month: capitalize(monthStr.split('/')[0]),
        startDate: startDateStr,
        endDate: endDateStr,
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
        profitLoss,
        roi,
      });
    }
    
    console.log('Campaigns parsed:', campaigns.length);
    return campaigns;
  };

  // Page 3: Resultados da Semana
  // Columns: Semana | Ano | Mês | Período | Custo Campanhas | N° vendas | Ganhos Campanhas | Ganhos Orgânico (cursos/ferramentas) | Ganhos Orgânico (adsense YT) | Faturamento | Lucro/Prejuízo
  // Index:     0    |  1  |  2  |    3    |        4        |     5     |        6         |                  7                   |              8               |      9      |      10
  const parseWeekly = (sheet: XLSX.WorkSheet): WeeklyResult[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const results: WeeklyResult[] = [];
    
    const headerRowIndex = findHeaderRow(data, ['semana', 'custo campanhas', 'ganhos campanhas']);
    console.log('Weekly - Header row index:', headerRowIndex);
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Week should start with 'S' (S1, S2, etc.)
      const week = String(row[0] || '').trim();
      if (!week || !week.match(/^S\d+/i)) continue;
      
      // Year should be a valid number
      const year = parseNumber(row[1]);
      if (!year || year < 2000 || year > 2100) continue;
      
      const campaignCosts = parseNumber(row[4]);
      const campaignEarnings = parseNumber(row[6]);
      const organicEarnings = parseNumber(row[7]);
      const adsenseEarnings = parseNumber(row[8]);
      const revenue = parseNumber(row[9]) || (campaignEarnings + organicEarnings + adsenseEarnings);
      const profitLoss = parseNumber(row[10]) || (revenue - campaignCosts);
      
      results.push({
        id: `week-${results.length + 1}`,
        week: week.toUpperCase(),
        year,
        month: String(row[2] || '').trim(),
        period: String(row[3] || '').trim(),
        campaignCosts,
        sales: parseNumber(row[5]),
        campaignEarnings,
        organicEarnings,
        adsenseEarnings,
        revenue,
        profitLoss,
      });
    }
    
    console.log('Weekly results parsed:', results.length);
    return results;
  };

  // Page 4: Receitas e Despesas
  // Layout: Receitas (cols 0-4) | gap | Despesas (cols 6-10)
  // Receitas: Mês | Data | Fonte da Receita | Detalhamento | Valor R$
  // Index:     0  |  1   |        2         |       3      |    4
  // Despesas: Mês | Data | Fonte da Despesa | Detalhamento | Valor R$
  // Index:     6  |  7   |        8         |       9      |   10
  const parseIncomeExpenses = (sheet: XLSX.WorkSheet): IncomeExpense[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const items: IncomeExpense[] = [];
    
    const headerRowIndex = findHeaderRow(data, ['fonte da receita', 'fonte da despesa']);
    console.log('IncomeExpenses - Header row index:', headerRowIndex);
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Parse income (left side: columns 0-4)
      const incomeMonthStr = String(row[0] || '').toLowerCase().trim();
      const incomeMonthNum = getMonthNumber(incomeMonthStr);
      if (incomeMonthNum) {
        const incomeAmount = parseNumber(row[4]);
        if (incomeAmount > 0) {
          const dateStr = parseExcelDate(row[1]);
          let year = 2024;
          if (dateStr && dateStr.includes('-')) {
            year = parseInt(dateStr.substring(0, 4));
          }
          
          items.push({
            id: `income-${items.length + 1}`,
            type: 'income',
            year,
            month: capitalize(incomeMonthStr.split('/')[0]),
            date: dateStr,
            source: String(row[2] || '').trim(),
            details: String(row[3] || '').trim(),
            amount: incomeAmount,
          });
        }
      }
      
      // Parse expenses (right side: columns 6-10)
      const expenseMonthStr = String(row[6] || '').toLowerCase().trim();
      const expenseMonthNum = getMonthNumber(expenseMonthStr);
      if (expenseMonthNum) {
        const expenseAmount = parseNumber(row[10]);
        if (expenseAmount > 0) {
          const dateStr = parseExcelDate(row[7]);
          let year = 2024;
          if (dateStr && dateStr.includes('-')) {
            year = parseInt(dateStr.substring(0, 4));
          }
          
          items.push({
            id: `expense-${items.length + 1}`,
            type: 'expense',
            year,
            month: capitalize(expenseMonthStr.split('/')[0]),
            date: dateStr,
            source: String(row[8] || '').trim(),
            details: String(row[9] || '').trim(),
            amount: expenseAmount,
          });
        }
      }
    }
    
    console.log('IncomeExpenses parsed:', items.length);
    return items;
  };

  // Detect sheet type by analyzing all content in first 25 rows
  const detectSheetType = (sheet: XLSX.WorkSheet, sheetName: string): 'products' | 'campaigns' | 'weekly' | 'incomeExpenses' | 'unknown' => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    // Build text from first 25 rows
    let allText = '';
    for (let i = 0; i < Math.min(25, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      allText += ' ' + row.map((cell: any) => String(cell || '').toLowerCase()).join(' ');
    }
    
    console.log(`Detecting sheet "${sheetName}" - sample:`, allText.substring(0, 300));
    
    // Detection order matters! Check most specific patterns first
    
    // 1. Income/Expenses: Has "Fonte da Receita" or "Fonte da Despesa"
    if (allText.includes('fonte da receita') || allText.includes('fonte da despesa')) {
      console.log(`Sheet "${sheetName}" detected as: incomeExpenses`);
      return 'incomeExpenses';
    }
    
    // 2. Weekly: Has "Resultados da Semana" title OR "Custo Campanhas" + "Ganhos Campanhas"
    if (allText.includes('resultados da semana') || 
        (allText.includes('custo campanhas') && allText.includes('ganhos campanhas'))) {
      console.log(`Sheet "${sheetName}" detected as: weekly`);
      return 'weekly';
    }
    
    // 3. Products: Has "Análise de Produtos" OR "Ticket Médio" with "Comissão"
    if (allText.includes('análise de produtos') || 
        (allText.includes('ticket médio') && (allText.includes('comissão %') || allText.includes('comissão em r$')))) {
      console.log(`Sheet "${sheetName}" detected as: products`);
      return 'products';
    }
    
    // 4. Campaigns: Has "Controle dos Resultados" OR campaign-specific columns
    if (allText.includes('controle dos resultados') ||
        (allText.includes('impressões') && allText.includes('cliques') && allText.includes('roi')) ||
        (allText.includes('início') && allText.includes('fim') && allText.includes('custos') && allText.includes('ganhos'))) {
      console.log(`Sheet "${sheetName}" detected as: campaigns`);
      return 'campaigns';
    }
    
    console.log(`Sheet "${sheetName}" detected as: unknown`);
    return 'unknown';
  };

  const importFromFile = async (file: File): Promise<ImportResult> => {
    setIsImporting(true);
    setError(null);
    setProgress(0);

    try {
      console.log('Starting import for file:', file.name);
      
      const buffer = await file.arrayBuffer();
      setProgress(20);
      
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      setProgress(40);
      
      const result: ImportResult = {
        products: [],
        campaigns: [],
        weekly: [],
        incomeExpenses: [],
      };

      const sheetNames = workbook.SheetNames;
      console.log('Found sheets:', sheetNames);
      
      const progressPerSheet = 50 / sheetNames.length;
      
      // Process each sheet
      for (let i = 0; i < sheetNames.length; i++) {
        const sheetName = sheetNames[i];
        const sheet = workbook.Sheets[sheetName];
        
        console.log(`\n--- Processing sheet: "${sheetName}" ---`);
        
        const sheetType = detectSheetType(sheet, sheetName);
        
        switch (sheetType) {
          case 'products': {
            const products = parseProducts(sheet);
            if (products.length > 0) {
              result.products = [...result.products, ...products];
            }
            break;
          }
          case 'campaigns': {
            const campaigns = parseCampaigns(sheet);
            if (campaigns.length > 0) {
              result.campaigns = [...result.campaigns, ...campaigns];
            }
            break;
          }
          case 'weekly': {
            const weekly = parseWeekly(sheet);
            if (weekly.length > 0) {
              result.weekly = [...result.weekly, ...weekly];
            }
            break;
          }
          case 'incomeExpenses': {
            const incomeExpenses = parseIncomeExpenses(sheet);
            if (incomeExpenses.length > 0) {
              result.incomeExpenses = [...result.incomeExpenses, ...incomeExpenses];
            }
            break;
          }
          default:
            console.log(`Sheet "${sheetName}" skipped (unknown type)`);
        }
        
        setProgress(40 + (i + 1) * progressPerSheet);
      }
      
      console.log('\n=== Import Summary ===');
      console.log('Products:', result.products.length);
      console.log('Campaigns:', result.campaigns.length);
      console.log('Weekly:', result.weekly.length);
      console.log('IncomeExpenses:', result.incomeExpenses.length);
      
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
