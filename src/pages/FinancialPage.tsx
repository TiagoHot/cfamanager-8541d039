import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, ArrowUpRight, ArrowDownRight, Upload, Filter, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { IncomeExpense, MONTHS } from "@/types";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddIncomeExpenseDialog } from "@/components/dialogs/AddIncomeExpenseDialog";
import { exportIncomeExpenses } from "@/lib/exportData";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const incomeColumns = [
  {
    key: 'date',
    header: 'Data',
    render: (item: IncomeExpense) => formatDate(item.date),
  },
  {
    key: 'month',
    header: 'Mês',
    render: (item: IncomeExpense) => (
      <span className="font-medium">{item.month} {item.year}</span>
    ),
  },
  {
    key: 'source',
    header: 'Fonte',
    render: (item: IncomeExpense) => (
      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
        {item.source}
      </Badge>
    ),
  },
  {
    key: 'details',
    header: 'Detalhamento',
  },
  {
    key: 'amount',
    header: 'Valor',
    className: 'text-right',
    render: (item: IncomeExpense) => (
      <div className="flex items-center justify-end gap-2">
        <ArrowUpRight className="w-4 h-4 text-success" />
        <span className="font-medium text-success">{formatCurrency(item.amount)}</span>
      </div>
    ),
  },
];

const expenseColumns = [
  {
    key: 'date',
    header: 'Data',
    render: (item: IncomeExpense) => formatDate(item.date),
  },
  {
    key: 'month',
    header: 'Mês',
    render: (item: IncomeExpense) => (
      <span className="font-medium">{item.month} {item.year}</span>
    ),
  },
  {
    key: 'source',
    header: 'Fonte',
    render: (item: IncomeExpense) => (
      <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
        {item.source}
      </Badge>
    ),
  },
  {
    key: 'details',
    header: 'Detalhamento',
  },
  {
    key: 'amount',
    header: 'Valor',
    className: 'text-right',
    render: (item: IncomeExpense) => (
      <div className="flex items-center justify-end gap-2">
        <ArrowDownRight className="w-4 h-4 text-destructive" />
        <span className="font-medium text-destructive">{formatCurrency(item.amount)}</span>
      </div>
    ),
  },
];

export default function FinancialPage() {
  const { incomeExpenses, importData, addIncomeExpense } = useData();
  
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  
  // Get unique years for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(incomeExpenses.map(i => i.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [incomeExpenses]);

  // Filter and sort
  const filteredItems = useMemo(() => {
    let filtered = incomeExpenses;
    
    if (yearFilter !== "all") {
      filtered = filtered.filter(i => i.year === parseInt(yearFilter));
    }
    if (monthFilter !== "all") {
      filtered = filtered.filter(i => i.month === monthFilter);
    }

    return [...filtered].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [incomeExpenses, yearFilter, monthFilter]);

  const incomes = filteredItems.filter(item => item.type === 'income');
  const expenses = filteredItems.filter(item => item.type === 'expense');

  const hasFilters = yearFilter !== "all" || monthFilter !== "all";

  const clearFilters = () => {
    setYearFilter("all");
    setMonthFilter("all");
  };

  const handleExport = () => {
    if (filteredItems.length === 0) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    exportIncomeExpenses(filteredItems);
    toast.success('Receitas e despesas exportadas com sucesso!');
  };

  // Calculate totals
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Receitas & Despesas" 
        description="Gerencie todas as suas entradas e saídas financeiras"
      >
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Anos</SelectItem>
            {years.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={hasFilters ? "border-primary" : ""}>
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {hasFilters && <Badge className="ml-2" variant="secondary">Ativos</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros</h4>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mês</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Meses</SelectItem>
                    {MONTHS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <ImportExcelDialog onImportComplete={importData}>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
        </ImportExcelDialog>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <AddIncomeExpenseDialog onAdd={addIncomeExpense}>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Registro
          </Button>
        </AddIncomeExpenseDialog>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
          <p className="text-sm text-muted-foreground">Total Receitas</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-muted-foreground">Total Despesas</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
        </div>
        <div className={`p-4 rounded-lg ${balance >= 0 ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
          <p className="text-sm text-muted-foreground">Saldo</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="income" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="income" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Receitas ({incomes.length})
          </TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Despesas ({expenses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <DataTable 
            data={incomes} 
            columns={incomeColumns}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <DataTable 
            data={expenses} 
            columns={expenseColumns}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}