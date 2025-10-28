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
    primary: 'bg-gradient-to-r from-primary-500 via-primary-600 to-accent-400 text-white premium-shadow-lg hover:shadow-2xl hover:from-primary-600 hover:via-primary-700 hover:to-accent-500 active:scale-[.96] border border-transparent hover:border-accent-400/30 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
    secondary: 'glass-premium text-text-primary border border-secondary-600/50 hover:border-accent-400/60 hover:text-accent-300 hover:bg-secondary-700/70 active:scale-[.98] backdrop-blur-xl premium-shadow hover:premium-shadow-lg',
    outline: 'bg-transparent border-2 border-accent-400/50 text-accent-400 hover:bg-accent-400/15 hover:border-accent-400/80 hover:text-accent-300 active:scale-[.98] hover:shadow-lg hover:shadow-accent-400/25',
    danger: 'bg-gradient-to-r from-status-error/90 to-red-600/90 text-white border border-status-error/60 hover:from-status-error hover:to-red-600 hover:shadow-xl hover:shadow-red-500/25 active:scale-[.98] premium-shadow',
    ghost: 'bg-transparent text-text-secondary hover:text-accent-300 hover:bg-accent-400/10 active:scale-[.98] hover:backdrop-blur-sm hover:border hover:border-accent-400/20'
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