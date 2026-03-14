import { MORSE_MAP } from './codes';
import { getWordsForLesson } from './words';
import type { LetterProgress, MasteryLevel } from '@/types';

export type ExerciseType =
  | 'introduce'
  | 'tap-assisted'
  | 'tap-recall'
  | 'identify'
  | 'translate'
  | 'word-listen'
  | 'word-encode'
  | 'word-spell';

export interface Exercise {
  type: ExerciseType;
  symbol: string;
  word?: string;
  options?: string[];
  showPattern: boolean;
  showMnemonic: boolean;
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandomOptions(
  correct: string,
  pool: string[],
  count: number
): string[] {
  let filtered = pool.filter((s) => s !== correct);
  // If pool is too small, pad with random letters from the full alphabet
  if (filtered.length < count) {
    const allSymbols = Object.keys(MORSE_MAP).filter((s) => s !== correct && !filtered.includes(s));
    filtered = [...filtered, ...shuffle(allSymbols).slice(0, count - filtered.length)];
  }
  const shuffled = shuffle(filtered);
  const wrong = shuffled.slice(0, count);
  return shuffle([correct, ...wrong]);
}

export function generateLesson(
  newSymbols: string[],
  reviewSymbols: string[],
  letterProgress: LetterProgress[]
): Exercise[] {
  const progressMap = new Map<string, LetterProgress>();
  for (const lp of letterProgress) {
    progressMap.set(lp.symbol, lp);
  }

  const allKnown = [...newSymbols, ...reviewSymbols];
  const newExercises: Exercise[][] = [];

  for (const symbol of newSymbols) {
    const symbolExercises: Exercise[] = [];

    symbolExercises.push({
      type: 'introduce',
      symbol,
      showPattern: true,
      showMnemonic: true,
    });

    symbolExercises.push({
      type: 'tap-assisted',
      symbol,
      showPattern: true,
      showMnemonic: false,
    });

    symbolExercises.push({
      type: 'tap-recall',
      symbol,
      showPattern: false,
      showMnemonic: false,
    });

    const options = pickRandomOptions(symbol, allKnown, 3);
    symbolExercises.push({
      type: 'identify',
      symbol,
      options,
      showPattern: false,
      showMnemonic: false,
    });

    symbolExercises.push({
      type: 'translate',
      symbol,
      showPattern: false,
      showMnemonic: false,
    });

    newExercises.push(symbolExercises);
  }

  const reviewPool: Exercise[] = [];
  const weightedReview = reviewSymbols.map((symbol) => {
    const progress = progressMap.get(symbol);
    const errorRate =
      progress && progress.attempt_count > 0
        ? 1 - progress.correct_count / progress.attempt_count
        : 0.5;
    return { symbol, weight: errorRate + 0.1 };
  });

  const totalWeight = weightedReview.reduce((sum, r) => sum + r.weight, 0);

  const reviewCount = Math.min(5, reviewSymbols.length * 2);
  for (let i = 0; i < reviewCount; i++) {
    let rand = Math.random() * totalWeight;
    let chosen = weightedReview[0].symbol;
    for (const entry of weightedReview) {
      rand -= entry.weight;
      if (rand <= 0) {
        chosen = entry.symbol;
        break;
      }
    }

    const exerciseType = Math.random() < 0.5 ? 'tap-recall' : 'identify';
    if (exerciseType === 'identify') {
      const options = pickRandomOptions(chosen, allKnown, 3);
      reviewPool.push({
        type: 'identify',
        symbol: chosen,
        options,
        showPattern: false,
        showMnemonic: false,
      });
    } else {
      reviewPool.push({
        type: 'tap-recall',
        symbol: chosen,
        showPattern: false,
        showMnemonic: false,
      });
    }
  }

  const shuffledReview = shuffle(reviewPool);

  const result: Exercise[] = [];
  let reviewIndex = 0;

  for (let i = 0; i < newExercises.length; i++) {
    result.push(...newExercises[i]);

    if (reviewIndex < shuffledReview.length) {
      const reviewsToInsert = Math.ceil(
        (shuffledReview.length - reviewIndex) / (newExercises.length - i)
      );
      for (
        let r = 0;
        r < reviewsToInsert && reviewIndex < shuffledReview.length;
        r++
      ) {
        result.push(shuffledReview[reviewIndex]);
        reviewIndex++;
      }
    }
  }

  while (reviewIndex < shuffledReview.length) {
    result.push(shuffledReview[reviewIndex]);
    reviewIndex++;
  }

  return result.slice(0, 20);
}

export function generateWordLesson(
  learnedLetters: string[],
  letterProgress: LetterProgress[]
): Exercise[] {
  const letterSet = new Set(learnedLetters);
  const words: string[] = getWordsForLesson(letterSet, 8);

  const wordTypes: ExerciseType[] = ['word-listen', 'word-encode', 'word-spell'];
  const wordExercises: Exercise[] = words.map((word, i) => ({
    type: wordTypes[i % wordTypes.length],
    symbol: word[0],
    word,
    showPattern: false,
    showMnemonic: false,
  }));

  // Generate review exercises for individual letters using weighted selection
  const progressMap = new Map<string, LetterProgress>();
  for (const lp of letterProgress) {
    progressMap.set(lp.symbol, lp);
  }

  const weightedReview = learnedLetters.map((symbol) => {
    const progress = progressMap.get(symbol);
    const errorRate =
      progress && progress.attempt_count > 0
        ? 1 - progress.correct_count / progress.attempt_count
        : 0.5;
    return { symbol, weight: errorRate + 0.1 };
  });

  const totalWeight = weightedReview.reduce((sum, r) => sum + r.weight, 0);
  const reviewExercises: Exercise[] = [];
  const reviewCount = Math.min(5, learnedLetters.length);

  for (let i = 0; i < reviewCount; i++) {
    let rand = Math.random() * totalWeight;
    let chosen = weightedReview[0].symbol;
    for (const entry of weightedReview) {
      rand -= entry.weight;
      if (rand <= 0) {
        chosen = entry.symbol;
        break;
      }
    }

    const exerciseType: ExerciseType = Math.random() < 0.5 ? 'tap-recall' : 'identify';
    if (exerciseType === 'identify') {
      const options = pickRandomOptions(chosen, learnedLetters, 3);
      reviewExercises.push({
        type: 'identify',
        symbol: chosen,
        options,
        showPattern: false,
        showMnemonic: false,
      });
    } else {
      reviewExercises.push({
        type: 'tap-recall',
        symbol: chosen,
        showPattern: false,
        showMnemonic: false,
      });
    }
  }

  // Interleave: insert a review exercise every ~2 word exercises
  const result: Exercise[] = [];
  let reviewIdx = 0;
  for (let i = 0; i < wordExercises.length; i++) {
    result.push(wordExercises[i]);
    if ((i + 1) % 2 === 0 && reviewIdx < reviewExercises.length) {
      result.push(reviewExercises[reviewIdx]);
      reviewIdx++;
    }
  }
  while (reviewIdx < reviewExercises.length) {
    result.push(reviewExercises[reviewIdx]);
    reviewIdx++;
  }

  return result.slice(0, 20);
}

export function calculateXP(
  correct: number,
  total: number,
  streak: number
): number {
  const baseXP = correct * 10;
  const accuracy = total > 0 ? correct / total : 0;
  const accuracyBonus = accuracy >= 0.9 ? 50 : 0;
  const streakMultiplier = Math.min(streak * 0.1 + 1, 2.0);
  return Math.round((baseXP + accuracyBonus) * streakMultiplier);
}

export function calculatePracticeXP(
  correct: number,
  total: number,
  streak: number
): number {
  const baseXP = correct * 3;
  const accuracy = total > 0 ? correct / total : 0;
  const accuracyBonus = accuracy >= 0.9 ? 15 : 0;
  const streakMultiplier = Math.min(streak * 0.1 + 1, 2.0);
  return Math.round((baseXP + accuracyBonus) * streakMultiplier);
}

export function generatePracticeSession(
  selectedSymbols: string[],
  letterProgress: LetterProgress[]
): Exercise[] {
  const progressMap = new Map<string, LetterProgress>();
  for (const lp of letterProgress) {
    progressMap.set(lp.symbol, lp);
  }

  const weighted = selectedSymbols.map((symbol) => {
    const progress = progressMap.get(symbol);
    const errorRate =
      progress && progress.attempt_count > 0
        ? 1 - progress.correct_count / progress.attempt_count
        : 0.5;
    return { symbol, weight: errorRate + 0.1 };
  });

  const totalWeight = weighted.reduce((sum, r) => sum + r.weight, 0);
  const exercises: Exercise[] = [];

  for (let i = 0; i < 20; i++) {
    let rand = Math.random() * totalWeight;
    let chosen = weighted[0].symbol;
    for (const entry of weighted) {
      rand -= entry.weight;
      if (rand <= 0) {
        chosen = entry.symbol;
        break;
      }
    }

    const roll = Math.random();
    let exerciseType: ExerciseType;
    if (roll < 0.4) {
      exerciseType = 'tap-recall';
    } else if (roll < 0.7) {
      exerciseType = 'identify';
    } else {
      exerciseType = 'translate';
    }

    if (exerciseType === 'identify') {
      const options = pickRandomOptions(chosen, selectedSymbols, 3);
      exercises.push({
        type: 'identify',
        symbol: chosen,
        options,
        showPattern: false,
        showMnemonic: false,
      });
    } else {
      exercises.push({
        type: exerciseType,
        symbol: chosen,
        showPattern: false,
        showMnemonic: false,
      });
    }
  }

  return exercises;
}

export function updateMastery(
  current: MasteryLevel,
  correct: number,
  attempts: number
): MasteryLevel {
  if (current === 0) {
    return 1;
  }

  if (attempts < 5) {
    return current;
  }

  const accuracy = attempts > 0 ? correct / attempts : 0;

  if (accuracy >= 0.8) {
    return 3;
  }

  return 2;
}
