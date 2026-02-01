import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CampaignResult, MONTHS, Product } from '@/types';
import { toast } from 'sonner';
import { Globe, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, setDate, setMonth, setYear, format } from 'date-fns';
import { useSettings } from '@/hooks/useSettings'; // Import useSettings

interface AddCampaignDialogProps {
  onAdd: (campaign: CampaignResult) => void;
  children: React.ReactNode;
  products: Product[]; // Using Product interface now
}

const LOCATIONS = ['Brasil', 'Gringa'];

export function AddCampaignDialog({ onAdd, children, products }: AddCampaignDialogProps) {
  const { strategies } = useSettings(); // Get dynamic strategies
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
    location: 'Brasil', // Default location
    strategy: strategies[0] || 'Pesquisa', // Use first strategy or default
    impressions: '',
    clicks: '',
    sales: '',
    earnings: '',
    costs: '',
  });

  // Calculate daysRunning dynamically
  const daysRunning = useMemo(() => {
    if (formData.startDate && formData.endDate) {
      try {
        const start = parseISO(formData.startDate);
        const end = parseISO(formData.endDate);
        // Add 1 day because the calculation should be inclusive (e.g., 01/01 to 01/01 is 1 day)
        const days = differenceInDays(end, start) + 1;
        return days > 0 ? days : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }, [formData.startDate, formData.endDate]);

  // Filter products based on selected location
  const filteredProducts = useMemo(() => {
    const location = formData.location;
    return products
      .filter(p => p.country === location)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, formData.location]);

  // Reset product name if the selected location changes and the current product is no longer valid
  const handleLocationChange = (newLocation: string) => {
    setFormData(prev => {
      const isCurrentProductValid = filteredProducts.some(p => p.name === prev.productName);
      return {
        ...prev,
        location: newLocation,
        productName: isCurrentProductValid ? prev.productName : '', // Clear product if invalid
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    
    if (!formData.endDate) {
      toast.error('Data Fim é obrigatória para calcular os dias rodando');
      return;
    }

    const calculatedDaysRunning = daysRunning;
    if (calculatedDaysRunning <= 0) {
      toast.error('A Data Fim deve ser igual ou posterior à Data Início');
      return;
    }

    const earnings = parseFloat(formData.earnings) || 0;
    const costs = parseFloat(formData.costs) || 0;
    const clicks = parseInt(formData.clicks) || 0;
    const profitLoss = earnings - costs;
    const roi = costs > 0 ? ((earnings - costs) / costs) * 100 : 0;
    const cpc = clicks > 0 ? costs / clicks : 0;
    
    // Find commission BRL from the product list
    const product = products.find(p => p.name === formData.productName);
    const commissionBRL = product?.commissionBRL || 0;

    const newCampaign: CampaignResult = {
      id: `camp-new-${Date.now()}`,
      year: parseInt(formData.year),
      monthNumber: formData.monthNumber,
      month: formData.month,
      startDate: formData.startDate,
      endDate: formData.endDate,
      daysRunning: calculatedDaysRunning,
      productName: formData.productName,
      niche: product?.niche || '',
      location: formData.location,
      strategy: formData.strategy,
      commissionBRL,
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
      location: 'Brasil',
      strategy: strategies[0] || 'Pesquisa',
      impressions: '',
      clicks: '',
      sales: '',
      earnings: '',
      costs: '',
    });
  };

  const handleMonthChange = (month: string) => {
    const monthIndex = MONTHS.findIndex(m => m === month);
    const yearInt = parseInt(formData.year);
    
    if (monthIndex !== -1) {
      // Calculate the first day of the selected month/year
      let date = new Date();
      date = setYear(date, yearInt);
      date = setMonth(date, monthIndex);
      date = setDate(date, 1); // Set day to 1
      
      const newStartDate = format(date, 'yyyy-MM-dd');

      setFormData(prev => ({
        ...prev,
        month,
        monthNumber: monthIndex + 1,
        startDate: newStartDate, // Update start date
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        month,
        monthNumber: 0,
      }));
    }
  };
  
  // Handle Year change to update startDate
  const handleYearChange = (yearStr: string) => {
    const yearInt = parseInt(yearStr);
    const monthIndex = MONTHS.findIndex(m => m === formData.month);
    
    let newStartDate = formData.startDate;
    if (monthIndex !== -1) {
      let date = new Date();
      date = setYear(date, yearInt);
      date = setMonth(date, monthIndex);
      date = setDate(date, 1);
      newStartDate = format(date, 'yyyy-MM-dd');
    }
    
    setFormData(prev => ({ 
      ...prev, 
      year: yearStr,
      startDate: newStartDate,
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
          
          {/* Location Selector */}
          <div className="space-y-2">
            <Label>Localização da Campanha *</Label>
            <ToggleGroup 
              type="single" 
              value={formData.location} 
              onValueChange={(v) => v && handleLocationChange(v)}
              className="grid grid-cols-2 gap-2"
            >
              {LOCATIONS.map(loc => (
                <ToggleGroupItem 
                  key={loc} 
                  value={loc} 
                  className={cn(
                    "py-3 px-4 rounded-lg border transition-all duration-200",
                    formData.location === loc 
                      ? "bg-warning/10 border-warning text-warning shadow-md" 
                      : "bg-secondary/50 border-secondary text-secondary-foreground hover:bg-secondary"
                  )}
                >
                  {loc === 'Brasil' ? <Flag className="w-4 h-4 mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                  {loc}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="productName">Nome do Produto *</Label>
              <Select 
                value={formData.productName} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, productName: v }))}
                disabled={filteredProducts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={filteredProducts.length > 0 ? "Selecione um produto" : `Nenhum produto em ${formData.location}`} />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map(p => (
                    <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year">Ano</Label>
              <Select value={formData.year} onValueChange={handleYearChange}>
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
              <Label htmlFor="startDate">Data Início *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">Data Fim *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
            
            {/* Dias Rodando e Estratégia na mesma linha (col-span-2 removido) */}
            <div>
              <Label htmlFor="daysRunningDisplay">Dias Rodando</Label>
              <Input
                id="daysRunningDisplay"
                value={daysRunning > 0 ? daysRunning : '-'}
                readOnly
                disabled
                className="bg-muted/50 text-center font-bold"
              />
            </div>

            <div>
              <Label htmlFor="strategy">Estratégia</Label>
              <Select value={formData.strategy} onValueChange={(v) => setFormData(prev => ({ ...prev, strategy: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(s => (
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