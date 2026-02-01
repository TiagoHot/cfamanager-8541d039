import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeExpense, MONTHS } from '@/types';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings'; // Import useSettings
import { setDate, setMonth, setYear, format, endOfMonth } from 'date-fns'; // Import endOfMonth

interface AddIncomeExpenseDialogProps {
  onAdd: (item: IncomeExpense) => void;
  children: React.ReactNode;
}

export function AddIncomeExpenseDialog({ onAdd, children }: AddIncomeExpenseDialogProps) {
  const { incomeSources, expenseSources } = useSettings(); // Use dynamic sources
  const [open, setOpen] = useState(false);
  
  const getInitialFormData = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    // Set to the last day of the current month
    const defaultDate = format(endOfMonth(setMonth(setYear(today, currentYear), currentMonth)), 'yyyy-MM-dd');

    return {
      year: currentYear.toString(),
      month: MONTHS[currentMonth],
      date: defaultDate,
      source: '',
      details: '',
      amount: '',
    };
  };

  const [type, setType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState(getInitialFormData());

  // Reset form data when dialog opens
  useState(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
  }, [open]);

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
    setOpen(false);
    // No need to call resetForm here, as the useState effect handles it when dialog re-opens
  };

  const handleMonthChange = (newMonth: string) => {
    setFormData(prev => {
      const monthIndex = MONTHS.findIndex(m => m === newMonth);
      const yearInt = parseInt(prev.year);

      let newDate = prev.date;
      if (monthIndex !== -1) {
        let dateObj = new Date();
        dateObj = setYear(dateObj, yearInt);
        dateObj = setMonth(dateObj, monthIndex);
        dateObj = endOfMonth(dateObj); // Set to the last day of the month
        newDate = format(dateObj, 'yyyy-MM-dd');
      }

      return {
        ...prev,
        month: newMonth,
        date: newDate,
      };
    });
  };

  const handleYearChange = (newYearStr: string) => {
    setFormData(prev => {
      const yearInt = parseInt(newYearStr);
      const monthIndex = MONTHS.findIndex(m => m === prev.month);

      let newDate = prev.date;
      if (monthIndex !== -1) {
        let dateObj = new Date();
        dateObj = setYear(dateObj, yearInt);
        dateObj = setMonth(dateObj, monthIndex);
        dateObj = endOfMonth(dateObj); // Set to the last day of the month
        newDate = format(dateObj, 'yyyy-MM-dd');
      }

      return {
        ...prev,
        year: newYearStr,
        date: newDate,
      };
    });
  };

  const sources = type === 'income' ? incomeSources : expenseSources;

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
              <Select value={formData.year} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(y => (
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