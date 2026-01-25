
'use server';

import {
  validateInventoryData,
  type ValidateInventoryDataInput,
  type ValidateInventoryDataOutput,
} from '@/ai/flows/data-entry-validation';

export async function validateInventoryAction(
  data: ValidateInventoryDataInput
): Promise<ValidateInventoryDataOutput> {
  // The react-hook-form schema will coerce strings to numbers,
  // so we can expect the correct types here.
  const result = await validateInventoryData(data);
  return result;
}
