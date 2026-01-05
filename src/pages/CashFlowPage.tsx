import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockCashFlow2025 } from "@/data/mockData";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
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

export default function CashFlowPage() {
  const data = mockCashFlow2025;
  
  const chartData = data.months.map(m => ({
    month: m.month.substring(0, 3),
    receitas: m.income,
    despesas: m.expenses,
    saldo: m.balance
  }));

  const accumulatedData = data.months.map(m => ({
    month: m.month.substring(0, 3),
    acumulado: m.accumulatedBalance
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Fluxo de Caixa" 
        description="Visão consolidada de receitas e despesas"
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
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receitas Totais"
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
        <StatCard
          title="Média Mensal"
          value={formatCurrency(data.totalProfit / 12)}
          icon={Wallet}
          variant="info"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receitas vs Despesas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Bar dataKey="receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saldo Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accumulatedData}>
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
                  <Line 
                    type="monotone" 
                    dataKey="acumulado" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-success">Receitas por Fonte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.incomeBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                  <span className="capitalize font-medium">{key}</span>
                  <span className="font-mono text-success">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.expenseBreakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                  <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-mono text-destructive">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Mês</th>
                  <th className="text-right py-3 px-4 font-semibold text-success">Receitas</th>
                  <th className="text-right py-3 px-4 font-semibold text-destructive">Despesas</th>
                  <th className="text-right py-3 px-4 font-semibold">Saldo</th>
                  <th className="text-right py-3 px-4 font-semibold text-accent">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((month) => (
                  <tr key={month.month} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="py-3 px-4 text-right font-mono text-success">{formatCurrency(month.income)}</td>
                    <td className="py-3 px-4 text-right font-mono text-destructive">{formatCurrency(month.expenses)}</td>
                    <td className={`py-3 px-4 text-right font-mono font-medium ${month.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(month.balance)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-accent">{formatCurrency(month.accumulatedBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
