/**
 * @file role.validator.ts
 * @layer Presentation › Validators
 */

import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).optional(),
});
