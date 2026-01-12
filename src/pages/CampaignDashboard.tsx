import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatPercent, normalizeMonthToAbbreviation } from "@/lib/formatters";
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

const MONTH_ORDER = MONTHS;

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
      .filter(month => monthlyMap.has(month))
      .map(month => {
        const data = monthlyMap.get(month)!;
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
    return [...new Set(campaignsForSelectedYear.map(c => normalizeMonthToAbbreviation(c.month)))].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
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

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Dashboard de Campanhas" 
        description="Análise de desempenho das campanhas de marketing"
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
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {monthsWithData.map(month => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Lucro" 
          value={formatCurrency(stats.profit)} 
          icon={TrendingUp} 
          variant={stats.profit >= 0 ? "success" : "danger"} 
        />
        <StatCard 
          title="Despesa" 
          value={formatCurrency(stats.totalCosts)} 
          icon={TrendingDown} 
          variant="danger" 
        />
        <StatCard 
          title="Receita" 
          value={formatCurrency(stats.totalEarnings)} 
          icon={DollarSign} 
          variant="info" 
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
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="receita" 
                    name="Receita"
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]} 
                    label={{ position: 'top', formatter: (value: number) => formatCurrency(value, 'BRL'), fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="despesa" 
                    name="Despesa"
                    stroke="hsl(var(--warning))" 
                    strokeWidth={3}
                    strokeDasharray="5 5" 
                    dot={{ fill: 'hsl(var(--warning))', r: 4 }}
                    label={{ position: 'top', formatter: (value: number) => formatCurrency(value, 'BRL'), fill: 'hsl(var(--foreground))', fontSize: 12 }}
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
            <CardContent>
              <div className="space-y-4">
                {strategyData.map(strategy => (
                  <div key={strategy.name} className={`p-4 rounded-lg border ${strategy.profit >= 0 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${strategy.profit >= 0 ? 'bg-success' : 'bg-destructive'}`} />
                        {strategy.name}
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Receitas</p>
                        <p className="text-sm text-success">{formatCurrency(strategy.earnings)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Despesas</p>
                        <p className="text-sm text-destructive">{formatCurrency(strategy.costs)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">{strategy.profit >= 0 ? 'Lucro' : 'Prejuízo'}</span>
                      <span className={strategy.profit >= 0 ? 'text-success font-bold' : 'text-destructive font-bold'}>
                        {formatCurrency(strategy.profit)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                      <span>{strategy.sales} vendas</span>
                      <span>ROI: {formatPercent(strategy.roi)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {locationData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise por Local</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationData.map(location => (
                  <div key={location.name} className={`p-4 rounded-lg border ${location.profit >= 0 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${location.profit >= 0 ? 'bg-success' : 'bg-destructive'}`} />
                        {location.name}
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Receitas</p>
                        <p className="text-sm text-success">{formatCurrency(location.earnings)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Despesas</p>
                        <p className="text-sm text-destructive">{formatCurrency(location.costs)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">{location.profit >= 0 ? 'Lucro' : 'Prejuízo'}</span>
                      <span className={location.profit >= 0 ? 'text-success font-bold' : 'text-destructive font-bold'}>
                        {formatCurrency(location.profit)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                      <span>{location.sales} vendas</span>
                      <span>ROI: {formatPercent(location.roi)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}