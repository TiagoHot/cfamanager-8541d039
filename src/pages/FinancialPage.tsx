import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, ArrowUpRight, ArrowDownRight, Upload } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { IncomeExpense } from "@/types";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";

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
        <span className="font-mono font-medium text-success">{formatCurrency(item.amount)}</span>
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
        <span className="font-mono font-medium text-destructive">{formatCurrency(item.amount)}</span>
      </div>
    ),
  },
];

export default function FinancialPage() {
  const { incomeExpenses, importData } = useData();
  const incomes = incomeExpenses.filter(item => item.type === 'income');
  const expenses = incomeExpenses.filter(item => item.type === 'expense');

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Receitas & Despesas" 
        description="Gerencie todas as suas entradas e saídas financeiras"
      >
        <ImportExcelDialog onImportComplete={importData}>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
        </ImportExcelDialog>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Registro
        </Button>
      </PageHeader>

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
