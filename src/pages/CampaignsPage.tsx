import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, getProfitLossColor, getROIColor, normalizeMonthToAbbreviation, formatMonthName } from "@/lib/formatters";
import { CampaignResult, MONTHS } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddCampaignDialog } from "@/components/dialogs/AddCampaignDialog";
import { EditCampaignDialog } from "@/components/dialogs/EditCampaignDialog"; // NEW
import { exportCampaigns } from "@/lib/exportData";
import { toast } from "sonner";
import { PageContent } from "@/components/PageContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Helper para recalcular ROI na exibição
const calculateROI = (profitLoss: number, costs: number): number => {
  if (costs === 0) return 0;
  return (profitLoss / costs) * 100;
};

export default function CampaignsPage() {
  const { campaigns, products, importData, addCampaign, updateCampaign, removeCampaign } = useData();
  
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all"); 

  // Define columns inside the component to use updateCampaign/removeCampaign
  const columns = useMemo(() => [
    {
      key: 'daysRunning',
      header: 'Dias',
      className: 'w-16 text-center',
      render: (item: CampaignResult) => (
        <span>{item.daysRunning}</span>
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
        <span className={cn("font-bold", item.sales > 0 ? "text-warning" : "text-muted-foreground")}>
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
      render: (item: CampaignResult) => {
        // Recalcula o ROI na exibição para garantir precisão
        const calculatedRoi = calculateROI(item.profitLoss, item.costs);
        
        return (
          <span className={cn("font-bold", getROIColor(calculatedRoi))}>
            {formatPercent(calculatedRoi)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-16 text-center', // Reduced width
      render: (item: CampaignResult) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <EditCampaignDialog campaign={item} onUpdate={updateCampaign} products={products}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            </EditCampaignDialog>
            
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
                  <AlertDialogTitle>Remover Campanha</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover a campanha <strong>{item.productName} ({item.month}/{item.year})</strong>? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => removeCampaign(item.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
  ], [updateCampaign, removeCampaign, products]);

  // Get unique years for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(campaigns.map(c => c.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [campaigns]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (yearFilter !== "all" && c.year !== parseInt(yearFilter)) return false;
      // Normaliza o mês da campanha para comparação com o filtro
      if (monthFilter !== "all" && normalizeMonthToAbbreviation(c.month) !== monthFilter) return false;
      if (productFilter !== "all" && c.productName !== productFilter) return false;
      return true;
    }).sort((a, b) => {
      // Sort by date descending for consistent display order within groups
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [campaigns, yearFilter, monthFilter, productFilter]);

  // Helper para obter o número do mês da primeira parte de uma string (ex: 'Jan/Fev' -> 0)
  const getFirstMonthIndex = (monthStr: string) => {
      const firstMonthAbbr = normalizeMonthToAbbreviation(monthStr.split('/')[0].trim()); // Usa a nova utilidade
      return MONTHS.indexOf(firstMonthAbbr);
  };

  // Group campaigns by Year and Month
  const groupedCampaigns = useMemo(() => {
    const groups = new Map<number, Map<string, CampaignResult[]>>();
    
    for (const campaign of filteredCampaigns) {
        if (!groups.has(campaign.year)) {
            groups.set(campaign.year, new Map<string, CampaignResult[]>());
        }
        const monthMap = groups.get(campaign.year)!;
        
        // Usa a string do mês normalizada para agrupamento
        const normalizedMonthForGrouping = normalizeMonthToAbbreviation(campaign.month);
        if (!monthMap.has(normalizedMonthForGrouping)) {
            monthMap.set(normalizedMonthForGrouping, []);
        }
        monthMap.get(normalizedMonthForGrouping)!.push(campaign);
    }

    // Sort years descending
    const sortedYears = Array.from(groups.keys()).sort((a, b) => b - a);

    // Prepare final structure, sorting months within each year (descending month number)
    const finalGroups: { year: number; month: string; campaigns: CampaignResult[] }[] = [];
    
    for (const year of sortedYears) {
        const monthMap = groups.get(year)!;
        const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => 
            getFirstMonthIndex(b) - getFirstMonthIndex(a)
        );
        
        for (const month of sortedMonths) {
            // Sort campaigns within each month by profitLoss descending
            const sortedCampaignsInMonth = monthMap.get(month)!.sort((a, b) => b.profitLoss - a.profitLoss);
            finalGroups.push({
                year,
                month,
                campaigns: sortedCampaignsInMonth
            });
        }
    }
    
    return finalGroups;
  }, [filteredCampaigns]);


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
        <AddCampaignDialog onAdd={addCampaign} products={products}>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </AddCampaignDialog>
      </PageHeader>

      <PageContent className="space-y-6">
        {groupedCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Nenhuma campanha encontrada com os filtros selecionados.</p>
            </CardContent>
          </Card>
        ) : (
          groupedCampaigns.map(({ year, month, campaigns }) => (
            <Card key={`${year}-${month}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">
                  {formatMonthName(month)} de {year}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {campaigns.length} produtos registrados
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable 
                  data={campaigns} 
                  columns={columns}
                  // Removendo sticky header, pois o PageContent já gerencia a rolagem
                />
              </CardContent>
            </Card>
          ))
        )}
      </PageContent>
    </div>
  );
}