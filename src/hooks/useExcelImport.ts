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
  // Based on log: "data produto n° ... nome do produto plataforma país moeda ticket médio comissão % comissão em r$"
  const parseProducts = (sheet: XLSX.WorkSheet): Product[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const products: Product[] = [];
    
    // Find header row by looking for key column headers
    let headerRowIndex = -1;
    let colMap: { [key: string]: number } = {};
    
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      // Map all column indices in this row
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase().trim();
        if (cell === 'data' && colMap['date'] === undefined) colMap['date'] = j;
        if (cell.includes('produto n') || cell === 'produto nº') colMap['productNumber'] = j;
        if (cell === 'nome do produto') colMap['name'] = j;
        if (cell === 'plataforma') colMap['platform'] = j;
        if (cell === 'país') colMap['country'] = j;
        if (cell === 'moeda') colMap['currency'] = j;
        if (cell === 'ticket médio') colMap['averageTicket'] = j;
        if (cell === 'comissão %') colMap['commissionPercent'] = j;
        if (cell === 'comissão em r$') colMap['commissionBRL'] = j;
      }
      
      // Check if we found the key columns
      if (colMap['name'] !== undefined && colMap['averageTicket'] !== undefined) {
        headerRowIndex = i;
        break;
      }
    }
    
    console.log('Products - Header row index:', headerRowIndex, 'Column map:', colMap);
    
    if (headerRowIndex < 0 || colMap['name'] === undefined) {
      console.log('Products - Could not find header row');
      return products;
    }
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Get product number - try mapped column or detect from name position
      let productNumber = 0;
      if (colMap['productNumber'] !== undefined) {
        productNumber = parseNumber(row[colMap['productNumber']]);
      } else {
        // Try column before name
        productNumber = parseNumber(row[colMap['name'] - 1]);
      }
      
      const name = String(row[colMap['name']] || '').trim();
      if (!name) continue;
      
      // If no product number but has name, assign sequential number
      if (!productNumber) {
        productNumber = products.length + 1;
      }
      
      const currency = colMap['currency'] !== undefined 
        ? String(row[colMap['currency']] || 'Real').trim() 
        : 'Real';
      const averageTicket = colMap['averageTicket'] !== undefined 
        ? parseNumber(row[colMap['averageTicket']]) 
        : 0;
      const commissionPercent = colMap['commissionPercent'] !== undefined 
        ? parsePercentage(row[colMap['commissionPercent']]) 
        : 0;
      const commissionBRL = colMap['commissionBRL'] !== undefined 
        ? parseNumber(row[colMap['commissionBRL']]) 
        : calculateCommissionBRL(averageTicket, commissionPercent, currency);
      
      console.log(`Product ${i}: name=${name}, ticket=${averageTicket}, comm=${commissionPercent}%`);
      
      products.push({
        id: `prod-${i}`,
        date: colMap['date'] !== undefined ? parseExcelDate(row[colMap['date']]) : '',
        productNumber,
        name,
        niche: '',
        platform: colMap['platform'] !== undefined ? String(row[colMap['platform']] || '').trim() : '',
        country: colMap['country'] !== undefined ? String(row[colMap['country']] || 'Brasil').trim() : 'Brasil',
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
  // Based on log: "ano mês 2 mês início da campanha fim da campanha nº de dias rodando nome do produto local estratégia comissão em r$ impressões cliques nº de vendas cpc"
  // Actual columns: Ano | Mês 2 | Mês | Início | Fim | Dias | Nome do Produto | Local | Estratégia | Comissão R$ | Impressões | Cliques | Vendas | CPC | Ganhos | Custos | Lucro | ROI
  const parseCampaigns = (sheet: XLSX.WorkSheet): CampaignResult[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const campaigns: CampaignResult[] = [];
    
    // Find header row and map columns dynamically
    let headerRowIndex = -1;
    let colMap: { [key: string]: number } = {};
    
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      const rowText = row.map((cell: any) => String(cell || '').toLowerCase().trim()).join(' ');
      if (rowText.includes('nome do produto') && rowText.includes('impressões')) {
        headerRowIndex = i;
        // Map column indices
        for (let k = 0; k < row.length; k++) {
          const header = String(row[k] || '').toLowerCase().trim();
          if (header === 'ano') colMap['year'] = k;
          if (header === 'mês' && !colMap['month']) colMap['month'] = k;
          if (header.includes('início')) colMap['startDate'] = k;
          if (header.includes('fim')) colMap['endDate'] = k;
          if (header.includes('dias')) colMap['days'] = k;
          if (header.includes('nome do produto') || header === 'produto') colMap['productName'] = k;
          if (header === 'local') colMap['location'] = k;
          if (header.includes('estratégia')) colMap['strategy'] = k;
          if (header.includes('comissão')) colMap['commission'] = k;
          if (header.includes('impressões')) colMap['impressions'] = k;
          if (header.includes('cliques')) colMap['clicks'] = k;
          if (header.includes('vendas')) colMap['sales'] = k;
          if (header === 'cpc') colMap['cpc'] = k;
          if (header.includes('ganhos') || header.includes('receita')) colMap['earnings'] = k;
          if (header.includes('custos') || header.includes('despesa')) colMap['costs'] = k;
          if (header.includes('lucro') || header.includes('prejuízo')) colMap['profitLoss'] = k;
          if (header === 'roi' || header === 'roi %') colMap['roi'] = k;
        }
        break;
      }
    }
    
    console.log('Campaigns - Header row index:', headerRowIndex, 'Column map:', colMap);
    
    if (headerRowIndex < 0) {
      console.log('Campaigns - Could not find header row');
      return campaigns;
    }
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Get year - try year column first, then extract from date
      let year = parseNumber(row[colMap['year'] ?? 0]);
      if (!year || year < 2000 || year > 2100) {
        const startDateStr = parseExcelDate(row[colMap['startDate']]);
        if (startDateStr && startDateStr.includes('-')) {
          year = parseInt(startDateStr.substring(0, 4));
        }
      }
      if (!year || year < 2000) continue;
      
      // Get month
      const monthStr = String(row[colMap['month'] ?? 2] || '').toLowerCase().trim();
      const monthNumber = getMonthNumber(monthStr);
      if (!monthNumber) continue;
      
      // Get product name
      const productName = String(row[colMap['productName']] || '').trim();
      if (!productName) continue;
      
      const startDateStr = parseExcelDate(row[colMap['startDate']]);
      const endDateStr = parseExcelDate(row[colMap['endDate']]);
      
      const earnings = parseNumber(row[colMap['earnings']]);
      const costs = parseNumber(row[colMap['costs']]);
      const clicks = parseNumber(row[colMap['clicks']]);
      const profitLoss = parseNumber(row[colMap['profitLoss']]) || (earnings - costs);
      const roi = parsePercentage(row[colMap['roi']]) || (costs > 0 ? ((earnings - costs) / costs) * 100 : 0);
      
      campaigns.push({
        id: `camp-${campaigns.length + 1}`,
        year,
        monthNumber,
        month: capitalize(monthStr.split('/')[0]),
        startDate: startDateStr,
        endDate: endDateStr,
        daysRunning: parseNumber(row[colMap['days']]),
        productName,
        niche: '',
        location: String(row[colMap['location']] || 'Brasil').trim(),
        strategy: String(row[colMap['strategy']] || 'Pesquisa').trim(),
        commissionBRL: parseNumber(row[colMap['commission']]),
        impressions: parseNumber(row[colMap['impressions']]),
        clicks,
        sales: parseNumber(row[colMap['sales']]),
        cpc: parseNumber(row[colMap['cpc']]) || (clicks > 0 ? costs / clicks : 0),
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
  // Based on log: "ano mês 2 mês data fonte da receita detalhamento valor r$ ano mês 2 mês data fonte da despesa detalhamento valor r$"
  // Structure: Ano | Mês2 | Mês | Data | Fonte | Detalhamento | Valor
  const parseIncomeExpenses = (sheet: XLSX.WorkSheet): IncomeExpense[] => {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    const items: IncomeExpense[] = [];
    
    // Find header row and map columns directly by finding "fonte da receita" and "fonte da despesa"
    let headerRowIndex = -1;
    let incomeFonteCol = -1;
    let expenseFonteCol = -1;
    
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (!row) continue;
      
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase().trim();
        if (cell.includes('fonte da receita') && incomeFonteCol < 0) {
          headerRowIndex = i;
          incomeFonteCol = j;
        }
        if (cell.includes('fonte da despesa') && expenseFonteCol < 0) {
          expenseFonteCol = j;
        }
      }
      if (headerRowIndex >= 0 && incomeFonteCol >= 0 && expenseFonteCol >= 0) break;
    }
    
    console.log('IncomeExpenses - Header row:', headerRowIndex, 'Income fonte col:', incomeFonteCol, 'Expense fonte col:', expenseFonteCol);
    
    if (headerRowIndex < 0 || incomeFonteCol < 0) {
      console.log('IncomeExpenses - Could not find header row');
      return items;
    }
    
    // Calculate column positions relative to "fonte" column
    // Structure: Ano(-4) | Mês2(-3) | Mês(-2) | Data(-1) | Fonte(0) | Detalhamento(+1) | Valor(+2)
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      // Parse income using incomeFonteCol as reference
      const incomeYear = parseNumber(row[incomeFonteCol - 4]);
      const incomeMonthStr = String(row[incomeFonteCol - 2] || '').toLowerCase().trim();
      const incomeMonthNum = getMonthNumber(incomeMonthStr);
      const incomeSource = String(row[incomeFonteCol] || '').trim();
      const incomeAmount = parseNumber(row[incomeFonteCol + 2]);
      
      console.log(`Row ${i} Income: year=${incomeYear}, month=${incomeMonthStr}, source=${incomeSource}, amount=${incomeAmount}`);
      
      if (incomeYear >= 2000 && incomeMonthNum && incomeSource && incomeAmount > 0) {
        items.push({
          id: `income-${items.length + 1}`,
          type: 'income',
          year: incomeYear,
          month: capitalize(incomeMonthStr.split('/')[0]),
          date: parseExcelDate(row[incomeFonteCol - 1]),
          source: incomeSource,
          details: String(row[incomeFonteCol + 1] || '').trim(),
          amount: incomeAmount,
        });
      }
      
      // Parse expenses using expenseFonteCol as reference
      if (expenseFonteCol >= 0) {
        const expenseYear = parseNumber(row[expenseFonteCol - 4]);
        const expenseMonthStr = String(row[expenseFonteCol - 2] || '').toLowerCase().trim();
        const expenseMonthNum = getMonthNumber(expenseMonthStr);
        const expenseSource = String(row[expenseFonteCol] || '').trim();
        const expenseAmount = parseNumber(row[expenseFonteCol + 2]);
        
        if (expenseYear >= 2000 && expenseMonthNum && expenseSource && expenseAmount > 0) {
          items.push({
            id: `expense-${items.length + 1}`,
            type: 'expense',
            year: expenseYear,
            month: capitalize(expenseMonthStr.split('/')[0]),
            date: parseExcelDate(row[expenseFonteCol - 1]),
            source: expenseSource,
            details: String(row[expenseFonteCol + 1] || '').trim(),
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
