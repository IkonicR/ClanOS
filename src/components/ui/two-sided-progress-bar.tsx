import React from 'react';
import { cn } from '@/lib/utils';

interface TwoSidedProgressBarProps {
  leftValue: number; // Percentage for the left side (0-100)
  rightValue: number; // Percentage for the right side (0-100)
  leftClassName?: string;
  rightClassName?: string;
  containerClassName?: string;
}

export const TwoSidedProgressBar: React.FC<TwoSidedProgressBarProps> = ({
  leftValue,
  rightValue,
  leftClassName = 'bg-primary',
  rightClassName = 'bg-destructive',
  containerClassName,
}) => {
  const leftWidth = `${Math.max(0, Math.min(100, leftValue))}%`;
  const rightWidth = `${Math.max(0, Math.min(100, rightValue))}%`;

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-muted/40',
        containerClassName
      )}
    >
      <div
        className={cn('absolute h-full top-0 left-0 rounded-l-full', leftClassName)}
        style={{ width: leftWidth, transition: 'width 0.3s ease-in-out' }}
      />
      <div
        className={cn('absolute h-full top-0 right-0 rounded-r-full', rightClassName)}
        style={{ width: rightWidth, transition: 'width 0.3s ease-in-out' }}
      />
    </div>
  );
}; 