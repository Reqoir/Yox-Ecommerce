import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  roleId: z.string({
    required_error: 'Role ID is required',
    invalid_type_error: 'Role ID must be a string',
  }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Role ID format'),
});

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  phone: z.string().optional(),
  roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Role ID format'),
});
