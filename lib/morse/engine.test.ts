import { describe, it, expect } from 'vitest';
import {
  shuffle,
  calculateXP,
  calculatePracticeXP,
  updateMastery,
  generateLesson,
  generateWordLesson,
  generateDailyReviewLesson,
  generatePracticeSession,
} from './engine';
import type { LetterProgress } from '@/types';

describe('shuffle', () => {
  it('preserves length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(5);
  });

  it('contains all elements', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('handles empty array', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('handles single element', () => {
    expect(shuffle([42])).toEqual([42]);
  });
});

describe('calculateXP', () => {
  it('calculates base XP as correct * 10', () => {
    expect(calculateXP(5, 10, 0)).toBe(50);
  });

  it('adds accuracy bonus at >= 90%', () => {
    // 9 correct out of 10 = 90% accuracy → base 90 + bonus 50 = 140
    expect(calculateXP(9, 10, 0)).toBe(140);
  });

  it('does not add accuracy bonus below 90%', () => {
    // 8 correct out of 10 = 80% → base 80, no bonus
    expect(calculateXP(8, 10, 0)).toBe(80);
  });

  it('applies streak multiplier', () => {
    // 5 correct, 10 total, streak 5 → multiplier = 1.5
    // base 50, no bonus → 50 * 1.5 = 75
    expect(calculateXP(5, 10, 5)).toBe(75);
  });

  it('caps streak multiplier at 2.0x', () => {
    // streak 20 → 20 * 0.1 + 1 = 3.0, capped at 2.0
    // 5 correct → base 50 * 2.0 = 100
    expect(calculateXP(5, 10, 20)).toBe(100);
  });

  it('returns 0 when no correct answers', () => {
    expect(calculateXP(0, 10, 0)).toBe(0);
  });

  it('handles zero total', () => {
    expect(calculateXP(0, 0, 0)).toBe(0);
  });
});

describe('updateMastery', () => {
  it('promotes from 0 to 1', () => {
    expect(updateMastery(0, 0, 0)).toBe(1);
  });

  it('does not change if fewer than 5 attempts', () => {
    expect(updateMastery(1, 3, 4)).toBe(1);
  });

  it('promotes to 3 at >= 80% accuracy with 5+ attempts', () => {
    expect(updateMastery(1, 4, 5)).toBe(3);
  });

  it('sets to 2 below 80% accuracy with 5+ attempts', () => {
    expect(updateMastery(1, 3, 5)).toBe(2);
  });

  it('can demote from 3 to 2 if accuracy drops', () => {
    expect(updateMastery(3, 3, 5)).toBe(2);
  });
});

describe('generateLesson', () => {
  const emptyProgress: LetterProgress[] = [];

  it('starts with an introduce exercise', () => {
    const exercises = generateLesson(['E'], [], emptyProgress);
    expect(exercises[0].type).toBe('introduce');
    expect(exercises[0].symbol).toBe('E');
  });

  it('includes review symbols when provided', () => {
    const exercises = generateLesson(['E'], ['T', 'A'], emptyProgress);
    const reviewExercises = exercises.filter(
      (e) => e.symbol === 'T' || e.symbol === 'A'
    );
    expect(reviewExercises.length).toBeGreaterThan(0);
  });

  it('caps at 20 exercises', () => {
    const exercises = generateLesson(
      ['E', 'T', 'A', 'I'],
      ['N', 'M', 'S'],
      emptyProgress
    );
    expect(exercises.length).toBeLessThanOrEqual(20);
  });

  it('identify exercises include the correct answer in options', () => {
    const exercises = generateLesson(['E'], ['T', 'A', 'N'], emptyProgress);
    const identifyExercises = exercises.filter((e) => e.type === 'identify');
    for (const ex of identifyExercises) {
      expect(ex.options).toContain(ex.symbol);
    }
  });
});

describe('calculatePracticeXP', () => {
  it('uses a smaller multiplier than calculateXP (3x vs 10x base)', () => {
    expect(calculatePracticeXP(5, 10, 0)).toBe(15);
  });

  it('adds practice bonus of 15 at >= 90% accuracy', () => {
    // 9 correct out of 10 = 90% → base 27 + bonus 15 = 42
    expect(calculatePracticeXP(9, 10, 0)).toBe(42);
  });

  it('does not add bonus below 90% accuracy', () => {
    // 8 correct out of 10 = 80% → base 24, no bonus
    expect(calculatePracticeXP(8, 10, 0)).toBe(24);
  });

  it('applies streak multiplier', () => {
    // base 15, streak 5 → multiplier 1.5 → 22.5 → 23 (rounded)
    expect(calculatePracticeXP(5, 10, 5)).toBe(23);
  });

  it('caps streak multiplier at 2.0', () => {
    expect(calculatePracticeXP(5, 10, 100)).toBe(30);
  });

  it('returns 0 with no correct answers', () => {
    expect(calculatePracticeXP(0, 10, 0)).toBe(0);
  });

  it('always yields less XP than the equivalent lesson at low streak', () => {
    expect(calculatePracticeXP(9, 10, 0)).toBeLessThan(calculateXP(9, 10, 0));
  });
});

describe('generateWordLesson', () => {
  const emptyProgress: LetterProgress[] = [];

  it('returns at most 20 exercises', () => {
    const exercises = generateWordLesson(['E', 'T', 'A', 'O', 'I', 'N', 'S', 'R'], emptyProgress);
    expect(exercises.length).toBeLessThanOrEqual(20);
  });

  it('every word exercise carries a word string', () => {
    const exercises = generateWordLesson(['E', 'T', 'A', 'O', 'I', 'N', 'S', 'R'], emptyProgress);
    const wordExercises = exercises.filter((e) =>
      ['word-listen', 'word-encode', 'word-spell'].includes(e.type)
    );
    for (const ex of wordExercises) {
      expect(ex.word).toBeTruthy();
      expect(typeof ex.word).toBe('string');
    }
  });

  it('words only use the learned letters', () => {
    const learned = ['E', 'T', 'A', 'O', 'I', 'N'];
    const exercises = generateWordLesson(learned, emptyProgress);
    const wordExercises = exercises.filter((e) => e.word);
    for (const ex of wordExercises) {
      const wordLetters = ex.word!.toUpperCase().split('');
      for (const l of wordLetters) {
        expect(learned).toContain(l);
      }
    }
  });

  it('mixes in review exercises that target the learned letter pool', () => {
    const exercises = generateWordLesson(['E', 'T', 'A', 'O', 'I', 'N'], emptyProgress);
    const reviewExercises = exercises.filter((e) =>
      ['tap-recall', 'identify'].includes(e.type)
    );
    for (const ex of reviewExercises) {
      expect(['E', 'T', 'A', 'O', 'I', 'N']).toContain(ex.symbol);
    }
  });
});

describe('generateDailyReviewLesson', () => {
  const emptyProgress: LetterProgress[] = [];

  it('produces exactly 20 exercises', () => {
    const exercises = generateDailyReviewLesson(
      ['A', 'B', 'C', 'D', 'E'],
      ['F', 'G', 'H'],
      emptyProgress
    );
    expect(exercises).toHaveLength(20);
  });

  it('uses only review-style exercise types (no introduce / tap-assisted)', () => {
    const exercises = generateDailyReviewLesson(
      ['A', 'B', 'C', 'D', 'E'],
      ['F', 'G', 'H'],
      emptyProgress
    );
    const types = new Set(exercises.map((e) => e.type));
    expect(types.has('introduce')).toBe(false);
    expect(types.has('tap-assisted')).toBe(false);
  });

  it('only quizzes symbols from the primary symbol list', () => {
    const symbols = ['A', 'B', 'C'];
    const exercises = generateDailyReviewLesson(symbols, ['D', 'E'], emptyProgress);
    for (const ex of exercises) {
      expect(symbols).toContain(ex.symbol);
    }
  });

  it('identify-type exercises always include the correct symbol in options', () => {
    const exercises = generateDailyReviewLesson(['A', 'B', 'C', 'D'], ['E'], emptyProgress);
    for (const ex of exercises.filter((e) => e.type === 'identify')) {
      expect(ex.options).toContain(ex.symbol);
    }
  });
});

describe('generatePracticeSession', () => {
  const emptyProgress: LetterProgress[] = [];

  it('produces 20 exercises', () => {
    const exercises = generatePracticeSession(['A', 'B', 'C'], emptyProgress);
    expect(exercises).toHaveLength(20);
  });

  it('only quizzes the selected symbols', () => {
    const selected = ['A', 'B', 'C'];
    const exercises = generatePracticeSession(selected, emptyProgress);
    for (const ex of exercises) {
      expect(selected).toContain(ex.symbol);
    }
  });

  it('weighting reduces exercises for symbols with high accuracy', () => {
    const progress: LetterProgress[] = [
      // 'A' has perfect accuracy → low weight (just 0.1 baseline)
      { id: '1', user_id: 'u', symbol: 'A', mastery_level: 3, correct_count: 50, attempt_count: 50, last_seen: null },
      // 'B' has poor accuracy → high weight (~0.9 + 0.1)
      { id: '2', user_id: 'u', symbol: 'B', mastery_level: 1, correct_count: 5, attempt_count: 50, last_seen: null },
    ];
    // Run many trials; B should appear more often than A on average.
    const counts = { A: 0, B: 0 };
    for (let i = 0; i < 200; i++) {
      const exercises = generatePracticeSession(['A', 'B'], progress);
      for (const ex of exercises) {
        counts[ex.symbol as 'A' | 'B']++;
      }
    }
    expect(counts.B).toBeGreaterThan(counts.A);
  });
});

describe('updateMastery — additional edge cases', () => {
  it('keeps mastery 2 at exactly 80% with 5+ attempts (boundary)', () => {
    // 4/5 = 80% → promoted to 3 (boundary is inclusive of 0.8)
    expect(updateMastery(2, 4, 5)).toBe(3);
  });

  it('keeps mastery 3 at perfect accuracy', () => {
    expect(updateMastery(3, 10, 10)).toBe(3);
  });

  it('does not promote past 3', () => {
    const result = updateMastery(3, 100, 100);
    expect(result).toBe(3);
  });
});
