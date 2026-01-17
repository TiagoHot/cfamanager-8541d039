import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyResult, MONTHS } from '@/types';
import { toast } from 'sonner';
import { Pencil, Save, DollarSign, Euro, BadgeCent } from 'lucide-react';
import { useCurrencyRates } from '@/contexts/CurrencyRatesContext';
import { formatCurrency } from '@/lib/formatters';

interface EditWeeklyResultDialogProps {
  result: WeeklyResult;
  onUpdate: (result: WeeklyResult) => void;
  children: React.ReactNode;
}

// Helper to extract week number from week string (e.g., "S01" -> 1)
const getWeekNumber = (week: string): number => {
  const match = week.match(/S(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

export function EditWeeklyResultDialog({ result, onUpdate, children }: EditWeeklyResultDialogProps) {
  const [open, setOpen] = useState(false);
  const { rates } = useCurrencyRates();
  
  const [formData, setFormData] = useState({
    week: result.week,
    year: result.year.toString(),
    month: result.month,
    period: result.period,
    campaignCosts: result.campaignCosts.toString(),
    sales: result.sales.toString(),
    campaignEarningsBRL: result.campaignEarnings.toString(),
    campaignEarningsUSD: '',
    campaignEarningsEUR: '',
    organicEarnings: result.organicEarnings.toString(),
    adsenseEarnings: result.adsenseEarnings.toString(),
  });

  // Calculate converted campaign earnings in BRL
  const campaignEarningsTotal = useMemo(() => {
    const brl = parseFloat(formData.campaignEarningsBRL) || 0;
    const usd = parseFloat(formData.campaignEarningsUSD) || 0;
    const eur = parseFloat(formData.campaignEarningsEUR) || 0;
    
    // Use rates from context state
    const usdToBrl = usd * rates.Dollar;
    const eurToBrl = eur * rates.Euro;
    
    return brl + usdToBrl + eurToBrl;
  }, [formData.campaignEarningsBRL, formData.campaignEarningsUSD, formData.campaignEarningsEUR, rates]);

  // Reset form data when dialog opens or result changes
  useEffect(() => {
    if (open) {
      // NOTE: When editing, we assume the stored campaignEarnings is the BRL total.
      // We reset USD/EUR inputs to empty strings unless we implement reverse calculation/storage, 
      // which is complex and usually unnecessary for editing aggregated weekly results.
      setFormData({
        week: result.week,
        year: result.year.toString(),
        month: result.month,
        period: result.period,
        campaignCosts: result.campaignCosts.toString(),
        sales: result.sales.toString(),
        campaignEarningsBRL: result.campaignEarnings.toString(),
        campaignEarningsUSD: '',
        campaignEarningsEUR: '',
        organicEarnings: result.organicEarnings.toString(),
        adsenseEarnings: result.adsenseEarnings.toString(),
      });
    }
  }, [open, result]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.month.trim()) {
      toast.error('Mês é obrigatório');
      return;
    }

    const campaignCosts = parseFloat(formData.campaignCosts) || 0;
    const campaignEarnings = campaignEarningsTotal; // Use calculated total from all currencies
    const organicEarnings = parseFloat(formData.organicEarnings) || 0;
    const adsenseEarnings = parseFloat(formData.adsenseEarnings) || 0;
    const revenue = campaignEarnings + organicEarnings + adsenseEarnings;
    const profitLoss = revenue - campaignCosts;

    const updatedResult: WeeklyResult = {
      ...result,
      week: formData.week.toUpperCase(),
      year: parseInt(formData.year),
      month: formData.month.trim(),
      period: formData.period,
      campaignCosts,
      sales: parseInt(formData.sales) || 0,
      campaignEarnings,
      organicEarnings,
      adsenseEarnings,
      revenue,
      profitLoss,
    };

    onUpdate(updatedResult);
    toast.success('Resultado semanal atualizado com sucesso!');
    setOpen(false);
  };

  const weeks = useMemo(() => Array.from({ length: 52 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`), []);

  const currentYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="w-4 h-4" />
            Editar: {result.week} / {result.year}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2 bg-muted/50 p-3 rounded-lg">
            <div>
              <Label htmlFor="week" className="text-xs">Semana</Label>
              <Select value={formData.week} onValueChange={(v) => setFormData(prev => ({ ...prev, week: v }))}>
                <SelectTrigger className="h-8">
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
              <Label htmlFor="year" className="text-xs">Ano</Label>
              <Select value={formData.year} onValueChange={(v) => setFormData(prev => ({ ...prev, year: v }))}>
                <SelectTrigger className="h-8">
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
              <Label htmlFor="month" className="text-xs">Mês</Label>
              <Input
                id="month"
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                placeholder="Jan/Fev"
                required
                className="h-8"
              />
            </div>

            <div>
              <Label htmlFor="period" className="text-xs">Período</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                placeholder="01/01 - 07/01"
                className="h-8"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Valores</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="campaignCosts" className="text-xs">Custo Campanhas (R$)</Label>
                <Input
                  id="campaignCosts"
                  type="number"
                  step="0.01"
                  value={formData.campaignCosts}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaignCosts: e.target.value }))}
                  placeholder="0.00"
                  className="h-8"
                />
              </div>

              <div>
                <Label htmlFor="sales" className="text-xs">N° de Vendas</Label>
                <Input
                  id="sales"
                  type="number"
                  value={formData.sales}
                  onChange={(e) => setFormData(prev => ({ ...prev, sales: e.target.value }))}
                  placeholder="0"
                  className="h-8"
                />
              </div>

              {/* Ganhos Campanhas - Multi-currency */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-medium">Ganhos Campanhas</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <BadgeCent className="w-3 h-3 text-success" />
                      <span className="text-xs text-muted-foreground">BRL</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.campaignEarningsBRL}
                      onChange={(e) => setFormData(prev => ({ ...prev, campaignEarningsBRL: e.target.value }))}
                      placeholder="0.00"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <DollarSign className="w-3 h-3 text-info" />
                      <span className="text-xs text-muted-foreground">USD</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.campaignEarningsUSD}
                      onChange={(e) => setFormData(prev => ({ ...prev, campaignEarningsUSD: e.target.value }))}
                      placeholder="0.00"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Euro className="w-3 h-3 text-chart-5" />
                      <span className="text-xs text-muted-foreground">EUR</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.campaignEarningsEUR}
                      onChange={(e) => setFormData(prev => ({ ...prev, campaignEarningsEUR: e.target.value }))}
                      placeholder="0.00"
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-primary/10 border border-primary/20">
                  <span className="text-xs font-medium">Total R$:</span>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(campaignEarningsTotal, 'BRL')}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="organicEarnings" className="text-xs">Orgânico (R$)</Label>
                <Input
                  id="organicEarnings"
                  type="number"
                  step="0.01"
                  value={formData.organicEarnings}
                  onChange={(e) => setFormData(prev => ({ ...prev, organicEarnings: e.target.value }))}
                  placeholder="0.00"
                  className="h-8"
                />
              </div>

              <div>
                <Label htmlFor="adsenseEarnings" className="text-xs">Adsense (R$)</Label>
                <Input
                  id="adsenseEarnings"
                  type="number"
                  step="0.01"
                  value={formData.adsenseEarnings}
                  onChange={(e) => setFormData(prev => ({ ...prev, adsenseEarnings: e.target.value }))}
                  placeholder="0.00"
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              <Save className="w-3 h-3 mr-1" />
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}