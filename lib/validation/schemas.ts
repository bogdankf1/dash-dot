import { z } from 'zod';

export const saveProgressSchema = z.object({
  chapterId: z.string(),
  lessonId: z.string(),
  xpEarned: z.number().int().min(0).max(10000),
  accuracy: z.number().min(0).max(1),
  symbolResults: z.array(
    z.object({
      symbol: z.string(),
      correct: z.number().int().min(0),
      attempts: z.number().int().min(0),
      masteryLevel: z.number().int().min(0).max(3),
    })
  ),
  timezoneOffset: z.number().int().min(-720).max(840).default(0),
});

export const updateProfileSchema = z
  .object({
    username: z.string().min(1).max(50).optional(),
    selected_guide: z.enum(['google', 'koch', 'alphabetical']).optional(),
  })
  .strict();
