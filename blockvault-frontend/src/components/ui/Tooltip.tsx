import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface TooltipProps {
  children: React.ReactElement;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setTimeout(() => setShouldRender(false), 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-secondary-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-secondary-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-secondary-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-secondary-700',
  };

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
      {shouldRender && (
        <div
          className={clsx(
            'absolute z-50 whitespace-nowrap pointer-events-none transition-all duration-200',
            positions[position],
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            className
          )}
        >
          <div className="glass-premium px-3 py-2 rounded-lg text-sm font-medium text-white shadow-2xl border border-primary-500/20">
            {content}
            {/* Arrow */}
            <div className={clsx('absolute w-0 h-0 border-4', arrows[position])} />
          </div>
        </div>
      )}
    </div>
  );
};

// Compound component for complex tooltips
interface TooltipContentProps {
  title?: string;
  description?: string;
  shortcut?: string;
}

export const TooltipContent: React.FC<TooltipContentProps> = ({
  title,
  description,
  shortcut,
}) => {
  return (
    <div className="text-left max-w-xs">
      {title && <div className="font-bold text-white mb-1">{title}</div>}
      {description && <div className="text-sm text-text-secondary mb-2">{description}</div>}
      {shortcut && (
        <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-secondary-600/50">
          <kbd className="px-2 py-1 bg-secondary-800 rounded text-xs font-mono border border-secondary-600">
            {shortcut}
          </kbd>
        </div>
      )}
    </div>
  );
};

