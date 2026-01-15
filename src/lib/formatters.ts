export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function formatDateShort(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function getProfitLossColor(value: number): string {
  if (value > 0) return 'text-success';
  if (value < 0) return 'text-destructive';
  return 'text-muted-foreground';
}

export function getROIColor(value: number): string {
  if (value > 0) return 'text-success'; // Qualquer ROI positivo é verde
  if (value < 0) return 'text-destructive'; // Qualquer ROI negativo é vermelho
  return 'text-warning'; // ROI zero (breakeven) é laranja
}

// Mapeamento de nomes de meses completos para abreviações
const FULL_MONTH_TO_ABBR_MAP: { [key: string]: string } = {
  'janeiro': 'Jan', 'fevereiro': 'Fev', 'março': 'Mar', 'abril': 'Abr',
  'maio': 'Mai', 'junho': 'Jun', 'julho': 'Jul', 'agosto': 'Ago',
  'setembro': 'Set', 'outubro': 'Out', 'novembro': 'Nov', 'dezembro': 'Dez',
};

/**
 * Normaliza uma string de mês para sua abreviação padrão (ex: 'Jan', 'Fev').
 * Lida com nomes completos (ex: 'Janeiro' -> 'Jan') e strings compostas (ex: 'Mar/Abr' -> 'Mar').
 * @param monthStr A string do mês a ser normalizada.
 * @returns A abreviação do mês ou a string original se não for reconhecida.
 */
export function normalizeMonthToAbbreviation(monthStr: string): string {
  if (!monthStr) return '';
  const parts = monthStr.split('/');
  const firstPart = parts[0].toLowerCase().trim();
  
  // Se for um nome de mês completo, converte para abreviação
  if (FULL_MONTH_TO_ABBR_MAP[firstPart]) {
    return FULL_MONTH_TO_ABBR_MAP[firstPart];
  }
  // Caso contrário, assume que já é uma abreviação ou uma string composta e capitaliza a primeira parte
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('/');
}