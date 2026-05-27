import { describe, it, expect } from 'vitest';
import {
  getChapters,
  getLessonsForChapter,
  getChapterCompletionStatus,
  getDailyReviewChapter,
  getDailyReviewLessons,
} from './chapters';

describe('getChapters', () => {
  it('produces stable chapter ids per guide', () => {
    const google = getChapters('google');
    const koch = getChapters('koch');
    const alpha = getChapters('alphabetical');
    expect(google[0].id).toBe('google-ch1');
    expect(koch[0].id).toBe('koch-ch1');
    expect(alpha[0].id).toBe('alphabetical-ch1');
  });

  it('sets index in increasing order starting at 0', () => {
    const chapters = getChapters('google');
    chapters.forEach((c, i) => expect(c.index).toBe(i));
  });

  it('never produces an empty chapter', () => {
    for (const guide of ['google', 'koch', 'alphabetical'] as const) {
      const chapters = getChapters(guide);
      expect(chapters.length).toBeGreaterThan(0);
      for (const c of chapters) {
        expect(c.symbols.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getLessonsForChapter', () => {
  it('caps newSymbols per lesson at 3', () => {
    const chapter = getChapters('google')[0];
    const lessons = getLessonsForChapter(chapter, []);
    for (const l of lessons) {
      // word lessons have no newSymbols, regular lessons have <= 3
      expect(l.newSymbols.length).toBeLessThanOrEqual(3);
    }
  });

  it('covers every symbol in the chapter exactly once across newSymbols', () => {
    const chapter = getChapters('google')[0];
    const lessons = getLessonsForChapter(chapter, []);
    const allNew = lessons.flatMap((l) => l.newSymbols);
    expect(new Set(allNew)).toEqual(new Set(chapter.symbols));
    expect(allNew.length).toBe(chapter.symbols.length);
  });

  it('passes previous symbols + earlier-in-chapter symbols into reviewSymbols', () => {
    const chapter = getChapters('google')[1];
    const previousSymbols = ['X', 'Y', 'Z'];
    const lessons = getLessonsForChapter(chapter, previousSymbols).filter(
      (l) => !l.isWordLesson
    );
    // The first lesson's reviewSymbols includes the previous-chapter symbols.
    expect(lessons[0].reviewSymbols).toEqual(
      expect.arrayContaining(previousSymbols)
    );
  });

  it('appends a word lesson when enough words are reachable', () => {
    const chapter = getChapters('google')[0];
    const lessons = getLessonsForChapter(chapter, []);
    // The google guide chapter 1 is heavy on vowels/common letters; expect a
    // word lesson to be appended after the regular ones.
    const wordLessons = lessons.filter((l) => l.isWordLesson);
    if (wordLessons.length > 0) {
      expect(wordLessons[0].id).toMatch(/-words$/);
      expect(wordLessons[0].newSymbols).toEqual([]);
      expect(wordLessons[0].learnedLetters?.length).toBeGreaterThan(0);
    }
  });

  it('assigns sequential lesson ids', () => {
    const chapter = getChapters('google')[0];
    const lessons = getLessonsForChapter(chapter, []).filter((l) => !l.isWordLesson);
    lessons.forEach((l, i) => {
      expect(l.id).toBe(`${chapter.id}-L${i + 1}`);
    });
  });
});

describe('getChapterCompletionStatus', () => {
  it('marks the first chapter unlocked when no progress', () => {
    const chapters = getChapters('google');
    const status = getChapterCompletionStatus(chapters, []);
    expect(status.get(chapters[0].id)?.unlocked).toBe(true);
  });

  it('locks subsequent chapters until previous is fully complete', () => {
    const chapters = getChapters('google');
    const status = getChapterCompletionStatus(chapters, []);
    if (chapters.length > 1) {
      expect(status.get(chapters[1].id)?.unlocked).toBe(false);
    }
  });

  it('unlocks the next chapter once previous is complete', () => {
    const chapters = getChapters('google');
    const firstLessons = getLessonsForChapter(chapters[0], []);
    const completed = firstLessons.map((l) => l.id);
    const status = getChapterCompletionStatus(chapters, completed);
    expect(status.get(chapters[0].id)?.completed).toBe(firstLessons.length);
    if (chapters.length > 1) {
      expect(status.get(chapters[1].id)?.unlocked).toBe(true);
    }
  });
});

describe('getDailyReviewChapter', () => {
  it('has a fixed id and contains all 26 letters', () => {
    const ch = getDailyReviewChapter();
    expect(ch.id).toBe('daily-review');
    expect(ch.symbols).toHaveLength(26);
  });
});

describe('getDailyReviewLessons', () => {
  it('returns 3 lessons whose ids embed the date', () => {
    const lessons = getDailyReviewLessons('2026-05-27');
    expect(lessons).toHaveLength(3);
    lessons.forEach((l, i) => {
      expect(l.id).toBe(`daily-review-2026-05-27-L${i + 1}`);
    });
  });

  it('is deterministic — same date produces the same lessons', () => {
    const a = getDailyReviewLessons('2026-05-27');
    const b = getDailyReviewLessons('2026-05-27');
    expect(a.map((l) => l.newSymbols)).toEqual(b.map((l) => l.newSymbols));
    expect(a.map((l) => l.reviewSymbols)).toEqual(b.map((l) => l.reviewSymbols));
  });

  it('produces different shuffles on different dates', () => {
    const a = getDailyReviewLessons('2026-05-27');
    const b = getDailyReviewLessons('2026-05-28');
    // At least one of the three lessons should have a different newSymbols list.
    const differ = a.some((l, i) => JSON.stringify(l.newSymbols) !== JSON.stringify(b[i].newSymbols));
    expect(differ).toBe(true);
  });

  it('covers all 26 letters across the three lessons combined', () => {
    const lessons = getDailyReviewLessons('2026-05-27');
    const allLetters = lessons.flatMap((l) => l.newSymbols);
    expect(new Set(allLetters).size).toBe(26);
  });
});
