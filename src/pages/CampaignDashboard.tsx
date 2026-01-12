import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatPercent, normalizeMonthToAbbreviation, getProfitLossColor, getROIColor } from "@/lib/formatters";
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, Percent } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line, 
  Legend
} from "recharts";
import { useState, useMemo } from "react";
import { MONTHS } from "@/types"; 
import { cn } from "@/lib/utils";

const MONTH_ORDER = MONTHS;

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const receita = payload.find((p: any) => p.dataKey === 'receita')?.value || 0;
    const despesa = payload.find((p: any) => p.dataKey === 'despesa')?.value || 0;
    const lucroPrejuizo = receita - despesa;

    return (
      <div className="p-3 bg-card border border-border rounded-lg shadow-lg text-sm">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-success">Receita : {formatCurrency(receita)}</p>
        <p className="text-destructive">Despesa : {formatCurrency(despesa)}</p>
        <p className={getProfitLossColor(lucroPrejuizo)}>Lucro/Prejuízo : {formatCurrency(lucroPrejuizo)}</p>
      </div>
    );
  }
  return null;
};

// Helper function to get dynamic styling for categories
const getCategoryStyling = (categoryName: string) => {
  let cardBgClass = '';
  let cardBorderClass = '';
  let cardTextClass = '';
  let circleBgClass = '';

  switch (categoryName) {
    case 'Brasil':
      cardBgClass = 'bg-success/5'; // Lighter background
      cardBorderClass = 'border-success/20';
      cardTextClass = 'text-success';
      circleBgClass = 'bg-success';
      break;
    case 'Gringa':
      cardBgClass = 'bg-info/5';
      cardBorderClass = 'border-info/20';
      cardTextClass = 'text-info';
      circleBgClass = 'bg-info';
      break;
    case 'Pesquisa':
      cardBgClass = 'bg-warning/5';
      cardBorderClass = 'border-warning/20';
      cardTextClass = 'text-warning';
      circleBgClass = 'bg-warning';
      break;
    case 'Display':
      cardBgClass = 'bg-chart-5/5'; // Purple-ish
      cardBorderClass = 'border-chart-5/20';
      cardTextClass = 'text-chart-5';
      circleBgClass = 'bg-chart-5';
      break;
    case 'YouTube':
      cardBgClass = 'bg-chart-1/5'; // Blue
      cardBorderClass = 'border-chart-1/20';
      cardTextClass = 'text-chart-1';
      circleBgClass = 'bg-chart-1';
      break;
    case 'Shopping':
      cardBgClass = 'bg-chart-2/5'; // Green
      cardBorderClass = 'border-chart-2/20';
      cardTextClass = 'text-chart-2';
      circleBgClass = 'bg-chart-2';
      break;
    case 'Performance Max':
      cardBgClass = 'bg-chart-3/5'; // Yellow/Orange
      cardBorderClass = 'border-chart-3/20';
      cardTextClass = 'text-chart-3';
      circleBgClass = 'bg-chart-3';
      break;
    case 'Discovery':
      cardBgClass = 'bg-chart-6/5'; // Another blue
      cardBorderClass = 'border-chart-6/20';
      cardTextClass = 'text-chart-6';
      circleBgClass = 'bg-chart-6';
      break;
    default:
      cardBgClass = 'bg-secondary/5';
      cardBorderClass = 'border-secondary/20';
      cardTextClass = 'text-secondary-foreground';
      circleBgClass = 'bg-secondary';
      break;
  }
  return { cardBgClass, cardBorderClass, cardTextClass, circleBgClass };
};

