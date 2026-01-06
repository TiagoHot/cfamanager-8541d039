import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { formatCurrency, getProfitLossColor } from "@/lib/formatters";
import { WeeklyResult } from "@/types";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";

const columns = [
  {
    key: 'week',
    header: 'Semana',
    render: (item: WeeklyResult) => (
      <span className="font-mono font-bold">{item.week}</span>
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
      <span className="font-mono text-destructive">{formatCurrency(item.campaignCosts)}</span>
    ),
  },
  {
    key: 'sales',
    header: 'Vendas',
    className: 'text-center',
    render: (item: WeeklyResult) => (
      <span className={cn("font-mono font-bold", item.sales > 0 ? "text-success" : "text-muted-foreground")}>
        {item.sales}
      </span>
    ),
  },
  {
    key: 'campaignEarnings',
    header: 'Ganhos Campanhas',
    className: 'text-right',
    render: (item: WeeklyResult) => (
      <span className="font-mono">{formatCurrency(item.campaignEarnings)}</span>
    ),
  },
  {
    key: 'organicEarnings',
    header: 'Ganhos Orgânico',
    className: 'text-right',
    render: (item: WeeklyResult) => (
      <span className="font-mono">{formatCurrency(item.organicEarnings)}</span>
    ),
  },
  {
    key: 'adsenseEarnings',
    header: 'Adsense',
    className: 'text-right',
    render: (item: WeeklyResult) => (
      <span className="font-mono">{formatCurrency(item.adsenseEarnings)}</span>
    ),
  },
  {
    key: 'revenue',
    header: 'Faturamento',
    className: 'text-right',
    render: (item: WeeklyResult) => (
      <span className="font-mono font-medium text-primary">{formatCurrency(item.revenue)}</span>
    ),
  },
  {
    key: 'profitLoss',
    header: 'Lucro/Prejuízo',
    className: 'text-right',
    render: (item: WeeklyResult) => (
      <span className={cn("font-mono font-bold", getProfitLossColor(item.profitLoss))}>
        {formatCurrency(item.profitLoss)}
      </span>
    ),
  },
];

export default function WeeklyResultsPage() {
  const { weeklyResults, importData } = useData();

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Resultados Semanais" 
        description="Acompanhe seus resultados semana a semana"
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
          Nova Semana
        </Button>
      </PageHeader>

      <DataTable 
        data={weeklyResults} 
        columns={columns}
      />
    </div>
  );
}
