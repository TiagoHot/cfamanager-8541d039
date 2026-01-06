import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockCashFlow2025, getBusinessLevel } from "@/data/mockData";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, TrendingUp, TrendingDown, Award, BarChart2 } from "lucide-react";
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
  Legend // Adicionado Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['hsl(210, 100%, 52%)', 'hsl(152, 69%, 41%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(199, 89% 48%)'];

// NOTE: Since we don't have the logic to calculate mockCashFlow2025 from the fetched data yet, 
// we will temporarily use the mock data structure but wrap the content in a loading check.

export default function BusinessDashboard() {
  const { isLoading } = useData();
  const data = mockCashFlow2025; // Temporary mock data usage until calculation logic is implemented
  const businessLevel = getBusinessLevel(data.totalProfit);

  const monthlyData = data.months.map(m => ({
    month: m.month.substring(0, 3),
    receita: m.income,
    despesa: m.expenses,
    lucro: m.balance
  }));

  const incomeSourceData = [
    { name: 'Campanhas', value: data.incomeBreakdown.campaigns },
    { name: 'Orgânico', value: data.incomeBreakdown.organic },
    { name: 'Adsense', value: data.incomeBreakdown.adsense },
    { name: 'Outras', value: data.incomeBreakdown.other },
  ];

  const expenseSourceData = [
    { name: 'Tráfego Pago', value: data.expenseBreakdown.paidTraffic },
    { name: 'Ferramentas', value: data.expenseBreakdown.tools },
    { name: 'Mentorias', value: data.expenseBreakdown.mentoring },
    { name: 'Contabilidade', value: data.expenseBreakdown.accounting },
    { name: 'Cursos', value: data.expenseBreakdown.courses },
  ];

  const levelColors = {
    destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    info: 'bg-info/10 border-info/30 text-info',
    success: 'bg-success/10 border-success/30 text-success',
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader 
          title="Dashboard do Negócio" 
          description="Visão geral da performance do seu negócio"
        >
          <Skeleton className="w-32 h-9" />
          <Skeleton className="w-40 h-9" />
        </PageHeader>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Dashboard do Negócio" 
        description="Visão geral da performance do seu negócio"
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
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mês" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            <SelectItem value="12">Dezembro</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Business Level Banner */}
      <Card className={cn("border-2", levelColors[businessLevel.color as keyof typeof levelColors])}>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-4 rounded-xl", `bg-${businessLevel.color}/20`)}>
              <Award className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{businessLevel.level}</h2>
              <p className="text-sm opacity-80">{businessLevel.message}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Lucro Acumulado</p>
              <p className="text-3xl font-bold">{formatCurrency(data.totalProfit)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Investimento Total" 
          value={formatCurrency(data.totalIncome)} 
          icon={TrendingUp} 
          variant="success" 
        />
        <StatCard 
          title="Despesas Totais" 
          value={formatCurrency(data.totalExpenses)} 
          icon={TrendingDown} 
          variant="danger" 
        />
        <StatCard 
          title="Lucro Líquido" 
          value={formatCurrency(data.totalProfit)} 
          icon={DollarSign} 
          variant={data.totalProfit > 0 ? "success" : "danger"} 
        />
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Fontes de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeSourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {incomeSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {incomeSourceData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-mono">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Breakdown de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseSourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {expenseSourceData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-mono">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            Receitas, Despesas e Lucro por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
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
                <Bar dataKey="receita" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo Mensal Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Mês</th>
                  <th className="text-right py-3 px-4 font-semibold text-success">Receita</th>
                  <th className="text-right py-3 px-4 font-semibold text-destructive">Despesa</th>
                  <th className="text-right py-3 px-4 font-semibold">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((month) => (
                  <tr key={month.month} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="py-3 px-4 text-right font-mono text-success">{formatCurrency(month.income)}</td>
                    <td className="py-3 px-4 text-right font-mono text-destructive">{formatCurrency(month.expenses)}</td>
                    <td className={cn("py-3 px-4 text-right font-mono font-medium", month.balance >= 0 ? 'text-success' : 'text-destructive')}>
                      {formatCurrency(month.balance)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-bold">
                  <td className="py-3 px-4">Todos os Meses</td>
                  <td className="py-3 px-4 text-right font-mono text-success">{formatCurrency(data.totalIncome)}</td>
                  <td className="py-3 px-4 text-right font-mono text-destructive">{formatCurrency(data.totalExpenses)}</td>
                    <td className={cn("py-3 px-4 text-right font-mono", data.totalProfit >= 0 ? 'text-success' : 'text-destructive')}>
                    {formatCurrency(data.totalProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}