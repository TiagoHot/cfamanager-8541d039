import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/useSettings';
import { Textarea } from '@/components/ui/textarea';

interface AddProductDialogProps {
  onAdd: (product: Product) => void;
  children: React.ReactNode;
  existingProductsCount: number;
}

export function AddProductDialog({ onAdd, children, existingProductsCount }: AddProductDialogProps) {
  const { niches, productTypes, platforms } = useSettings();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: productTypes[0] || '',
    niche: niches[0] || '',
    platform: platforms[0] || 'Hotmart',
    country: 'Brasil',
    date: new Date().toISOString().split('T')[0],
    notes: '', // New field
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    // Campos removidos: averageTicket, commissionPercent, currency.
    // commissionBRL é definido como 0, pois o cálculo não é mais feito aqui.
    const newProduct: Product = {
      id: `prod-new-${Date.now()}`,
      date: formData.date,
      productNumber: existingProductsCount + 1,
      name: formData.name,
      type: formData.type,
      niche: formData.niche,
      platform: formData.platform,
      country: formData.country,
      currency: 'Real', // Default value, but not used for calculation here
      averageTicket: 0, // Default value
      commissionPercent: 0, // Default value
      commissionBRL: 0, // Set to 0 since calculation fields were removed
      notes: formData.notes.trim(),
    };

    onAdd(newProduct);
    toast.success('Produto adicionado com sucesso!');
    setOpen(false);
    setFormData({
      name: '',
      type: productTypes[0] || '',
      niche: niches[0] || '',
      platform: platforms[0] || 'Hotmart',
      country: 'Brasil',
      date: new Date().toISOString().split('T')[0],
      notes: '',
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
                  {productTypes.map(t => (
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
                  {platforms.map(p => (
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
              <Label htmlFor="date">Data de Cadastro</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            {/* Campos removidos: Moeda, Ticket Médio, Comissão (%) */}
            
            <div className="col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anotações rápidas sobre o produto..."
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