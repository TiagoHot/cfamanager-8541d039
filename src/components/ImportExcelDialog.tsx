import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { useExcelImport } from '@/hooks/useExcelImport';
import { toast } from 'sonner';

interface ImportExcelDialogProps {
  onImportComplete: (data: any) => void;
  children?: React.ReactNode;
}

export function ImportExcelDialog({ onImportComplete, children }: ImportExcelDialogProps) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importFromFile, isImporting, progress, error } = useExcelImport();

  const handleFileSelect = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV');
      return;
    }

    try {
      const data = await importFromFile(file);
      setImportedData(data);
      toast.success('Arquivo importado com sucesso!');
    } catch {
      toast.error('Erro ao importar arquivo');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleConfirmImport = () => {
    if (importedData) {
      onImportComplete(importedData);
      setOpen(false);
      setImportedData(null);
      toast.success('Dados importados para o sistema!');
    }
  };

  const totalItems = importedData
    ? importedData.products.length +
      importedData.campaigns.length +
      importedData.weekly.length +
      importedData.incomeExpenses.length
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="import-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Planilha Excel
          </DialogTitle>
          <p id="import-dialog-description" className="text-sm text-muted-foreground">
            Importe seus dados de produtos, campanhas, resultados semanais e receitas/despesas.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {!importedData && !isImporting && (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              `}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">
                Arraste seu arquivo aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Suporta .xlsx, .xls, .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          )}

          {isImporting && (
            <div className="space-y-3 py-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Processando arquivo...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">{progress}%</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {importedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Arquivo processado com sucesso!</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{importedData.products.length}</p>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{importedData.campaigns.length}</p>
                  <p className="text-xs text-muted-foreground">Campanhas</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{importedData.weekly.length}</p>
                  <p className="text-xs text-muted-foreground">Resultados Semanais</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{importedData.incomeExpenses.length}</p>
                  <p className="text-xs text-muted-foreground">Receitas/Despesas</p>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Total: <span className="font-medium text-foreground">{totalItems}</span> registros encontrados
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setImportedData(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleConfirmImport}>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Importação
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
