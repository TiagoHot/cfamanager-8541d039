import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatNumber, formatPercent, normalizeMonthToAbbreviation, getProfitLossColor } from "@/lib/formatters";
import { Package, Eye, DollarSign, TrendingUp, TrendingDown, MousePointer, Receipt, Calendar } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { useState, useMemo, useEffect } from "react";
import { MONTHS } from "@/types";
import { cn } from "@/lib/utils"; // Import cn
import { Button } from "@/components/ui/button"; // Import Button

const MONTH_ORDER = MONTHS;

// Custom Tooltip Component for Product Dashboard
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

export default function ProductDashboard() {
  const { products, campaigns } = useData();
  
  const years = useMemo(() => {
    const uniqueYears = [...new Set(campaigns.map(c => c.year))].sort((a, b) => b - a);
    return uniqueYears;
  }, [campaigns]);

  const locations = useMemo(() => {
    return [...new Set(products.map(p => p.country))];
  }, [products]);
  
  const [selectedYear, setSelectedYear] = useState<string>(years[0]?.toString() || "all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0] || "all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  
  // Filter product names based on selected location AND selected year
  const productNamesByLocation = useMemo(() => {
    const yearInt = selectedYear === "all" ? null : parseInt(selectedYear);
    
    const productsWithCampaignsInYear = new Set<string>();
    if (yearInt !== null) {
      campaigns.filter(c => c.year === yearInt).forEach(c => productsWithCampaignsInYear.add(c.productName));
    }

    const filteredProducts = products.filter(p => {
      const locationMatch = selectedLocation === "all" || p.country === selectedLocation;
      const yearMatch = selectedYear === "all" || productsWithCampaignsInYear.has(p.name);
      return locationMatch && yearMatch;
    });
    
    return [...new Set(filteredProducts.map(p => p.name))].sort();
  }, [products, campaigns, selectedLocation, selectedYear]);

  // Reset selected product if the location or year changes and the product is no longer valid
  useEffect(() => {
    if (selectedProduct !== "all" && !productNamesByLocation.includes(selectedProduct)) {
      setSelectedProduct("all");
    }
  }, [selectedLocation, selectedYear, productNamesByLocation, selectedProduct]);

  const productData = useMemo(() => {
    let filteredCampaigns = campaigns.filter(c => {
      const campaignYear = c.year.toString();
      const campaignMonth = normalizeMonthToAbbreviation(c.month);
      const campaignLocation = c.location;
      const campaignProductName = c.productName;

      const yearMatch = selectedYear === "all" || campaignYear === selectedYear;
      // NOTE: We intentionally ignore monthMatch here for the initial filtering, 
      // as the monthly chart needs all months if selectedMonth is "all".
      // The month filter is applied later for the summary stats.
      const locationMatch = selectedLocation === "all" || campaignLocation === selectedLocation;
      const productMatch = selectedProduct === "all" || campaignProductName === selectedProduct;

      return yearMatch && locationMatch && productMatch;
    });

    // If a specific product is selected, ensure only its campaigns are considered
    if (selectedProduct !== "all") {
      filteredCampaigns = filteredCampaigns.filter(c => c.productName === selectedProduct);
    } else if (productNamesByLocation.length > 0 && selectedProduct === "all") {
      // If no specific product is selected, but a location is, show data for all products in that location
      filteredCampaigns = filteredCampaigns.filter(c => productNamesByLocation.includes(c.productName));
    }
    
    // --- Calculate Summary Stats (Applying Month Filter Here) ---
    const summaryCampaigns = filteredCampaigns.filter(c => 
      selectedMonth === "all" || normalizeMonthToAbbreviation(c.month) === selectedMonth
    );

    const totalDays = summaryCampaigns.reduce((sum, c) => sum + c.daysRunning, 0);
    const totalImpressions = summaryCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = summaryCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalSales = summaryCampaigns.reduce((sum, c) => sum + c.sales, 0);
    const totalEarnings = summaryCampaigns.reduce((sum, c) => sum + c.earnings, 0);
    const totalCosts = summaryCampaigns.reduce((sum, c) => sum + c.costs, 0);
    const profit = totalEarnings - totalCosts;
    const roi = totalCosts > 0 ? ((totalEarnings - totalCosts) / totalCosts) * 100 : 0;
    const cpc = totalClicks > 0 ? totalCosts / totalClicks : 0;

    const clicksPerSale = totalSales > 0 ? totalClicks / totalSales : 0;
    const costPerSale = totalSales > 0 ? totalCosts / totalSales : 0;
    
    // --- Calculate Monthly Data for Chart (Ignoring selectedMonth filter) ---
    const monthlyMap = new Map<string, { earnings: number; costs: number }>();
    
    // Use the campaigns filtered by Year, Location, and Product (but NOT Month)
    filteredCampaigns.forEach(c => {
      const monthKey = normalizeMonthToAbbreviation(c.month);
      const current = monthlyMap.get(monthKey) || { earnings: 0, costs: 0 };
      monthlyMap.set(monthKey, {
        earnings: current.earnings + c.earnings,
        costs: current.costs + c.costs,
      });
    });
    
    const monthlyData = MONTH_ORDER
      .map(month => {
        const data = monthlyMap.get(month) || { earnings: 0, costs: 0 }; // Provide default if no data
        return {
          month: month,
          receita: data.earnings,
          despesa: data.costs,
        };
      })
      .filter(m => m.receita > 0 || m.despesa > 0); // Only keep months with data
    
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
      clicksPerSale,
      costPerSale,
      monthlyData,
      hasData: summaryCampaigns.length > 0, // Check if summary data exists
      hasMonthlyData: monthlyData.length > 0, // Check if chart data exists
    };
  }, [campaigns, selectedYear, selectedMonth, selectedLocation, selectedProduct, products, productNamesByLocation]);

  // Determine which months have data for the selected year
  const monthsWithData = useMemo(() => {
    return [...new Set(campaigns.filter(c => selectedYear === "all" || c.year === parseInt(selectedYear)).map(c => normalizeMonthToAbbreviation(c.month)))].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  }, [campaigns, selectedYear]);

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

  // Decide whether to show the monthly chart or a single month summary
  const showMonthlyChart = selectedMonth === "all" && productData.hasMonthlyData;
  const showSingleMonthSummary = selectedMonth !== "all" && productData.hasData;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Custom Header Structure */}
      <div className="sticky top-[4rem] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 pt-6 pb-6 border-b">
        <div className="flex items-start justify-between">
          
          {/* Left Block: Title and Description */}
          <div className="flex flex-col min-w-[300px] flex-shrink-0">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Produtos</h1>
            <p className="text-sm text-muted-foreground mt-1">Análise de desempenho por produto</p>
          </div>

          {/* Middle Block: Empty space for alignment */}
          <div className="flex-1" />

          {/* Right Block: Filters (Selects and Month Buttons) - Stacked vertically */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            
            {/* Row 1: Selects (Year, Location, Product) */}
            <div className="flex gap-2 items-center">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-28 h-10">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Anos</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-32 h-10">
                    <SelectValue placeholder="Local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Locais</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={productNamesByLocation.length === 0}>
                  <SelectTrigger className="w-40 h-10">
                    <SelectValue placeholder="Todos os..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Produtos</SelectItem>
                    {productNamesByLocation.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            {/* Row 2: Month Buttons Grid (Single row of 13 buttons) */}
            <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedMonth("all")}
                  className={cn(
                    "transition-all duration-200 h-10 px-4", 
                    selectedMonth === "all" 
                      ? "bg-warning/20 text-warning border-warning/50 hover:bg-warning/30" 
                      : "hover:bg-muted"
                  )}
                >
                  Todos os Meses
                </Button>
                {MONTH_ORDER.map(month => { 
                  const hasData = monthsWithData.includes(month);
                  return (
                    <Button 
                      key={month} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedMonth(month)}
                      disabled={!hasData}
                      className={cn(
                        "transition-all duration-200 h-10 w-12 px-2", // Fixed width for month buttons
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

      {/* Product Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Dias" value={formatNumber(productData.totalDays)} icon={Calendar} />
        <StatCard title="Impressões" value={formatNumber(productData.totalImpressions)} icon={Eye} />
        <StatCard title="Cliques" value={formatNumber(productData.totalClicks)} icon={MousePointer} />
        <StatCard title="Vendas" value={productData.totalSales} icon={Package} variant="success" />
        <StatCard title="Cliques/Venda" value={productData.clicksPerSale.toFixed(1)} icon={MousePointer} />
        <StatCard title="Receitas" value={formatCurrency(productData.totalEarnings)} icon={TrendingUp} variant="success" />
        <StatCard title="Custo" value={formatCurrency(productData.totalCosts)} icon={TrendingDown} variant="danger" />
        <StatCard title="Custo/Venda" value={formatCurrency(productData.costPerSale)} icon={Receipt} variant="warning" />
        <StatCard title="ROI" value={formatPercent(productData.roi)} icon={DollarSign} variant={productData.roi > 0 ? "success" : "danger"} />
      </div>

      {/* Balance Card */}
      <Card className={cn(productData.profit >= 0 ? "border-success bg-success/5" : "border-destructive bg-destructive/5", "card-hover")}>
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
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedMonth === "all" ? "Evolução Mensal" : `Resumo do Mês: ${selectedMonth}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showMonthlyChart ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
                    <Tooltip 
                      content={<CustomTooltip />} // Use the custom tooltip component
                      wrapperStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        outline: 'none' // Remove default focus outline
                      }}
                    />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : showSingleMonthSummary ? (
              <div className="py-12 text-center">
                <p className="text-xl font-semibold mb-2">Dados Consolidados para {selectedMonth}</p>
                <div className="flex justify-center gap-8 mt-4">
                  <div className="text-success">
                    <p className="text-sm text-muted-foreground">Receita</p>
                    <p className="text-2xl font-bold">{formatCurrency(productData.totalEarnings)}</p>
                  </div>
                  <div className="text-destructive">
                    <p className="text-sm text-muted-foreground">Despesa</p>
                    <p className="text-2xl font-bold">{formatCurrency(productData.totalCosts)}</p>
                  </div>
                  <div className={getProfitLossColor(productData.profit)}>
                    <p className="text-sm text-muted-foreground">Lucro</p>
                    <p className="text-2xl font-bold">{formatCurrency(productData.profit)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">Sem dados de campanha para os filtros selecionados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}