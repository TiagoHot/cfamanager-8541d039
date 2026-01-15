import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useData } from "@/contexts/DataContext";
import { useMemo, useState } from "react";
import { useCashFlowData } from "@/hooks/useCashFlowData";
import { cn } from "@/lib/utils";
import { PageContent } from "@/components/PageContent"; // Import PageContent

export default function CashFlowPage() {
  const { incomeExpenses } = useData();
  
  const years = useMemo(() => {
    const uniqueYears = [...new Set(incomeExpenses.map(i => i.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [incomeExpenses]);
  
  const defaultYear = years[0]?.toString() || new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
  
  const cashFlowData = useCashFlowData(incomeExpenses, parseInt(selectedYear));
  
  const chartData = cashFlowData.months.map(m => ({
    month: m.month,
    receitas: m.income,
    despesas: m.expenses,
    saldo: m.balance
  }));

  const accumulatedData = cashFlowData.months.map(m => ({
    month: m.month,
    acumulado: m.accumulatedBalance
  }));

  // Prepare sorted breakdown data
  const sortedIncomeBreakdown = useMemo(() => {
    return Object.entries(cashFlowData.incomeBreakdown)
      .sort(([, valueA], [, valueB]) => valueB - valueA);
  }, [cashFlowData.incomeBreakdown]);

  const sortedExpenseBreakdown = useMemo(() => {
    return Object.entries(cashFlowData.expenseBreakdown)
      .sort(([, valueA], [, valueB]) => valueB - valueA);
  }, [cashFlowData.expenseBreakdown]);

  if (incomeExpenses.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader 
          title="Fluxo de Caixa" 
          description="Visão consolidada de receitas e despesas"
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum dado financeiro encontrado. Adicione receitas e despesas na aba "Financeiro" para visualizar o fluxo de caixa.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Custom Sticky Header */}
      <div className="sticky top-[4rem] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 pt-6 pb-6 border-b">
        <div className="flex items-center justify-between">
          
          {/* Left Block: Title and Description */}
          <div className="flex flex-col min-w-[300px] flex-shrink-0">
            <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
            <p className="text-sm text-muted-foreground mt-1">Visão consolidada de receitas e despesas</p>
          </div>

          {/* Right Block: Year Filter */}
          <div className="flex-shrink-0">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 h-10">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* End Custom Sticky Header */}

      <PageContent className="space-y-6 pt-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Receitas Totais"
            value={formatCurrency(cashFlowData.totalIncome)}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Despesas Totais"
            value={formatCurrency(cashFlowData.totalExpenses)}
            icon={TrendingDown}
            variant="danger"
          />
          <StatCard
            title="Lucro Líquido"
            value={formatCurrency(cashFlowData.totalProfit)}
            icon={DollarSign}
            variant={cashFlowData.totalProfit > 0 ? "success" : "danger"}
          />
          <StatCard
            title="Média Mensal"
            value={formatCurrency(cashFlowData.totalProfit / (cashFlowData.months.length || 1))}
            icon={Wallet}
            variant="info"
          />
        </div>

        {/* Charts */}
        {cashFlowData.months.length > 0 ? (
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
                        stroke="hsl(var(--chart-5))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--chart-5))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Não há dados de receitas/despesas para o ano de {selectedYear}.</p>
            </CardContent>
          </Card>
        )}

        {/* Breakdown Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-success">Receitas por Fonte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedIncomeBreakdown.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                    <span className="capitalize font-medium">{key}</span>
                    <span className="font-medium text-success">{formatCurrency(value)}</span>
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
                {sortedExpenseBreakdown.map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                    <span className="capitalize font-medium">{key}</span>
                    <span className="font-medium text-destructive">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Table */}
        {cashFlowData.months.length > 0 && (
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
                      <th className="text-right py-3 px-4 font-semibold text-info">Saldo</th>
                      <th className="text-right py-3 px-4 font-semibold text-high-contrast">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlowData.months.map((month) => (
                      <tr key={month.month} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{month.month}</td>
                        <td className="py-3 px-4 text-right font-medium text-success">{formatCurrency(month.income)}</td>
                        <td className="py-3 px-4 text-right font-medium text-destructive">{formatCurrency(month.expenses)}</td>
                        <td className="py-3 px-4 text-right font-medium text-info">
                          {formatCurrency(month.balance)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-high-contrast">{formatCurrency(month.accumulatedBalance)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 font-bold">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right font-medium text-success">{formatCurrency(cashFlowData.totalIncome)}</td>
                      <td className="py-3 px-4 text-right font-medium text-destructive">{formatCurrency(cashFlowData.totalExpenses)}</td>
                      <td className="py-3 px-4 text-right font-medium text-info">
                        {formatCurrency(cashFlowData.totalProfit)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-high-contrast">{formatCurrency(cashFlowData.totalProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </div>
  );
}