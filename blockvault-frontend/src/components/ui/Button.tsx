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
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 active:scale-[.98] border border-transparent',
    secondary: 'bg-slate-800/60 text-slate-200 border border-slate-700/50 hover:border-blue-500/50 hover:text-blue-300 hover:bg-slate-700/60 active:scale-[.98] backdrop-blur-sm',
    outline: 'bg-transparent border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 active:scale-[.98]',
    danger: 'bg-red-500/80 text-white border border-red-500/60 hover:bg-red-500 hover:shadow-lg active:scale-[.98]',
    ghost: 'bg-transparent text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 active:scale-[.98]'
  };

  const sizes = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3'
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      )}
      {!loading && (
        <>
          {leftIcon}
          <span className="whitespace-nowrap">{children}</span>
          {rightIcon}
        </>
      )}
    </button>
  );
};