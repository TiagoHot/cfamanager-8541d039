import { useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Product } from "@/types";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddProductDialog } from "@/components/dialogs/AddProductDialog";
import { EditProductDialog } from "@/components/dialogs/EditProductDialog";
import { exportProducts } from "@/lib/exportData";
import { toast } from "sonner";
import { PageContent } from "@/components/PageContent";
import { cn } from "@/lib/utils"; // Importando cn para classes customizadas

export default function ProductsPage() {
  const { products, importData, addProduct, updateProduct } = useData();

  // Define columns inside the component to use updateProduct hook
  const columns = useMemo(() => [
    {
      key: 'productNumber',
      header: 'N°',
      className: 'w-16',
      render: (item: Product) => (
        <span className="text-sm">{item.productNumber}</span>
      ),
    },
    {
      key: 'name',
      header: 'Produto',
      render: (item: Product) => (
        <span className="font-medium">{item.name}</span>
      ),
    },
    {
      key: 'platform',
      header: 'Plataforma',
      render: (item: Product) => (
        <Badge variant="secondary">{item.platform}</Badge>
      ),
    },
    {
      key: 'country',
      header: 'País',
      render: (item: Product) => {
        const isBrasil = item.country === 'Brasil';
        const badgeClasses = cn(
          "text-xs font-medium",
          isBrasil 
            ? "bg-success/10 text-success border-success/20 hover:bg-success/20" 
            : "bg-info/10 text-info border-info/20 hover:bg-info/20"
        );
        return (
          <Badge className={badgeClasses}>
            {item.country}
          </Badge>
        );
      },
    },
    {
      key: 'currency',
      header: 'Moeda',
    },
    {
      key: 'averageTicket',
      header: 'Ticket Médio',
      className: 'text-right',
      render: (item: Product) => (
        <span>
          {item.currency === 'Real' ? 'R$' : item.currency === 'Dólar' ? '$' : '€'} {item.averageTicket.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'commissionPercent',
      header: 'Comissão %',
      className: 'text-right',
      render: (item: Product) => (
        <span>{item.commissionPercent}%</span>
      ),
    },
    {
      key: 'commissionBRL',
      header: 'Comissão R$',
      className: 'text-right',
      render: (item: Product) => (
        <span className="font-medium text-success">
          {formatCurrency(item.commissionBRL)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      render: (item: Product) => formatDate(item.date),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-20 text-center',
      render: (item: Product) => (
        <EditProductDialog product={item} onUpdate={updateProduct}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        </EditProductDialog>
      ),
    },
  ], [updateProduct]);

  // Sort products by date descending (most recent first), then by productNumber descending
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return b.productNumber - a.productNumber;
    });
  }, [products]);

  const handleExport = () => {
    if (products.length === 0) {
      toast.error('Nenhum produto para exportar');
      return;
    }
    exportProducts(products);
    toast.success('Produtos exportados com sucesso!');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Produtos" 
        description="Gerencie seu catálogo de produtos afiliados"
      >
        <ImportExcelDialog onImportComplete={importData}>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
        </ImportExcelDialog>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        <AddProductDialog onAdd={addProduct} existingProductsCount={products.length}>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </AddProductDialog>
      </PageHeader>

      <PageContent>
        <DataTable 
          data={sortedProducts} 
          columns={columns}
          // Adicionando classe sticky ao cabeçalho da tabela
          headerClassName="sticky top-0 z-10 bg-background shadow-sm"
        />
      </PageContent>
    </div>
  );
}