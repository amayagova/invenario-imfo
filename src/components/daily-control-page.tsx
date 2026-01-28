'use client';

import * as React from 'react';
import { Search, FilePenLine, Loader2, Upload, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';

import type { InventoryItem, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PageHeader } from './page-header';
import { useAppContext } from '@/context/app-context';

type FormValues = {
    search: string;
    physicalCount: string;
    systemCount: string;
};

export function DailyControlPage() {
  const { branches, products, inventory, updateInventoryCount, batchUpdateInventory } = useAppContext();
  const [selectedBranch, setSelectedBranch] = React.useState<string>('');
  const [activeProduct, setActiveProduct] = React.useState<InventoryItem | null>(null);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    defaultValues: {
      search: '',
      physicalCount: '',
      systemCount: '',
    },
  });

  const searchQuery = form.watch('search');

  React.useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
        setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);
  
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const searchResults = React.useMemo(() => {
    if (!searchQuery || !selectedBranch) return [];
    const upperQuery = searchQuery.toUpperCase();
    return products.filter(product => 
        product.description.toUpperCase().includes(upperQuery) ||
        product.code.toUpperCase().includes(upperQuery)
    );
  }, [products, searchQuery, selectedBranch]);

  const loggedInventory = React.useMemo(() => {
    if (!selectedBranch) return [];
    
    const branchInventory = inventory.filter(item => 
      item.branchId === selectedBranch &&
      (item.physicalCount > 0 || item.systemCount > 0)
    );

    const uniqueItems: InventoryItem[] = [];
    const seenCodes = new Set<string>();

    for (const item of branchInventory) {
      if (!seenCodes.has(item.code)) {
        uniqueItems.push(item);
        seenCodes.add(item.code);
      }
    }
    
    return uniqueItems.sort((a,b) => a.description.localeCompare(b.description));
  }, [inventory, selectedBranch]);


  const handleProductSelect = (product: Product) => {
    const inventoryItem = inventory.find(item => item.branchId === selectedBranch && item.code === product.code);
    
    if (inventoryItem) {
        setActiveProduct(inventoryItem);
        form.setValue('search', inventoryItem.description);
        form.setValue('systemCount', String(inventoryItem.systemCount));
        form.setValue('physicalCount', String(inventoryItem.physicalCount > 0 ? inventoryItem.physicalCount : ''));
        setShowSearchResults(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error de Sincronización',
            description: `El producto "${product.description}" no se encuentra en esta sucursal.`,
        });
    }
  };
  
  const onSubmit = async () => {
    if (!activeProduct) {
        toast({
            variant: 'destructive',
            title: 'Error de Registro',
            description: 'Busca y selecciona un producto válido para registrar el conteo.',
        });
        return;
    }
    
    setIsSubmitting(true);

    const physicalCount = form.getValues('physicalCount');
    const physicalCountNum = parseInt(physicalCount, 10);
    const systemCount = form.getValues('systemCount');
    const systemCountNum = parseInt(systemCount, 10);

    if (isNaN(physicalCountNum) || physicalCountNum < 0) {
        toast({
            variant: 'destructive',
            title: 'Dato Inválido',
            description: 'El conteo físico debe ser un número positivo.',
        });
        setIsSubmitting(false);
        return;
    }

    if (isNaN(systemCountNum) || systemCountNum < 0) {
        toast({
            variant: 'destructive',
            title: 'Dato Inválido',
            description: 'El conteo de sistema debe ser un número positivo.',
        });
        setIsSubmitting(false);
        return;
    }

    try {
        await updateInventoryCount(activeProduct.id, physicalCountNum, systemCountNum);
        toast({
          title: 'Registro Exitoso',
          description: `Se actualizó el inventario para ${activeProduct.description}.`,
        });
        // Reset
        setActiveProduct(null);
        form.reset({ search: '', physicalCount: '', systemCount: '' });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Error al Registrar',
            description: e.message || 'No se pudo actualizar el inventario.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!selectedBranch || loggedInventory.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay datos para exportar',
        description: 'Selecciona una sucursal con registros de inventario.',
      });
      return;
    }

    const branchName = branches.find(b => b.id === selectedBranch)?.name || 'sucursal';

    let csvContent = "data:text/csv;charset=utf-8,código,descripción,físico,sistema,diferencia\n";

    loggedInventory.forEach(item => {
      const discrepancy = item.physicalCount - item.systemCount;
      const row = [
        item.code,
        `"${item.description.replace(/"/g, '""')}"`,
        item.physicalCount,
        item.systemCount,
        discrepancy
      ].join(',');
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_${branchName.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
        title: 'Exportación Exitosa',
        description: 'El archivo de inventario ha sido descargado.',
    });
  };

  const handleImportClick = () => {
    if (!selectedBranch) {
        toast({
            variant: 'destructive',
            title: 'Selecciona una Sucursal',
            description: 'Debes seleccionar una sucursal para importar el inventario.',
        });
        return;
    }
    importFileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBranch) return;

    if (!file.type.includes('csv')) {
        toast({
            variant: 'destructive',
            title: 'Archivo no válido',
            description: 'Por favor, selecciona un archivo CSV.',
        });
        return;
    }
    
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        const header = lines[0].toLowerCase().trim();
        const startIndex = (header.includes('código') || header.includes('codigo')) && header.includes('físico') ? 1 : 0;

        const updates: { code: string, physicalCount: number, branchId: string }[] = [];
        let invalidLines = 0;

        const branchInventoryCodes = new Set(inventory.filter(i => i.branchId === selectedBranch).map(i => i.code));

        lines.slice(startIndex).forEach(line => {
            const [code, physicalCountStr] = line.split(',');
            const physicalCount = parseInt(physicalCountStr?.trim(), 10);
            
            if (code?.trim() && !isNaN(physicalCount) && physicalCount >= 0 && branchInventoryCodes.has(code.trim().toUpperCase())) {
                updates.push({
                    code: code.trim().toUpperCase(),
                    physicalCount,
                    branchId: selectedBranch,
                });
            } else {
                invalidLines++;
            }
        });

        if (updates.length > 0) {
            try {
                await batchUpdateInventory(updates);
                toast({
                    title: 'Importación Exitosa',
                    description: `${updates.length} registros de inventario fueron actualizados.`,
                });
            } catch (err: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error en la Importación',
                    description: err.message || 'No se pudieron actualizar los registros.',
                });
            }
        }

        if (invalidLines > 0) {
            toast({
                variant: 'destructive',
                title: 'Líneas Omitidas',
                description: `${invalidLines} líneas del archivo CSV fueron omitidas por formato incorrecto o código de producto inexistente en esta sucursal.`,
            });
        }
        
        if (updates.length === 0 && invalidLines === lines.slice(startIndex).length) {
             toast({
                variant: 'destructive',
                title: 'Importación Fallida',
                description: 'No se encontraron registros válidos para actualizar en el archivo.',
            });
        }

        setIsImporting(false);
    };

    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Error al leer archivo',
        description: 'No se pudo leer el archivo seleccionado.',
      });
      setIsImporting(false);
    };

    reader.readAsText(file);
    event.target.value = '';
  };


  const DiscrepancyCell = ({ item }: { item: InventoryItem }) => {
    const discrepancy = item.physicalCount - item.systemCount;
    if (discrepancy === 0) return <span className="text-muted-foreground/80">0</span>;
    const color = discrepancy < 0 ? 'text-destructive' : 'text-green-500';
    return <span className={cn('font-bold', color)}>{discrepancy > 0 ? '+' : ''}{discrepancy}</span>;
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader title="Control Diario" />
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border/40">
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <FilePenLine className="h-5 w-5" />
                Registro de Inventario Manual
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Select value={selectedBranch} onValueChange={(value) => {
                    setSelectedBranch(value);
                    setActiveProduct(null);
                    form.reset();
                }}
                disabled={branches.length === 0}
                >
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Seleccionar Sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-1 gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleImportClick} disabled={isImporting || !selectedBranch}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Importar
                    </Button>
                    <Input
                        type="file"
                        ref={importFileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".csv"
                    />
                    <Button variant="outline" className="flex-1" onClick={handleExport} disabled={loggedInventory.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                <div className="relative md:col-span-12 lg:col-span-6" ref={searchContainerRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por código o descripción"
                        className="pl-10 h-11 text-base"
                        {...form.register('search')}
                        onFocus={() => setShowSearchResults(true)}
                        disabled={!selectedBranch}
                        autoComplete="off"
                    />
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute top-full mt-2 w-full rounded-md bg-card shadow-lg border z-10 max-h-60 overflow-y-auto">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleProductSelect(product)}
                            className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-accent"
                          >
                            <span className="text-sm font-medium text-primary">{product.code}</span>
                            <span className="text-base text-foreground">{product.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
                <div className="md:col-span-1 lg:col-span-2">
                    <Input 
                        type="number" 
                        placeholder="Físico" 
                        className="h-11 text-base"
                        {...form.register('physicalCount')}
                        disabled={!selectedBranch || !activeProduct}
                    />
                </div>
                <div className="md:col-span-1 lg:col-span-2">
                     <Input 
                        type="number"
                        placeholder="Sistema" 
                        className="h-11 text-base"
                        {...form.register('systemCount')}
                        disabled={!selectedBranch || !activeProduct}
                    />
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                    <Button type="submit" className="w-full h-11 text-base font-bold" disabled={!selectedBranch || isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'REGISTRAR'}
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border/40">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="text-muted-foreground/80">PRODUCTO</TableHead>
                <TableHead className="text-right text-muted-foreground/80">FÍSICO</TableHead>
                <TableHead className="text-right text-muted-foreground/80">SISTEMA</TableHead>
                <TableHead className="text-right text-muted-foreground/80">DIFERENCIA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loggedInventory.length > 0 ? (
                loggedInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">{item.code}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.physicalCount}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{item.systemCount}</TableCell>
                    <TableCell className="text-right font-mono">
                      <DiscrepancyCell item={item} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                    {!selectedBranch ? 'Por favor, crea y selecciona una sucursal para empezar.' : 
                     'No hay registros de inventario para esta sucursal.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
