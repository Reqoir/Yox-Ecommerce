import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  roleId: z.string({
    required_error: 'Role ID is required',
    invalid_type_error: 'Role ID must be a string',
  }).min(1, 'Role ID cannot be empty'),
});
