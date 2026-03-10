'use client';

import { useState, useCallback, useRef } from 'react';
import type { Exercise } from '@/lib/morse/engine';
import { MORSE_MAP } from '@/lib/morse/codes';
import { playMorse, playMorseWord } from '@/lib/morse/audio';
import MorseDisplay from '@/components/lesson/MorseDisplay';
import MorseInput from '@/components/lesson/MorseInput';
import LetterReveal from '@/components/lesson/LetterReveal';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseNumber: number;
  totalExercises: number;
  onAnswer: (correct: boolean) => void;
}

type Feedback = 'correct' | 'incorrect' | null;

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
}: ExerciseCardProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [retries, setRetries] = useState(0);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [translateInput, setTranslateInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const maxRetries = 2;
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const correctPattern = MORSE_MAP[exercise.symbol.toUpperCase()] || MORSE_MAP[exercise.symbol];

  const handleCorrect = useCallback(() => {
    setFeedback('correct');
    setInputDisabled(true);
    feedbackTimeoutRef.current = setTimeout(() => {
      onAnswer(true);
    }, 1200);
  }, [onAnswer]);

  const handleIncorrect = useCallback(() => {
    const newRetries = retries + 1;
    setRetries(newRetries);
    setFeedback('incorrect');

    if (newRetries >= maxRetries) {
      setInputDisabled(true);
      setShowAnswer(true);
      feedbackTimeoutRef.current = setTimeout(() => {
        onAnswer(false);
      }, 2500);
    } else {
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  }, [retries, onAnswer]);

  const handleTapComplete = useCallback(
    (pattern: string) => {
      if (inputDisabled) return;
      if (pattern === correctPattern) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
    },
    [inputDisabled, correctPattern, handleCorrect, handleIncorrect]
  );

  const handleIdentifyChoice = useCallback(
    (choice: string) => {
      if (inputDisabled) return;
      if (choice === exercise.symbol) {
        handleCorrect();
      } else {
        handleIncorrect();
      }
    },
    [inputDisabled, exercise.symbol, handleCorrect, handleIncorrect]
  );

  const handleTranslateSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputDisabled) return;
      if (translateInput.toUpperCase() === exercise.symbol.toUpperCase()) {
        handleCorrect();
      } else {
        handleIncorrect();
        if (retries + 1 < maxRetries) {
          setTranslateInput('');
        }
      }
    },
    [inputDisabled, translateInput, exercise.symbol, handleCorrect, handleIncorrect, retries]
  );

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
                {exercise.symbol} = {patternToReadable(correctPattern)}
              </p>
            </div>
          )}
        </div>
      )}

      {exercise.type === 'introduce' && (
        <LetterReveal
          symbol={exercise.symbol}
          pattern={correctPattern}
          onContinue={() => onAnswer(true)}
        />
      )}

      {exercise.type === 'tap-assisted' && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Tap the Morse code for:
          </p>
          <div
            className="text-5xl font-bold"
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
          <MorseInput onComplete={handleTapComplete} disabled={inputDisabled} />
        </div>
      )}

      {exercise.type === 'tap-recall' && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Tap the Morse code for:
          </p>
          <div
            className="text-5xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {exercise.symbol}
          </div>
          <MorseInput onComplete={handleTapComplete} disabled={inputDisabled} />
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
                className="h-16 rounded-xl text-2xl font-bold transition-colors cursor-pointer disabled:opacity-50"
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
          <form onSubmit={handleTranslateSubmit} className="flex gap-3 w-full max-w-xs">
            <input
              type="text"
              value={translateInput}
              onChange={(e) => setTranslateInput(e.target.value)}
              maxLength={1}
              disabled={inputDisabled}
              placeholder="?"
              className="flex-1 h-14 rounded-xl text-center text-2xl font-bold outline-none disabled:opacity-50"
              style={{
                backgroundColor: 'var(--background)',
                border: '2px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              autoFocus
            />
            <button
              type="submit"
              disabled={inputDisabled || !translateInput}
              className="px-6 h-14 rounded-xl font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)' }}
              onMouseEnter={(e) => {
                if (!inputDisabled) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
              }}
            >
              Check
            </button>
          </form>
        </div>
      )}

      {exercise.type === 'word-listen' && exercise.word && (
        <WordListenExercise
          word={exercise.word}
          inputDisabled={inputDisabled}
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          showAnswer={showAnswer}
          retries={retries}
          maxRetries={maxRetries}
        />
      )}

      {exercise.type === 'word-encode' && exercise.word && (
        <WordEncodeExercise
          word={exercise.word}
          inputDisabled={inputDisabled}
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          showAnswer={showAnswer}
        />
      )}

      {exercise.type === 'word-spell' && exercise.word && (
        <WordSpellExercise
          word={exercise.word}
          inputDisabled={inputDisabled}
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          showAnswer={showAnswer}
          retries={retries}
          maxRetries={maxRetries}
        />
      )}
    </div>
  );
}