export default function CampaignDashboard() {
  const { campaigns } = useData();
  
  const years = useMemo(() => {
    return [...new Set(campaigns.map(c => c.year))].sort((a, b) => b - a);
  }, [campaigns]);
  
  const [selectedYear, setSelectedYear] = useState<string>(years[0]?.toString() || "all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  
  const filteredCampaigns = useMemo(() => {
    const year = selectedYear === "all" ? null : parseInt(selectedYear);
    return campaigns.filter(c => {
      if (year !== null && c.year !== year) return false;
      if (selectedMonth !== "all" && normalizeMonthToAbbreviation(c.month) !== selectedMonth) return false;
      return true;
    });
  }, [campaigns, selectedYear, selectedMonth]);
  
  const stats = useMemo(() => {
    const totalEarnings = filteredCampaigns.reduce((sum, c) => sum + c.earnings, 0);
    const totalCosts = filteredCampaigns.reduce((sum, c) => sum + c.costs, 0);
    const totalSales = filteredCampaigns.reduce((sum, c) => sum + c.sales, 0);
    const profit = totalEarnings - totalCosts;
    const roi = totalCosts > 0 ? ((totalEarnings - totalCosts) / totalCosts) * 100 : 0;
    
    return { totalEarnings, totalCosts, totalSales, profit, roi };
  }, [filteredCampaigns]);
  
  const monthlyData = useMemo(() => {
    const year = selectedYear === "all" ? null : parseInt(selectedYear);
    
    const filteredCampaignsForChart = campaigns.filter(c => {
      const yearMatch = year === null || c.year === year;
      const monthMatch = selectedMonth === "all" || normalizeMonthToAbbreviation(c.month) === selectedMonth;
      return yearMatch && monthMatch;
    });
    
    const monthlyMap = new Map<string, { earnings: number; costs: number }>();
    filteredCampaignsForChart.forEach(c => { 
      const monthKey = normalizeMonthToAbbreviation(c.month);
      const current = monthlyMap.get(monthKey) || { earnings: 0, costs: 0 };
      monthlyMap.set(monthKey, {
        earnings: current.earnings + c.earnings,
        costs: current.costs + c.costs,
      });
    });
    
    if (selectedMonth !== "all") {
      const data = monthlyMap.get(selectedMonth) || { earnings: 0, costs: 0 };
      return [{
        month: selectedMonth,
        receita: data.earnings,
        despesa: data.costs,
      }];
    }

    return MONTH_ORDER
      .map(month => { 
        const data = monthlyMap.get(month) || { earnings: 0, costs: 0 };
        return {
          month: month,
          receita: data.earnings,
          despesa: data.costs,
        };
      });
  }, [campaigns, selectedYear, selectedMonth]);
  
  const strategyData = useMemo(() => {
    const strategyMap = new Map<string, { earnings: number; costs: number; sales: number }>();
    filteredCampaigns.forEach(c => {
      const strategy = c.strategy || 'Outros';
      const current = strategyMap.get(strategy) || { earnings: 0, costs: 0, sales: 0 };
      strategyMap.set(strategy, {
        earnings: current.earnings + c.earnings,
        costs: current.costs + c.costs,
        sales: current.sales + c.sales,
      });
    });
    
    return Array.from(strategyMap.entries()).map(([name, data]) => ({
      name,
      earnings: data.earnings,
      costs: data.costs,
      sales: data.sales,
      profit: data.earnings - data.costs,
      roi: data.costs > 0 ? ((data.earnings - data.costs) / data.costs) * 100 : 0,
    }));
  }, [filteredCampaigns]);
  
  const locationData = useMemo(() => {
    const locationMap = new Map<string, { earnings: number; costs: number; sales: number }>();
    filteredCampaigns.forEach(c => {
      const location = c.location || 'Outros';
      const current = locationMap.get(location) || { earnings: 0, costs: 0, sales: 0 };
      locationMap.set(location, {
        earnings: current.earnings + c.earnings,
        costs: current.costs + c.costs,
        sales: current.sales + c.sales,
      });
    });
    
    return Array.from(locationMap.entries()).map(([name, data]) => ({
      name,
      earnings: data.earnings,
      costs: data.costs,
      sales: data.sales,
      profit: data.earnings - data.costs,
      roi: data.costs > 0 ? ((data.earnings - data.costs) / data.costs) * 100 : 0,
    }));
  }, [filteredCampaigns]);
  
  const monthsWithData = useMemo(() => {
    const year = selectedYear === "all" ? null : parseInt(selectedYear);
    const campaignsForSelectedYear = campaigns.filter(c => year === null || c.year === year);
    
    // Get unique months and sort them chronologically
    const uniqueMonths = [...new Set(campaignsForSelectedYear.map(c => normalizeMonthToAbbreviation(c.month)))];
    return uniqueMonths.sort((a, b) => MONTH_ORDER.indexOf(a.split('/')[0].trim()) - MONTH_ORDER.indexOf(b.split('/')[0].trim()));
  }, [campaigns, selectedYear]);

  if (campaigns.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader 
          title="Dashboard de Campanhas" 
          description="Análise de desempenho das campanhas de marketing"
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum dado encontrado. Adicione campanhas para visualizar o dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleMonthClick = (month: string) => {
    setSelectedMonth(prev => prev === month ? "all" : month);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Dashboard de Campanhas" 
        description="Análise de desempenho das campanhas de marketing"
        className="sticky top-[4rem] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 pt-6 pb-6"
      >
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Anos</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Month Buttons */}
      {monthsWithData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {monthsWithData.map(month => (
            <Button
              key={month}
              variant={selectedMonth === month ? "default" : "outline"}
              size="sm"
              onClick={() => handleMonthClick(month)}
              className={cn(
                "transition-all duration-200",
                selectedMonth === month 
                  ? "bg-warning text-warning-foreground hover:bg-warning/90 border-warning" 
                  : "hover:bg-muted/50"
              )}
            >
              {month}
            </Button>
          ))}
          {selectedMonth !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMonth("all")}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Receita" 
          value={formatCurrency(stats.totalEarnings)} 
          icon={DollarSign} 
          variant="info" 
        />
        <StatCard 
          title="Despesa" 
          value={formatCurrency(stats.totalCosts)} 
          icon={TrendingDown} 
          variant="danger" 
        />
        <StatCard 
          title="Lucro" 
          value={formatCurrency(stats.profit)} 
          icon={TrendingUp} 
          variant={stats.profit >= 0 ? "success" : "danger"} 
        />
        <StatCard 
          title="Nº de Vendas" 
          value={stats.totalSales} 
          icon={ShoppingCart} 
        />
        <StatCard 
          title="ROI" 
          value={formatPercent(stats.roi)} 
          icon={Percent} 
          variant={stats.roi >= 0 ? "success" : "danger"} 
        />
      </div>

      {/* Evolution Chart */}
      {monthlyData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Mensal - Receita vs Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs" 
                    tick={{ angle: -45, textAnchor: 'end' }}
                    height={60}
                  />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    content={<CustomTooltip />} // Use the custom tooltip component
                    wrapperStyle={{ outline: 'none' }} // Remove default focus outline
                  />
                  <Legend />
                  <Bar 
                    dataKey="receita" 
                    name="Receita"
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="despesa" 
                    name="Despesa"
                    fill="hsl(var(--destructive))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum dado de campanha encontrado para os filtros selecionados.</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis By Strategy & Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise por Estratégia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategyData.map(strategy => {
                const { cardBgClass, cardBorderClass, cardTextClass, circleBgClass } = getCategoryStyling(strategy.name);
                return (
                  <Card key={strategy.name} className={cn("card-hover", cardBgClass, cardBorderClass)}>
                    <CardHeader className="pb-2">
                      <CardTitle className={cn("text-lg flex items-center gap-2", cardTextClass)}>
                        <span className={cn("w-3 h-3 rounded-full", circleBgClass)} />
                        {strategy.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6 pt-0"> {/* Added p-6 pt-0 for consistent spacing */}
                      {/* Profit/Loss - most prominent */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{strategy.profit >= 0 ? 'Lucro Líquido' : 'Prejuízo Líquido'}</p>
                          <p className={cn("text-3xl font-bold", getProfitLossColor(strategy.profit))}>
                            {formatCurrency(strategy.profit)}
                          </p>
                        </div>
                      </div>

                      {/* Revenues and Costs */}
                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Receitas</p>
                          <p className="text-lg font-semibold text-success">{formatCurrency(strategy.earnings)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Despesas</p>
                          <p className="text-lg font-semibold text-destructive">{formatCurrency(strategy.costs)}</p>
                        </div>
                      </div>

                      {/* Sales and ROI */}
                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Vendas</p>
                          <p className="text-lg font-semibold">{strategy.sales}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className={cn("text-lg font-semibold", getROIColor(strategy.roi))}>
                            {formatPercent(strategy.roi)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}

        {locationData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise por Local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {locationData.map(location => {
                const { cardBgClass, cardBorderClass, cardTextClass, circleBgClass } = getCategoryStyling(location.name);
                return (
                  <Card key={location.name} className={cn("card-hover", cardBgClass, cardBorderClass)}>
                    <CardHeader className="pb-2">
                      <CardTitle className={cn("text-lg flex items-center gap-2", cardTextClass)}>
                        <span className={cn("w-3 h-3 rounded-full", circleBgClass)} />
                        {location.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6 pt-0"> {/* Added p-6 pt-0 for consistent spacing */}
                      {/* Profit/Loss - most prominent */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{location.profit >= 0 ? 'Lucro Líquido' : 'Prejuízo Líquido'}</p>
                          <p className={cn("text-3xl font-bold", getProfitLossColor(location.profit))}>
                            {formatCurrency(location.profit)}
                          </p>
                        </div>
                      </div>

                      {/* Revenues and Costs */}
                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Receitas</p>
                          <p className="text-lg font-semibold text-success">{formatCurrency(location.earnings)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Despesas</p>
                          <p className="text-lg font-semibold text-destructive">{formatCurrency(location.costs)}</p>
                        </div>
                      </div>

                      {/* Sales and ROI */}
                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Vendas</p>
                          <p className="text-lg font-semibold">{location.sales}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className={cn("text-lg font-semibold", getROIColor(location.roi))}>
                            {formatPercent(location.roi)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}