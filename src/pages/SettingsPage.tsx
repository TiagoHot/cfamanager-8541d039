import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, X, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { CURRENCY_RATES } from "@/types";
import { useSettings } from "@/hooks/useSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Componente auxiliar para gerenciar listas (Niches, Types, Sources, Platforms)
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
            <AlertDialog key={item}>
              <AlertDialogTrigger asChild>
                <Badge 
                  className={`text-sm cursor-pointer transition-colors ${badgeVariant}`} 
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
    platforms, // New: Platforms from hook
    addPlatform, // New: Platform functions
    removePlatform, // New: Platform functions
    resetPlatforms, // New: Platform functions
    freedomThreshold,
    setFreedomThreshold,
    resetFreedomThreshold,
  } = useSettings();
  
  const [newPlatform, setNewPlatform] = useState('');
  const [newStrategy, setNewStrategy] = useState('');

  // Temporary effect to ensure default types are loaded correctly after the last change
  useEffect(() => {
    const needsReset = productTypes.some(t => 
      t === 'Comércio eletrônico' || t === 'E-commerce'
    );
    
    if (needsReset) {
      resetProductTypes();
    }
  }, [productTypes, resetProductTypes]);


  const handleResetAll = () => {
    resetNiches();
    resetProductTypes();
    resetIncomeSources();
    resetExpenseSources();
    resetPlatforms(); // Reset platforms
    resetFreedomThreshold(); // Reset threshold
    toast.success('Configurações restauradas para o padrão.');
  };

  // Placeholder functions for other settings management (Strategies)
  const handleAddPlatform = () => {
    // This function is now redundant as ListManager handles it, but keeping it for consistency if needed elsewhere.
    if (newPlatform.trim()) {
      addPlatform(newPlatform);
      setNewPlatform('');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Parâmetros Auxiliares" 
        description="Configure as taxas de câmbio e parâmetros do sistema"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar Padrões
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar TODAS as Configurações?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja restaurar TODAS as configurações (listas e limiares) para os valores padrão? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAll}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Restaurar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button size="sm" disabled>
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Currency Rates (Top Left) */}
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

        {/* 2. Income Sources */}
        <ListManager
          title="Fontes de Receita"
          description="Gerencie as categorias de entrada de dinheiro."
          items={incomeSources}
          onAdd={addIncomeSource}
          onRemove={removeIncomeSource}
          onReset={resetIncomeSources}
          badgeColor="success"
        />

        {/* 3. Expense Sources */}
        <ListManager
          title="Fontes de Despesa"
          description="Gerencie as categorias de saída de dinheiro."
          items={expenseSources}
          onAdd={addExpenseSource}
          onRemove={removeExpenseSource}
          onReset={resetExpenseSources}
          badgeColor="destructive"
        />

        {/* 4. Product Types */}
        <ListManager
          title="Tipos de Produto"
          description="Gerencie a lista de tipos de produtos (Nutra, Digital, etc.)."
          items={productTypes}
          onAdd={addProductType}
          onRemove={removeProductType}
          onReset={resetProductTypes}
          badgeColor="default"
        />

        {/* 5. Niches */}
        <ListManager
          title="Nichos de Produtos"
          description="Gerencie a lista de nichos disponíveis para categorização de produtos."
          items={niches}
          onAdd={addNiche}
          onRemove={removeNiche}
          onReset={resetNiches}
          badgeColor="default"
        />

        {/* 6. Platforms */}
        <ListManager
          title="Plataformas de Afiliados"
          description="Gerencie a lista de plataformas disponíveis para cadastro."
          items={platforms}
          onAdd={addPlatform}
          onRemove={removePlatform}
          onReset={resetPlatforms}
          badgeColor="default"
        />
        
        {/* 7. Business Level Thresholds (Moved to the end) */}
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