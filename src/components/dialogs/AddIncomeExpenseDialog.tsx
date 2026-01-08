import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeExpense, MONTHS, INCOME_SOURCES, EXPENSE_SOURCES } from '@/types';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AddIncomeExpenseDialogProps {
  onAdd: (item: IncomeExpense) => void;
  children: React.ReactNode;
}

export function AddIncomeExpenseDialog({ onAdd, children }: AddIncomeExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState({
    year: currentYear.toString(),
    month: MONTHS[currentMonth],
    date: new Date().toISOString().split('T')[0],
    source: '',
    details: '',
    amount: '',
  });

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

    const newItem: IncomeExpense = {
      id: `ie-new-${Date.now()}`,
      type,
      year: parseInt(formData.year),
      month: formData.month,
      date: formData.date,
      source: formData.source,
      details: formData.details,
      amount: parseFloat(formData.amount),
    };

    onAdd(newItem);
    toast.success(`${type === 'income' ? 'Receita' : 'Despesa'} adicionada com sucesso!`);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      year: currentYear.toString(),
      month: MONTHS[currentMonth],
      date: new Date().toISOString().split('T')[0],
      source: '',
      details: '',
      amount: '',
    });
  };

  const sources = type === 'income' ? INCOME_SOURCES : EXPENSE_SOURCES;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Registro</DialogTitle>
        </DialogHeader>
        
        <Tabs value={type} onValueChange={(v) => {
          setType(v as 'income' | 'expense');
          setFormData(prev => ({ ...prev, source: '' }));
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
              Adicionar {type === 'income' ? 'Receita' : 'Despesa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