function WordListenExercise({
  word,
  inputDisabled,
  onCorrect,
  onIncorrect,
  showAnswer,
  retries,
  maxRetries,
}: {
  word: string;
  inputDisabled: boolean;
  onCorrect: () => void;
  onIncorrect: () => void;
  showAnswer: boolean;
  retries: number;
  maxRetries: number;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputDisabled) return;
      if (input.toUpperCase() === word.toUpperCase()) {
        onCorrect();
      } else {
        onIncorrect();
        if (retries + 1 < maxRetries) {
          setInput('');
        }
      }
    },
    [inputDisabled, input, word, onCorrect, onIncorrect, retries, maxRetries]
  );

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
      {showAnswer && (
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {word}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-xs">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={word.length + 2}
          disabled={inputDisabled}
          placeholder="Type the word..."
          className="flex-1 h-14 rounded-xl text-center text-2xl font-bold outline-none disabled:opacity-50"
          style={{
            backgroundColor: 'var(--background)',
            border: '2px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          autoFocus
        />
        <button
          type="submit"
          disabled={inputDisabled || !input}
          className="px-6 h-14 rounded-xl font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Check
        </button>
      </form>
    </div>
  );
}

function WordEncodeExercise({
  word,
  inputDisabled,
  onCorrect,
  onIncorrect,
  showAnswer,
}: {
  word: string;
  inputDisabled: boolean;
  onCorrect: () => void;
  onIncorrect: () => void;
  showAnswer: boolean;
}) {
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const letters = word.toUpperCase().split('');
  const currentLetter = letters[currentLetterIndex];
  const currentPattern = MORSE_MAP[currentLetter] || '';

  const handleTapComplete = useCallback(
    (pattern: string) => {
      if (inputDisabled) return;
      if (pattern === currentPattern) {
        if (currentLetterIndex + 1 >= letters.length) {
          onCorrect();
        } else {
          setCurrentLetterIndex((prev) => prev + 1);
        }
      } else {
        onIncorrect();
      }
    },
    [inputDisabled, currentPattern, currentLetterIndex, letters.length, onCorrect, onIncorrect]
  );

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
      <MorseInput onComplete={handleTapComplete} disabled={inputDisabled} />
    </div>
  );
}

function WordSpellExercise({
  word,
  inputDisabled,
  onCorrect,
  onIncorrect,
  showAnswer,
  retries,
  maxRetries,
}: {
  word: string;
  inputDisabled: boolean;
  onCorrect: () => void;
  onIncorrect: () => void;
  showAnswer: boolean;
  retries: number;
  maxRetries: number;
}) {
  const [input, setInput] = useState('');
  const letters = word.toUpperCase().split('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputDisabled) return;
      if (input.toUpperCase() === word.toUpperCase()) {
        onCorrect();
      } else {
        onIncorrect();
        if (retries + 1 < maxRetries) {
          setInput('');
        }
      }
    },
    [inputDisabled, input, word, onCorrect, onIncorrect, retries, maxRetries]
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        Read the Morse patterns and type the word:
      </p>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {letters.map((letter, i) => {
          const pattern = MORSE_MAP[letter] || '';
          return (
            <div key={i} className="flex flex-col items-center gap-1">
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
      <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-xs">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={word.length + 2}
          disabled={inputDisabled}
          placeholder="Type the word..."
          className="flex-1 h-14 rounded-xl text-center text-2xl font-bold outline-none disabled:opacity-50"
          style={{
            backgroundColor: 'var(--background)',
            border: '2px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          autoFocus
        />
        <button
          type="submit"
          disabled={inputDisabled || !input}
          className="px-6 h-14 rounded-xl font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Check
        </button>
      </form>
    </div>
  );
}
