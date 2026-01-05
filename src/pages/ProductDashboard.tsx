import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockProducts, mockCampaignResults } from "@/data/mockData";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { Package, Calendar, Eye, DollarSign, TrendingUp, Target } from "lucide-react";
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
import { useState } from "react";

const COLORS = ['hsl(210, 100%, 52%)', 'hsl(152, 69%, 41%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export default function ProductDashboard() {
  const [selectedProduct, setSelectedProduct] = useState("Fit Burn");
  
  // Find data for selected product
  const productCampaigns = mockCampaignResults.filter(c => c.productName === selectedProduct);
  
  const totalDays = productCampaigns.reduce((sum, c) => sum + c.daysRunning, 0);
  const totalImpressions = productCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = productCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalSales = productCampaigns.reduce((sum, c) => sum + c.sales, 0);
  const totalEarnings = productCampaigns.reduce((sum, c) => sum + c.earnings, 0);
  const totalCosts = productCampaigns.reduce((sum, c) => sum + c.costs, 0);
  const profit = totalEarnings - totalCosts;
  const roi = totalCosts > 0 ? ((totalEarnings - totalCosts) / totalCosts) * 100 : 0;
  const cpc = totalClicks > 0 ? totalCosts / totalClicks : 0;

  const monthlyData = [
    { month: 'Out', receita: 2706.84, despesa: 2702.39 },
    { month: 'Nov', receita: 5320.70, despesa: 2484.15 },
    { month: 'Dez', receita: 0, despesa: 1636.20 },
  ];

  const strategyData = [
    { name: 'Pesquisa', value: 95 },
    { name: 'Display', value: 5 },
  ];

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
            {mockProducts.slice(0, 10).map(p => (
              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue="2025">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Product Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard title="Dias Rodando" value={89} icon={Calendar} />
        <StatCard title="Impressões" value={formatNumber(3895)} icon={Eye} />
        <StatCard title="Cliques" value={formatNumber(513)} icon={Target} />
        <StatCard title="Vendas" value={7} icon={Package} variant="success" />
        <StatCard title="Receita" value={formatCurrency(7686)} icon={TrendingUp} variant="success" />
        <StatCard title="ROI" value={formatPercent(12.7)} icon={DollarSign} variant={roi > 0 ? "success" : "danger"} />
      </div>

      {/* Balance Card */}
      <Card className="border-success bg-success/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Balanço do Produto</p>
              <p className={`text-3xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {profit >= 0 ? 'Gerou Lucro de ' : 'Prejuízo de '}{formatCurrency(Math.abs(863.27))}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${profit >= 0 ? 'bg-success/20' : 'bg-destructive/20'}`}>
              <TrendingUp className={`w-8 h-8 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
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
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Estratégia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={strategyData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {strategyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
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
              <p className="text-2xl font-bold text-success">{formatCurrency(7686)}</p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-muted-foreground">Despesa Total</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(6822.73)}</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground">Lucro Total</p>
              <p className="text-2xl font-bold text-accent">{formatCurrency(863.27)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
