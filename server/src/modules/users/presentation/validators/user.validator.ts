import { z } from 'zod';

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/,
    'Password must contain an uppercase letter, a lowercase letter, a number, and a special character'
  );

export const updateUserRoleSchema = z.object({
  roleId: z.string({
    required_error: 'Role ID is required',
    invalid_type_error: 'Role ID must be a string',
  }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Role ID format'),
  email: z.string().email('Invalid email address').optional(),
});

export const resetStaffPasswordSchema = z.object({
  password: strongPasswordSchema,
});

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: strongPasswordSchema.optional(),
  phone: z.string({ required_error: 'Contact mobile phone number is required' }).min(10, 'A valid 10-digit mobile phone number is required'),
  roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Role ID format'),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be ACTIVE, INACTIVE, or SUSPENDED',
  }),
});

export const updateStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'A valid 10-digit mobile phone number is required').optional(),
  roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Role ID format').optional(),
});

