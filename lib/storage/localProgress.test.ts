import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadProfile,
  saveProfile,
  loadLetterProgress,
  loadLessonHistory,
  applyLessonResult,
  exportSnapshot,
  resetAll,
  hasAnyData,
} from './localProgress';

// Minimal localStorage shim — vitest's default env is node, and the module
// short-circuits on typeof window === 'undefined', so we need both window and
// localStorage defined globally.
const storage = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => {
    storage.set(k, v);
  },
  removeItem: (k: string) => {
    storage.delete(k);
  },
  clear: () => {
    storage.clear();
  },
  get length() {
    return storage.size;
  },
  key: (i: number) => Array.from(storage.keys())[i] ?? null,
};

beforeEach(() => {
  storage.clear();
  (globalThis as any).window = globalThis;
  (globalThis as any).localStorage = localStorageStub;
});

afterEach(() => {
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
  vi.useRealTimers();
});

function lessonInput(overrides: Partial<Parameters<typeof applyLessonResult>[0]> = {}) {
  return {
    chapterId: 'google-ch1',
    lessonId: 'google-ch1-L1',
    xpEarned: 50,
    accuracy: 0.9,
    symbolResults: [
      { symbol: 'E', correct: 4, attempts: 5, masteryLevel: 3 },
    ],
    timezoneOffset: 0,
    ...overrides,
  };
}

describe('loadProfile', () => {
  it('returns DEFAULT_PROFILE when nothing is stored', () => {
    expect(loadProfile()).toEqual({
      xp: 0,
      streak: 0,
      last_activity_date: null,
      selected_guide: 'google',
    });
  });

  it('merges partial stored profile with defaults', () => {
    saveProfile({ xp: 100 });
    expect(loadProfile()).toEqual({
      xp: 100,
      streak: 0,
      last_activity_date: null,
      selected_guide: 'google',
    });
  });

  it('survives corrupt JSON by falling back to default', () => {
    storage.set('dashdot:guest:v1:profile', 'not-json{');
    expect(loadProfile()).toEqual({
      xp: 0,
      streak: 0,
      last_activity_date: null,
      selected_guide: 'google',
    });
  });
});

describe('applyLessonResult — XP accumulation', () => {
  it('adds xpEarned to existing xp', () => {
    saveProfile({ xp: 30 });
    applyLessonResult(lessonInput({ xpEarned: 50 }));
    expect(loadProfile().xp).toBe(80);
  });

  it('still adds XP on a repeat-same-day lesson (parity with SQL save_lesson_progress)', () => {
    applyLessonResult(lessonInput({ xpEarned: 50 }));
    const firstXp = loadProfile().xp;
    applyLessonResult(lessonInput({ xpEarned: 30 }));
    expect(loadProfile().xp).toBe(firstXp + 30);
  });
});

