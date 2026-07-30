/**
 * @file notification.validator.ts
 * @layer Presentation › Validators
 */

import { z } from 'zod';

export const notificationListQuerySchema = z.object({
  type: z.enum(['LOW_STOCK', 'ORDER_STATUS', 'SYSTEM']).optional(),
  isRead: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});
