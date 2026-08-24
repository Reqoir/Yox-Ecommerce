import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordRequestDTO = z.infer<typeof forgotPasswordSchema>;
