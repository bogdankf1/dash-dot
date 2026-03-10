'use client';

import { useEffect, useState } from 'react';

interface MorseDisplayProps {
  pattern: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    dotSize: 8,
    dashWidth: 24,
    dashHeight: 8,
    gap: 'gap-2',
  },
  md: {
    dotSize: 16,
    dashWidth: 48,
    dashHeight: 16,
    gap: 'gap-3',
  },
  lg: {
    dotSize: 24,
    dashWidth: 72,
    dashHeight: 24,
    gap: 'gap-4',
  },
};

export default function MorseDisplay({
  pattern,
  animated = false,
  size = 'md',
}: MorseDisplayProps) {
  const [visibleCount, setVisibleCount] = useState(animated ? 0 : pattern.length);
  const config = sizeConfig[size];

  useEffect(() => {
    if (!animated) {
      setVisibleCount(pattern.length);
      return;
    }

    setVisibleCount(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= pattern.length) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [pattern, animated]);

  const symbols = pattern.split('');

  return (
    <div className={`flex items-center justify-center ${config.gap}`}>
      {symbols.map((symbol, index) => {
        const isVisible = index < visibleCount;
        const style: React.CSSProperties = {
          opacity: isVisible ? 1 : 0,
          transition: animated ? 'opacity 0.2s ease-in' : 'none',
        };

        if (symbol === '.') {
          return (
            <div
              key={index}
              style={{
                width: config.dotSize,
                height: config.dotSize,
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                ...style,
              }}
            />
          );
        }

        if (symbol === '-') {
          return (
            <div
              key={index}
              style={{
                width: config.dashWidth,
                height: config.dashHeight,
                borderRadius: config.dashHeight / 2,
                backgroundColor: 'var(--primary)',
                ...style,
              }}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
