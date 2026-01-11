import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, normalizeMonthToAbbreviation } from "@/lib/formatters"; // Import the new utility
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
  Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { MONTHS } from "@/types"; // Import MONTHS

const COLORS = ['hsl(210, 100%, 52%)', 'hsl(152, 69%, 41%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)', 'hsl(199, 89%, 48%)'];

// Usando MONTHS importado
const MONTH_ORDER = MONTHS;

const getBusinessLevel = (profit: number): { level: string; message: string; color: string } => {
  if (profit < 0) {
    return { 
      level: 'NÍVEL INVESTIDOR', 
      message: 'Você ainda está negativo, mas não desista! Continue investindo!',
      color: 'destructive'
    };
  } else if (profit === 0) {
    return { 
      level: 'NÍVEL BREAKEVEN', 
      message: 'Parabéns! Você alcançou o ponto de equilíbrio.',
      color: 'warning'
    };
  } else if (profit > 0 && profit < 60000) {
    return { 
      level: 'NÍVEL PAYBACK', 
      message: 'Parabéns! Seus resultados geram lucro!',
      color: 'info'
    };
  } else {
    return { 
      level: 'NÍVEL RETIRADA', 
      message: 'Pode comemorar! Você é um Liberto!',
      color: 'success'
    };
  }
};

export default function BusinessDashboard() {
  const { incomeExpenses, campaigns, weeklyResults } = useData();
  
  const years = useMemo(() => {
    const allYears = new Set<number>();
    incomeExpenses.forEach(ie => allYears.add(ie.year));
    campaigns.forEach(c => allYears.add(c.year));
    weeklyResults.forEach(w => allYears.add(w.year));
    return Array.from(allYears).sort((a, b) => b - a);
  }, [incomeExpenses, campaigns, weeklyResults]);
  
  const [selectedYear, setSelectedYear] = useState<string>(years[0]?.toString() || "2025");
  
  const yearData = useMemo(() => {
    const year = parseInt(selectedYear);
    const yearIncomes = incomeExpenses.filter(ie => ie.year === year && ie.type === 'income');
    const yearExpenses = incomeExpenses.filter(ie => ie.year === year && ie.type === 'expense');
    
    // Calculate totals
    const totalIncome = yearIncomes.reduce((sum, ie) => sum + ie.amount, 0);
    const totalExpenses = yearExpenses.reduce((sum, ie) => sum + ie.amount, 0);
    const totalProfit = totalIncome - totalExpenses;
    
    // Group by month
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    // Use MONTH_ORDER (which is MONTHS) for initialization
    MONTH_ORDER.forEach(month => monthlyMap.set(month, { income: 0, expenses: 0 }));
    
    yearIncomes.forEach(ie => {
      // Normaliza o nome do mês para abreviação antes de usar como chave
      const monthKey = normalizeMonthToAbbreviation(ie.month); 
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
      monthlyMap.set(monthKey, { ...current, income: current.income + ie.amount });
    });
    
    yearExpenses.forEach(ie => {
      // Normaliza o nome do mês para abreviação antes de usar como chave
      const monthKey = normalizeMonthToAbbreviation(ie.month); 
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
      monthlyMap.set(monthKey, { ...current, expenses: current.expenses + ie.amount });
    });
    
    const months = MONTH_ORDER.map(month => {
      const data = monthlyMap.get(month) || { income: 0, expenses: 0 };
      return {
        month,
        income: data.income,
        expenses: data.expenses,
        balance: data.income - data.expenses
      };
    }).filter(m => m.income > 0 || m.expenses > 0);
    
    // Income breakdown by source
    const incomeBySource = new Map<string, number>();
    yearIncomes.forEach(ie => {
      const source = ie.source || 'Outros';
      incomeBySource.set(source, (incomeBySource.get(source) || 0) + ie.amount);
    });
    
    // Expense breakdown by source
    const expenseBySource = new Map<string, number>();
    yearExpenses.forEach(ie => {
      const source = ie.source || 'Outros';
      expenseBySource.set(source, (expenseBySource.get(source) || 0) + ie.amount);
    });
    
    return {
      totalIncome,
      totalExpenses,
      totalProfit,
      months,
      incomeBreakdown: Array.from(incomeBySource.entries()).map(([name, value]) => ({ name, value })),
      expenseBreakdown: Array.from(expenseBySource.entries()).map(([name, value]) => ({ name, value })),
    };
  }, [incomeExpenses, selectedYear]);
  
  const businessLevel = getBusinessLevel(yearData.totalProfit);

  const monthlyChartData = yearData.months.map(m => ({
    month: m.month, // Already abbreviated
    receita: m.income,
    despesa: m.expenses,
    lucro: m.balance
  }));

  const levelColors = {
    destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    info: 'bg-info/10 border-info/30 text-info',
    success: 'bg-success/10 border-success/30 text-success',
  };

  if (incomeExpenses.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader 
          title="Dashboard do Negócio" 
          description="Visão geral da performance do seu negócio"
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum dado encontrado. Adicione receitas e despesas na aba "Financeiro" para visualizar o dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Dashboard do Negócio" 
        description="Visão geral da performance do seu negócio"
      >
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
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
              <p className="text-3xl font-bold">{formatCurrency(yearData.totalProfit)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Receita Total" 
          value={formatCurrency(yearData.totalIncome)} 
          icon={TrendingUp} 
          variant="success" 
        />
        <StatCard 
          title="Despesas Totais" 
          value={formatCurrency(yearData.totalExpenses)} 
          icon={TrendingDown} 
          variant="danger" 
        />
        <StatCard 
          title="Lucro Líquido" 
          value={formatCurrency(yearData.totalProfit)} 
          icon={DollarSign} 
          variant={yearData.totalProfit > 0 ? "success" : "danger"} 
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
            {yearData.incomeBreakdown.length > 0 ? (
              <>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={yearData.incomeBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                      >
                        {yearData.incomeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {yearData.incomeBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados de receita</p>
            )}
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
            {yearData.expenseBreakdown.length > 0 ? (
              <>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={yearData.expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                      >
                        {yearData.expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {yearData.expenseBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados de despesa</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bar Chart */}
      {monthlyChartData.length > 0 && (
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
                <BarChart data={monthlyChartData}>
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
      )}

      {/* Monthly Summary Table */}
      {yearData.months.length > 0 && (
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
                  {yearData.months.map((month) => (
                    <tr key={month.month} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{month.month}</td>
                      <td className="py-3 px-4 text-right font-medium text-success">{formatCurrency(month.income)}</td>
                      <td className="py-3 px-4 text-right font-medium text-destructive">{formatCurrency(month.expenses)}</td>
                      <td className={cn("py-3 px-4 text-right font-medium", month.balance >= 0 ? 'text-success' : 'text-destructive')}>
                        {formatCurrency(month.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-bold">
                    <td className="py-3 px-4">Total</td>
                    <td className="py-3 px-4 text-right font-medium text-success">{formatCurrency(yearData.totalIncome)}</td>
                    <td className="py-3 px-4 text-right font-medium text-destructive">{formatCurrency(yearData.totalExpenses)}</td>
                    <td className={cn("py-3 px-4 text-right font-medium", yearData.totalProfit >= 0 ? 'text-success' : 'text-destructive')}>
                      {formatCurrency(yearData.totalProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}