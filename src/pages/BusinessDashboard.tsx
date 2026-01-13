import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, normalizeMonthToAbbreviation, getProfitLossColor } from "@/lib/formatters";
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
import { useSettings } from "@/hooks/useSettings"; // Import useSettings

// Expanded color palette using chart colors and others
const COLORS = [
  'hsl(var(--chart-1))', // Blue
  'hsl(var(--chart-2))', // Green
  'hsl(var(--chart-3))', // Yellow/Orange
  'hsl(var(--chart-4))', // Red
  'hsl(var(--chart-5))', // Purple
  'hsl(var(--chart-6))', // Cyan
  'hsl(280 80% 50%)', // Magenta
  'hsl(100 60% 40%)', // Lime Green
  'hsl(30 90% 50%)', // Orange
  'hsl(200 80% 60%)', // Light Blue
];

// Usando MONTHS importado
const MONTH_ORDER = MONTHS;

const getBusinessLevel = (profit: number, threshold: number): { level: string; message: string; color: string } => {
  if (profit < 0) {
    return { 
      level: 'NÍVEL INICIANTE', 
      message: 'Você ainda está no vermelho, mas não desanime! Você está apenas começando, continue investindo.',
      color: 'destructive'
    };
  } else if (profit === 0) {
    return { 
      level: 'NÍVEL BREAKEVEN', 
      message: 'Parabéns pelo avanço! Você atingiu o ponto em que sua receita cobre seus custos.',
      color: 'warning'
    };
  } else if (profit > 0 && profit < threshold) {
    return { 
      level: 'NÍVEL PAYBACK', 
      message: 'Parabéns! Seus resultados cobrem todos os custos e geram um pequeno lucro. Mas tenha em mente que você ainda não atingiu a independência financeira!',
      color: 'info'
    };
  } else {
    return { 
      level: 'NÍVEL DE LIBERDADE', 
      message: 'Parabéns! Você atingiu sua independência financeira!',
      color: 'success'
    };
  }
};

// Custom label component for Pie Chart to display name and percentage externally
const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }: any) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  // Increase radius multiplier for labels to push them further out
  const labelRadiusMultiplier = 1.25; 
  const lineExtension = 25; // Increased line extension

  // Start point of the line (just outside the pie)
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  
  // Middle point of the line (extending further)
  const mx = cx + (outerRadius * labelRadiusMultiplier) * cos;
  const my = cy + (outerRadius * labelRadiusMultiplier) * sin;
  
  // End point of the line (where text starts/ends)
  const ex = mx + (cos >= 0 ? 1 : -1) * lineExtension; // Horizontal extension
  const ey = my;
  
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const fill = COLORS[index % COLORS.length];

  // Ensure the label is drawn if the value is positive
  if (percent > 0) {
    return (
      <g>
        {/* Line segment 1: from pie edge to middle point */}
        <path d={`M${sx},${sy}L${mx},${my}`} stroke={fill} fill="none" />
        {/* Line segment 2: horizontal extension */}
        <path d={`M${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        
        {/* Text label */}
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 2} 
          y={ey} 
          textAnchor={textAnchor} 
          fill={fill} 
          className="text-xs font-medium"
          dominantBaseline="central"
        >
          {`${name} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  }
  return null;
};

// Custom Tooltip Component for Monthly Bar Chart
const MonthlyBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // payload contains data for all bars at this index (month)
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


export default function BusinessDashboard() {
  const { incomeExpenses, campaigns, weeklyResults } = useData();
  const { freedomThreshold } = useSettings(); // Get dynamic threshold
  
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
    
    // Convert maps to arrays and sort by value descending
    const sortedIncomeBreakdown = Array.from(incomeBySource.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const sortedExpenseBreakdown = Array.from(expenseBySource.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalIncome,
      totalExpenses,
      totalProfit,
      months,
      incomeBreakdown: sortedIncomeBreakdown,
      expenseBreakdown: sortedExpenseBreakdown,
    };
  }, [incomeExpenses, selectedYear]);
  
  const businessLevel = getBusinessLevel(yearData.totalProfit, freedomThreshold); // Pass threshold

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
      {/* Custom Sticky Header */}
      <div className="sticky top-[4rem] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 pt-6 pb-6 border-b">
        <div className="flex items-center justify-between">
          
          {/* Left Block: Title and Description */}
          <div className="flex flex-col min-w-[300px] flex-shrink-0">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard do Negócio</h1>
            <p className="text-sm text-muted-foreground mt-1">Visão geral da performance do seu negócio</p>
          </div>

          {/* Right Block: Year Filter (Moved to the right side, but centered vertically) */}
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

      {/* Monthly Bar Chart */}
      {monthlyChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              Receitas e Despesas por Mês
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
                    content={<MonthlyBarTooltip />}
                    wrapperStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      outline: 'none'
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
      )}

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
                        labelLine={true}
                        label={CustomPieLabel}
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
              Fonte de Despesas
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
                        labelLine={true}
                        label={CustomPieLabel}
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
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                        />
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
    </div>
  );
}