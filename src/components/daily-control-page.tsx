'use client';

import * as React from 'react';
import { Search, FilePenLine, Loader2, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import type { InventoryItem, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { useAppContext } from '@/context/app-context';

type FormValues = {
    search: string;
    physicalCount: string;
    systemCount: string;
};

function TimeAgo({ dateString }: { dateString: string | null }) {
    if (!dateString) {
      return null;
    }
    try {
      const date = new Date(dateString);
      const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: es });
      return (
        <div className="text-xs text-muted-foreground/80 mt-1">
          Actualizado {timeAgo}
        </div>
      );
    } catch (error) {
      return null;
    }
  }

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

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

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

  const branchInventoryItems = React.useMemo(() => {
    if (!selectedBranch) return [];
    return inventory.filter(item => item.branchId === selectedBranch);
  }, [inventory, selectedBranch]);

  const loggedInventory = React.useMemo(() => {
    if (!selectedBranch) return [];
    
    const branchInventory = inventory.filter(item => 
      item.branchId === selectedBranch &&
      (item.physicalCount > 0 || item.systemCount > 0 || item.lastUpdated)
    );

    const uniqueItems: InventoryItem[] = [];
    const seenCodes = new Set<string>();

    for (const item of branchInventory) {
      if (!seenCodes.has(item.code)) {
        uniqueItems.push(item);
        seenCodes.add(item.code);
      }
    }
    
    return uniqueItems.sort((a,b) => {
        if (a.lastUpdated && b.lastUpdated) {
            return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        }
        if (a.lastUpdated) return -1;
        if (b.lastUpdated) return 1;
        return a.description.localeCompare(b.description);
    });
  }, [inventory, selectedBranch]);

  const totalPages = Math.ceil(loggedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLoggedInventory = loggedInventory.slice(startIndex, endIndex);

  React.useEffect(() => {
      if (selectedBranch) {
          setCurrentPage(1);
      }
  }, [selectedBranch]);

  React.useEffect(() => {
      if (currentLoggedInventory.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
      }
  }, [currentLoggedInventory.length, currentPage]);

  const getPageNumbers = () => {
      if (totalPages <= 1) return [];
      const pageNumbers = [];
      const visiblePages = 5;

      if (totalPages <= visiblePages) {
          for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
          return pageNumbers;
      }
      
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage < 3) {
          startPage = 1;
          endPage = visiblePages;
      } else if (currentPage > totalPages - 2) {
          startPage = totalPages - visiblePages + 1;
          endPage = totalPages;
      }
      
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
      return pageNumbers;
  }
  const pageNumbers = getPageNumbers();


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
    if (!selectedBranch || branchInventoryItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay datos para exportar',
        description: 'Selecciona una sucursal con productos para generar la plantilla.',
      });
      return;
    }

    const branchName = branches.find(b => b.id === selectedBranch)?.name || 'sucursal';

    let csvContent = "data:text/csv;charset=utf-8,codigo,descripcion,fisico,sistema\n";

    const sortedInventory = [...branchInventoryItems].sort((a, b) => a.code.localeCompare(b.code));

    sortedInventory.forEach(item => {
      const row = [
        item.code,
        `"${item.description.replace(/"/g, '""')}"`,
        item.physicalCount,
        item.systemCount
      ].join(',');
      csvContent += row + "\n";
    });


    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `plantilla_conteo_${branchName.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
        title: 'Plantilla Generada',
        description: 'El archivo CSV con el inventario completo de la sucursal ha sido descargado.',
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
        
        const header = lines[0].toLowerCase().trim().replace(/"/g, '');
        const hasHeader = header.includes('codigo') && header.includes('descripcion') && header.includes('fisico') && header.includes('sistema');
        const startIndex = hasHeader ? 1 : 0;

        const updates: { code: string; physicalCount: number; systemCount: number; branchId: string }[] = [];
        let invalidLines = 0;

        const branchInventoryCodes = new Set(inventory.filter(i => i.branchId === selectedBranch).map(i => i.code));

        lines.slice(startIndex).forEach(line => {
            const columns = line.split(',');
            if (columns.length < 4) {
                invalidLines++;
                return;
            }

            const code = columns[0]?.trim();
            const physicalCount = parseInt(columns[2]?.trim(), 10);
            const systemCount = parseInt(columns[3]?.trim(), 10);
            
            if (code && !isNaN(physicalCount) && physicalCount >= 0 && !isNaN(systemCount) && systemCount >= 0 && branchInventoryCodes.has(code)) {
                updates.push({
                    code,
                    physicalCount,
                    systemCount,
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
                description: `${invalidLines} líneas del archivo CSV fueron omitidas por formato incorrecto, datos inválidos o código de producto inexistente en esta sucursal.`,
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
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FilePenLine className="h-5 w-5" />
              Registro de Inventario
            </CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleExport} disabled={branchInventoryItems.length === 0}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Descargar plantilla</span>
                </Button>
                <Button variant="outline" size="icon" onClick={handleImportClick} disabled={isImporting || !selectedBranch}>
                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="sr-only">Importar</span>
                </Button>
                <Input
                    type="file"
                    ref={importFileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".csv"
                />
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Select value={selectedBranch} onValueChange={(value) => {
                    setSelectedBranch(value);
                    setActiveProduct(null);
                    form.reset();
                }}
                disabled={branches.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione Sucursal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative" ref={searchContainerRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar producto..."
                        className="pl-10"
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
                            <span className="text-sm text-foreground">{product.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        type="number" 
                        placeholder="Fisico" 
                        {...form.register('physicalCount')}
                        disabled={!selectedBranch || !activeProduct}
                    />
                     <Input 
                        type="number"
                        placeholder="Sist" 
                        {...form.register('systemCount')}
                        disabled={!selectedBranch || !activeProduct}
                    />
                </div>

                <Button type="submit" className="w-full font-bold" size="lg" disabled={!selectedBranch || isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'REGISTRAR CONTEO'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>PRODUCTO</TableHead>
                    <TableHead className="text-right">FIS</TableHead>
                    <TableHead className="text-right">SIS</TableHead>
                    <TableHead className="text-right">DIF</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {currentLoggedInventory.length > 0 ? (
                    currentLoggedInventory.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                        <div className="font-medium">{item.description}</div>
                        <div className="text-sm text-muted-foreground">{item.code}</div>
                        <TimeAgo dateString={item.lastUpdated} />
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
                        {selectedBranch ? 'No hay registros hoy.' : 'Por favor, crea y selecciona una sucursal para empezar.'}
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            {totalPages > 1 && (
                <CardFooter>
                    <div className="flex w-full items-center justify-center pt-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="h-9 w-9"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {pageNumbers.map(page => (
                            <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'ghost'}
                                size="icon"
                                onClick={() => setCurrentPage(page)}
                                className="h-9 w-9"
                            >
                                {page}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="h-9 w-9"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    </div>
                </CardFooter>
            )}
        </Card>
      </div>
    </div>
  );
}
