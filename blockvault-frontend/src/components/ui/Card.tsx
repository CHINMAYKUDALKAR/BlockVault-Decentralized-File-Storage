import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = true,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'glass rounded-xl p-6 transition-all duration-300',
        hover && 'card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
