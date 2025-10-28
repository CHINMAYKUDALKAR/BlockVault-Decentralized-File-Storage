import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  label?: string;
  variant?: 'default' | 'premium';
}

export const Input: React.FC<InputProps> = ({
  leftIcon,
  rightIcon,
  error,
  label,
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <div className="space-y-2 group">
      {label && (
        <label className="block text-sm font-semibold text-text-primary mb-3 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary transition-colors duration-200 group-focus-within:text-accent-400">
            {leftIcon}
          </div>
        )}
        <input
          className={clsx(
            'w-full px-5 py-4 text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-xl font-medium',
            variant === 'default' && 'glass rounded-xl border border-secondary-600/40 focus:ring-accent-400/50 focus:border-accent-400/60 hover:border-secondary-600/60',
            variant === 'premium' && 'glass-premium rounded-2xl border border-accent-400/30 focus:ring-accent-400/60 focus:border-accent-400/80 premium-shadow hover:premium-shadow-lg',
            leftIcon && 'pl-12',
            rightIcon && 'pr-12',
            error && 'border-status-error/50 focus:ring-status-error/50 focus:border-status-error',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary transition-colors duration-200 group-focus-within:text-accent-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-status-error font-medium mt-2 animate-slide-down">{error}</p>
      )}
    </div>
  );
};
