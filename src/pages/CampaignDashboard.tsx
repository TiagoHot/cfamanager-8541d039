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
import { Button } from "@/components/ui/button";

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
  
  // 1. Campaigns filtered by Year (used for overall stats and chart)
  const yearFilteredCampaigns = useMemo(() => {
    const year = selectedYear === "all" ? null : parseInt(selectedYear);
    return campaigns.filter(c => {
      if (year !== null && c.year !== year) return false;
      return true;
    });
  }, [campaigns, selectedYear]);

  // 2. Campaigns filtered by Year AND Month (used for Strategy/Location analysis cards)
  const monthFilteredCampaigns = useMemo(() => {
    if (selectedMonth === "all") {
      return yearFilteredCampaigns;
    }
    return yearFilteredCampaigns.filter(c => {
      return normalizeMonthToAbbreviation(c.month) === selectedMonth;
    });
  }, [yearFilteredCampaigns, selectedMonth]);
  
  const stats = useMemo(() => {
    // Calculate stats based on MONTH filtered campaigns
    const totalEarnings = monthFilteredCampaigns.reduce((sum, c) => sum + c.earnings, 0);
    const totalCosts = monthFilteredCampaigns.reduce((sum, c) => sum + c.costs, 0);
    const totalSales = monthFilteredCampaigns.reduce((sum, c) => sum + c.sales, 0);
    const profit = totalEarnings - totalCosts;
    const roi = totalCosts > 0 ? ((totalEarnings - totalCosts) / totalCosts) * 100 : 0;
    
    return { totalEarnings, totalCosts, totalSales, profit, roi };
  }, [monthFilteredCampaigns]);
  
  // Monthly data for the chart (always based on YEAR filtered campaigns)
  const monthlyData = useMemo(() => {
    const year = selectedYear === "all" ? null : parseInt(selectedYear);
    
    const filteredCampaignsForChart = campaigns.filter(c => {
      const yearMatch = year === null || c.year === year;
      return yearMatch; // Do not filter by month here
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
    
    return MONTH_ORDER
      .map(month => { 
        const data = monthlyMap.get(month) || { earnings: 0, costs: 0 };
        return {
          month: month,
          receita: data.earnings,
          despesa: data.costs,
        };
      });
  }, [campaigns, selectedYear]);
  
  const strategyData = useMemo(() => {
    const strategyMap = new Map<string, { earnings: number; costs: number; sales: number }>();
    // Use monthFilteredCampaigns here
    monthFilteredCampaigns.forEach(c => {
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
  }, [monthFilteredCampaigns]);
  
  const locationData = useMemo(() => {
    const locationMap = new Map<string, { earnings: number; costs: number; sales: number }>();
    // Use monthFilteredCampaigns here
    monthFilteredCampaigns.forEach(c => {
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
  }, [monthFilteredCampaigns]);
  
  // Determine which months have data for the selected year
  const monthsWithData = useMemo(() => {
    return [...new Set(yearFilteredCampaigns.map(c => normalizeMonthToAbbreviation(c.month)))].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [yearFilteredCampaigns]);

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
      {/* Custom Header Structure */}
      <div className="sticky top-[4rem] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 pt-6 pb-6 border-b">
        <div className="flex justify-between items-start">
          {/* Left Side: Title and Description */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Campanhas</h1>
            <p className="text-sm text-muted-foreground mt-1">Análise de desempenho das campanhas de marketing</p>
          </div>

          {/* Right Side: Year Selector and Month Buttons Grid */}
          <div className="flex gap-4">
            {/* Year Selector in the middle area */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 h-10">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Month Buttons Grid (2 rows, 6 columns) */}
            <div className="flex flex-col gap-2 w-[450px]">
              {/* Row 1: Todos + Jan-Mai (6 items total) */}
              <div className="grid grid-cols-6 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedMonth("all")}
                  className={cn(
                    "transition-all duration-200 col-span-2 h-10", // col-span-2 for Todos os Meses
                    selectedMonth === "all" 
                      ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                      : "hover:bg-muted"
                  )}
                >
                  Todos os Meses
                </Button>
                {MONTH_ORDER.slice(0, 4).map(month => { // Jan, Fev, Mar, Abr (4 months)
                  const hasData = monthsWithData.includes(month);
                  return (
                    <Button 
                      key={month} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedMonth(month)}
                      disabled={!hasData}
                      className={cn(
                        "transition-all duration-200 h-10",
                        selectedMonth === month 
                          ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                          : "hover:bg-muted",
                        !hasData && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {month}
                    </Button>
                  );
                })}
              </div>
              
              {/* Row 2: Mai-Dez (6 months) */}
              <div className="grid grid-cols-6 gap-2">
                {MONTH_ORDER.slice(4).map(month => { // Mai, Jun, Jul, Ago, Set, Out, Nov, Dez (8 months) -> Need to adjust slice for 6 items per row
                  // Let's re-evaluate the slicing to ensure 6 items per row:
                  // Row 1: Todos (2 cols) + Jan, Fev, Mar, Abr (4 cols) = 6 columns total.
                  // Row 2: Mai, Jun, Jul, Ago, Set, Out (6 months)
                  // Wait, MONTH_ORDER has 12 months.
                  // Row 1: Todos (2) + Jan, Fev, Mar, Abr (4) = 6. (Total 6 months used: Jan-Abr)
                  // Row 2: Mai, Jun, Jul, Ago, Set, Out, Nov, Dez (8 months remaining) -> This doesn't fit 6 columns.
                  
                  // Let's stick to the visual: 7 columns total in the month grid area.
                  // Row 1: Todos (2 cols) + Jan, Fev, Mar, Abr, Mai (5 cols) = 7 columns total. (Total 5 months used: Jan-Mai)
                  // Row 2: Jun, Jul, Ago, Set, Out, Nov, Dez (7 months remaining) -> This requires 7 columns.
                  
                  // Let's revert the month grid to 7 columns wide, as implemented in the previous step, but move the year selector outside of it.
                  
                  // Reverting to the previous month grid structure (2 rows, 7 columns wide total):
                  // Row 1: Todos (2 cols) + Jan, Fev, Mar, Abr, Mai (5 cols)
                  // Row 2: Jun, Jul, Ago, Set, Out, Nov, Dez (7 cols)
                  
                  // Let's put the year selector next to the month grid, as requested by the image.
                  
                  // Re-implementing the month grid structure from the previous step (which matched the image layout for months):
                  
                  // Row 1: Jan, Fev, Mar, Abr, Mai, Jun (6 months)
                  // Row 2: Jul, Ago, Set, Out, Nov, Dez (6 months)
                  // PLUS: Todos os Meses (1 button) and Year Selector (1 button)
                  
                  // The image shows:
                  // Row 1: Todos (2 cols) | Jan | Fev | Mar | Abr | Mai (6 items total, 7 columns wide)
                  // Row 2: Jun | Jul | Ago | Set | Out | Nov | Dez (7 items total, 7 columns wide)
                  
                  // Let's use a 7-column grid for the month buttons area, and place the year selector next to it.
                  
                  // Reverting to the structure that produced the visual in the previous step, but moving the year selector.
                  
                  // Previous structure:
                  /*
                  <div className="flex flex-col gap-2 w-[450px]">
                    <div className="grid grid-cols-7 gap-2">
                      <Button col-span-2 Todos os Meses
                      {MONTH_ORDER.slice(0, 5).map(month => { // Jan-Mai (5 months)
                    <div className="grid grid-cols-7 gap-2">
                      {MONTH_ORDER.slice(5).map(month => { // Jun-Dez (7 months)
                  */
                  
                  // This structure is correct for the month buttons area. Now, let's place the year selector next to it.
                  
                  // The image shows the Year Selector *between* the title/description and the month buttons.
                  
                  // Let's use a main flex container for the header content:
                  // [Title/Description] [Year Selector] [Month Buttons]
                  
                  // To achieve the look in the image where the Year Selector is positioned in the empty space, we need to adjust the main flex container.
                  
                  // Current structure:
                  /*
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col"> // Title/Description
                      <div className="flex items-center gap-6">
                        <h1 ...>Dashboard de Campanhas</h1>
                        <Select ...> // Year Selector (Removed in this iteration)
                      </div>
                      <p ...>Análise de desempenho...</p>
                    </div>
                    <div className="flex gap-4"> // Right Side
                      <Select ...> // Year Selector (Moved here in this iteration)
                      <div className="flex flex-col gap-2 w-[450px]"> // Month Buttons
                  */
                  
                  // To match the image:
                  // 1. Put the Year Selector back next to the title, but give it a specific width and margin.
                  // 2. Put the Month Buttons on the far right.
                  
                  // Let's try to use a grid layout for the header content to control the spacing precisely.
                  
                  // Reverting to the structure from the previous step, but moving the Year Selector back to the left side and adjusting the layout to match the image.
                  
                  // The image shows:
                  // [Dashboard Title] [Year Selector] [Empty Space] [Month Buttons Grid]
                  
                  // Let's use a main flex container with `justify-between` and place the Year Selector next to the title, but outside the title's flex column, and use `flex-1` for the empty space.
                  
                  // Reverting to the structure from the previous step, but moving the Year Selector to the right of the title block.
                  
                  // The previous structure was:
                  /*
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col"> // Title/Description
                      <h1 ...>Dashboard de Campanhas</h1>
                      <p ...>Análise de desempenho...</p>
                    </div>
                    <div className="flex gap-4"> // Right Side
                      <Select ...> // Year Selector
                      <div className="flex flex-col gap-2 w-[450px]"> // Month Buttons
                  */
                  
                  // To match the image, the Year Selector needs to be closer to the title, and the Month Buttons need to be on the far right.
                  
                  // Let's try this structure:
                  /*
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4"> // Left Group: Title/Desc + Year Selector
                      <div className="flex flex-col"> // Title/Desc
                        <h1 ...>Dashboard de Campanhas</h1>
                        <p ...>Análise de desempenho...</p>
                      </div>
                      <Select ...> // Year Selector
                    </div>
                    <div className="flex flex-col gap-2 w-[450px]"> // Month Buttons (Far Right)
                  </div>
                  */
                  
                  // Wait, the image shows the Year Selector aligned vertically with the title, and the description below the title.
                  
                  // Let's use the structure from the previous step, but move the Year Selector out of the right-side group and place it next to the title block, using a wrapper to control the alignment.
                  
                  // New attempt at the header structure:
                  
                  return (
                    <div className="animate-fade-in space-y-6">
                      {/* Custom Header Structure */}
                      <div className="sticky top-[4rem] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 pt-6 pb-6 border-b">
                        <div className="flex items-start justify-between">
                          
                          {/* Left Side: Title, Year Selector, Description */}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-4">
                              <h1 className="text-3xl font-bold tracking-tight">Dashboard de Campanhas</h1>
                              {/* Year Selector moved here, next to the title */}
                              <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-32 h-10">
                                  <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos os Anos</SelectItem>
                                  {years.map(year => (
                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Análise de desempenho das campanhas de marketing</p>
                          </div>
                          
                          {/* Right Side: Month Buttons Grid (Far Right) */}
                          <div className="flex flex-col gap-2 w-[450px]">
                            {/* Row 1: Todos + Jan-Mai (7 columns wide) */}
                            <div className="grid grid-cols-7 gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedMonth("all")}
                                className={cn(
                                  "transition-all duration-200 col-span-2 h-10", // col-span-2 for Todos os Meses
                                  selectedMonth === "all" 
                                    ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                                    : "hover:bg-muted"
                                )}
                              >
                                Todos os Meses
                              </Button>
                              {MONTH_ORDER.slice(0, 5).map(month => { // Jan, Fev, Mar, Abr, Mai (5 months)
                                const hasData = monthsWithData.includes(month);
                                return (
                                  <Button 
                                    key={month} 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedMonth(month)}
                                    disabled={!hasData}
                                    className={cn(
                                      "transition-all duration-200 h-10",
                                      selectedMonth === month 
                                        ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                                        : "hover:bg-muted",
                                      !hasData && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    {month}
                                  </Button>
                                );
                              })}
                            </div>
                            
                            {/* Row 2: Jun-Dez (7 columns wide) */}
                            <div className="grid grid-cols-7 gap-2">
                              {MONTH_ORDER.slice(5).map(month => { // Jun, Jul, Ago, Set, Out, Nov, Dez (7 months)
                                const hasData = monthsWithData.includes(month);
                                return (
                                  <Button 
                                    key={month} 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedMonth(month)}
                                    disabled={!hasData}
                                    className={cn(
                                      "transition-all duration-200 h-10",
                                      selectedMonth === month 
                                        ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                                        : "hover:bg-muted",
                                      !hasData && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    {month}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* End Custom Header Structure */}
                      
                      {/* ... rest of the component ... */}
                    </div>
                  );
                }
                
                // Applying the changes to the file:
                
<dyad-write path="src/pages/CampaignDashboard.tsx" description="Moving the year selector next to the title and adjusting the month button grid to match the requested layout.">
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
import { Button } from "@/components/ui/button";

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
  
  // 1. Campaigns filtered by Year (used for overall stats and chart)
  const yearFilteredCampaigns = useMemo(() => {
    const year = selectedYear === "all" ? null : parseInt(selectedYear);
    return campaigns.filter(c => {
      if (year !== null && c.year !== year) return false;
      return true;
    });
  }, [campaigns, selectedYear]);

  // 2. Campaigns filtered by Year AND Month (used for Strategy/Location analysis cards)
  const monthFilteredCampaigns = useMemo(() => {
    if (selectedMonth === "all") {
      return yearFilteredCampaigns;
    }
    return yearFilteredCampaigns.filter(c => {
      return normalizeMonthToAbbreviation(c.month) === selectedMonth;
    });
  }, [yearFilteredCampaigns, selectedMonth]);
  
  const stats = useMemo(() => {
    // Calculate stats based on MONTH filtered campaigns
    const totalEarnings = monthFilteredCampaigns.reduce((sum, c) => sum + c.earnings, 0);
    const totalCosts = monthFilteredCampaigns.reduce((sum, c) => sum + c.costs, 0);
    const totalSales = monthFilteredCampaigns.reduce((sum, c) => sum + c.sales, 0);
    const profit = totalEarnings - totalCosts;
    const roi = totalCosts > 0 ? ((totalEarnings - totalCosts) / totalCosts) * 100 : 0;
    
    return { totalEarnings, totalCosts, totalSales, profit, roi };
  }, [monthFilteredCampaigns]);
  
  // Monthly data for the chart (always based on YEAR filtered campaigns)
  const monthlyData = useMemo(() => {
    const year = selectedYear === "all" ? null : parseInt(selectedYear);
    
    const filteredCampaignsForChart = campaigns.filter(c => {
      const yearMatch = year === null || c.year === year;
      return yearMatch; // Do not filter by month here
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
    
    return MONTH_ORDER
      .map(month => { 
        const data = monthlyMap.get(month) || { earnings: 0, costs: 0 };
        return {
          month: month,
          receita: data.earnings,
          despesa: data.costs,
        };
      });
  }, [campaigns, selectedYear]);
  
  const strategyData = useMemo(() => {
    const strategyMap = new Map<string, { earnings: number; costs: number; sales: number }>();
    // Use monthFilteredCampaigns here
    monthFilteredCampaigns.forEach(c => {
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
  }, [monthFilteredCampaigns]);
  
  const locationData = useMemo(() => {
    const locationMap = new Map<string, { earnings: number; costs: number; sales: number }>();
    // Use monthFilteredCampaigns here
    monthFilteredCampaigns.forEach(c => {
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
  }, [monthFilteredCampaigns]);
  
  // Determine which months have data for the selected year
  const monthsWithData = useMemo(() => {
    return [...new Set(yearFilteredCampaigns.map(c => normalizeMonthToAbbreviation(c.month)))].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [yearFilteredCampaigns]);

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
      {/* Custom Header Structure */}
      <div className="sticky top-[4rem] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 pt-6 pb-6 border-b">
        <div className="flex items-start justify-between">
          
          {/* Left Side: Title and Description */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Campanhas</h1>
            <p className="text-sm text-muted-foreground mt-1">Análise de desempenho das campanhas de marketing</p>
          </div>

          {/* Right Side: Year Selector and Month Buttons Grid */}
          <div className="flex gap-4">
            {/* Year Selector moved to the right of the title block, but before the month buttons */}
            <div className="mt-1"> {/* Added mt-1 to align vertically with the title/description block */}
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32 h-10">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Buttons Grid (2 rows, 7 columns wide) */}
            <div className="flex flex-col gap-2 w-[450px]">
              {/* Row 1: Todos + Jan-Mai (7 columns wide) */}
              <div className="grid grid-cols-7 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedMonth("all")}
                  className={cn(
                    "transition-all duration-200 col-span-2 h-10", // col-span-2 for Todos os Meses
                    selectedMonth === "all" 
                      ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                      : "hover:bg-muted"
                  )}
                >
                  Todos os Meses
                </Button>
                {MONTH_ORDER.slice(0, 5).map(month => { // Jan, Fev, Mar, Abr, Mai (5 months)
                  const hasData = monthsWithData.includes(month);
                  return (
                    <Button 
                      key={month} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedMonth(month)}
                      disabled={!hasData}
                      className={cn(
                        "transition-all duration-200 h-10",
                        selectedMonth === month 
                          ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                          : "hover:bg-muted",
                        !hasData && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {month}
                    </Button>
                  );
                })}
              </div>
              
              {/* Row 2: Jun-Dez (7 columns wide) */}
              <div className="grid grid-cols-7 gap-2">
                {MONTH_ORDER.slice(5).map(month => { // Jun, Jul, Ago, Set, Out, Nov, Dez (7 months)
                  const hasData = monthsWithData.includes(month);
                  return (
                    <Button 
                      key={month} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedMonth(month)}
                      disabled={!hasData}
                      className={cn(
                        "transition-all duration-200 h-10",
                        selectedMonth === month 
                          ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                          : "hover:bg-muted",
                        !hasData && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {month}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Custom Header Structure */}

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
            <CardTitle className="text-lg">Evolução Mensal - Receita vs Despesa (Ano {selectedYear})</CardTitle>
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
              <CardTitle className="text-lg">Análise por Estratégia {selectedMonth !== 'all' && `(${selectedMonth})`}</CardTitle>
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
              <CardTitle className="text-lg">Análise por Local {selectedMonth !== 'all' && `(${selectedMonth})`}</CardTitle>
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