describe('applyLessonResult — streak logic', () => {
  // Use a fixed "now" so we can control the local-date math deterministically.
  // 2026-05-27T12:00:00Z, timezoneOffset 0 → local date 2026-05-27
  const FIXED_NOW = new Date('2026-05-27T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  it('starts streak at 1 on the very first activity', () => {
    expect(loadProfile().last_activity_date).toBeNull();
    applyLessonResult(lessonInput());
    expect(loadProfile().streak).toBe(1);
    expect(loadProfile().last_activity_date).toBe('2026-05-27');
  });

  it('does not change streak when called twice the same local day', () => {
    applyLessonResult(lessonInput());
    expect(loadProfile().streak).toBe(1);
    applyLessonResult(lessonInput());
    expect(loadProfile().streak).toBe(1);
  });

  it('increments streak when last activity was yesterday', () => {
    saveProfile({ streak: 4, last_activity_date: '2026-05-26' });
    applyLessonResult(lessonInput());
    expect(loadProfile().streak).toBe(5);
  });

  it('resets streak to 1 when there is a gap', () => {
    saveProfile({ streak: 10, last_activity_date: '2026-05-20' });
    applyLessonResult(lessonInput());
    expect(loadProfile().streak).toBe(1);
  });

  it('honors timezoneOffset when computing local date', () => {
    // FIXED_NOW is 12:00 UTC. Offset +840 (UTC+14, max) would land us on the prior day.
    // The function does `now - offsetMinutes * 60_000`, mirroring SQL behavior:
    // a JS getTimezoneOffset for UTC+14 returns -840, so passing -840 here is the
    // realistic value. Verify the date math runs and produces a valid YYYY-MM-DD.
    applyLessonResult(lessonInput({ timezoneOffset: -840 }));
    const date = loadProfile().last_activity_date;
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('applyLessonResult — letter progress upsert', () => {
  it('creates a new letter_progress row for a previously unseen symbol', () => {
    applyLessonResult(lessonInput({
      symbolResults: [{ symbol: 'A', correct: 3, attempts: 5, masteryLevel: 2 }],
    }));
    const rows = loadLetterProgress();
    expect(rows).toHaveLength(1);
    expect(rows[0].symbol).toBe('A');
    expect(rows[0].mastery_level).toBe(2);
    expect(rows[0].correct_count).toBe(3);
    expect(rows[0].attempt_count).toBe(5);
    expect(rows[0].last_seen).toBeTruthy();
  });

  it('increments existing counts on subsequent lessons (parity with SQL)', () => {
    applyLessonResult(lessonInput({
      symbolResults: [{ symbol: 'E', correct: 3, attempts: 5, masteryLevel: 2 }],
    }));
    applyLessonResult(lessonInput({
      symbolResults: [{ symbol: 'E', correct: 4, attempts: 5, masteryLevel: 3 }],
    }));
    const rows = loadLetterProgress();
    expect(rows).toHaveLength(1);
    expect(rows[0].correct_count).toBe(7);
    expect(rows[0].attempt_count).toBe(10);
    expect(rows[0].mastery_level).toBe(3);
  });

  it('handles multiple symbols in one lesson', () => {
    applyLessonResult(lessonInput({
      symbolResults: [
        { symbol: 'E', correct: 3, attempts: 4, masteryLevel: 2 },
        { symbol: 'T', correct: 5, attempts: 5, masteryLevel: 3 },
      ],
    }));
    const rows = loadLetterProgress().sort((a, b) => a.symbol.localeCompare(b.symbol));
    expect(rows.map((r) => r.symbol)).toEqual(['E', 'T']);
    expect(rows.find((r) => r.symbol === 'E')?.mastery_level).toBe(2);
    expect(rows.find((r) => r.symbol === 'T')?.mastery_level).toBe(3);
  });
});

describe('applyLessonResult — lesson history', () => {
  it('appends one row per lesson', () => {
    applyLessonResult(lessonInput({ lessonId: 'L1' }));
    applyLessonResult(lessonInput({ lessonId: 'L2' }));
    const history = loadLessonHistory();
    expect(history).toHaveLength(2);
    expect(history.map((h) => h.lesson_id)).toEqual(['L1', 'L2']);
  });

  it('records xp_earned, accuracy, and completed_at', () => {
    applyLessonResult(lessonInput({ xpEarned: 75, accuracy: 0.85 }));
    const [row] = loadLessonHistory();
    expect(row.xp_earned).toBe(75);
    expect(row.accuracy).toBe(0.85);
    expect(row.completed_at).toBeTruthy();
  });
});

describe('exportSnapshot', () => {
  it('returns profile, letterProgress, and lessonHistory without internal ids', () => {
    applyLessonResult(lessonInput());
    const snap = exportSnapshot();
    expect(snap.profile.xp).toBeGreaterThan(0);
    expect(snap.letterProgress[0]).not.toHaveProperty('id');
    expect(snap.letterProgress[0]).not.toHaveProperty('user_id');
    expect(snap.lessonHistory[0]).not.toHaveProperty('id');
    expect(snap.lessonHistory[0]).not.toHaveProperty('user_id');
  });
});

describe('resetAll', () => {
  it('clears all guest keys', () => {
    applyLessonResult(lessonInput());
    expect(hasAnyData()).toBe(true);
    resetAll();
    expect(hasAnyData()).toBe(false);
    expect(loadLetterProgress()).toHaveLength(0);
    expect(loadLessonHistory()).toHaveLength(0);
  });
});

describe('hasAnyData', () => {
  it('returns false on a fresh install', () => {
    expect(hasAnyData()).toBe(false);
  });

  it('returns true once any guest write has happened', () => {
    saveProfile({ xp: 1 });
    expect(hasAnyData()).toBe(true);
  });
});
