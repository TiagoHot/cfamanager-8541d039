import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CampaignResult, MONTHS } from '@/types';
import { toast } from 'sonner';

interface AddCampaignDialogProps {
  onAdd: (campaign: CampaignResult) => void;
  children: React.ReactNode;
  products: { name: string }[];
}

const STRATEGIES = ['Pesquisa', 'Display', 'YouTube', 'Shopping', 'Performance Max', 'Discovery'];
const LOCATIONS = ['Brasil', 'Gringa', 'ES', 'MX', 'US', 'PT'];

export function AddCampaignDialog({ onAdd, children, products }: AddCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [formData, setFormData] = useState({
    productName: '',
    year: currentYear.toString(),
    month: MONTHS[currentMonth],
    monthNumber: currentMonth + 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    daysRunning: '',
    location: 'Brasil',
    strategy: 'Pesquisa',
    impressions: '',
    clicks: '',
    sales: '',
    earnings: '',
    costs: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    const earnings = parseFloat(formData.earnings) || 0;
    const costs = parseFloat(formData.costs) || 0;
    const clicks = parseInt(formData.clicks) || 0;
    const profitLoss = earnings - costs;
    const roi = costs > 0 ? ((earnings - costs) / costs) * 100 : 0;
    const cpc = clicks > 0 ? costs / clicks : 0;

    const newCampaign: CampaignResult = {
      id: `camp-new-${Date.now()}`,
      year: parseInt(formData.year),
      monthNumber: formData.monthNumber,
      month: formData.month,
      startDate: formData.startDate,
      endDate: formData.endDate,
      daysRunning: parseInt(formData.daysRunning) || 0,
      productName: formData.productName,
      niche: '',
      location: formData.location,
      strategy: formData.strategy,
      commissionBRL: 0,
      impressions: parseInt(formData.impressions) || 0,
      clicks,
      sales: parseInt(formData.sales) || 0,
      cpc,
      earnings,
      costs,
      profitLoss,
      roi,
    };

    onAdd(newCampaign);
    toast.success('Campanha adicionada com sucesso!');
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      year: currentYear.toString(),
      month: MONTHS[currentMonth],
      monthNumber: currentMonth + 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      daysRunning: '',
      location: 'Brasil',
      strategy: 'Pesquisa',
      impressions: '',
      clicks: '',
      sales: '',
      earnings: '',
      costs: '',
    });
  };

  const handleMonthChange = (month: string) => {
    const monthIndex = MONTHS.findIndex(m => m === month);
    setFormData(prev => ({
      ...prev,
      month,
      monthNumber: monthIndex + 1,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Campanha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="productName">Nome do Produto *</Label>
              <Select value={formData.productName} onValueChange={(v) => setFormData(prev => ({ ...prev, productName: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
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
              <Label htmlFor="month">Mês</Label>
              <Select value={formData.month} onValueChange={handleMonthChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="daysRunning">Dias Rodando</Label>
              <Input
                id="daysRunning"
                type="number"
                value={formData.daysRunning}
                onChange={(e) => setFormData(prev => ({ ...prev, daysRunning: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="location">Local</Label>
              <Select value={formData.location} onValueChange={(v) => setFormData(prev => ({ ...prev, location: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="strategy">Estratégia</Label>
              <Select value={formData.strategy} onValueChange={(v) => setFormData(prev => ({ ...prev, strategy: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Métricas da Campanha</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="impressions">Impressões</Label>
                <Input
                  id="impressions"
                  type="number"
                  value={formData.impressions}
                  onChange={(e) => setFormData(prev => ({ ...prev, impressions: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="clicks">Cliques</Label>
                <Input
                  id="clicks"
                  type="number"
                  value={formData.clicks}
                  onChange={(e) => setFormData(prev => ({ ...prev, clicks: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="sales">Vendas</Label>
                <Input
                  id="sales"
                  type="number"
                  value={formData.sales}
                  onChange={(e) => setFormData(prev => ({ ...prev, sales: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="earnings">Ganhos (R$)</Label>
                <Input
                  id="earnings"
                  type="number"
                  step="0.01"
                  value={formData.earnings}
                  onChange={(e) => setFormData(prev => ({ ...prev, earnings: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="costs">Custos (R$)</Label>
                <Input
                  id="costs"
                  type="number"
                  step="0.01"
                  value={formData.costs}
                  onChange={(e) => setFormData(prev => ({ ...prev, costs: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar Campanha</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
