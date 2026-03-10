# MorseMaster — Product Requirements Document
> A Duolingo-style Morse code learning app. Give this file to Claude Code and work through it section by section.

---

## 1. Vision

A clean, gamified web app to learn Morse code — inspired by Duolingo's progression system and Google's Morse code guide. No monetization, no subscriptions. Just learn Morse code, earn XP, keep a streak.

**Core loop:** Login → Learn letters one by one → Practice with exercises → Track progress on an alphabet grid → Maintain daily streaks.

---

## 2. Tech Stack

### Decision: Next.js monorepo + Supabase (no separate backend)

- **Framework:** Next.js 14+ (App Router)
- **Auth:** Supabase Auth — Google OAuth only for MVP
- **Database:** Supabase (Postgres) with Row-Level Security
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Audio:** Web Audio API (no library needed)
- **Repo structure:** Single Next.js app (monorepo-ready but no separate backend for MVP)

### Why not Next.js + FastAPI
The app logic is simple enough that Next.js API routes + Supabase handle everything. No heavy compute. FastAPI can be added later if AI features are introduced.

---

## 3. Project Structure

```
morsemaster/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Main app shell with nav
│   │   ├── dashboard/page.tsx      # Home: chapters + progress overview
│   │   ├── learn/
│   │   │   └── [chapterId]/page.tsx
│   │   ├── lesson/
│   │   │   └── [lessonId]/page.tsx # Active lesson UI
│   │   ├── practice/page.tsx       # Free practice mode
│   │   ├── progress/page.tsx       # Alphabet grid + mastery stats
│   │   ├── profile/page.tsx        # Streak, XP, history
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── progress/route.ts       # Save lesson results
│   │   └── user/route.ts
│   └── layout.tsx
├── components/
│   ├── lesson/
│   │   ├── MorseInput.tsx          # The main tap input component
│   │   ├── MorseDisplay.tsx        # Shows dots/dashes visually
│   │   ├── LetterReveal.tsx        # Intro phase: show letter + pattern
│   │   ├── ExerciseCard.tsx        # Wrapper for each exercise
│   │   └── ProgressBar.tsx         # Lesson progress bar
│   ├── ui/
│   │   ├── AlphabetGrid.tsx        # A–Z + 0–9 + punctuation grid
│   │   ├── StreakBadge.tsx
│   │   ├── XPBar.tsx
│   │   └── ChapterCard.tsx
│   └── layout/
│       └── BottomNav.tsx
├── lib/
│   ├── morse/
│   │   ├── codes.ts                # Full Morse code map
│   │   ├── audio.ts                # Web Audio API beep engine
│   │   ├── engine.ts               # Learning engine logic
│   │   └── guides/
│   │       ├── google.ts           # Google mnemonic tree order
│   │       ├── koch.ts             # Koch method order
│   │       └── alphabetical.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── hooks/
│       ├── useMorseInput.ts        # Handles spacebar/button tap logic
│       └── useAudio.ts
├── types/
│   └── index.ts
└── supabase/
    └── migrations/
        └── 001_initial.sql
```

---

## 4. Database Schema

```sql
-- Users (managed by Supabase Auth, extended here)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  xp integer default 0,
  streak integer default 0,
  last_activity_date date,
  selected_guide text default 'google', -- 'google' | 'koch' | 'alphabetical'
  created_at timestamp with time zone default now()
);

-- Letter mastery per user
create table public.letter_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  symbol text not null,           -- 'A', 'B', '1', '.', etc.
  mastery_level integer default 0, -- 0=unseen, 1=introduced, 2=learning, 3=mastered
  correct_count integer default 0,
  attempt_count integer default 0,
  last_seen timestamp with time zone,
  unique(user_id, symbol)
);

-- Completed lessons log
create table public.lesson_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  chapter_id text not null,
  lesson_id text not null,
  xp_earned integer default 0,
  accuracy numeric,
  completed_at timestamp with time zone default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.letter_progress enable row level security;
alter table public.lesson_history enable row level security;

create policy "Users can view/edit own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "Users can view/edit own progress"
  on public.letter_progress for all using (auth.uid() = user_id);

create policy "Users can view/insert own history"
  on public.lesson_history for all using (auth.uid() = user_id);
```

---

## 5. Morse Code Data

```typescript
// lib/morse/codes.ts
export const MORSE_MAP: Record<string, string> = {
  // Letters
  A: '.-',   B: '-...', C: '-.-.', D: '-..', E: '.',
  F: '..-.', G: '--.',  H: '....', I: '..',  J: '.---',
  K: '-.-',  L: '.-..', M: '--',   N: '-.',  O: '---',
  P: '.--.', Q: '--.-', R: '.-.',  S: '...', T: '-',
  U: '..-',  V: '...-', W: '.--',  X: '-..-', Y: '-.--',
  Z: '--..',
  // Numbers
  '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.',
  // Punctuation (common)
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
};

export const REVERSE_MORSE: Record<string, string> = 
  Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));
```

