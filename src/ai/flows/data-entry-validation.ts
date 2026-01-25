'use server';

/**
 * @fileOverview Flujo de validación de entrada de datos para datos de inventario.
 *
 * - validateInventoryData - Una función que valida las entradas de datos de inventario.
 * - ValidateInventoryDataInput - El tipo de entrada para la función validateInventoryData.
 * - ValidateInventoryDataOutput - El tipo de retorno para la función validateInventoryData.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateInventoryDataInputSchema = z.object({
  code: z.string().describe('El código del producto.'),
  description: z.string().describe('La descripción del producto.'),
  physicalCount: z.number().describe('El recuento físico del producto.'),
  systemCount: z.number().describe('El recuento del sistema del producto.'),
  branch: z.string().describe('La sucursal o ubicación del inventario.'),
});
export type ValidateInventoryDataInput = z.infer<
  typeof ValidateInventoryDataInputSchema
>;

const ValidateInventoryDataOutputSchema = z.object({
  isValid: z.boolean().describe('Si la entrada de datos es válida o no.'),
  errors: z.array(z.string()).describe('Una lista de errores de validación, si los hay.'),
});
export type ValidateInventoryDataOutput = z.infer<
  typeof ValidateInventoryDataOutputSchema
>;

export async function validateInventoryData(
  input: ValidateInventoryDataInput
): Promise<ValidateInventoryDataOutput> {
  return validateInventoryDataFlow(input);
}

const validateInventoryDataPrompt = ai.definePrompt({
  name: 'validateInventoryDataPrompt',
  input: {schema: ValidateInventoryDataInputSchema},
  output: {schema: ValidateInventoryDataOutputSchema},
  prompt: `Eres un asistente de IA que valida las entradas de datos de inventario.

  Analiza los siguientes datos de inventario y determina si son válidos.
  Identifica cualquier error o inconsistencia potencial en los datos.

  Código de Producto: {{{code}}}
  Descripción: {{{description}}}
  Recuento Físico: {{{physicalCount}}}
  Recuento del Sistema: {{{systemCount}}}
  Sucursal: {{{branch}}}

  Responde con un objeto JSON que indique si los datos son válidos y una lista de los errores encontrados.
  Sé conciso y específico en tus mensajes de error.
  `,
});

const validateInventoryDataFlow = ai.defineFlow(
  {
    name: 'validateInventoryDataFlow',
    inputSchema: ValidateInventoryDataInputSchema,
    outputSchema: ValidateInventoryDataOutputSchema,
  },
  async input => {
    const {output} = await validateInventoryDataPrompt(input);
    return output!;
  }
);
