import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, ArrowUpRight, ArrowDownRight, Upload } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { IncomeExpense, MONTHS } from "@/types";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddIncomeExpenseDialog } from "@/components/dialogs/AddIncomeExpenseDialog";
import { exportIncomeExpenses } from "@/lib/exportData";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContent } from "@/components/PageContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Colunas simplificadas para uso dentro dos Cards (Mês/Ano removido, pois já está no CardTitle)
const baseColumns = [
  {
    key: 'date',
    header: 'Data',
    className: 'w-24',
    render: (item: IncomeExpense) => formatDate(item.date),
  },
  {
    key: 'source',
    header: 'Fonte',
    render: (item: IncomeExpense) => (
      <Badge variant="secondary" className={cn(
        item.type === 'income' ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
      )}>
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
    className: 'text-right w-32',
    render: (item: IncomeExpense) => (
      <div className="flex items-center justify-end gap-2">
        {item.type === 'income' 
          ? <ArrowUpRight className="w-4 h-4 text-success" />
          : <ArrowDownRight className="w-4 h-4 text-destructive" />
        }
        <span className={cn("font-medium", item.type === 'income' ? "text-success" : "text-destructive")}>
          {formatCurrency(item.amount)}
        </span>
      </div>
    ),
  },
];

// Helper para obter o número do mês para ordenação (1 para Jan, 12 para Dez)
const getMonthNumber = (month: string): number => {
  const normalized = month.toLowerCase().split('/')[0].trim();
  const index = MONTHS.map(m => m.toLowerCase()).findIndex(m => m === normalized);
  return index >= 0 ? index + 1 : 0;
};

export default function FinancialPage() {
  const { incomeExpenses, importData, addIncomeExpense } = useData();
  
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  
  // Get unique years for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(incomeExpenses.map(i => i.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [incomeExpenses]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = incomeExpenses;
    
    if (yearFilter !== "all") {
      filtered = filtered.filter(i => i.year === parseInt(yearFilter));
    }
    if (monthFilter !== "all") {
      filtered = filtered.filter(i => i.month.toLowerCase().includes(monthFilter.toLowerCase()));
    }

    // Sort by date descending
    return [...filtered].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [incomeExpenses, yearFilter, monthFilter]);

  const incomes = filteredItems.filter(item => item.type === 'income');
  const expenses = filteredItems.filter(item => item.type === 'expense');

  // Grouping logic
  const groupedIncomes = useMemo(() => {
    const groups = new Map<string, IncomeExpense[]>(); // Key: "Month Year"
    incomes.forEach(item => {
      const key = `${item.month} ${item.year}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    // Sort groups by Year (desc) then Month (desc)
    const sortedGroups = Array.from(groups.entries()).sort(([keyA], [keyB]) => {
      const [monthA, yearA] = keyA.split(' ');
      const [monthB, yearB] = keyB.split(' ');
      
      const yearDiff = parseInt(yearB) - parseInt(yearA);
      if (yearDiff !== 0) return yearDiff;
      
      return getMonthNumber(monthB) - getMonthNumber(monthA);
    });
    
    return sortedGroups;
  }, [incomes]);

  const groupedExpenses = useMemo(() => {
    const groups = new Map<string, IncomeExpense[]>(); // Key: "Month Year"
    expenses.forEach(item => {
      const key = `${item.month} ${item.year}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    // Sort groups by Year (desc) then Month (desc)
    const sortedGroups = Array.from(groups.entries()).sort(([keyA], [keyB]) => {
      const [monthA, yearA] = keyA.split(' ');
      const [monthB, yearB] = keyB.split(' ');
      
      const yearDiff = parseInt(yearB) - parseInt(yearA);
      if (yearDiff !== 0) return yearDiff;
      
      return getMonthNumber(monthB) - getMonthNumber(monthA);
    });
    
    return sortedGroups;
  }, [expenses]);

  const handleExport = () => {
    if (filteredItems.length === 0) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    exportIncomeExpenses(filteredItems);
    toast.success('Receitas e despesas exportadas com sucesso!');
  };

  // Calculate totals for summary cards
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Receitas & Despesas" 
        description="Gerencie todas as suas entradas e saídas financeiras"
      >
        {/* Filtro de Ano */}
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

        {/* Filtro de Mês */}
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {MONTHS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      <PageContent className="h-[calc(100vh-4rem-24px-120px)] space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-3 flex-shrink-0">
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

        <Tabs defaultValue="income" className="space-y-6 flex flex-col flex-1 min-h-0">
          <TabsList className="bg-muted/50 flex-shrink-0">
            <TabsTrigger value="income" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Receitas ({incomes.length})
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Despesas ({expenses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="flex-1 min-h-0 overflow-y-auto space-y-6">
            {groupedIncomes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>Nenhuma receita encontrada com os filtros selecionados.</p>
                </CardContent>
              </Card>
            ) : (
              groupedIncomes.map(([monthYear, items]) => (
                <Card key={monthYear}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-success">{monthYear}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Total: <span className="font-medium text-success">{formatCurrency(items.reduce((sum, i) => sum + i.amount, 0))}</span>
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DataTable 
                      data={items} 
                      columns={baseColumns}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="expenses" className="flex-1 min-h-0 overflow-y-auto space-y-6">
            {groupedExpenses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>Nenhuma despesa encontrada com os filtros selecionados.</p>
                </CardContent>
              </Card>
            ) : (
              groupedExpenses.map(([monthYear, items]) => (
                <Card key={monthYear}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-destructive">{monthYear}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Total: <span className="font-medium text-destructive">{formatCurrency(items.reduce((sum, i) => sum + i.amount, 0))}</span>
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DataTable 
                      data={items} 
                      columns={baseColumns}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </PageContent>
    </div>
  );
}