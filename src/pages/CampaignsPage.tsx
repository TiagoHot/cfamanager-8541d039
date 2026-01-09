import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Filter, Upload, X } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, getProfitLossColor, getROIColor } from "@/lib/formatters";
import { CampaignResult, MONTHS } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddCampaignDialog } from "@/components/dialogs/AddCampaignDialog";
import { exportCampaigns } from "@/lib/exportData";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageContent } from "@/components/PageContent"; // Importando PageContent

const columns = [
  {
    key: 'month',
    header: 'Mês',
    render: (item: CampaignResult) => (
      <div>
        <span className="font-medium">{item.month}</span>
        <span className="text-muted-foreground text-sm ml-1">{item.year}</span>
      </div>
    ),
  },
  {
    key: 'productName',
    header: 'Produto',
    render: (item: CampaignResult) => (
      <span className="font-medium">{item.productName}</span>
    ),
  },
  {
    key: 'location',
    header: 'Local',
    render: (item: CampaignResult) => {
      const isBrasil = item.location === 'Brasil';
      const variantClass = isBrasil 
        ? "bg-success/10 text-success border-success/20 hover:bg-success/20" 
        : "bg-info/10 text-info border-info/20 hover:bg-info/20";
      
      return (
        <Badge className={cn("text-xs font-medium", variantClass)}>
          {item.location}
        </Badge>
      );
    },
  },
  {
    key: 'strategy',
    header: 'Estratégia',
    render: (item: CampaignResult) => (
      <Badge variant="outline">{item.strategy}</Badge>
    ),
  },
  {
    key: 'daysRunning',
    header: 'Dias',
    className: 'text-center',
    render: (item: CampaignResult) => (
      <span>{item.daysRunning}</span>
    ),
  },
  {
    key: 'impressions',
    header: 'Impressões',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span>{formatNumber(item.impressions)}</span>
    ),
  },
  {
    key: 'clicks',
    header: 'Cliques',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span>{formatNumber(item.clicks)}</span>
    ),
  },
  {
    key: 'sales',
    header: 'Vendas',
    className: 'text-center',
    render: (item: CampaignResult) => (
      <span className={cn("font-bold", item.sales > 0 ? "text-success" : "text-muted-foreground")}>
        {item.sales}
      </span>
    ),
  },
  {
    key: 'earnings',
    header: 'Ganhos',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className="text-success">{formatCurrency(item.earnings)}</span>
    ),
  },
  {
    key: 'costs',
    header: 'Custos',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className="text-destructive">{formatCurrency(item.costs)}</span>
    ),
  },
  {
    key: 'profitLoss',
    header: 'Lucro/Prejuízo',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className={cn("font-medium", getProfitLossColor(item.profitLoss))}>
        {formatCurrency(item.profitLoss)}
      </span>
    ),
  },
  {
    key: 'roi',
    header: 'ROI',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className={cn("font-bold", getROIColor(item.roi))}>
        {formatPercent(item.roi)}
      </span>
    ),
  },
];

export default function CampaignsPage() {
  const { campaigns, products, importData, addCampaign } = useData();
  
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  // Mantendo o estado do filtro de produto, mas ele não será exposto na UI
  const [productFilter, setProductFilter] = useState<string>("all"); 

  // Get unique years and products for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(campaigns.map(c => c.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [campaigns]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (yearFilter !== "all" && c.year !== parseInt(yearFilter)) return false;
      if (monthFilter !== "all" && c.month !== monthFilter) return false;
      if (productFilter !== "all" && c.productName !== productFilter) return false;
      return true;
    });
  }, [campaigns, yearFilter, monthFilter, productFilter]);

  const handleExport = () => {
    if (filteredCampaigns.length === 0) {
      toast.error('Nenhuma campanha para exportar');
      return;
    }
    exportCampaigns(filteredCampaigns);
    toast.success('Campanhas exportadas com sucesso!');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Resultados de Campanhas" 
        description="Acompanhe o desempenho de todas as suas campanhas"
      >
        {/* Filtro de Ano (Select) */}
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

        {/* Filtro de Mês (Select) */}
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
        
        {/* O Popover de Filtros foi removido daqui */}

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
        <AddCampaignDialog onAdd={addCampaign} products={products}>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </AddCampaignDialog>
      </PageHeader>

      <PageContent>
        <DataTable 
          data={filteredCampaigns} 
          columns={columns}
          headerClassName="sticky top-0 z-10 bg-background shadow-sm"
        />
      </PageContent>
    </div>
  );
}