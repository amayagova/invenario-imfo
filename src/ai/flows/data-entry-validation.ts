'use server';

/**
 * @fileOverview Data entry validation flow for inventory data.
 *
 * - validateInventoryData - A function that validates inventory data entries.
 * - ValidateInventoryDataInput - The input type for the validateInventoryData function.
 * - ValidateInventoryDataOutput - The return type for the validateInventoryData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateInventoryDataInputSchema = z.object({
  code: z.string().describe('The product code.'),
  description: z.string().describe('The product description.'),
  physicalCount: z.number().describe('The physical count of the product.'),
  systemCount: z.number().describe('The system count of the product.'),
  branch: z.string().describe('The branch or location of the inventory.'),
});
export type ValidateInventoryDataInput = z.infer<
  typeof ValidateInventoryDataInputSchema
>;

const ValidateInventoryDataOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the data entry is valid or not.'),
  errors: z.array(z.string()).describe('A list of validation errors, if any.'),
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
  prompt: `You are an AI assistant that validates inventory data entries.

  Analyze the following inventory data and determine if it is valid.
  Identify any potential errors or inconsistencies in the data.

  Product Code: {{{code}}}
  Description: {{{description}}}
  Physical Count: {{{physicalCount}}}
  System Count: {{{systemCount}}}
  Branch: {{{branch}}}

  Respond with a JSON object indicating whether the data is valid and a list of any errors found.
  Be concise and specific in your error messages.
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