---

## 6. Learning Guides (Chapter Order)

```typescript
// lib/morse/guides/google.ts
// Google's mnemonic tree approach — easiest/most distinct signals first
export const GOOGLE_GUIDE_ORDER = [
  // Chapter 1: The simplest
  ['E', 'T'],
  // Chapter 2: Short sequences
  ['I', 'A', 'N', 'M'],
  // Chapter 3: Three-element
  ['S', 'U', 'R', 'W', 'D', 'K', 'G', 'O'],
  // Chapter 4: Four-element letters
  ['H', 'V', 'F', 'L', 'P', 'J', 'B', 'X', 'C', 'Y', 'Z', 'Q'],
  // Chapter 5: Numbers 0–9
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  // Chapter 6: Common punctuation
  ['.', ',', '?', '!', '/'],
];

// lib/morse/guides/koch.ts
// Koch method — frequency/efficiency order
export const KOCH_ORDER = [
  ['K', 'M'], ['R', 'S'], ['U', 'A'], ['P', 'T'],
  ['L', 'O'], ['W', 'I'], ['.', 'N'], ['J', 'E'],
  ['F', '0'], ['Y', ','], ['V', 'G'], ['5', '/'],
  ['Q', '9'], ['Z', 'H'], ['3', '8'], ['B', '?'],
  ['4', '2'], ['7', 'C'], ['1', 'D'], ['6', 'X'],
];

// lib/morse/guides/alphabetical.ts
export const ALPHA_ORDER = [
  ['A', 'B', 'C', 'D', 'E'], ['F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O'], ['P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y'], ['Z', '0', '1', '2', '3'],
  ['4', '5', '6', '7', '8', '9'],
];
```

---

## 7. Learning Engine

```typescript
// lib/morse/engine.ts

export type ExerciseType = 
  | 'introduce'      // Show letter + morse, play audio, tap along
  | 'tap-assisted'   // Show letter + morse, user taps (pattern visible)
  | 'tap-recall'     // Show letter only, user taps from memory
  | 'identify'       // Play morse audio, user picks from 4 letters (multiple choice)
  | 'translate'      // Show morse pattern, user types the letter

export interface Exercise {
  type: ExerciseType;
  symbol: string;         // The target letter
  options?: string[];     // For 'identify' mode: 4 choices
  showPattern: boolean;
  showMnemonic: boolean;
}

/**
 * Generate a lesson sequence for an array of symbols.
 * 
 * Sequence per new symbol:
 * 1. introduce (x1) — pure observation
 * 2. tap-assisted (x2) — pattern visible
 * 3. tap-recall (x2) — no pattern
 * 4. identify (x2) — multiple choice audio
 * 
 * Then interleave previously learned symbols for review.
 * Weight symbols by (1 - accuracy): lower accuracy = more frequent.
 * 
 * Target: ~15–20 exercises per lesson.
 */
export function generateLesson(
  newSymbols: string[],
  reviewSymbols: string[],
  letterProgress: Record<string, { correct: number; attempts: number }>
): Exercise[] {
  // Implementation details:
  // - For each newSymbol: add introduce + tap-assisted x2 + tap-recall x2
  // - For identify: pick 3 random wrong options from known letters
  // - Add ~5 review exercises weighted by error rate
  // - Shuffle review exercises between new symbol sequences
  // - Cap total at 20 exercises
}

/**
 * Calculate XP earned from a lesson result.
 * Base: 10 XP per correct answer
 * Accuracy bonus: +50 if accuracy >= 0.9
 * Streak multiplier: min(streak * 0.1 + 1, 2.0) — max 2x at 10-day streak
 */
export function calculateXP(
  correct: number,
  total: number,
  streak: number
): number {}

/**
 * Determine new mastery level for a symbol.
 * 0 = unseen
 * 1 = introduced (seen in lesson)
 * 2 = learning (< 80% accuracy over >= 5 attempts)
 * 3 = mastered (>= 80% accuracy over >= 5 attempts)
 */
export function updateMastery(
  current: number,
  correct: number,
  attempts: number
): number {}
```

---

## 8. Audio Engine

