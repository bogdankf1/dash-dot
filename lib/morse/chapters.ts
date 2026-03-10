import { GOOGLE_GUIDE_ORDER } from './guides/google';
import { KOCH_ORDER } from './guides/koch';
import { ALPHA_ORDER } from './guides/alphabetical';
import { getAvailableWords, MIN_WORDS_FOR_LESSON } from './words';
import type { Chapter, GuideType, LessonConfig } from '@/types';

const guides: Record<GuideType, string[][]> = {
  google: GOOGLE_GUIDE_ORDER,
  koch: KOCH_ORDER,
  alphabetical: ALPHA_ORDER,
};

export function getChapters(guide: GuideType): Chapter[] {
  const order = guides[guide];
  return order.map((symbols, index) => ({
    id: `${guide}-ch${index + 1}`,
    index,
    symbols,
    title: `Chapter ${index + 1}`,
  }));
}

export function getLessonsForChapter(
  chapter: Chapter,
  previousSymbols: string[]
): LessonConfig[] {
  const lessons: LessonConfig[] = [];
  const symbolsPerLesson = Math.max(2, Math.ceil(chapter.symbols.length / 3));

  for (let i = 0; i < chapter.symbols.length; i += symbolsPerLesson) {
    const newSymbols = chapter.symbols.slice(i, i + symbolsPerLesson);
    const previousInChapter = chapter.symbols.slice(0, i);
    const reviewSymbols = [...previousSymbols, ...previousInChapter];
    const lessonIndex = Math.floor(i / symbolsPerLesson);

    lessons.push({
      id: `${chapter.id}-L${lessonIndex + 1}`,
      chapterId: chapter.id,
      newSymbols,
      reviewSymbols: reviewSymbols.slice(-8), // Keep review pool manageable
    });
  }

  // Append a word lesson if enough words are available from the cumulative letter pool
  const allLearnedLetters = [...previousSymbols, ...chapter.symbols];
  const letterSet = new Set(allLearnedLetters);
  const availableWords = getAvailableWords(letterSet);

  if (availableWords.length >= MIN_WORDS_FOR_LESSON) {
    lessons.push({
      id: `${chapter.id}-words`,
      chapterId: chapter.id,
      newSymbols: [],
      reviewSymbols: allLearnedLetters.slice(-8),
      isWordLesson: true,
      learnedLetters: allLearnedLetters,
    });
  }

  return lessons;
}

export function getChapterCompletionStatus(
  chapters: Chapter[],
  completedLessonIds: string[]
): Map<string, { total: number; completed: number; unlocked: boolean }> {
  const status = new Map<
    string,
    { total: number; completed: number; unlocked: boolean }
  >();
  let allPreviousCompleted = true;

  for (const chapter of chapters) {
    const previousSymbols = chapters
      .filter((c) => c.index < chapter.index)
      .flatMap((c) => c.symbols);

    const lessons = getLessonsForChapter(chapter, previousSymbols);
    const completedCount = lessons.filter((l) =>
      completedLessonIds.includes(l.id)
    ).length;

    status.set(chapter.id, {
      total: lessons.length,
      completed: completedCount,
      unlocked: allPreviousCompleted,
    });

    if (completedCount < lessons.length) {
      allPreviousCompleted = false;
    }
  }

  return status;
}
