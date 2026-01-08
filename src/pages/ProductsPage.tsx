import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Product } from "@/types";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddProductDialog } from "@/components/dialogs/AddProductDialog";
import { exportProducts } from "@/lib/exportData";
import { toast } from "sonner";

const columns = [
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
    render: (item: Product) => (
      <Badge variant={item.country === 'Brasil' ? 'default' : 'outline'}>
        {item.country}
      </Badge>
    ),
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
];

export default function ProductsPage() {
  const { products, importData, addProduct } = useData();

  // Sort products by date descending (most recent first), then by productNumber descending
  const sortedProducts = [...products].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    return b.productNumber - a.productNumber;
  });

  const handleExport = () => {
    if (products.length === 0) {
      toast.error('Nenhum produto para exportar');
      return;
    }
    exportProducts(products);
    toast.success('Produtos exportados com sucesso!');
  };

  return (
    <div className="animate-fade-in space-y-4 pt-6 pb-6">
      {/* PageHeader sticky top-0 (relative to main content area) */}
      <div className="sticky top-0 z-20 bg-background pt-0 pb-4 -mt-6">
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
      </div>

      <DataTable 
        data={sortedProducts} 
        columns={columns}
        // The DataTable header needs to stick right below the PageHeader wrapper (~5rem from viewport top)
        headerClassName="sticky top-[5rem] z-10 bg-background shadow-sm"
      />
    </div>
  );
}