import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-400/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden transform-gpu will-change-transform';

  const variants = {
    primary: 'text-white premium-shadow-lg hover:shadow-2xl active:scale-[.96] border border-transparent before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 bg-[linear-gradient(90deg,var(--accent-purple),var(--accent-cyan))] hover:opacity-90',
    secondary: 'glass-premium border backdrop-blur-xl premium-shadow hover:premium-shadow-lg active:scale-[.98] dark:text-text-primary light:text-[var(--text-primary)] dark:border-secondary-600/50 light:border-[var(--card-border)] dark:hover:bg-secondary-700/70 light:hover:bg-[var(--hover-bg)]',
    outline: 'bg-transparent border-2 active:scale-[.98] hover:shadow-lg dark:border-accent-400/50 dark:text-accent-400 dark:hover:bg-accent-400/15 dark:hover:border-accent-400/80 light:border-[var(--accent-purple)] light:text-[var(--accent-purple)] light:hover:bg-[var(--accent-purple)] light:hover:text-white',
    danger: 'bg-gradient-to-r from-status-error/90 to-red-600/90 text-white border border-status-error/60 hover:from-status-error hover:to-red-600 hover:shadow-xl hover:shadow-red-500/25 active:scale-[.98] premium-shadow',
    ghost: 'bg-transparent active:scale-[.98] hover:backdrop-blur-sm hover:border dark:text-text-secondary dark:hover:text-accent-300 dark:hover:bg-accent-400/10 dark:border-accent-400/20 light:text-[var(--text-secondary)] light:hover:text-[var(--accent-purple)] light:hover:bg-[var(--hover-bg)]'
  };

  const sizes = {
    sm: 'text-xs px-4 py-2.5 min-h-[36px]',
    md: 'text-sm px-6 py-3 min-h-[44px]',
    lg: 'text-base px-8 py-4 min-h-[52px]'
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-500 after:pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="animate-pulse">Loading...</span>
        </div>
      )}
      {!loading && (
        <>
          {leftIcon && <span className="mr-1">{leftIcon}</span>}
          <span className="whitespace-nowrap font-semibold tracking-wide">{children}</span>
          {rightIcon && <span className="ml-1">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};