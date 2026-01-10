import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyResult, MONTHS } from '@/types';
import { toast } from 'sonner';
import { Pencil, Save } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    week: result.week,
    year: result.year.toString(),
    month: result.month,
    period: result.period,
    campaignCosts: result.campaignCosts.toString(),
    sales: result.sales.toString(),
    campaignEarnings: result.campaignEarnings.toString(),
    organicEarnings: result.organicEarnings.toString(),
    adsenseEarnings: result.adsenseEarnings.toString(),
  });

  // Reset form data when dialog opens or result changes
  useEffect(() => {
    if (open) {
      setFormData({
        week: result.week,
        year: result.year.toString(),
        month: result.month,
        period: result.period,
        campaignCosts: result.campaignCosts.toString(),
        sales: result.sales.toString(),
        campaignEarnings: result.campaignEarnings.toString(),
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
    const campaignEarnings = parseFloat(formData.campaignEarnings) || 0;
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
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Editar Resultado: {result.week} / {result.year}
          </DialogTitle>
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
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}