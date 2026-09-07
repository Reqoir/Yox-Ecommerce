/**
 * @file address.validator.ts
 * @layer Presentation › Validators
 */

import { z } from 'zod';

export const createAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .regex(/^[\d\s+\-()]{7,20}$/, 'Phone number contains invalid characters'),
  street: z.string().trim().min(3, 'Street address must be at least 3 characters'),
  city: z.string().trim().min(2, 'City must be at least 2 characters'),
  state: z.string().trim().min(2, 'State must be at least 2 characters'),
  country: z.string().trim().min(2, 'Country is required'),
  zipCode: z.string().trim().min(3, 'Postal/ZIP code must be at least 3 characters'),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();
