import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Filter } from "lucide-react";
import { mockCampaignResults } from "@/data/mockData";
import { formatCurrency, formatNumber, formatPercent, getProfitLossColor, getROIColor } from "@/lib/formatters";
import { CampaignResult } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
    render: (item: CampaignResult) => (
      <Badge variant={item.location === 'Brasil' ? 'default' : 'secondary'}>
        {item.location}
      </Badge>
    ),
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
      <span className="font-mono">{item.daysRunning}</span>
    ),
  },
  {
    key: 'impressions',
    header: 'Impressões',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className="font-mono">{formatNumber(item.impressions)}</span>
    ),
  },
  {
    key: 'clicks',
    header: 'Cliques',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className="font-mono">{formatNumber(item.clicks)}</span>
    ),
  },
  {
    key: 'sales',
    header: 'Vendas',
    className: 'text-center',
    render: (item: CampaignResult) => (
      <span className={cn("font-mono font-bold", item.sales > 0 ? "text-success" : "text-muted-foreground")}>
        {item.sales}
      </span>
    ),
  },
  {
    key: 'earnings',
    header: 'Ganhos',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className="font-mono text-success">{formatCurrency(item.earnings)}</span>
    ),
  },
  {
    key: 'costs',
    header: 'Custos',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className="font-mono text-destructive">{formatCurrency(item.costs)}</span>
    ),
  },
  {
    key: 'profitLoss',
    header: 'Lucro/Prejuízo',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className={cn("font-mono font-medium", getProfitLossColor(item.profitLoss))}>
        {formatCurrency(item.profitLoss)}
      </span>
    ),
  },
  {
    key: 'roi',
    header: 'ROI',
    className: 'text-right',
    render: (item: CampaignResult) => (
      <span className={cn("font-mono font-bold", getROIColor(item.roi))}>
        {formatPercent(item.roi)}
      </span>
    ),
  },
];

export default function CampaignsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Resultados de Campanhas" 
        description="Acompanhe o desempenho de todas as suas campanhas"
      >
        <Select defaultValue="2025">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </PageHeader>

      <DataTable 
        data={mockCampaignResults} 
        columns={columns}
      />
    </div>
  );
}
