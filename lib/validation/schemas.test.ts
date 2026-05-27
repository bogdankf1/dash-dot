import { describe, it, expect } from 'vitest';
import {
  saveProgressSchema,
  updateProfileSchema,
  mergeSnapshotSchema,
  pushSubscriptionSchema,
} from './schemas';

describe('saveProgressSchema', () => {
  const validPayload = {
    chapterId: 'ch-1',
    lessonId: 'l-1',
    xpEarned: 100,
    accuracy: 0.85,
    symbolResults: [
      { symbol: 'E', correct: 3, attempts: 4, masteryLevel: 2 },
    ],
  };

  it('accepts valid payload', () => {
    const result = saveProgressSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects negative xpEarned', () => {
    const result = saveProgressSchema.safeParse({
      ...validPayload,
      xpEarned: -10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects accuracy greater than 1', () => {
    const result = saveProgressSchema.safeParse({
      ...validPayload,
      accuracy: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid mastery level', () => {
    const result = saveProgressSchema.safeParse({
      ...validPayload,
      symbolResults: [
        { symbol: 'E', correct: 3, attempts: 4, masteryLevel: 5 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts an empty symbolResults array', () => {
    const result = saveProgressSchema.safeParse({
      ...validPayload,
      symbolResults: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects xpEarned above the per-lesson cap', () => {
    const result = saveProgressSchema.safeParse({
      ...validPayload,
      xpEarned: 999_999,
    });
    expect(result.success).toBe(false);
  });

  it('rejects attempts of 0 (a recorded symbol must have at least one attempt)', () => {
    const result = saveProgressSchema.safeParse({
      ...validPayload,
      symbolResults: [{ symbol: 'E', correct: 0, attempts: 0, masteryLevel: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects symbolResults arrays larger than 100', () => {
    const big = Array.from({ length: 101 }, () => ({
      symbol: 'E',
      correct: 1,
      attempts: 1,
      masteryLevel: 1,
    }));
    const result = saveProgressSchema.safeParse({ ...validPayload, symbolResults: big });
    expect(result.success).toBe(false);
  });

  it('accepts valid timezoneOffset', () => {
    const result = saveProgressSchema.safeParse({
      ...validPayload,
      timezoneOffset: -300,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timezoneOffset).toBe(-300);
    }
  });

  it('rejects timezoneOffset outside [-720, 840]', () => {
    expect(
      saveProgressSchema.safeParse({ ...validPayload, timezoneOffset: -721 }).success
    ).toBe(false);
    expect(
      saveProgressSchema.safeParse({ ...validPayload, timezoneOffset: 841 }).success
    ).toBe(false);
  });

  it('defaults timezoneOffset to 0 when omitted', () => {
    const result = saveProgressSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timezoneOffset).toBe(0);
    }
  });
});

describe('updateProfileSchema', () => {
  it('accepts valid payload', () => {
    const result = updateProfileSchema.safeParse({
      username: 'alice',
      selected_guide: 'google',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid guide value', () => {
    const result = updateProfileSchema.safeParse({
      selected_guide: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields due to strict()', () => {
    const result = updateProfileSchema.safeParse({
      username: 'alice',
      hackerField: 'drop table',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty username', () => {
    const result = updateProfileSchema.safeParse({
      username: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts partial updates', () => {
    const result = updateProfileSchema.safeParse({
      selected_guide: 'koch',
    });
    expect(result.success).toBe(true);
  });

  it('rejects username longer than 50 characters', () => {
    const result = updateProfileSchema.safeParse({
      username: 'a'.repeat(51),
    });
    expect(result.success).toBe(false);
  });
});

describe('mergeSnapshotSchema', () => {
  const validSnapshot = {
    profile: {
      xp: 100,
      streak: 3,
      last_activity_date: '2026-05-27',
      selected_guide: 'google' as const,
    },
    letterProgress: [
      { symbol: 'E', mastery_level: 2, correct_count: 5, attempt_count: 7, last_seen: null },
    ],
    lessonHistory: [
      {
        chapter_id: 'google-ch1',
        lesson_id: 'google-ch1-L1',
        xp_earned: 50,
        accuracy: 0.85,
        completed_at: '2026-05-27T10:00:00Z',
      },
    ],
  };

  it('accepts a valid snapshot', () => {
    const result = mergeSnapshotSchema.safeParse(validSnapshot);
    expect(result.success).toBe(true);
  });

  it('rejects letterProgress arrays larger than 1000 (DoS guard)', () => {
    const huge = Array.from({ length: 1001 }, (_, i) => ({
      symbol: String(i % 26),
      mastery_level: 1,
      correct_count: 1,
      attempt_count: 1,
      last_seen: null,
    }));
    const result = mergeSnapshotSchema.safeParse({ ...validSnapshot, letterProgress: huge });
    expect(result.success).toBe(false);
  });

  it('rejects lessonHistory arrays larger than 1000', () => {
    const huge = Array.from({ length: 1001 }, () => ({
      chapter_id: 'c',
      lesson_id: 'l',
      xp_earned: 1,
      accuracy: 1,
      completed_at: '2026-05-27T10:00:00Z',
    }));
    const result = mergeSnapshotSchema.safeParse({ ...validSnapshot, lessonHistory: huge });
    expect(result.success).toBe(false);
  });

  it('rejects per-lesson xp_earned above the cap (XP-fraud guard)', () => {
    const result = mergeSnapshotSchema.safeParse({
      ...validSnapshot,
      lessonHistory: [{ ...validSnapshot.lessonHistory[0], xp_earned: 999_999 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects profile.xp above the lifetime cap', () => {
    const result = mergeSnapshotSchema.safeParse({
      ...validSnapshot,
      profile: { ...validSnapshot.profile, xp: 10_000_000 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects implausibly long streaks', () => {
    const result = mergeSnapshotSchema.safeParse({
      ...validSnapshot,
      profile: { ...validSnapshot.profile, streak: 4000 },
    });
    expect(result.success).toBe(false);
  });

  it('accepts null last_activity_date (never-played guest)', () => {
    const result = mergeSnapshotSchema.safeParse({
      ...validSnapshot,
      profile: { ...validSnapshot.profile, last_activity_date: null, streak: 0, xp: 0 },
    });
    expect(result.success).toBe(true);
  });
});

describe('pushSubscriptionSchema', () => {
  const valid = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
  };

  it('accepts a valid HTTPS subscription', () => {
    expect(pushSubscriptionSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects http:// endpoints (push spec requires HTTPS)', () => {
    const result = pushSubscriptionSchema.safeParse({
      ...valid,
      endpoint: 'http://fcm.googleapis.com/fcm/send/abc123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing keys', () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: valid.endpoint,
      keys: { p256dh: '', auth: 'auth' },
    });
    expect(result.success).toBe(false);
  });
});
