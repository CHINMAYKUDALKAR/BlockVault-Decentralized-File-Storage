import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'accent' | 'white';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  const variantClasses = {
    primary: 'border-primary-500/30 border-t-primary-500',
    accent: 'border-accent-500/30 border-t-accent-500',
    white: 'border-white/30 border-t-white',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative">
        {/* Outer spinning circle */}
        <div
          className={clsx(
            'rounded-full animate-spin',
            sizeClasses[size],
            variantClasses[variant]
          )}
        />
        {/* Inner glow effect */}
        <div
          className={clsx(
            'absolute inset-0 rounded-full animate-glow-pulse opacity-50 blur-md',
            variant === 'primary' && 'bg-primary-500/20',
            variant === 'accent' && 'bg-accent-500/20',
            variant === 'white' && 'bg-white/20'
          )}
        />
      </div>
      {text && (
        <p className="text-sm text-text-secondary animate-pulse font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

interface LoadingDotsProps {
  variant?: 'primary' | 'accent' | 'white';
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ variant = 'primary' }) => {
  const dotClasses = {
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    white: 'bg-white',
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={clsx('w-2 h-2 rounded-full animate-bounce', dotClasses[variant])} style={{ animationDelay: '0ms' }} />
      <div className={clsx('w-2 h-2 rounded-full animate-bounce', dotClasses[variant])} style={{ animationDelay: '150ms' }} />
      <div className={clsx('w-2 h-2 rounded-full animate-bounce', dotClasses[variant])} style={{ animationDelay: '300ms' }} />
    </div>
  );
};

interface LoadingBarProps {
  progress?: number; // 0-100
  variant?: 'primary' | 'accent' | 'success';
  className?: string;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({
  progress,
  variant = 'primary',
  className,
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    accent: 'bg-gradient-to-r from-accent-500 to-accent-600',
    success: 'bg-gradient-to-r from-status-success to-status-successLight',
  };

  return (
    <div className={clsx('w-full h-2 bg-secondary-700/50 rounded-full overflow-hidden', className)}>
      <div
        className={clsx(
          'h-full transition-all duration-300 ease-out',
          variantClasses[variant],
          !progress && 'w-1/3 animate-pulse'
        )}
        style={{ width: progress ? `${progress}%` : undefined }}
      >
        {!progress && (
          <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
      </div>
    </div>
  );
};

