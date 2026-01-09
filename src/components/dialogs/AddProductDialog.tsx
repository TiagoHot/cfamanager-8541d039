import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, PLATFORMS, CURRENCY_RATES, PRODUCT_TYPES } from '@/types';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';

interface AddProductDialogProps {
  onAdd: (product: Product) => void;
  children: React.ReactNode;
  existingProductsCount: number;
}

export function AddProductDialog({ onAdd, children, existingProductsCount }: AddProductDialogProps) {
  const { niches } = useSettings();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: PRODUCT_TYPES[0], // Default to first type
    niche: niches[0] || '',
    platform: 'Hotmart',
    country: 'Brasil',
    currency: 'Real',
    averageTicket: '',
    commissionPercent: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    const averageTicket = parseFloat(formData.averageTicket) || 0;
    const commissionPercent = parseFloat(formData.commissionPercent) || 0;
    const rate = CURRENCY_RATES[formData.currency as keyof typeof CURRENCY_RATES] || 1;
    const commissionBRL = averageTicket * (commissionPercent / 100) * rate;

    const newProduct: Product = {
      id: `prod-new-${Date.now()}`,
      date: formData.date,
      productNumber: existingProductsCount + 1,
      name: formData.name,
      type: formData.type,
      niche: formData.niche,
      platform: formData.platform,
      country: formData.country,
      currency: formData.currency,
      averageTicket,
      commissionPercent,
      commissionBRL,
    };

    onAdd(newProduct);
    toast.success('Produto adicionado com sucesso!');
    setOpen(false);
    setFormData({
      name: '',
      type: PRODUCT_TYPES[0],
      niche: niches[0] || '',
      platform: 'Hotmart',
      country: 'Brasil',
      currency: 'Real',
      averageTicket: '',
      commissionPercent: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Curso de Marketing Digital"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="niche">Nicho</Label>
              <Select value={formData.niche} onValueChange={(v) => setFormData(prev => ({ ...prev, niche: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nicho" />
                </SelectTrigger>
                <SelectContent>
                  {niches.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="platform">Plataforma</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="country">País</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brasil">Brasil</SelectItem>
                  <SelectItem value="Gringa">Gringa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency">Moeda</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Real">Real</SelectItem>
                  <SelectItem value="Dólar">Dólar</SelectItem>
                  <SelectItem value="Euro">Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Data de Cadastro</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="averageTicket">Ticket Médio</Label>
              <Input
                id="averageTicket"
                type="number"
                step="0.01"
                value={formData.averageTicket}
                onChange={(e) => setFormData(prev => ({ ...prev, averageTicket: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="commissionPercent">Comissão (%)</Label>
              <Input
                id="commissionPercent"
                type="number"
                step="0.1"
                value={formData.commissionPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, commissionPercent: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar Produto</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}