import { z } from 'zod';

// Card schema (max 3 cards)
const cardSchema = z.object({
  cardTitle: z.string().min(1, 'Card title is required').max(100, 'Card title too long'),
  cardSubtitle: z.string().min(1, 'Card subtitle is required').max(200, 'Card subtitle too long'),
});

// Update entire story schema
export const updateStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  subtitle: z.string().max(200, 'Subtitle too long').optional(),
  storyTitle: z.string().min(1, 'Story title is required').max(150, 'Story title too long').optional(),
  storySubtitle: z.string().max(200, 'Story subtitle too long').optional(),
  cards: z.array(cardSchema)
    .min(1, 'At least one card is required')
    .max(3, 'Maximum 3 cards allowed')
    .optional(),
});

// Update only cards schema
export const updateCardsSchema = z.object({
  cards: z.array(cardSchema)
    .min(1, 'At least one card is required')
    .max(3, 'Maximum 3 cards allowed'),
});

// Update only story content schema (without text and image)
export const updateStoryContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  subtitle: z.string().max(200, 'Subtitle too long').optional(),
  storyTitle: z.string().min(1, 'Story title is required').max(150, 'Story title too long').optional(),
  storySubtitle: z.string().max(200, 'Story subtitle too long').optional(),
});

export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type UpdateCardsInput = z.infer<typeof updateCardsSchema>;
export type UpdateStoryContentInput = z.infer<typeof updateStoryContentSchema>;
export type Card = z.infer<typeof cardSchema>;