```typescript
// lib/morse/audio.ts
// Use Web Audio API — no external library needed

const DOT_DURATION = 80;   // ms
const DASH_DURATION = 240; // ms  
const SYMBOL_GAP = 80;     // gap between dot/dash within a letter
const LETTER_GAP = 240;    // gap between letters
const FREQUENCY = 600;     // Hz — standard morse tone

export async function playMorse(pattern: string): Promise<void> {
  // Create AudioContext
  // For each char in pattern:
  //   '.' → beep for DOT_DURATION, pause SYMBOL_GAP
  //   '-' → beep for DASH_DURATION, pause SYMBOL_GAP
  //   ' ' → pause LETTER_GAP
}

export function playBeep(duration: number, frequency = FREQUENCY): void {
  // OscillatorNode + GainNode pattern
  // Ramp gain up/down to avoid clicks
}
```

---

## 9. Morse Input Component

```typescript
// lib/hooks/useMorseInput.ts
// Supports two modes simultaneously:
// Mode A — Single key (spacebar or tap area): hold = dash, short tap = dot
// Mode B — Two buttons: left = dot, right = dash

const HOLD_THRESHOLD = 200; // ms — under this = dot, over = dash (mode A)

export function useMorseInput(onComplete: (pattern: string) => void) {
  // State: currentPattern (e.g. '.-'), isHolding, holdStartTime
  
  // Mode A (spacebar / single tap area):
  //   keydown / touchstart → record holdStartTime
  //   keyup / touchend → if duration < HOLD_THRESHOLD → append '.', else append '-'
  //   After 600ms of no input → trigger onComplete(currentPattern)
  
  // Mode B (two buttons):
  //   dotButton click → append '.'
  //   dashButton click → append '-'  
  //   After 600ms of no input → trigger onComplete(currentPattern)
  
  // Always: display the building pattern in real-time
  // Always: clear pattern after onComplete fires
  
  return { currentPattern, isBuilding, dotButtonProps, dashButtonProps, tapAreaProps }
}
```

---

## 10. UI Components & Design

### Color Palette
```
Background:    #F7F7F5  (off-white)
Surface:       #FFFFFF
Primary:       #4F46E5  (indigo-600) — main actions, active states
Success:       #16A34A  (green-600)
Error:         #DC2626  (red-600)
Warning:       #D97706  (amber-600)
Text primary:  #1C1917  (stone-900)
Text muted:    #78716C  (stone-500)
Border:        #E7E5E4  (stone-200)
```

### Key UI Components

**AlphabetGrid** (`components/ui/AlphabetGrid.tsx`)
- Displays all 26 letters + 10 digits + optional punctuation
- Each cell shows: the symbol, its morse pattern below it
- Color coded by mastery: gray (unseen), yellow (learning), green (mastered)
- Clicking a cell shows a tooltip/modal with the full pattern + mnemonic
- Sections: "Letters" / "Numbers" / "Punctuation" tabs

**ChapterCard** (`components/ui/ChapterCard.tsx`)
- Shows chapter number, letters covered, completion %
- Locked state for chapters not yet unlocked
- Progress ring around chapter icon

**MorseDisplay** (`components/lesson/MorseDisplay.tsx`)
- Renders dots and dashes as visual elements (filled circles for dot, wide rectangles for dash)
- Animates them in sync with audio playback
- Size: large and prominent, center of lesson screen

**MorseInput** (`components/lesson/MorseInput.tsx`)
- Large tap zone in the center (Mode A)
- Two buttons at bottom: [  •  ] [ — ] (Mode B)
- Toggle between modes via small icon button
- Shows building pattern in real-time as user taps
- Visual pulse feedback on each tap

**ExerciseCard** (`components/lesson/ExerciseCard.tsx`)
- Wrapper with: header (exercise number / total), main content area, input area
- Transitions: correct → brief green flash → next, wrong → red flash → retry (max 2 retries then show answer)

**ProgressBar** (`components/lesson/ProgressBar.tsx`)
- Thin bar at top of lesson screen
- Fills as exercises complete
- Heart/lives system: 3 lives per lesson (lose one on wrong answer)

---

## 11. Pages

### `/login`
- Clean centered layout
- App logo + tagline: "Learn Morse Code. One letter at a time."
- Single button: "Continue with Google"
- Subtext: "Free forever. No credit card."

### `/dashboard`
- Top bar: streak flame + count, XP total
- "Continue" button → resumes last incomplete chapter
- Chapter list: scrollable cards showing chapters, locked/unlocked state, completion %
- Bottom nav: Home | Progress | Practice | Profile

### `/learn/[chapterId]`
- Chapter overview: letters in this chapter displayed as AlphabetGrid subset
- Lessons list (typically 3–5 lessons per chapter)
- "Start" button for next lesson

