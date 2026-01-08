import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Filter, X } from "lucide-react";
import { formatCurrency, getProfitLossColor } from "@/lib/formatters";
import { WeeklyResult, MONTHS } from "@/types";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddWeeklyResultDialog } from "@/components/dialogs/AddWeeklyResultDialog";
import { exportWeeklyResults } from "@/lib/exportData";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { PageContent } from "@/components/PageContent"; // Importando PageContent

// Extract week number from week string (e.g., "S01" -> 1, "S52" -> 52)
const getWeekNumber = (week: string): number => {
  const match = week.match(/S(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

// Get month number from month name
const getMonthNumber = (month: string): number => {
  const normalized = month.toLowerCase().split('/')[0].trim();
  const index = MONTHS.findIndex(m => m.toLowerCase() === normalized);
  return index >= 0 ? index + 1 : 0;
};

const columns = [
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
    header: 'Mês/Ano',
    render: (item: WeeklyResult) => (
      <div>
        <span className="font-medium">{item.month}</span>
        <span className="text-muted-foreground text-sm ml-1">{item.year}</span>
      </div>
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
    className: 'text-center',
    render: (item: WeeklyResult) => (
      <span className={cn("font-bold", item.sales > 0 ? "text-success" : "text-muted-foreground")}>
        {item.sales}
      </span>
    ),
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
];

export default function WeeklyResultsPage() {
  const { weeklyResults, importData, addWeeklyResult } = useData();
  
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");

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
      filtered = filtered.filter(r => r.month.toLowerCase().includes(monthFilter.toLowerCase()));
    }

    return [...filtered].sort((a, b) => {
      // First, compare by year (descending)
      if (b.year !== a.year) return b.year - a.year;
      
      // Then by month (descending)
      const monthA = getMonthNumber(a.month);
      const monthB = getMonthNumber(b.month);
      if (monthB !== monthA) return monthB - monthA;
      
      // Finally by week number (descending)
      return getWeekNumber(b.week) - getWeekNumber(a.week);
    });
  }, [weeklyResults, yearFilter, monthFilter]);

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
        <AddWeeklyResultDialog onAdd={addWeeklyResult}>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Semana
          </Button>
        </AddWeeklyResultDialog>
      </PageHeader>

      <PageContent>
        <DataTable 
          data={filteredAndSortedResults} 
          columns={columns}
          headerClassName="sticky top-0 z-10 bg-background shadow-sm"
        />
      </PageContent>
    </div>
  );
}