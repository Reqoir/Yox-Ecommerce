import { z } from 'zod';

export const reportQuerySchema = z.object({
  startDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid startDate format',
  }),
  endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid endDate format',
  }),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  format: z.enum(['json', 'csv']).default('json'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (start > end) return false;
    // Restrict query range to max 365 days for safety
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) return false;
  }
  return true;
}, {
  message: 'startDate must be before or equal to endDate, and range cannot exceed 365 days',
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
