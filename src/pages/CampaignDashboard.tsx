import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { DollarSign, TrendingUp, TrendingDown, Target, ShoppingCart, Percent } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

export default function CampaignDashboard() {
  const monthlyData = [
    { month: 'Jan', receita: 4820.4, despesa: 3931.0 },
    { month: 'Fev', receita: 3326.9, despesa: 2414.8 },
    { month: 'Mar', receita: 3139.8, despesa: 2007.7 },
    { month: 'Abr', receita: 950.7, despesa: 149.4 },
    { month: 'Mai', receita: 950.7, despesa: 846.9 },
    { month: 'Jun', receita: 4202.4, despesa: 2070.6 },
    { month: 'Jul', receita: 8977.4, despesa: 5119.6 },
    { month: 'Ago', receita: 14284.2, despesa: 5450.2 },
    { month: 'Set', receita: 11609.3, despesa: 7136.0 },
    { month: 'Out', receita: 13542.1, despesa: 13847.0 },
    { month: 'Nov', receita: 12512.6, despesa: 9848.1 },
    { month: 'Dez', receita: 17571.8, despesa: 13763.0 },
  ];

  const strategyData = [
    { month: 'Jan', pesquisa: 4820.4 },
    { month: 'Fev', pesquisa: 3326.9 },
    { month: 'Mar', pesquisa: 3139.8 },
    { month: 'Abr', pesquisa: 950.7 },
    { month: 'Mai', pesquisa: 950.7 },
    { month: 'Jun', pesquisa: 4202.4 },
    { month: 'Jul', pesquisa: 8977.4 },
    { month: 'Ago', pesquisa: 14284.2 },
    { month: 'Set', pesquisa: 11609.3 },
    { month: 'Out', pesquisa: 13542.1 },
    { month: 'Nov', pesquisa: 12512.6 },
    { month: 'Dez', pesquisa: 17571.8 },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Dashboard de Campanhas" 
        description="Análise de desempenho das campanhas de marketing"
      >
        <Select defaultValue="2025">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="12">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            <SelectItem value="12">Dezembro</SelectItem>
            <SelectItem value="11">Novembro</SelectItem>
            <SelectItem value="10">Outubro</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Lucro" 
          value={formatCurrency(3808.77)} 
          icon={TrendingUp} 
          variant="success" 
        />
        <StatCard 
          title="Despesa" 
          value={formatCurrency(13763.01)} 
          icon={TrendingDown} 
          variant="danger" 
        />
        <StatCard 
          title="Receita" 
          value={formatCurrency(17571.78)} 
          icon={DollarSign} 
          variant="info" 
        />
        <StatCard 
          title="Nº de Vendas" 
          value={26} 
          icon={ShoppingCart} 
        />
        <StatCard 
          title="ROI" 
          value={formatPercent(27.7)} 
          icon={Percent} 
          variant="success" 
        />
      </div>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Mensal - Receita vs Despesa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
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
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  name="Receita"
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--success))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesa" 
                  name="Despesa"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--destructive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Analysis By Strategy & Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise por Estratégia - Pesquisa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(17571.78)}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(13763.01)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Lucro</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(3808.77)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">ROI</p>
                  <p className="text-lg font-bold">{formatPercent(27.7)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-lg font-bold">26</p>
                </div>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="pesquisa" name="Pesquisa" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise por Local</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Brasil */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    Brasil
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Receitas</p>
                    <p className="text-sm font-mono">{formatCurrency(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Despesas</p>
                    <p className="text-sm font-mono">{formatCurrency(194.60)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Prejuízo</span>
                  <span className="font-mono text-destructive">{formatCurrency(-194.60)}</span>
                </div>
              </div>

              {/* Gringa */}
              <div className="p-4 rounded-lg border border-success/30 bg-success/5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success" />
                    Gringa
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Receitas</p>
                    <p className="text-sm font-mono text-success">{formatCurrency(17571.78)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Despesas</p>
                    <p className="text-sm font-mono">{formatCurrency(13568.41)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-success/20">
                  <span className="text-sm text-muted-foreground">Lucro</span>
                  <span className="font-mono font-bold text-success">{formatCurrency(4003.37)}</span>
                </div>
                <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                  <span>26 vendas</span>
                  <span>ROI: {formatPercent(29.5)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
