import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload, Pencil, MessageSquare, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Product } from "@/types";
import { useData } from "@/contexts/DataContext";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { AddProductDialog } from "@/components/dialogs/AddProductDialog";
import { EditProductDialog } from "@/components/dialogs/EditProductDialog";
import { exportProducts } from "@/lib/exportData";
import { toast } from "sonner";
import { PageContent } from "@/components/PageContent";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import InlineProductEditor from "@/components/InlineProductEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProductsPage() {
  const { products, importData, addProduct, updateProduct, removeProduct } = useData();

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
        <InlineProductEditor product={item} field="name" type="text">
          <span className="font-medium">{item.name}</span>
        </InlineProductEditor>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (item: Product) => (
        <InlineProductEditor product={item} field="type" type="select" badgeVariant="secondary">
          <Badge variant="secondary">{item.type || 'Não Definido'}</Badge>
        </InlineProductEditor>
      ),
    },
    {
      key: 'niche',
      header: 'Nicho',
      render: (item: Product) => (
        <InlineProductEditor product={item} field="niche" type="select" badgeVariant="outline">
          <Badge variant="outline">{item.niche || 'Não Definido'}</Badge>
        </InlineProductEditor>
      ),
    },
    {
      key: 'platform',
      header: 'Plataforma',
      render: (item: Product) => (
        <InlineProductEditor product={item} field="platform" type="select" badgeVariant="secondary">
          <Badge variant="secondary">{item.platform}</Badge>
        </InlineProductEditor>
      ),
    },
    {
      key: 'country',
      header: 'Local',
      render: (item: Product) => (
        <InlineProductEditor product={item} field="country" type="select" badgeVariant={item.country === 'Brasil' ? 'success' : 'info'}>
          {/* Display handled by InlineProductEditor renderDisplay */}
          <span className="text-xs font-medium">{item.country}</span>
        </InlineProductEditor>
      ),
    },
    {
      key: 'notes',
      header: 'Notas',
      className: 'w-20 text-center',
      render: (item: Product) => (
        <InlineProductEditor product={item} field="notes" type="textarea" className="text-center">
          {item.notes ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <MessageSquare className="w-4 h-4 text-muted-foreground mx-auto cursor-pointer hover:text-primary" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{item.notes}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </InlineProductEditor>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      render: (item: Product) => (
        <InlineProductEditor product={item} field="date" type="date">
          {formatDate(item.date)}
        </InlineProductEditor>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-24 text-center',
      render: (item: Product) => (
        <div className="flex items-center justify-center gap-1">
          <EditProductDialog product={item} onUpdate={updateProduct}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
          </EditProductDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Produto</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover o produto <strong>{item.name}</strong>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => removeProduct(item.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ], [updateProduct, removeProduct]);

  // Sort products primarily by productNumber descending (most recent product number first)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      // Primary sort: productNumber descending
      if (b.productNumber !== a.productNumber) {
        return b.productNumber - a.productNumber;
      }
      // Secondary sort (optional, but good practice): date descending
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
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