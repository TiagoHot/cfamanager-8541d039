import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { formatCurrency, formatNumber, formatPercent, normalizeMonthToAbbreviation } from "@/lib/formatters";
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

const MONTH_ORDER = MONTHS;

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
  
  // Filter product names based on selected location
  const productNamesByLocation = useMemo(() => {
    const filteredProducts = products.filter(p => 
      selectedLocation === "all" || p.country === selectedLocation
    );
    return [...new Set(filteredProducts.map(p => p.name))].sort();
  }, [products, selectedLocation]);

  // Reset selected product if the location changes and the product is no longer valid
  useEffect(() => {
    if (selectedProduct !== "all" && !productNamesByLocation.includes(selectedProduct)) {
      setSelectedProduct("all");
    }
  }, [selectedLocation, productNamesByLocation, selectedProduct]);

  const productData = useMemo(() => {
    let filteredCampaigns = campaigns.filter(c => {
      const campaignYear = c.year.toString();
      const campaignMonth = normalizeMonthToAbbreviation(c.month);
      const campaignLocation = c.location;
      const campaignProductName = c.productName;

      const yearMatch = selectedYear === "all" || campaignYear === selectedYear;
      const monthMatch = selectedMonth === "all" || campaignMonth === selectedMonth;
      const locationMatch = selectedLocation === "all" || campaignLocation === selectedLocation;
      const productMatch = selectedProduct === "all" || campaignProductName === selectedProduct;

      return yearMatch && monthMatch && locationMatch && productMatch;
    });

    // If a specific product is selected, ensure only its campaigns are considered
    if (selectedProduct !== "all") {
      filteredCampaigns = filteredCampaigns.filter(c => c.productName === selectedProduct);
    } else if (productNamesByLocation.length > 0 && selectedProduct === "all") {
      // If no specific product is selected, but a location is, show data for all products in that location
      filteredCampaigns = filteredCampaigns.filter(c => productNamesByLocation.includes(c.productName));
    }
    
    const totalDays = filteredCampaigns.reduce((sum, c) => sum + c.daysRunning, 0);
    const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalSales = filteredCampaigns.reduce((sum, c) => sum + c.sales, 0);
    const totalEarnings = filteredCampaigns.reduce((sum, c) => sum + c.earnings, 0);
    const totalCosts = filteredCampaigns.reduce((sum, c) => sum + c.costs, 0);
    const profit = totalEarnings - totalCosts;
    const roi = totalCosts > 0 ? ((totalEarnings - totalCosts) / totalCosts) * 100 : 0;
    const cpc = totalClicks > 0 ? totalCosts / totalClicks : 0;

    const clicksPerSale = totalSales > 0 ? totalClicks / totalSales : 0;
    const costPerSale = totalSales > 0 ? totalCosts / totalSales : 0;
    
    // Monthly data
    const monthlyMap = new Map<string, { earnings: number; costs: number }>();
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
      });
    
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
      hasData: filteredCampaigns.length > 0,
    };
  }, [campaigns, selectedYear, selectedMonth, selectedLocation, selectedProduct, products, productNamesByLocation]);

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
        className="sticky top-[4rem] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-6 px-6 pt-6 pb-6"
      >
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Anos</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Meses</SelectItem>
            {MONTH_ORDER.map(month => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-36">
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
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Produtos</SelectItem>
            {productNamesByLocation.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {!productData.hasData ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum dado encontrado para os filtros selecionados.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Product Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard title="Dias" value={formatNumber(productData.totalDays)} icon={Calendar} /> {/* New card */}
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
          <div className="grid grid-cols-1 gap-6">
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
          </div>
        </>
      )}
    </div>
  );
}