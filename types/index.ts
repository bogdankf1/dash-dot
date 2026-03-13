export type GuideType = 'google' | 'koch' | 'alphabetical';
export type MasteryLevel = 0 | 1 | 2 | 3;

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  streak: number;
  last_activity_date: string | null;
  selected_guide: GuideType;
  is_alpha_tester: boolean;
  created_at: string;
}

export interface LetterProgress {
  id: string;
  user_id: string;
  symbol: string;
  mastery_level: MasteryLevel;
  correct_count: number;
  attempt_count: number;
  last_seen: string | null;
}

export interface LessonHistory {
  id: string;
  user_id: string;
  chapter_id: string;
  lesson_id: string;
  xp_earned: number;
  accuracy: number;
  completed_at: string;
}

export interface Chapter {
  id: string;
  index: number;
  symbols: string[];
  title: string;
}

export interface LessonConfig {
  id: string;
  chapterId: string;
  newSymbols: string[];
  reviewSymbols: string[];
  isWordLesson?: boolean;
  learnedLetters?: string[];
}
