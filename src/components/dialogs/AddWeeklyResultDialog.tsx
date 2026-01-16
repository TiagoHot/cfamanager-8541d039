import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyResult, MONTHS, CURRENCY_RATES } from '@/types';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek, addWeeks, format, parseISO, isValid, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { formatCurrency } from '@/lib/formatters';
import { DollarSign, Euro, BadgeCent } from 'lucide-react';

interface AddWeeklyResultDialogProps {
  onAdd: (result: WeeklyResult) => void;
  children: React.ReactNode;
  weeklyResults: WeeklyResult[]; // Pass existing results for auto-fill
}

// Helper to extract week number from week string (e.g., "S01" -> 1)
const getWeekNumber = (week: string): number => {
  const match = week.match(/S(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

// Helper to find the latest end date from existing results
const getLatestEndDate = (results: WeeklyResult[]): Date | null => {
  let latestDate: Date | null = null;
  
  // Iterate through results and parse the end date from the 'period' string
  results.forEach(r => {
    if (r.period) {
      // Assuming period format is "DD/MM - DD/MM" or similar, we need the end date.
      // Since the period string is user-defined, relying on it is risky.
      // A safer approach is to rely on the latest recorded year/week number, 
      // but since the user wants to auto-fill the period, we must try to parse it.
      
      // Let's assume the period is always "DD/MM - DD/MM" or "DD/MM/YYYY - DD/MM/YYYY"
      const parts = r.period.split(' - ');
      if (parts.length === 2) {
        const endDateStr = parts[1].trim();
        
        // Try parsing DD/MM/YYYY
        let date = parseDateString(endDateStr, r.year);
        
        if (date && isValid(date)) {
          if (!latestDate || date.getTime() > latestDate.getTime()) {
            latestDate = date;
          }
        }
      }
    }
  });
  
  // Fallback: If no valid period is found, use the start of the current week.
  if (!latestDate) {
    return startOfWeek(new Date(), { weekStartsOn: 0 }); // Default to Sunday of current week
  }
  
  return latestDate;
};

// Helper to parse DD/MM/YY or DD/MM/YYYY string into a Date object
const parseDateString = (dateStr: string, year: number): Date | null => {
  const parts = dateStr.split('/');
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let y = parts.length === 3 ? parseInt(parts[2], 10) : year;
    
    // Handle 2-digit year
    if (y < 100) {
      y = y + (y > 50 ? 1900 : 2000);
    }
    
    const date = new Date(y, month - 1, day);
    if (isValid(date) && date.getFullYear() === y && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
  }
  return null;
};


export function AddWeeklyResultDialog({ onAdd, children, weeklyResults }: AddWeeklyResultDialogProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const { rates } = useCurrencyRates();
  
  const [formData, setFormData] = useState({
    week: 'S01', // Default, will be updated in useEffect
    year: currentYear.toString(),
    month: MONTHS[currentMonth],
    period: '', // Auto-calculated
    campaignCosts: '',
    sales: '',
    campaignEarningsBRL: '',
    campaignEarningsUSD: '',
    campaignEarningsEUR: '',
    organicEarnings: '',
    adsenseEarnings: '',
  });

  // Calculate converted campaign earnings in BRL
  const campaignEarningsTotal = useMemo(() => {
    const brl = parseFloat(formData.campaignEarningsBRL) || 0;
    const usd = parseFloat(formData.campaignEarningsUSD) || 0;
    const eur = parseFloat(formData.campaignEarningsEUR) || 0;
    
    const usdToBrl = usd * rates.Dollar;
    const eurToBrl = eur * rates.Euro;
    
    return brl + usdToBrl + eurToBrl;
  }, [formData.campaignEarningsBRL, formData.campaignEarningsUSD, formData.campaignEarningsEUR, rates]);

  // Calculate next week number and period
  useEffect(() => {
    if (open) {
      const currentYearInt = parseInt(formData.year);
      
      // 1. Calculate Next Week Number
      const maxWeek = weeklyResults
        .filter(r => r.year === currentYearInt)
        .reduce((max, r) => Math.max(max, getWeekNumber(r.week)), 0);
        
      const nextWeekNumber = maxWeek >= 52 ? 1 : maxWeek + 1;
      const nextWeekString = `S${String(nextWeekNumber).padStart(2, '0')}`;
      
      // 2. Calculate Next Period (Sunday to Saturday)
      let nextPeriodString = '';
      
      // Find the latest recorded end date
      const latestEndDate = getLatestEndDate(weeklyResults);
      
      let nextSunday: Date;
      
      if (latestEndDate) {
        // Start date of the next week is the day after the latest recorded end date
        nextSunday = addDays(latestEndDate, 1);
      } else {
        // If no data, use the start of the current week (Sunday)
        nextSunday = startOfWeek(new Date(), { weekStartsOn: 0 });
      }
      
      // Ensure nextSunday is a Sunday (0)
      if (nextSunday.getDay() !== 0) {
          nextSunday = startOfWeek(nextSunday, { weekStartsOn: 0 });
      }
      
      const nextSaturday = endOfWeek(nextSunday, { weekStartsOn: 0 });
      
      // Format period as DD/MM - DD/MM
      const startFormatted = format(nextSunday, 'dd/MM');
      const endFormatted = format(nextSaturday, 'dd/MM');
      nextPeriodString = `${startFormatted} - ${endFormatted}`;
      
      // Determine the month based on the start date of the period
      const nextMonthAbbr = MONTHS[nextSunday.getMonth()];
      
      setFormData(prev => ({
        ...prev,
        week: nextWeekString,
        month: nextMonthAbbr,
        period: nextPeriodString,
      }));
    }
  }, [open, weeklyResults, currentYear, currentMonth, formData.year]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.month.trim()) {
      toast.error('Mês é obrigatório');
      return;
    }
    
    if (!formData.period.trim()) {
      toast.error('Período é obrigatório');
      return;
    }

    const campaignCosts = parseFloat(formData.campaignCosts) || 0;
    const campaignEarnings = campaignEarningsTotal; // Use calculated total from all currencies
    const organicEarnings = parseFloat(formData.organicEarnings) || 0;
    const adsenseEarnings = parseFloat(formData.adsenseEarnings) || 0;
    const revenue = campaignEarnings + organicEarnings + adsenseEarnings;
    const profitLoss = revenue - campaignCosts;

    const newResult: WeeklyResult = {
      id: `week-new-${Date.now()}`,
      week: formData.week.toUpperCase(),
      year: parseInt(formData.year),
      month: formData.month.trim(), // Allow composite month string
      period: formData.period,
      campaignCosts,
      sales: parseInt(formData.sales) || 0,
      campaignEarnings,
      organicEarnings,
      adsenseEarnings,
      revenue,
      profitLoss,
    };

    onAdd(newResult);
    toast.success('Resultado semanal adicionado com sucesso!');
    setOpen(false);
    // Note: We don't reset the form here, as the useEffect will recalculate the next week when the dialog opens again.
  };

  const weeks = useMemo(() => Array.from({ length: 52 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Resultado Semanal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seção de Metadados da Semana com fundo contrastante */}
          <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
            <div>
              <Label htmlFor="week">Semana</Label>
              <Select value={formData.week} onValueChange={(v) => setFormData(prev => ({ ...prev, week: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Ano</Label>
              <Select value={formData.year} onValueChange={(v) => setFormData(prev => ({ ...prev, year: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Mês (Ex: Jan ou Jan/Fev)</Label>
              <Input
                id="month"
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                placeholder="Ex: Jan/Fev"
                required
              />
            </div>

            <div>
              <Label htmlFor="period">Período</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                placeholder="Ex: 01/01 - 07/01"
                required
              />
            </div>
          </div>

          {/* Seção de Valores com fundo contrastante */}
          <div className="border-t pt-4 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Valores</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaignCosts">Custo Campanhas (R$)</Label>
                <Input
                  id="campaignCosts"
                  type="number"
                  step="0.01"
                  value={formData.campaignCosts}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaignCosts: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="sales">N° de Vendas</Label>
                <Input
                  id="sales"
                  type="number"
                  value={formData.sales}
                  onChange={(e) => setFormData(prev => ({ ...prev, sales: e.target.value }))}
                  placeholder="0"
                />
              </div>

              {/* Ganhos Campanhas - Multi-currency inputs */}
              <div className="col-span-2 space-y-3">
                <Label className="text-sm font-medium">Ganhos Campanhas</Label>
                
                {/* BRL Input */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-success/10 text-success">
                    <BadgeCent className="w-4 h-4" />
                  </div>
                  <Input
                    id="campaignEarningsBRL"
                    type="number"
                    step="0.01"
                    value={formData.campaignEarningsBRL}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignEarningsBRL: e.target.value }))}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10">BRL</span>
                </div>
                
                {/* USD Input */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-info/10 text-info">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <Input
                    id="campaignEarningsUSD"
                    type="number"
                    step="0.01"
                    value={formData.campaignEarningsUSD}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignEarningsUSD: e.target.value }))}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10">USD</span>
                </div>
                
                {/* EUR Input */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-chart-5/10 text-chart-5">
                    <Euro className="w-4 h-4" />
                  </div>
                  <Input
                    id="campaignEarningsEUR"
                    type="number"
                    step="0.01"
                    value={formData.campaignEarningsEUR}
                    onChange={(e) => setFormData(prev => ({ ...prev, campaignEarningsEUR: e.target.value }))}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-10">EUR</span>
                </div>
                
                {/* Total converted */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium">Total em R$:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(campaignEarningsTotal, 'BRL')}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="organicEarnings">Ganhos Orgânico (R$)</Label>
                <Input
                  id="organicEarnings"
                  type="number"
                  step="0.01"
                  value={formData.organicEarnings}
                  onChange={(e) => setFormData(prev => ({ ...prev, organicEarnings: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="adsenseEarnings">Ganhos Adsense (R$)</Label>
                <Input
                  id="adsenseEarnings"
                  type="number"
                  step="0.01"
                  value={formData.adsenseEarnings}
                  onChange={(e) => setFormData(prev => ({ ...prev, adsenseEarnings: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar Resultado</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}