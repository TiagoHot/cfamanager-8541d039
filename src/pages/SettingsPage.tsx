import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CURRENCY_RATES } from "@/types";
import { useSettings } from "@/hooks/useSettings";
import { useState } from "react";
import { toast } from "sonner";

// Componente auxiliar para gerenciar listas (Niches, Types, Sources)
interface ListManagerProps {
  title: string;
  description: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  onReset: () => void;
  badgeColor: 'default' | 'success' | 'destructive';
}

const ListManager = ({ title, description, items, onAdd, onRemove, onReset, badgeColor }: ListManagerProps) => {
  const [newItem, setNewItem] = useState('');
  
  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
      toast.success(`${title.slice(0, -1)} "${newItem.trim()}" adicionado.`);
    }
  };

  const handleRemove = (item: string) => {
    onRemove(item);
    toast.info(`${title.slice(0, -1)} "${item}" removido.`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const badgeVariant = badgeColor === 'success' ? 'bg-success/10 text-success border-success/20' : 
                       badgeColor === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                       'secondary';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 min-h-10">
          {items.map(item => (
            <Badge 
              key={item} 
              className={`text-sm cursor-pointer transition-colors ${badgeVariant}`} 
              onClick={() => handleRemove(item)}
            >
              {item} <X className="w-3 h-3 ml-1" />
            </Badge>
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
        <Button variant="link" size="sm" onClick={onReset} className="mt-2 p-0 text-xs text-muted-foreground">
          Restaurar padrões
        </Button>
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
  } = useSettings();
  
  const [newPlatform, setNewPlatform] = useState('');
  const [newStrategy, setNewStrategy] = useState('');

  const handleResetAll = () => {
    resetNiches();
    resetProductTypes();
    resetIncomeSources();
    resetExpenseSources();
    toast.success('Configurações restauradas para o padrão.');
  };

  // Placeholder functions for other settings management (Platforms, Strategies)
  const handleAddPlatform = () => {
    if (newPlatform.trim()) {
      // Logic to add platform (currently hardcoded in types/index.ts)
      toast.info(`Plataforma "${newPlatform.trim()}" adicionada (Apenas visual, lista fixa no código).`);
      setNewPlatform('');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Parâmetros Auxiliares" 
        description="Configure as taxas de câmbio e parâmetros do sistema"
      >
        <Button variant="outline" size="sm" onClick={handleResetAll}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Restaurar Padrões
        </Button>
        <Button size="sm" disabled>
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxas de Câmbio</CardTitle>
            <CardDescription>Configure as taxas de conversão para o Real</CardDescription>
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
                  defaultValue={CURRENCY_RATES['Dólar']} 
                  className="w-32"
                  disabled // Disable editing since we don't have persistence for this yet
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
                  defaultValue={CURRENCY_RATES['Euro']} 
                  className="w-32"
                  disabled // Disable editing since we don't have persistence for this yet
                />
                <span className="text-muted-foreground">R$</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Level Thresholds */}
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
                  <p className="text-sm text-muted-foreground mt-1">Parabéns! Seus resultados cobrem todos os custos e geram um pequeno lucro. Mas tenha em mente que você ainda não atingiu a independência financeira!</p>
                </div>
                <span className="font-mono">&gt; R$ 0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                <div>
                  <Badge className="bg-success text-success-foreground">NÍVEL DE LIBERDADE</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Parabéns! Você atingiu sua independência financeira!</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">&gt;</span>
                  <Input 
                    type="number" 
                    defaultValue={60000} 
                    className="w-28"
                    disabled // Disable editing since we don't have persistence for this yet
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Income Sources */}
        <ListManager
          title="Fontes de Receita"
          description="Gerencie as categorias de entrada de dinheiro."
          items={incomeSources}
          onAdd={addIncomeSource}
          onRemove={removeIncomeSource}
          onReset={resetIncomeSources}
          badgeColor="success"
        />

        {/* Expense Sources */}
        <ListManager
          title="Fontes de Despesa"
          description="Gerencie as categorias de saída de dinheiro."
          items={expenseSources}
          onAdd={addExpenseSource}
          onRemove={removeExpenseSource}
          onReset={resetExpenseSources}
          badgeColor="destructive"
        />

        {/* Product Types */}
        <ListManager
          title="Tipos de Produto"
          description="Gerencie a lista de tipos de produtos (Nutra, Digital, etc.)."
          items={productTypes}
          onAdd={addProductType}
          onRemove={removeProductType}
          onReset={resetProductTypes}
          badgeColor="default"
        />

        {/* Niches */}
        <ListManager
          title="Nichos de Produtos"
          description="Gerencie a lista de nichos disponíveis para categorização de produtos."
          items={niches}
          onAdd={addNiche}
          onRemove={removeNiche}
          onReset={resetNiches}
          badgeColor="default"
        />

        {/* Platforms (Placeholder for future dynamic management) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plataformas de Afiliados</CardTitle>
            <CardDescription>Lista de plataformas disponíveis para cadastro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['Hotmart', 'Monetizze', 'Eduzz', 'Braip', 'Kiwify', 'ClickBank', 'BuyGoods', 'Digistore24', 'MaxWebb', 'Gurumedia', 'Terra Leads', 'Media Scalers', 'Doppus'].map(platform => (
                <Badge key={platform} variant="secondary" className="text-sm">
                  {platform}
                </Badge>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Input 
                placeholder="Nova plataforma..." 
                className="flex-1" 
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={handleAddPlatform}>Adicionar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}