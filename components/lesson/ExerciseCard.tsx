'use client';

import { useState, useCallback } from 'react';
import type { Exercise } from '@/lib/morse/engine';
import { MORSE_MAP } from '@/lib/morse/codes';
import { playMorse, playMorseWord } from '@/lib/morse/audio';
import MorseDisplay from '@/components/lesson/MorseDisplay';
import MorseInput from '@/components/lesson/MorseInput';
import LetterReveal from '@/components/lesson/LetterReveal';
import type { MnemonicGuideType } from '@/lib/morse/mnemonics';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseNumber: number;
  totalExercises: number;
  onAnswer: (correct: boolean) => void;
  mnemonicGuide?: MnemonicGuideType;
}

type Feedback = 'correct' | 'incorrect' | null;
type ButtonState = 'check' | 'continue' | 'retry';

function patternToReadable(pattern: string): string {
  return pattern
    .split('')
    .map((c) => (c === '.' ? '\u00B7' : '\u2014'))
    .join(' ');
}

export default function ExerciseCard({
  exercise,
  exerciseNumber,
  totalExercises,
  onAnswer,
  mnemonicGuide,
}: ExerciseCardProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [retries, setRetries] = useState(0);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [buttonState, setButtonState] = useState<ButtonState>('check');

  // Morse pattern state (for tap-assisted, tap-recall, word-encode)
  const [morsePattern, setMorsePattern] = useState('');

  // Text input state (for translate, word-listen, word-spell)
  const [textInput, setTextInput] = useState('');

  // Word-encode letter index
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);

  // Word-listen transcript toggle
  const [showTranscript, setShowTranscript] = useState(false);

  // Track correctness for continue
  const [lastCorrect, setLastCorrect] = useState(false);

  const maxRetries = 2;

  const correctPattern = MORSE_MAP[exercise.symbol.toUpperCase()] || MORSE_MAP[exercise.symbol];

  const markCorrect = useCallback(() => {
    setFeedback('correct');
    setInputDisabled(true);
    setLastCorrect(true);
    setButtonState('continue');
  }, []);

  const markIncorrect = useCallback(() => {
    const newRetries = retries + 1;
    setRetries(newRetries);
    setFeedback('incorrect');

    if (newRetries >= maxRetries) {
      setInputDisabled(true);
      setShowAnswer(true);
      setLastCorrect(false);
      setButtonState('continue');
    } else {
      setButtonState('retry');
    }
  }, [retries]);

  // --- Check logic per exercise type ---
  const handleCheck = useCallback(() => {
    if (exercise.type === 'tap-assisted' || exercise.type === 'tap-recall') {
      if (morsePattern === correctPattern) {
        markCorrect();
      } else {
        markIncorrect();
      }
    } else if (exercise.type === 'translate') {
      if (textInput.toUpperCase() === exercise.symbol.toUpperCase()) {
        markCorrect();
      } else {
        markIncorrect();
      }
    } else if (exercise.type === 'word-listen' || exercise.type === 'word-spell') {
      if (textInput.toUpperCase() === (exercise.word || '').toUpperCase()) {
        markCorrect();
      } else {
        markIncorrect();
      }
    } else if (exercise.type === 'word-encode') {
      const letters = (exercise.word || '').toUpperCase().split('');
      const currentLetter = letters[currentLetterIndex];
      const expectedPattern = MORSE_MAP[currentLetter] || '';
      if (morsePattern === expectedPattern) {
        if (currentLetterIndex + 1 >= letters.length) {
          markCorrect();
        } else {
          // Advance to next letter, reset morse pattern, stay in check state
          setCurrentLetterIndex((prev) => prev + 1);
          setMorsePattern('');
          setFeedback(null);
        }
      } else {
        markIncorrect();
      }
    }
  }, [exercise, morsePattern, textInput, correctPattern, currentLetterIndex, markCorrect, markIncorrect]);

  // --- Retry logic ---
  const handleRetry = useCallback(() => {
    setMorsePattern('');
    setTextInput('');
    setFeedback(null);
    setButtonState('check');
  }, []);

  // --- Identify is the exception: clicking a choice IS the check ---
  const handleIdentifyChoice = useCallback(
    (choice: string) => {
      if (inputDisabled) return;
      if (choice === exercise.symbol) {
        markCorrect();
      } else {
        markIncorrect();
      }
    },
    [inputDisabled, exercise.symbol, markCorrect, markIncorrect]
  );

  // --- Determine if Check button should be enabled ---
  const isCheckEnabled = (() => {
    if (exercise.type === 'tap-assisted' || exercise.type === 'tap-recall' || exercise.type === 'word-encode') {
      return morsePattern.length > 0;
    }
    if (exercise.type === 'translate' || exercise.type === 'word-listen' || exercise.type === 'word-spell') {
      return textInput.length > 0;
    }
    return false;
  })();

  // For introduce, the button is always "continue" (no check needed)
  const introduceButtonState: ButtonState = 'continue';
  const effectiveButtonState = exercise.type === 'introduce' ? introduceButtonState : buttonState;

  const feedbackBg =
    feedback === 'correct'
      ? 'animate-flash-green'
      : feedback === 'incorrect'
        ? 'animate-flash-red'
        : '';

  return (
    <div
      className={`w-full max-w-lg mx-auto rounded-2xl p-6 ${feedbackBg}`}
      style={{ backgroundColor: 'var(--surface)' }}
    >
      <div className="mb-6">
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          Exercise {exerciseNumber} / {totalExercises}
        </p>
      </div>

      {feedback && (
        <div className="mb-4 text-center">
          {feedback === 'correct' && (
            <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>
              Correct!
            </p>
          )}
          {feedback === 'incorrect' && !showAnswer && (
            <p className="text-lg font-bold" style={{ color: 'var(--error)' }}>
              Try Again
            </p>
          )}
          {feedback === 'incorrect' && showAnswer && (
            <div className="space-y-2">
              <p className="text-lg font-bold" style={{ color: 'var(--error)' }}>
                The answer was:
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {exercise.type === 'word-listen' || exercise.type === 'word-spell' || exercise.type === 'word-encode'
                  ? exercise.word
                  : `${exercise.symbol} = ${patternToReadable(correctPattern)}`}
              </p>
            </div>
          )}
        </div>
      )}

      {exercise.type === 'introduce' && (
        <LetterReveal
          symbol={exercise.symbol}
          pattern={correctPattern}
          mnemonicGuide={mnemonicGuide}
        />
      )}

      {exercise.type === 'tap-assisted' && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Tap the Morse code for:
          </p>
          <div
            className="text-4xl font-bold sm:text-5xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {exercise.symbol}
          </div>
          <MorseDisplay pattern={correctPattern} size="md" />
          <p
            className="text-lg font-mono tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            {patternToReadable(correctPattern)}
          </p>
          {!inputDisabled && (
            <MorseInput onChange={setMorsePattern} />
          )}
        </div>
      )}

      {exercise.type === 'tap-recall' && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Tap the Morse code for:
          </p>
          <div
            className="text-4xl font-bold sm:text-5xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {exercise.symbol}
          </div>
          {!inputDisabled && (
            <MorseInput onChange={setMorsePattern} />
          )}
        </div>
      )}

      {exercise.type === 'identify' && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Listen and identify the letter:
          </p>
          <button
            type="button"
            onClick={() => playMorse(correctPattern)}
            className="px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--primary)')
            }
          >
            Play Sound
          </button>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {(exercise.options || []).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleIdentifyChoice(option)}
                disabled={inputDisabled}
                className="h-20 sm:h-16 rounded-xl text-2xl font-bold transition-colors cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '2px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  if (!inputDisabled) {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {exercise.type === 'translate' && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            What letter is this?
          </p>
          <p
            className="text-3xl font-mono tracking-widest"
            style={{ color: 'var(--text-primary)' }}
          >
            {patternToReadable(correctPattern)}
          </p>
          <MorseDisplay pattern={correctPattern} size="md" />
          {!inputDisabled && (
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              maxLength={1}
              placeholder="?"
              className="w-20 h-14 rounded-xl text-center text-2xl font-bold outline-none"
              style={{
                backgroundColor: 'var(--background)',
                border: '2px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              autoFocus
            />
          )}
        </div>
      )}

      {exercise.type === 'word-listen' && exercise.word && (
        <WordListenBody
          word={exercise.word}
          inputDisabled={inputDisabled}
          showAnswer={showAnswer}
          textInput={textInput}
          onTextChange={setTextInput}
          showTranscript={showTranscript}
          onToggleTranscript={() => setShowTranscript((prev) => !prev)}
        />
      )}

      {exercise.type === 'word-encode' && exercise.word && (
        <WordEncodeBody
          word={exercise.word}
          currentLetterIndex={currentLetterIndex}
          showAnswer={showAnswer}
          inputDisabled={inputDisabled}
          onMorseChange={setMorsePattern}
        />
      )}

      {exercise.type === 'word-spell' && exercise.word && (
        <WordSpellBody
          word={exercise.word}
          showAnswer={showAnswer}
          inputDisabled={inputDisabled}
          textInput={textInput}
          onTextChange={setTextInput}
        />
      )}

      {/* Unified bottom button bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background)] px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {effectiveButtonState === 'check' && (
          <button
            type="button"
            onClick={handleCheck}
            disabled={!isCheckEnabled}
            className="w-full h-14 rounded-xl font-semibold text-white text-lg transition-colors cursor-pointer disabled:opacity-40"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Check
          </button>
        )}
        {effectiveButtonState === 'continue' && (
          <button
            type="button"
            onClick={() => onAnswer(exercise.type === 'introduce' ? true : lastCorrect)}
            className="w-full h-14 rounded-xl font-semibold text-white text-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: exercise.type === 'introduce' || lastCorrect ? 'var(--success)' : 'var(--primary)',
            }}
          >
            Continue
          </button>
        )}
        {effectiveButtonState === 'retry' && (
          <button
            type="button"
            onClick={handleRetry}
            className="w-full h-14 rounded-xl font-semibold text-white text-lg transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- Sub-components (display only, no forms/buttons) ---- */

function WordListenBody({
  word,
  inputDisabled,
  showAnswer,
  textInput,
  onTextChange,
  showTranscript,
  onToggleTranscript,
}: {
  word: string;
  inputDisabled: boolean;
  showAnswer: boolean;
  textInput: string;
  onTextChange: (value: string) => void;
  showTranscript: boolean;
  onToggleTranscript: () => void;
}) {
  const letters = word.toUpperCase().split('');

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        Listen to the word and type it:
      </p>
      <button
        type="button"
        onClick={() => playMorseWord(word)}
        className="px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer"
        style={{ backgroundColor: 'var(--primary)', color: '#FFFFFF' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
      >
        Play Word
      </button>
      <button
        type="button"
        onClick={onToggleTranscript}
        className="text-sm font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
      </button>
      {showTranscript && (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {letters.map((letter, i) => {
            const pattern = MORSE_MAP[letter] || '';
            return (
              <div key={i} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{letter}</span>
                <MorseDisplay pattern={pattern} size="sm" />
              </div>
            );
          })}
        </div>
      )}
      {showAnswer && (
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {word}
        </p>
      )}
      {!inputDisabled && (
        <input
          type="text"
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          maxLength={word.length + 2}
          placeholder="Type the word..."
          className="w-full max-w-xs h-14 rounded-xl text-center text-2xl font-bold outline-none"
          style={{
            backgroundColor: 'var(--background)',
            border: '2px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          autoFocus
        />
      )}
    </div>
  );
}

function WordEncodeBody({
  word,
  currentLetterIndex,
  showAnswer,
  inputDisabled,
  onMorseChange,
}: {
  word: string;
  currentLetterIndex: number;
  showAnswer: boolean;
  inputDisabled: boolean;
  onMorseChange: (pattern: string) => void;
}) {
  const letters = word.toUpperCase().split('');
  const currentLetter = letters[currentLetterIndex];
  const currentPattern = MORSE_MAP[currentLetter] || '';

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        Tap the Morse code for each letter:
      </p>
      <div className="flex gap-2">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="text-3xl font-bold px-2 py-1 rounded"
            style={{
              color: i === currentLetterIndex ? 'var(--primary)' : i < currentLetterIndex ? 'var(--success)' : 'var(--text-muted)',
              backgroundColor: i === currentLetterIndex ? 'var(--primary-bg, rgba(99,102,241,0.1))' : 'transparent',
            }}
          >
            {letter}
          </span>
        ))}
      </div>
      {showAnswer && (
        <p className="text-lg font-mono" style={{ color: 'var(--text-muted)' }}>
          {currentLetter} = {patternToReadable(currentPattern)}
        </p>
      )}
      {!inputDisabled && (
        <MorseInput onChange={onMorseChange} />
      )}
    </div>
  );
}

function WordSpellBody({
  word,
  showAnswer,
  inputDisabled,
  textInput,
  onTextChange,
}: {
  word: string;
  showAnswer: boolean;
  inputDisabled: boolean;
  textInput: string;
  onTextChange: (value: string) => void;
}) {
  const letters = word.toUpperCase().split('');

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        Read the Morse patterns and type the word:
      </p>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        {letters.map((letter, i) => {
          const pattern = MORSE_MAP[letter] || '';
          return (
            <div key={i} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
              <MorseDisplay pattern={pattern} size="sm" />
            </div>
          );
        })}
      </div>
      {showAnswer && (
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {word}
        </p>
      )}
      {!inputDisabled && (
        <input
          type="text"
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          maxLength={word.length + 2}
          placeholder="Type the word..."
          className="w-full max-w-xs h-14 rounded-xl text-center text-2xl font-bold outline-none"
          style={{
            backgroundColor: 'var(--background)',
            border: '2px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          autoFocus
        />
      )}
    </div>
  );
}