### `/lesson/[lessonId]`
- Full-screen lesson experience
- Top: progress bar + lives
- Center: ExerciseCard with MorseDisplay
- Bottom: MorseInput
- On completion: results screen (XP earned, accuracy, continue button)

### `/practice`
- User selects which letters to drill (from mastered + learning pool)
- Free-form practice: no lives, no XP, just repetition
- Good for drilling weak letters

### `/progress`
- Full AlphabetGrid
- Stats section: total XP, letters mastered, accuracy %, lessons completed
- Recent activity list

### `/profile`
- Avatar (from Google), display name
- Streak calendar (GitHub-style heatmap)
- XP history chart (recharts line chart, weekly)
- Badges (simple: "First lesson", "7-day streak", "All letters learned")

### `/settings`
- **Learning Guide:** dropdown — Google Guide | Koch Method | Alphabetical
- **Audio:** toggle on/off
- **Playback Speed:** slider 0.5x – 2x (affects tone duration)
- **Input Mode:** Single key | Two buttons | Both available
- **Theme:** Light / Dark (optional stretch goal)

---

## 12. App Shell & Navigation

```typescript
// Bottom navigation (mobile-first)
// Items: Home (house icon) | Progress (grid icon) | Practice (zap icon) | Profile (person icon)

// Streak logic (run on each authenticated page load):
// - Check profiles.last_activity_date
// - If today: streak is current, no change
// - If yesterday: streak continues (no increment here, increment on lesson complete)
// - If 2+ days ago: reset streak to 0
// - On lesson completion: if last_activity_date !== today → increment streak, update date
```

---

## 13. Implementation Order for Claude Code

Work through these phases in order. Each phase should be a working, deployable state.

### Phase 1 — Foundation
1. Initialize Next.js 14 project with TypeScript + Tailwind
2. Set up Supabase project (create tables from schema above)
3. Implement Google OAuth login flow
4. Create basic app shell with bottom nav
5. Implement auth middleware (redirect to login if not authenticated)

### Phase 2 — Core Data & Engine
1. Implement `lib/morse/codes.ts` (full morse map)
2. Implement all three guide order files
3. Implement `lib/morse/audio.ts` (Web Audio API beep engine)
4. Implement `lib/morse/engine.ts` (lesson generator + XP calculator)
5. Implement `lib/hooks/useMorseInput.ts`

### Phase 3 — Lesson UI
1. Build `MorseDisplay` component
2. Build `MorseInput` component (both modes)
3. Build `ExerciseCard` with all exercise types
4. Build `ProgressBar` + lives system
5. Wire up `/lesson/[lessonId]` page end-to-end
6. Save results to Supabase on lesson complete

### Phase 4 — Navigation & Progress
1. Build `AlphabetGrid` component with mastery coloring
2. Build `ChapterCard` component
3. Build `/dashboard` page with chapter list
4. Build `/progress` page with full grid + stats
5. Build `/learn/[chapterId]` chapter overview

### Phase 5 — Profile & Settings
1. Build `/profile` page (streak, XP, badges)
2. Build `/settings` page (guide selector, audio, speed, input mode)
3. Persist settings to Supabase profiles table
4. Implement streak logic

### Phase 6 — Practice Mode & Polish
1. Build `/practice` page with letter selector
2. Add smooth transitions between exercises
3. Add loading states and error handling
4. Mobile responsiveness pass
5. Deploy to Vercel

---

## 14. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server-side only
NEXTAUTH_URL=http://localhost:3000                 # or production URL
```

Supabase handles Google OAuth — configure the Google provider in the Supabase dashboard (OAuth credentials from Google Cloud Console).

---

## 15. Key Design Decisions & Constraints

- **No AI features in MVP.** Keep it deterministic and simple.
- **No payment, subscriptions, or premium tiers.** Everything is free.
- **Mobile-first.** The lesson input must work on touch devices.
- **Single key input is primary.** Two-button is secondary/optional. Both must work.
- **Audio on by default,** but respect the user's OS mute/silent mode.
- **No complex spaced repetition algorithms.** Simple accuracy weighting is enough.
- **Chapters unlock sequentially.** You must complete chapter N to unlock N+1.
- **Letters unlock within a chapter** as you progress through lessons.
- **3 lives per lesson.** Lose all 3 → lesson ends, no XP, retry prompt.
- **Perfect lesson (100% accuracy) = XP bonus** but no special "hearts refill" mechanic.

---

## 16. Stretch Goals (Post-MVP)

- Dark mode
- Keyboard shortcut legend overlay
- Sound themes (classic CW, futuristic, retro)
- Export progress as PDF certificate
- "Challenge mode" — timed decode races
- Offline PWA support
- Leaderboard (opt-in)
