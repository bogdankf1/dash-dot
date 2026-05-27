import { z } from 'zod';

// Per-lesson XP earned cannot exceed this. Matches the upper bound a legitimate
// run of calculateXP can produce (base + bonus + streak multiplier).
const MAX_XP_PER_LESSON = 1000;
// Lifetime cap for guest-claimed XP/streak passed through merge. Anything
// larger is treated as tampered and clamped at the server.
const MAX_GUEST_PROFILE_XP = 5_000_000;
const MAX_GUEST_STREAK = 3650;
// Defensive caps for snapshot arrays to prevent OOM/DoS on /api/progress/merge.
const MAX_MERGE_ARRAY_LENGTH = 1000;
const MAX_SYMBOL_LENGTH = 4;

export const saveProgressSchema = z.object({
  chapterId: z.string().min(1).max(100),
  lessonId: z.string().min(1).max(100),
  xpEarned: z.number().int().min(0).max(MAX_XP_PER_LESSON),
  accuracy: z.number().min(0).max(1),
  symbolResults: z
    .array(
      z.object({
        symbol: z.string().min(1).max(MAX_SYMBOL_LENGTH),
        correct: z.number().int().min(0).max(1000),
        attempts: z.number().int().min(1).max(1000),
        masteryLevel: z.number().int().min(0).max(3),
      })
    )
    .max(100),
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
    xp: z.number().int().min(0).max(MAX_GUEST_PROFILE_XP),
    streak: z.number().int().min(0).max(MAX_GUEST_STREAK),
    last_activity_date: z.string().nullable(),
    selected_guide: z.enum(['google', 'koch', 'alphabetical']),
  }),
  letterProgress: z
    .array(
      z.object({
        symbol: z.string().min(1).max(MAX_SYMBOL_LENGTH),
        mastery_level: z.number().int().min(0).max(3),
        correct_count: z.number().int().min(0).max(1_000_000),
        attempt_count: z.number().int().min(0).max(1_000_000),
        last_seen: z.string().nullable(),
      })
    )
    .max(MAX_MERGE_ARRAY_LENGTH),
  lessonHistory: z
    .array(
      z.object({
        chapter_id: z.string().min(1).max(100),
        lesson_id: z.string().min(1).max(100),
        xp_earned: z.number().int().min(0).max(MAX_XP_PER_LESSON),
        accuracy: z.number().min(0).max(1),
        completed_at: z.string(),
      })
    )
    .max(MAX_MERGE_ARRAY_LENGTH),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z
    .string()
    .url()
    .startsWith('https://')
    .max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});
