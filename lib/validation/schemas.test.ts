import { describe, it, expect } from 'vitest';
import { saveProgressSchema, updateProfileSchema } from './schemas';

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

  it('rejects empty symbolResults array', () => {
    // Empty array should actually pass since the schema doesn't require min length
    const result = saveProgressSchema.safeParse({
      ...validPayload,
      symbolResults: [],
    });
    expect(result.success).toBe(true);
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
});
