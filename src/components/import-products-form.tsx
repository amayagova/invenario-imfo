'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Branch, InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  products: z.string().min(1, 'La lista de productos no puede estar vacía.'),
});

type ImportProductsFormProps = {
  branches: Branch[];
  onImportItems: (newItems: InventoryItem[]) => void;
  onFinished: () => void;
};

export function ImportProductsForm({
  branches,
  onImportItems,
  onFinished,
}: ImportProductsFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      products: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    const { products } = values;

    const lines = products.split('\n').filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error de importación',
        description: 'No se encontraron productos para importar.',
      });
      setIsSubmitting(false);
      return;
    }

    const parsedLines = lines.map((line) => {
        const [code, ...descriptionParts] = line.split(',');
        const description = descriptionParts.join(',').trim();
        if (!code || !description) {
          return null;
        }
        return { code: code.trim(), description };
      });
      
    const validProducts = parsedLines.filter((p): p is {code: string, description: string} => p !== null);

    if (validProducts.length !== lines.length) {
      toast({
        variant: 'destructive',
        title: 'Error de formato',
        description:
          'Algunas líneas no tenían el formato correcto (código,descripción) y fueron omitidas.',
      });
    }

    const newItems: InventoryItem[] = validProducts.flatMap(({ code, description }) => 
        branches.map(branch => ({
            id: `item-${Date.now()}-${branch.id}-${code}`,
            code,
            description,
            physicalCount: 0,
            systemCount: 0,
            unitType: 'units',
            branchId: branch.id,
        }))
    );
    
    if (newItems.length > 0) {
      onImportItems(newItems);
    }

    form.reset();
    onFinished();
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="products"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lista de Productos (CSV)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="SKU001,Producto 1&#10;SKU002,Producto 2"
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar Artículos
          </Button>
        </div>
      </form>
    </Form>
  );
}
