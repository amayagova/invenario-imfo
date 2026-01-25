'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateInventoryAction } from '@/lib/actions';
import type { Branch, InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  physicalCount: z.coerce.number().min(0, 'El recuento no puede ser negativo'),
  systemCount: z.coerce.number().min(0, 'El recuento no puede ser negativo'),
  unitType: z.enum(['units', 'cases'], {
    required_error: 'Debes seleccionar un tipo de unidad.',
  }),
  branchId: z.string({ required_error: 'Por favor, selecciona una sucursal.' }),
});

type AddInventoryFormProps = {
  branches: Branch[];
  onAddItem: (newItem: InventoryItem) => void;
  onFinished: () => void;
};

export function AddInventoryForm({ branches, onAddItem, onFinished }: AddInventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [apiErrors, setApiErrors] = React.useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      description: '',
      physicalCount: 0,
      systemCount: 0,
      unitType: 'units',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setApiErrors([]);

    const validationResult = await validateInventoryAction(values);

    if (!validationResult.isValid) {
      setApiErrors(validationResult.errors);
      setIsSubmitting(false);
      return;
    }

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      ...values,
    };

    onAddItem(newItem);
    toast({
      title: '¡Éxito!',
      description: 'Se ha añadido el nuevo artículo al inventario.',
    });
    form.reset();
    onFinished();
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        {apiErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de Validación</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5">
                {apiErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Producto</FormLabel>
              <FormControl>
                <Input placeholder="p.ej. SKU-006" {...field} />
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
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe el producto..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="systemCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recuento del Sistema</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="physicalCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recuento Físico</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sucursal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una sucursal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Unidad</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="units" />
                    </FormControl>
                    <FormLabel className="font-normal">Unidades</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="cases" />
                    </FormControl>
                    <FormLabel className="font-normal">Cajas</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Añadir Artículo
          </Button>
        </div>
      </form>
    </Form>
  );
}
