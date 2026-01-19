import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Save, RefreshCw, X, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { CURRENCY_RATES } from "@/types";
import { useSettings } from "@/hooks/useSettings";
import { useCurrencyRates } from "@/contexts/CurrencyRatesContext"; // Import new hook from context
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils"; // Import cn

// Componente auxiliar para gerenciar listas (Niches, Types, Sources, Platforms)
interface ListManagerProps {
  title: string;
  description: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  onReset: () => void;
  // Alterado para aceitar uma string de classe Tailwind customizada
  badgeClass: string; 
}

const ListManager = ({ title, description, items, onAdd, onRemove, onReset, badgeClass }: ListManagerProps) => {
  const [newItem, setNewItem] = useState('');
  
  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
      toast.success(`${title.slice(0, -1)} "${newItem.trim()}" adicionado.`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleResetConfirm = () => {
    onReset();
    toast.success(`${title} restaurados para os padrões.`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 min-h-10">
          {items.map(item => (
            <AlertDialog key={item}>
              <AlertDialogTrigger asChild>
                <Badge 
                  className={cn("text-sm cursor-pointer transition-colors", badgeClass)} 
                >
                  {item} <X className="w-3 h-3 ml-1" />
                </Badge>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover "{item}" da lista de {title.toLowerCase()}?
                    Isso não afetará os produtos já cadastrados, mas removerá a opção para novos cadastros.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onRemove(item)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex gap-2">
          <Input 
            placeholder={`Novo ${title.toLowerCase().slice(0, -1)}...`} 
            className="flex-1" 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button variant="outline" size="sm" onClick={handleAdd}>Adicionar</Button>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="link" size="sm" className="mt-2 p-0 text-xs text-muted-foreground">
              Restaurar padrões
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar Padrões?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja restaurar a lista de {title.toLowerCase()} para os valores padrão? 
                Todas as suas adições e remoções personalizadas serão perdidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetConfirm}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Restaurar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};


export default function SettingsPage() {
  const { 
    niches, 
    addNiche, 
    removeNiche, 
    resetNiches,
    productTypes,
    addProductType,
    removeProductType,
    resetProductTypes,
    incomeSources,
    addIncomeSource,
    removeIncomeSource,
    resetIncomeSources,
    expenseSources,
    addExpenseSource,
    removeExpenseSource,
    resetExpenseSources,
    platforms,
    addPlatform,
    removePlatform,
    resetPlatforms,
    strategies, // New: Strategies from hook
    addStrategy, // New: Strategy functions
    removeStrategy, // New: Strategy functions
    resetStrategies, // New: Strategy functions
    freedomThreshold,
    setFreedomThreshold,
    resetFreedomThreshold,
  } = useSettings();
  
  const { rates, updateRate, saveRates, fetchRatesFromAPI, isLoading, lastUpdate } = useCurrencyRates();

  // Temporary effect to ensure default types are loaded correctly after the last change
  useEffect(() => {
    const needsReset = productTypes.some(t => 
      t === 'Comércio eletrônico' || t === 'E-commerce'
    );
    
    if (needsReset) {
      resetProductTypes();
    }
  }, [productTypes, resetProductTypes]);


  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Parâmetros Auxiliares" 
        description="Configure as taxas de câmbio e parâmetros do sistema"
      >
        {/* Removed Save Button */}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Currency Rates (Top Left) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxas de Câmbio</CardTitle>
            <CardDescription>
              Cotações atualizadas via Banco Central do Brasil
              {lastUpdate && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Última atualização: {lastUpdate}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dollar">Dólar (USD) para Real (BRL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$1 =</span>
                <Input 
                  id="dollar" 
                  type="number" 
                  step="0.0001" 
                  value={rates.Dollar}
                  onChange={(e) => updateRate('Dollar', parseFloat(e.target.value) || 0)}
                  className="w-32"
                  disabled={isLoading}
                />
                <span className="text-muted-foreground">R$</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="euro">Euro (EUR) para Real (BRL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">€1 =</span>
                <Input 
                  id="euro" 
                  type="number" 
                  step="0.0001" 
                  value={rates.Euro}
                  onChange={(e) => updateRate('Euro', parseFloat(e.target.value) || 0)}
                  className="w-32"
                  disabled={isLoading}
                />
                <span className="text-muted-foreground">R$</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchRatesFromAPI} 
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar via BCB
                  </>
                )}
              </Button>
              <Button onClick={saveRates} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* 2. Strategies (Laranja/Warning) */}
        <ListManager
          title="Estratégias de Campanha"
          description="Gerencie as estratégias de tráfego pago (Pesquisa, Display, etc.)."
          items={strategies}
          onAdd={addStrategy}
          onRemove={removeStrategy}
          onReset={resetStrategies}
          badgeClass="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
        />

        {/* 3. Income Sources (Verde/Success) */}
        <ListManager
          title="Fontes de Receita"
          description="Gerencie as categorias de entrada de dinheiro."
          items={incomeSources}
          onAdd={addIncomeSource}
          onRemove={removeIncomeSource}
          onReset={resetIncomeSources}
          badgeClass="bg-success/10 text-success border-success/20 hover:bg-success/20"
        />

        {/* 4. Expense Sources (Vermelho/Destructive) */}
        <ListManager
          title="Fontes de Despesa"
          description="Gerencie as categorias de saída de dinheiro."
          items={expenseSources}
          onAdd={addExpenseSource}
          onRemove={removeExpenseSource}
          onReset={resetExpenseSources}
          badgeClass="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
        />

        {/* 5. Product Types (Rosa/Chart-7) */}
        <ListManager
          title="Tipos de Produto"
          description="Gerencie a lista de tipos de produtos (Nutra, Digital, etc.)."
          items={productTypes}
          onAdd={addProductType}
          onRemove={removeProductType}
          onReset={resetProductTypes}
          badgeClass="bg-chart-7/10 text-chart-7 border-chart-7/20 hover:bg-chart-7/20"
        />

        {/* 6. Niches (Lilás/Chart-5) */}
        <ListManager
          title="Nichos de Produtos"
          description="Gerencie a lista de nichos disponíveis para categorização de produtos."
          items={niches}
          onAdd={addNiche}
          onRemove={removeNiche}
          onReset={resetNiches}
          badgeClass="bg-chart-5/10 text-chart-5 border-chart-5/20 hover:bg-chart-5/20"
        />

        {/* 7. Platforms (Azul/Chart-1) */}
        <ListManager
          title="Plataformas de Afiliados"
          description="Gerencie a lista de plataformas disponíveis para cadastro."
          items={platforms}
          onAdd={addPlatform}
          onRemove={removePlatform}
          onReset={resetPlatforms}
          badgeClass="bg-chart-1/10 text-chart-1 border-chart-1/20 hover:bg-chart-1/20"
        />
        
        {/* 8. Business Level Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Níveis do Negócio</CardTitle>
            <CardDescription>Defina os limiares para cada nível de resultado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div>
                  <Badge variant="destructive">NÍVEL INICIANTE</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Você ainda está no vermelho, mas não desanime! Você está apenas começando, continue investindo.</p>
                </div>
                <span className="font-mono">&lt; R$ 0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div>
                  <Badge className="bg-warning text-warning-foreground">NÍVEL BREAKEVEN</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Parabéns pelo avanço! Você atingiu o ponto em que sua receita cobre seus custos.</p>
                </div>
                <span className="font-mono">= R$ 0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-info/10 border border-info/20">
                <div>
                  <Badge className="bg-info text-info-foreground">NÍVEL PAYBACK</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Parabéns! Seus resultados cobrem todos os custos e geram lucro. Mas tenha em mente que você ainda não atingiu a independência financeira!</p>
                </div>
                <span className="font-mono">&gt; R$ 0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                <div>
                  <Badge className="bg-success text-success-foreground">NÍVEL DE LIBERDADE</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Parabéns! Você atingiu sua independência financeira!</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Obs: Defina o lucro anual que você acha ideal para atingir a "independência financeira" e adicione na caixa acima.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">&gt;</span>
                  <Input 
                    type="number" 
                    value={freedomThreshold}
                    onChange={(e) => setFreedomThreshold(parseFloat(e.target.value) || 0)}
                    className="w-28"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}