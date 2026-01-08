import * as XLSX from 'xlsx';
import { Product, CampaignResult, WeeklyResult, IncomeExpense } from '@/types';

export function exportToExcel(
  data: Product[] | CampaignResult[] | WeeklyResult[] | IncomeExpense[],
  filename: string,
  sheetName: string
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportProducts(products: Product[]) {
  const data = products.map(p => ({
    'N°': p.productNumber,
    'Data': p.date,
    'Nome do Produto': p.name,
    'Plataforma': p.platform,
    'País': p.country,
    'Moeda': p.currency,
    'Ticket Médio': p.averageTicket,
    'Comissão %': p.commissionPercent,
    'Comissão R$': p.commissionBRL,
  }));
  exportToExcel(data as any, 'produtos', 'Produtos');
}

export function exportCampaigns(campaigns: CampaignResult[]) {
  const data = campaigns.map(c => ({
    'Ano': c.year,
    'Mês': c.month,
    'Produto': c.productName,
    'Local': c.location,
    'Estratégia': c.strategy,
    'Dias Rodando': c.daysRunning,
    'Impressões': c.impressions,
    'Cliques': c.clicks,
    'Vendas': c.sales,
    'CPC': c.cpc,
    'Ganhos': c.earnings,
    'Custos': c.costs,
    'Lucro/Prejuízo': c.profitLoss,
    'ROI %': c.roi,
  }));
  exportToExcel(data as any, 'campanhas', 'Campanhas');
}

export function exportWeeklyResults(results: WeeklyResult[]) {
  const data = results.map(r => ({
    'Semana': r.week,
    'Ano': r.year,
    'Mês': r.month,
    'Período': r.period,
    'Custo Campanhas': r.campaignCosts,
    'Vendas': r.sales,
    'Ganhos Campanhas': r.campaignEarnings,
    'Ganhos Orgânico': r.organicEarnings,
    'Adsense': r.adsenseEarnings,
    'Faturamento': r.revenue,
    'Lucro/Prejuízo': r.profitLoss,
  }));
  exportToExcel(data as any, 'resultados-semanais', 'Resultados Semanais');
}

export function exportIncomeExpenses(items: IncomeExpense[]) {
  const data = items.map(i => ({
    'Tipo': i.type === 'income' ? 'Receita' : 'Despesa',
    'Ano': i.year,
    'Mês': i.month,
    'Data': i.date,
    'Fonte': i.source,
    'Detalhamento': i.details,
    'Valor': i.amount,
  }));
  exportToExcel(data as any, 'receitas-despesas', 'Receitas e Despesas');
}

export function exportAllData(
  products: Product[],
  campaigns: CampaignResult[],
  weeklyResults: WeeklyResult[],
  incomeExpenses: IncomeExpense[]
) {
  const wb = XLSX.utils.book_new();

  // Products sheet
  const productsData = products.map(p => ({
    'N°': p.productNumber,
    'Data': p.date,
    'Nome do Produto': p.name,
    'Plataforma': p.platform,
    'País': p.country,
    'Moeda': p.currency,
    'Ticket Médio': p.averageTicket,
    'Comissão %': p.commissionPercent,
    'Comissão R$': p.commissionBRL,
  }));
  const wsProducts = XLSX.utils.json_to_sheet(productsData as any);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Produtos');

  // Campaigns sheet
  const campaignsData = campaigns.map(c => ({
    'Ano': c.year,
    'Mês': c.month,
    'Produto': c.productName,
    'Local': c.location,
    'Estratégia': c.strategy,
    'Dias Rodando': c.daysRunning,
    'Impressões': c.impressions,
    'Cliques': c.clicks,
    'Vendas': c.sales,
    'CPC': c.cpc,
    'Ganhos': c.earnings,
    'Custos': c.costs,
    'Lucro/Prejuízo': c.profitLoss,
    'ROI %': c.roi,
  }));
  const wsCampaigns = XLSX.utils.json_to_sheet(campaignsData as any);
  XLSX.utils.book_append_sheet(wb, wsCampaigns, 'Campanhas');

  // Weekly results sheet
  const weeklyData = weeklyResults.map(r => ({
    'Semana': r.week,
    'Ano': r.year,
    'Mês': r.month,
    'Período': r.period,
    'Custo Campanhas': r.campaignCosts,
    'Vendas': r.sales,
    'Ganhos Campanhas': r.campaignEarnings,
    'Ganhos Orgânico': r.organicEarnings,
    'Adsense': r.adsenseEarnings,
    'Faturamento': r.revenue,
    'Lucro/Prejuízo': r.profitLoss,
  }));
  const wsWeekly = XLSX.utils.json_to_sheet(weeklyData as any);
  XLSX.utils.book_append_sheet(wb, wsWeekly, 'Resultados Semanais');

  // Income/Expenses sheet
  const ieData = incomeExpenses.map(i => ({
    'Tipo': i.type === 'income' ? 'Receita' : 'Despesa',
    'Ano': i.year,
    'Mês': i.month,
    'Data': i.date,
    'Fonte': i.source,
    'Detalhamento': i.details,
    'Valor': i.amount,
  }));
  const wsIE = XLSX.utils.json_to_sheet(ieData as any);
  XLSX.utils.book_append_sheet(wb, wsIE, 'Receitas e Despesas');

  XLSX.writeFile(wb, 'dados-completos.xlsx');
}
