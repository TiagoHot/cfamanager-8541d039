import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeExpense, MONTHS } from '@/types';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight, Pencil, Save } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

interface EditIncomeExpenseDialogProps {
  item: IncomeExpense;
  onUpdate: (item: IncomeExpense) => void;
  children: React.ReactNode;
}

export function EditIncomeExpenseDialog({ item, onUpdate, children }: EditIncomeExpenseDialogProps) {
  const { incomeSources, expenseSources } = useSettings();
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  
  const [type, setType] = useState<'income' | 'expense'>(item.type);
  const [formData, setFormData] = useState({
    year: item.year.toString(),
    month: item.month,
    date: item.date,
    source: item.source,
    details: item.details,
    amount: item.amount.toString(),
  });

  // Reset form data when dialog opens or item prop changes
  useEffect(() => {
    if (open) {
      setType(item.type);
      setFormData({
        year: item.year.toString(),
        month: item.month,
        date: item.date,
        source: item.source,
        details: item.details,
        amount: item.amount.toString(),
      });
    }
  }, [open, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.source) {
      toast.error('Fonte é obrigatória');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    const updatedItem: IncomeExpense = {
      ...item,
      type,
      year: parseInt(formData.year),
      month: formData.month,
      date: formData.date,
      source: formData.source,
      details: formData.details,
      amount: parseFloat(formData.amount),
    };

    onUpdate(updatedItem);
    toast.success(`${type === 'income' ? 'Receita' : 'Despesa'} atualizada com sucesso!`);
    setOpen(false);
  };

  const sources = type === 'income' ? incomeSources : expenseSources;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Editar Registro: {item.source}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={type} onValueChange={(v) => {
          setType(v as 'income' | 'expense');
          // Reset source if switching type, unless the source exists in the new list
          setFormData(prev => {
            const newSources = v === 'income' ? incomeSources : expenseSources;
            const isSourceValid = newSources.includes(prev.source);
            return { ...prev, source: isSourceValid ? prev.source : '' };
          });
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Receita
            </TabsTrigger>
            <TabsTrigger value="expense" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Despesa
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Select value={formData.month} onValueChange={(v) => setFormData(prev => ({ ...prev, month: v }))}>
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
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="source">Fonte *</Label>
              <Select value={formData.source} onValueChange={(v) => setFormData(prev => ({ ...prev, source: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="details">Detalhamento</Label>
              <Input
                id="details"
                value={formData.details}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Descrição adicional (opcional)"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className={type === 'income' ? 'focus:border-success' : 'focus:border-destructive'}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit"
              className={type === 'income' ? 'bg-success hover:bg-success/90' : 'bg-destructive hover:bg-destructive/90'}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}