'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, UploadCloud, FileUp, Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { PageHeader } from '@/components/page-header';

const productFormSchema = z.object({
  code: z.string().min(1, 'El código es requerido.'),
  description: z.string().min(1, 'La descripción es requerida.'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductMasterPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: '',
      description: '',
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    const upperCode = data.code.toUpperCase();
    if (products.some(p => p.code === upperCode)) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Ya existe un producto con ese código.',
        });
        return;
    }
    
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      code: upperCode,
      description: data.description.toUpperCase(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    toast({
      title: 'Producto Creado',
      description: `El producto "${newProduct.description}" ha sido creado.`,
    });
    form.reset();
  };

  const handleDelete = (productId: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== productId));
    toast({
      variant: 'destructive',
      title: 'Producto Eliminado',
      description: 'El producto ha sido eliminado del catálogo.',
    });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast({
        variant: 'destructive',
        title: 'Archivo no válido',
        description: 'Por favor, selecciona un archivo CSV.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const newProducts: Product[] = [];
      const existingCodes = new Set(products.map(p => p.code));

      lines.forEach((line, index) => {
        if (index === 0 && (line.toUpperCase().includes('CÓDIGO') || line.toUpperCase().includes('CODE'))) return;
        const [code, ...descriptionParts] = line.split(',');
        const description = descriptionParts.join(',').trim();
        const upperCode = code.trim().toUpperCase();

        if (upperCode && description && !existingCodes.has(upperCode)) {
          newProducts.push({
            id: `product-${Date.now()}-${index}`,
            code: upperCode,
            description: description.toUpperCase(),
          });
          existingCodes.add(upperCode);
        }
      });
      
      if(newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        toast({
          title: 'Importación Exitosa',
          description: `${newProducts.length} productos fueron importados.`,
        });
      } else {
        toast({
            variant: 'destructive',
            title: 'Importación Fallida',
            description: 'No se encontraron nuevos productos o el formato es incorrecto.',
          });
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  };
  
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,CÓDIGO,DESCRIPCIÓN\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination calculations
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [products, currentPage, totalPages]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeader title="Maestro Productos" />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus />
              Alta Manual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">CÓDIGO</FormLabel>
                      <FormControl>
                        <Input placeholder="EAN-13, SKU..." {...field} className="uppercase"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">DESCRIPCIÓN</FormLabel>
                      <FormControl>
                        <Input placeholder="NOMBRE DEL PRODUCTO" {...field} className="uppercase"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg">
                  Registrar en Catálogo
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="flex flex-col bg-primary/10 text-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
                Carga Masiva CSV
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-2">
                Importa todo tu catálogo de productos en segundos. El sistema mapeará automáticamente las columnas de tu archivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow justify-between">
            <div className="flex items-center justify-center">
                <UploadCloud className="h-24 w-24 text-primary/30 animate-cloud-float" />
            </div>
            <div className="flex flex-col gap-4">
                <Button onClick={handleFileSelect} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" size="lg">
                    <FileUp className="mr-2 h-4 w-4" />
                    Seleccionar Archivo CSV
                </Button>
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".csv"
                />
                <Button onClick={handleDownloadTemplate} variant="outline" className="border-primary/50 text-foreground hover:bg-primary/20" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Plantilla Modelo
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Maestro de Inventario ({products.length})</CardTitle>
            <span className="text-sm text-muted-foreground">
              {totalPages > 0 ? `PÁGINA ${currentPage} DE ${totalPages}` : 'PÁGINA 1 DE 1'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CÓDIGO DE BARRAS / SKU</TableHead>
                <TableHead>NOMBRE DEL PRODUCTO</TableHead>
                <TableHead className="text-right">GESTIÓN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.code}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay productos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter>
            <div className="flex w-full items-center justify-between pt-6 text-sm text-muted-foreground">
              <div>
                Mostrando {Math.min(startIndex + 1, products.length)} a {Math.min(endIndex, products.length)} de {products.length} productos.
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
