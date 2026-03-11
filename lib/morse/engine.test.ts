import { describe, it, expect } from 'vitest';
import { shuffle, calculateXP, updateMastery, generateLesson } from './engine';
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
