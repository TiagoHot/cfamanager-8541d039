import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { formatCurrency, getProfitLossColor, normalizeMonthToAbbreviation, formatMonthName } from "@/lib/formatters";
import { WeeklyResult, MONTHS } from "@/types";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddWeeklyResultDialog } from "@/components/dialogs/AddWeeklyResultDialog";
import { EditWeeklyResultDialog } from "@/components/dialogs/EditWeeklyResultDialog";
import { exportWeeklyResults } from "@/lib/exportData";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContent } from "@/components/PageContent";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
// import { useCurrencyRates } from "@/hooks/useCurrencyRates"; // Não é mais necessário aqui

// Extract week number from week string (e.g., "S01" -> 1, "S52" -> 52)
const getWeekNumber = (week: string): number => {
  if (!week) return 0;
  // Remove 'S' and parse the number
  const match = week.toUpperCase().match(/S(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

// Get month number from month name (handles abbreviations and composite months like Jan/Fev)
const getMonthNumber = (month: string): number => {
  // Normaliza a string do mês para sua abreviação antes de encontrar o índice
  const normalizedAbbr = normalizeMonthToAbbreviation(month.split('/')[0].trim());
  const index = MONTHS.findIndex(m => m === normalizedAbbr);
  // Return 1-based month number (1 for Jan, 12 for Dez). If not found, return 0.
  return index >= 0 ? index + 1 : 0;
};

// O componente CurrencyRateDisplay foi movido para AppLayout.

export default function WeeklyResultsPage() {
  const { weeklyResults, importData, addWeeklyResult, updateWeeklyResult, removeWeeklyResult } = useData();
  
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // Calculate max sales across all results for consistent bar scaling
  const maxSales = useMemo(() => {
    return Math.max(...weeklyResults.map(r => r.sales), 1);
  }, [weeklyResults]);

  // Define columns inside the component to use updateWeeklyResult and removeWeeklyResult
  const columns = useMemo(() => [
    {
      key: 'week',
      header: 'Semana',
      className: 'text-left bg-warning/5', // Fundo amarelo suave
      render: (item: WeeklyResult) => (
        <span className="font-bold">{item.week}</span>
      ),
    },
    {
      key: 'period',
      header: 'Período',
      className: 'text-left bg-warning/5', // Fundo amarelo suave
      render: (item: WeeklyResult) => (
        <span className="text-sm">{item.period}</span>
      ),
    },
    {
      key: 'month',
      header: 'Mês',
      className: 'text-left bg-warning/5', // Fundo amarelo suave
      render: (item: WeeklyResult) => (
        <span className="font-medium">{item.month}</span>
      ),
    },
    {
      key: 'campaignCosts',
      header: 'Custo Campanhas',
      className: 'text-left', 
      render: (item: WeeklyResult) => (
        <span className="text-high-contrast">{formatCurrency(item.campaignCosts)}</span>
      ),
    },
    {
      key: 'sales',
      header: 'Vendas',
      className: 'w-28 text-left', // Keeping sales bar aligned left
      render: (item: WeeklyResult) => {
        const barWidth = (item.sales / maxSales) * 100;
        return (
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-16 rounded-sm bg-muted">
              <div
                className="absolute left-0 top-0 h-full rounded-sm bg-success/70" // Alterado para verde (success)
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-sm font-bold text-foreground">
              {item.sales}
            </span>
          </div>
        );
      },
    },
    {
      key: 'campaignEarnings',
      header: 'Ganhos Campanhas',
      className: 'text-left bg-success/5',
      render: (item: WeeklyResult) => (
        <span className="text-foreground">{formatCurrency(item.campaignEarnings)}</span>
      ),
    },
    {
      key: 'organicEarnings',
      header: 'Ganhos Orgânico',
      className: 'text-left bg-success/5',
      render: (item: WeeklyResult) => (
        <span className="text-foreground">{formatCurrency(item.organicEarnings)}</span>
      ),
    },
    {
      key: 'adsenseEarnings',
      header: 'Adsense',
      className: 'text-left bg-success/5',
      render: (item: WeeklyResult) => (
        <span className="text-foreground">{formatCurrency(item.adsenseEarnings)}</span>
      ),
    },
    {
      key: 'revenue',
      header: 'Faturamento',
      className: 'text-left',
      render: (item: WeeklyResult) => (
        <span className="font-medium text-primary">{formatCurrency(item.revenue)}</span>
      ),
    },
    {
      key: 'profitLoss',
      header: 'Lucro/Prejuízo',
      className: 'text-left',
      render: (item: WeeklyResult) => (
        <span className={cn("font-bold", getProfitLossColor(item.profitLoss))}>
          {formatCurrency(item.profitLoss)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-16 text-center',
      render: (item: WeeklyResult) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditWeeklyResultDialog result={item} onUpdate={updateWeeklyResult}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            </EditWeeklyResultDialog>
            
            <DropdownMenuSeparator />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  onSelect={(e) => e.preventDefault()} // Prevent dropdown close on trigger click
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso removerá o resultado semanal da semana {item.week} de {item.year}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => removeWeeklyResult(item.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [updateWeeklyResult, removeWeeklyResult, maxSales]);

  // Get unique years for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(weeklyResults.map(r => r.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [weeklyResults]);

  // Filter and sort weekly results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = weeklyResults;
    
    if (yearFilter !== "all") {
      filtered = filtered.filter(r => r.year === parseInt(yearFilter));
    }
    if (monthFilter !== "all") {
      filtered = filtered.filter(r => normalizeMonthToAbbreviation(r.month) === monthFilter);
    }

    return [...filtered].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      const monthA = getMonthNumber(a.month);
      const monthB = getMonthNumber(b.month);
      if (monthB !== monthA) return monthB - monthA;
      return getWeekNumber(b.week) - getWeekNumber(a.week);
    });
  }, [weeklyResults, yearFilter, monthFilter]);

  // Group results by year
  const groupedResultsByYear = useMemo(() => {
    const groups = new Map<number, WeeklyResult[]>();
    for (const result of filteredAndSortedResults) {
      if (!groups.has(result.year)) {
        groups.set(result.year, []);
      }
      groups.get(result.year)!.push(result);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [filteredAndSortedResults]);

  const handleExport = () => {
    if (filteredAndSortedResults.length === 0) {
      toast.error('Nenhum resultado para exportar');
      return;
    }
    exportWeeklyResults(filteredAndSortedResults);
    toast.success('Resultados exportados com sucesso!');
  };

  return (
    <div className="animate-fade-in">
      
      {/* CurrencyRateDisplay foi movido para AppLayout */}

      <PageHeader 
        title="Resultados Semanais" 
        description="Acompanhe seus resultados semana a semana"
      >
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Anos</SelectItem>
            {years.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {MONTHS.map(m => (
              <SelectItem key={m} value={m}>{formatMonthName(m)}</SelectItem>
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
        <AddWeeklyResultDialog onAdd={addWeeklyResult} weeklyResults={weeklyResults}>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Semana
          </Button>
        </AddWeeklyResultDialog>
      </PageHeader>

      <PageContent className="space-y-6">
        {groupedResultsByYear.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Nenhum resultado semanal encontrado com os filtros selecionados.</p>
            </CardContent>
          </Card>
        ) : (
          groupedResultsByYear.map(([year, results]) => (
            <Card key={year}>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">
                  Ano de {year}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {results.length} resultados semanais registrados
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable 
                  data={results} 
                  columns={columns}
                />
              </CardContent>
            </Card>
          ))
        )}
      </PageContent>
    </div>
  );
}