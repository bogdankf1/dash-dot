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

export const mergeSnapshotSchema = z.object({
  profile: z.object({
    xp: z.number().int().min(0),
    streak: z.number().int().min(0),
    last_activity_date: z.string().nullable(),
    selected_guide: z.enum(['google', 'koch', 'alphabetical']),
  }),
  letterProgress: z.array(
    z.object({
      symbol: z.string(),
      mastery_level: z.number().int().min(0).max(3),
      correct_count: z.number().int().min(0),
      attempt_count: z.number().int().min(0),
      last_seen: z.string().nullable(),
    })
  ),
  lessonHistory: z.array(
    z.object({
      chapter_id: z.string(),
      lesson_id: z.string(),
      xp_earned: z.number().int().min(0),
      accuracy: z.number().min(0).max(1),
      completed_at: z.string(),
    })
  ),
});
