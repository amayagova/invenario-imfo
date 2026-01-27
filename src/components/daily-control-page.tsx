'use client';

import * as React from 'react';
import { Search, FilePenLine, Loader2 } from 'lucide-react';
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
  const { branches, products, inventory, updateInventoryCount } = useAppContext();
  const [selectedBranch, setSelectedBranch] = React.useState<string>('');
  const [activeProduct, setActiveProduct] = React.useState<InventoryItem | null>(null);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
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
              <Select value={selectedBranch} onValueChange={(value) => {
                  setSelectedBranch(value);
                  setActiveProduct(null);
                  form.reset();
              }}
              disabled={branches.length === 0}
              >
                <SelectTrigger className="w-full md:w-[240px]">
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
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="relative md:col-span-5" ref={searchContainerRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="BUSCAR POR CÓDIGO O DESCRIPCIÓN DEL PRODUCTO"
                        className="pl-10 h-11 text-base uppercase"
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
                <div className="md:col-span-2">
                    <Input 
                        type="number" 
                        placeholder="Físico" 
                        className="h-11 text-base"
                        {...form.register('physicalCount')}
                        disabled={!selectedBranch || !activeProduct}
                    />
                </div>
                <div className="md:col-span-2">
                     <Input 
                        type="number"
                        placeholder="Sistema" 
                        className="h-11 text-base"
                        {...form.register('systemCount')}
                        disabled={!selectedBranch || !activeProduct}
                    />
                </div>
                <div className="md:col-span-3">
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
