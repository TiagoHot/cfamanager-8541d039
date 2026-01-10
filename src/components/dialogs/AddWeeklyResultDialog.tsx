import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyResult, MONTHS } from '@/types';
import { toast } from 'sonner';

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

export function AddWeeklyResultDialog({ onAdd, children, weeklyResults }: AddWeeklyResultDialogProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [formData, setFormData] = useState({
    week: 'S01', // Default, will be updated in useEffect
    year: currentYear.toString(),
    month: MONTHS[currentMonth],
    period: '',
    campaignCosts: '',
    sales: '',
    campaignEarnings: '',
    organicEarnings: '',
    adsenseEarnings: '',
  });

  // Calculate next week number for the current year
  useEffect(() => {
    if (open) {
      const currentYearInt = parseInt(formData.year);
      
      // Find the highest week number for the selected year
      const maxWeek = weeklyResults
        .filter(r => r.year === currentYearInt)
        .reduce((max, r) => Math.max(max, getWeekNumber(r.week)), 0);
        
      const nextWeekNumber = maxWeek >= 52 ? 1 : maxWeek + 1;
      const nextWeekString = `S${String(nextWeekNumber).padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        week: nextWeekString,
        month: MONTHS[currentMonth], // Reset month to current month abbreviation
      }));
    }
  }, [open, weeklyResults, currentYear, currentMonth, formData.year]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.month.trim()) {
      toast.error('Mês é obrigatório');
      return;
    }

    const campaignCosts = parseFloat(formData.campaignCosts) || 0;
    const campaignEarnings = parseFloat(formData.campaignEarnings) || 0;
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
          <div className="grid grid-cols-2 gap-4">
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
              />
            </div>
          </div>

          <div className="border-t pt-4">
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

              <div>
                <Label htmlFor="campaignEarnings">Ganhos Campanhas (R$)</Label>
                <Input
                  id="campaignEarnings"
                  type="number"
                  step="0.01"
                  value={formData.campaignEarnings}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaignEarnings: e.target.value }))}
                  placeholder="0.00"
                />
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