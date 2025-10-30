import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  variant?: 'default' | 'premium' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = true,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'glass rounded-xl',
    premium: 'glass-premium rounded-2xl premium-shadow-lg border-gradient',
    glass: 'glass rounded-xl backdrop-blur-2xl',
  };

  return (
    <div
      className={clsx(
        'p-6 transition-all duration-400 relative',
        variants[variant],
        hover && 'card-hover',
        'noise-texture',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
