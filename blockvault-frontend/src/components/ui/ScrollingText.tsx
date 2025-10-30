import React, { useEffect, useRef, useState } from 'react';

interface ScrollingTextProps {
  text: string;
  className?: string;
  speed?: number; // Duration in seconds
}

export const ScrollingText: React.FC<ScrollingTextProps> = ({ 
  text, 
  className = '', 
  speed = 10 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        setIsOverflowing(textWidth > containerWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${
          isOverflowing && isHovering ? 'animate-scroll-left' : ''
        }`}
        style={
          isOverflowing && isHovering
            ? {
                animationDuration: `${speed}s`,
                paddingRight: '2rem'
              }
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
};

