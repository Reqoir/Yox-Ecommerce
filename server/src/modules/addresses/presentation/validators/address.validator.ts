/**
 * @file address.validator.ts
 * @layer Presentation › Validators
 */

import { z } from 'zod';

export const createAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be valid'),
  street: z.string().min(5, 'Street address must be valid'),
  city: z.string().min(2, 'City must be valid'),
  state: z.string().min(2, 'State must be valid'),
  country: z.string().min(2, 'Country must be valid'),
  zipCode: z.string().min(4, 'Zip code must be valid'),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();
