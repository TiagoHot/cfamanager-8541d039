import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw } from "lucide-react";
import { CURRENCY_RATES } from "@/types";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader 
        title="Parâmetros Auxiliares" 
        description="Configure as taxas de câmbio e parâmetros do sistema"
      >
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Restaurar Padrões
        </Button>
        <Button size="sm">
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
                  <Badge variant="destructive">NÍVEL INVESTIDOR</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Lucro acumulado negativo</p>
                </div>
                <span className="font-mono">&lt; R$ 0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div>
                  <Badge className="bg-warning text-warning-foreground">NÍVEL BREAKEVEN</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Ponto de equilíbrio</p>
                </div>
                <span className="font-mono">= R$ 0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-info/10 border border-info/20">
                <div>
                  <Badge className="bg-info text-info-foreground">NÍVEL PAYBACK</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Lucro positivo, mas ainda não liberto</p>
                </div>
                <span className="font-mono">&gt; R$ 0</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                <div>
                  <Badge className="bg-success text-success-foreground">NÍVEL RETIRADA</Badge>
                  <p className="text-sm text-muted-foreground mt-1">Independência financeira</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">&gt;</span>
                  <Input 
                    type="number" 
                    defaultValue={60000} 
                    className="w-28"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platforms */}
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
              <Input placeholder="Nova plataforma..." className="flex-1" />
              <Button variant="outline" size="sm">Adicionar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Strategies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estratégias de Campanha</CardTitle>
            <CardDescription>Tipos de estratégias para campanhas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">Pesquisa</Badge>
              <Badge variant="outline" className="text-sm">Display</Badge>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-2">
              <Input placeholder="Nova estratégia..." className="flex-1" />
              <Button variant="outline" size="sm">Adicionar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
