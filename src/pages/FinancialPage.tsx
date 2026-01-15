import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, ArrowUpRight, ArrowDownRight, Upload, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, normalizeMonthToAbbreviation } from "@/lib/formatters";
import { IncomeExpense, MONTHS } from "@/types";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddIncomeExpenseDialog } from "@/components/dialogs/AddIncomeExpenseDialog";
import { EditIncomeExpenseDialog } from "@/components/dialogs/EditIncomeExpenseDialog"; // NEW
import { exportIncomeExpenses } from "@/lib/exportData";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContent } from "@/components/PageContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // NEW

// Helper para obter o número do mês para ordenação (1 para Jan, 12 para Dez)
const getMonthNumber = (month: string): number => {
  const normalized = normalizeMonthToAbbreviation(month.split('/')[0].trim());
  const index = MONTHS.map(m => m.toLowerCase()).findIndex(m => m === normalized.toLowerCase());
  return index >= 0 ? index + 1 : 0;
};

export default function FinancialPage() {
  const { incomeExpenses, importData, addIncomeExpense, updateIncomeExpense, removeIncomeExpense } = useData();
  
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  
  // Get unique years for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(incomeExpenses.map(i => i.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [incomeExpenses]);

  // Define action column renderer
  const actionColumn = (item: IncomeExpense) => (
    <div className="flex items-center justify-center gap-1">
      <EditIncomeExpenseDialog item={item} onUpdate={updateIncomeExpense}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="w-4 h-4" />
        </Button>
      </EditIncomeExpenseDialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o registro de {item.type === 'income' ? 'Receita' : 'Despesa'} 
              de <strong>{formatCurrency(item.amount)}</strong> ({item.source})? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeIncomeExpense(item.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // Colunas específicas para Receitas (coluna da esquerda)
  const incomeColumns = useMemo(() => [
    {
      key: 'date',
      header: 'Data',
      className: 'w-20',
      render: (item: IncomeExpense) => formatDate(item.date),
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
      header: 'Nota',
      render: (item: IncomeExpense) => (
        <span className="text-sm text-muted-foreground">{item.details || '-'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      className: 'text-right w-24',
      render: (item: IncomeExpense) => (
        <span className="font-medium text-success">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-24 text-center',
      render: actionColumn,
    },
  ], [updateIncomeExpense, removeIncomeExpense]);

  // Colunas específicas para Despesas (coluna da direita)
  const expenseColumns = useMemo(() => [
    {
      key: 'date',
      header: 'Data',
      className: 'w-20',
      render: (item: IncomeExpense) => formatDate(item.date),
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
      header: 'Nota',
      render: (item: IncomeExpense) => (
        <span className="text-sm text-muted-foreground">{item.details || '-'}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      className: 'text-right w-24',
      render: (item: IncomeExpense) => (
        <span className="font-medium text-destructive">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-24 text-center',
      render: actionColumn,
    },
  ], [updateIncomeExpense, removeIncomeExpense]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = incomeExpenses;
    
    if (yearFilter !== "all") {
      filtered = filtered.filter(i => i.year === parseInt(yearFilter));
    }
    if (monthFilter !== "all") {
      filtered = filtered.filter(i => normalizeMonthToAbbreviation(i.month) === monthFilter);
    }

    // Sort by date descending
    return [...filtered].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [incomeExpenses, yearFilter, monthFilter]);

  // Grouping logic (combined income and expense)
  const groupedItems = useMemo(() => {
    const groups = new Map<string, IncomeExpense[]>(); // Key: "Month Year"
    filteredItems.forEach(item => {
      const key = `${normalizeMonthToAbbreviation(item.month)} ${item.year}`;
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
  }, [filteredItems]);

  const handleExport = () => {
    if (filteredItems.length === 0) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    exportIncomeExpenses(filteredItems);
    toast.success('Receitas e despesas exportadas com sucesso!');
  };

  // Calculate totals for summary cards
  const totalIncome = filteredItems.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = filteredItems.filter(i => i.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
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

      <PageContent className="space-y-6">
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

        {groupedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Nenhum registro encontrado com os filtros selecionados.</p>
            </CardContent>
          </Card>
        ) : (
          groupedItems.map(([monthYear, items]) => {
            const monthlyIncomes = items.filter(i => i.type === 'income');
            const monthlyExpenses = items.filter(i => i.type === 'expense');
            const monthlyIncomeTotal = monthlyIncomes.reduce((sum, i) => sum + i.amount, 0);
            const monthlyExpenseTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
            const monthlyBalance = monthlyIncomeTotal - monthlyExpenseTotal;

            return (
              <Card key={monthYear}>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-xl flex items-center justify-between">
                    <span>{monthYear}</span>
                    <div className="text-sm font-medium">
                      Saldo: 
                      <span className={cn("ml-2", monthlyBalance >= 0 ? 'text-success' : 'text-destructive')}>
                        {formatCurrency(monthlyBalance)}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
                    {/* Coluna de Receitas */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-3 text-success flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5" />
                        Receitas ({monthlyIncomes.length})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Total: <span className="font-medium text-success">{formatCurrency(monthlyIncomeTotal)}</span>
                      </p>
                      <DataTable 
                        data={monthlyIncomes} 
                        columns={incomeColumns}
                      />
                    </div>

                    {/* Coluna de Despesas */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-3 text-destructive flex items-center gap-2">
                        <ArrowDownRight className="w-5 h-5" />
                        Despesas ({monthlyExpenses.length})
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Total: <span className="font-medium text-destructive">{formatCurrency(monthlyExpenseTotal)}</span>
                      </p>
                      <DataTable 
                        data={monthlyExpenses} 
                        columns={expenseColumns}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </PageContent>
    </div>
  );
}