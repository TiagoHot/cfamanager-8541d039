import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Filter, X, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, getProfitLossColor, normalizeMonthToAbbreviation } from "@/lib/formatters";
import { WeeklyResult, MONTHS } from "@/types";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddWeeklyResultDialog } from "@/components/dialogs/AddWeeklyResultDialog";
import { EditWeeklyResultDialog } from "@/components/dialogs/EditWeeklyResultDialog";
import { exportWeeklyResults } from "@/lib/exportData";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { PageContent } from "@/components/PageContent";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components

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
  const normalizedAbbr = normalizeMonthToAbbreviation(month.split('/')[0].trim()); // Usa a nova utilidade
  const index = MONTHS.findIndex(m => m === normalizedAbbr);
  // Return 1-based month number (1 for Jan, 12 for Dez). If not found, return 0.
  return index >= 0 ? index + 1 : 0;
};

export default function WeeklyResultsPage() {
  const { weeklyResults, importData, addWeeklyResult, updateWeeklyResult, removeWeeklyResult } = useData();
  
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // Calculate max sales across all results for consistent bar scaling
  const maxSales = useMemo(() => {
    return Math.max(...weeklyResults.map(r => r.sales), 1); // Ensure at least 1 to prevent division by zero
  }, [weeklyResults]);

  // Define columns inside the component to use updateWeeklyResult and removeWeeklyResult
  const columns = useMemo(() => [
    {
      key: 'week',
      header: 'Semana',
      render: (item: WeeklyResult) => (
        <span className="font-bold">{item.week}</span>
      ),
    },
    {
      key: 'period',
      header: 'Período',
      render: (item: WeeklyResult) => (
        <span className="text-sm">{item.period}</span>
      ),
    },
    {
      key: 'month',
      header: 'Mês', // Changed from 'Mês/Ano' as year is now in card title
      render: (item: WeeklyResult) => (
        <span className="font-medium">{item.month}</span>
      ),
    },
    {
      key: 'campaignCosts',
      header: 'Custo Campanhas',
      className: 'text-right',
      render: (item: WeeklyResult) => (
        <span className="text-destructive">{formatCurrency(item.campaignCosts)}</span>
      ),
    },
    {
      key: 'sales',
      header: 'Vendas',
      className: 'w-28 text-left', // Adjusted width for the column
      render: (item: WeeklyResult) => {
        const barWidth = (item.sales / maxSales) * 100; // Percentage width
        return (
          <div className="flex items-center gap-2">
            <div className="relative h-5 w-16 rounded-sm bg-muted"> {/* Adjusted width for the bar container */}
              <div
                className="absolute left-0 top-0 h-full rounded-sm bg-success/70"
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
      className: 'text-right',
      render: (item: WeeklyResult) => (
        <span>{formatCurrency(item.campaignEarnings)}</span>
      ),
    },
    {
      key: 'organicEarnings',
      header: 'Ganhos Orgânico',
      className: 'text-right',
      render: (item: WeeklyResult) => (
        <span>{formatCurrency(item.organicEarnings)}</span>
      ),
    },
    {
      key: 'adsenseEarnings',
      header: 'Adsense',
      className: 'text-right',
      render: (item: WeeklyResult) => (
        <span>{formatCurrency(item.adsenseEarnings)}</span>
      ),
    },
    {
      key: 'revenue',
      header: 'Faturamento',
      className: 'text-right',
      render: (item: WeeklyResult) => (
        <span className="font-medium text-primary">{formatCurrency(item.revenue)}</span>
      ),
    },
    {
      key: 'profitLoss',
      header: 'Lucro/Prejuízo',
      className: 'text-right',
      render: (item: WeeklyResult) => (
        <span className={cn("font-bold", getProfitLossColor(item.profitLoss))}>
          {formatCurrency(item.profitLoss)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-24 text-center',
      render: (item: WeeklyResult) => (
        <div className="flex justify-center gap-1">
          <EditWeeklyResultDialog result={item} onUpdate={updateWeeklyResult}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
          </EditWeeklyResultDialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
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
        </div>
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
      // Normaliza o mês do resultado para comparação com o filtro
      filtered = filtered.filter(r => normalizeMonthToAbbreviation(r.month) === monthFilter);
    }

    return [...filtered].sort((a, b) => {
      // 1. Compare by year (descending)
      if (b.year !== a.year) return b.year - a.year;
      
      // 2. Then by month (descending) - using the first month for sorting
      const monthA = getMonthNumber(a.month);
      const monthB = getMonthNumber(b.month);
      if (monthB !== monthA) return monthB - monthA;
      
      // 3. Finally by week number (descending)
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
    // Sort years descending
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [filteredAndSortedResults]);

  const hasFilters = yearFilter !== "all" || monthFilter !== "all";

  const clearFilters = () => {
    setYearFilter("all");
    setMonthFilter("all");
  };

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
      <PageHeader 
        title="Resultados Semanais" 
        description="Acompanhe seus resultados semana a semana"
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