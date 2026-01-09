import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { Package, Calendar, Eye, DollarSign, TrendingUp, Target, MousePointer } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useState, useMemo } from "react";

const COLORS = ['hsl(210, 100%, 52%)', 'hsl(152, 69%, 41%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

const MONTH_ORDER = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function ProductDashboard() {
  const { products, campaigns } = useData();
  
  const productNames = useMemo(() => {
    return [...new Set(campaigns.map(c => c.productName))];
  }, [campaigns]);
  
  const [selectedProduct, setSelectedProduct] = useState(productNames[0] || "");
  
  const productData = useMemo(() => {
    const productCampaigns = campaigns.filter(c => c.productName === selectedProduct);
    
    const totalDays = productCampaigns.reduce((sum, c) => sum + c.daysRunning, 0);
    const totalImpressions = productCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = productCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalSales = productCampaigns.reduce((sum, c) => sum + c.sales, 0);
    const totalEarnings = productCampaigns.reduce((sum, c) => sum + c.earnings, 0);
    const totalCosts = productCampaigns.reduce((sum, c) => sum + c.costs, 0);
    const profit = totalEarnings - totalCosts;
    const roi = totalCosts > 0 ? ((totalEarnings - totalCosts) / totalCosts) * 100 : 0;
    const cpc = totalClicks > 0 ? totalCosts / totalClicks : 0;
    
    // Monthly data
    const monthlyMap = new Map<string, { earnings: number; costs: number }>();
    productCampaigns.forEach(c => {
      const current = monthlyMap.get(c.month) || { earnings: 0, costs: 0 };
      monthlyMap.set(c.month, {
        earnings: current.earnings + c.earnings,
        costs: current.costs + c.costs,
      });
    });
    
    const monthlyData = MONTH_ORDER
      .filter(month => monthlyMap.has(month))
      .map(month => {
        const data = monthlyMap.get(month)!;
        return {
          month: month.substring(0, 3),
          receita: data.earnings,
          despesa: data.costs,
        };
      });
    
    // Strategy data
    const strategyMap = new Map<string, number>();
    productCampaigns.forEach(c => {
      const strategy = c.strategy || 'Outros';
      strategyMap.set(strategy, (strategyMap.get(strategy) || 0) + c.earnings);
    });
    
    const strategyData = Array.from(strategyMap.entries()).map(([name, value]) => ({ name, value }));
    
    return {
      totalDays,
      totalImpressions,
      totalClicks,
      totalSales,
      totalEarnings,
      totalCosts,
      profit,
      roi,
      cpc,
      monthlyData,
      strategyData,
    };
  }, [campaigns, selectedProduct]);

  if (products.length === 0 && campaigns.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader 
          title="Dashboard de Produtos" 
          description="Análise de desempenho por produto"
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum dado encontrado. Adicione produtos e campanhas para visualizar o dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Dashboard de Produtos" 
        description="Análise de desempenho por produto"
      >
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            {productNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {selectedProduct && (
        <>
          {/* Product Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard title="Dias Rodando" value={productData.totalDays} icon={Calendar} />
            <StatCard title="Impressões" value={formatNumber(productData.totalImpressions)} icon={Eye} />
            <StatCard title="Cliques" value={formatNumber(productData.totalClicks)} icon={MousePointer} />
            <StatCard title="Vendas" value={productData.totalSales} icon={Package} variant="success" />
            <StatCard title="Receita" value={formatCurrency(productData.totalEarnings)} icon={TrendingUp} variant="success" />
            <StatCard title="ROI" value={formatPercent(productData.roi)} icon={DollarSign} variant={productData.roi > 0 ? "success" : "danger"} />
          </div>

          {/* Balance Card */}
          <Card className={productData.profit >= 0 ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Balanço do Produto</p>
                  <p className={`text-3xl font-bold ${productData.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {productData.profit >= 0 ? 'Gerou Lucro de ' : 'Prejuízo de '}{formatCurrency(Math.abs(productData.profit))}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${productData.profit >= 0 ? 'bg-success/20' : 'bg-destructive/20'}`}>
                  <TrendingUp className={`w-8 h-8 ${productData.profit >= 0 ? 'text-success' : 'text-destructive'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                {productData.monthlyData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="receita" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Sem dados mensais</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Estratégia</CardTitle>
              </CardHeader>
              <CardContent>
                {productData.strategyData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productData.strategyData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {productData.strategyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Sem dados de estratégia</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(productData.totalEarnings)}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-muted-foreground">Despesa Total</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(productData.totalCosts)}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-muted-foreground">Lucro Total</p>
                  <p className={`text-2xl font-bold ${productData.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(productData.profit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}