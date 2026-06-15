import { z } from 'zod';

export const createFAQSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(500, 'Question too long'),
  answer: z.string().min(10, 'Answer must be at least 10 characters').max(5000, 'Answer too long'),
  order: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateFAQSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(500, 'Question too long').optional(),
  answer: z.string().min(10, 'Answer must be at least 10 characters').max(5000, 'Answer too long').optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const getFAQsQuerySchema = z.object({
  page: z.string().optional().transform(Number).default(1),
  limit: z.string().optional().transform(Number).default(10),
  isActive: z.string().optional().transform(val => val === 'true'),
  search: z.string().optional(),
});

export type CreateFAQInput = z.infer<typeof createFAQSchema>;
export type UpdateFAQInput = z.infer<typeof updateFAQSchema>;
export type GetFAQsQueryInput = z.infer<typeof getFAQsQuerySchema>;