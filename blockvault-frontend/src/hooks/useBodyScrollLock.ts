import { useEffect } from 'react';

/**
 * Hook to lock body scroll when modals are open
 * Prevents background scrolling and compensates for scrollbar
 */
export const useBodyScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    // Store original overflow
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll and compensate for scrollbar
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
};

