/**
 * @file auth.validator.ts
 * @layer Presentation › Validators
 * 
 * Zod schemas for validating Auth-related incoming requests.
 */

import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const resetPasswordPhoneVerifySchema = z.object({
  phone: z.string().min(10, 'Valid mobile number is required').max(20),
  verificationToken: z.string().min(1, 'Mobile verification token is required'),
});

export const resetPasswordPhoneConfirmSchema = z.object({
  resetToken: z.string().min(1, 'Reset session token is required'),
  userId: z.string().min(1, 'Account selection is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/,
      'Password must contain an uppercase letter, a lowercase letter, a number, and a special character'
    ),
});


export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address').max(255).optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/,
        'Password must contain an uppercase letter, a lowercase letter, a number, and a special character'
      ),
    phone: z.string().optional().or(z.literal('')),
    verificationToken: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const hasEmail = Boolean(data.email && data.email.trim());
      const hasPhone = Boolean(data.phone && data.phone.trim());
      return hasEmail || hasPhone;
    },
    {
      message: 'Please provide either an email address or mobile number',
      path: ['email'],
    }
  );

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or mobile number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const loginPhoneSchema = z.object({
  phone: z.string().min(10, 'Valid mobile number is required').max(20),
  verificationToken: z.string().min(1, 'Mobile verification token is required'),
});

export const loginPhoneSelectSchema = z.object({
  selectionToken: z.string().min(1, 'Selection token is required'),
  userId: z.string().min(1, 'Account selection ID is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/,
      'Password must contain an uppercase letter, a lowercase letter, a number, and a special character'
    ),
  confirmPassword: z.string().optional(),
});

