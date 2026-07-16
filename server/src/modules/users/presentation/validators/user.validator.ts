import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  roleId: z.string({
    required_error: 'Role ID is required',
    invalid_type_error: 'Role ID must be a string',
  }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Role ID format'),
});
