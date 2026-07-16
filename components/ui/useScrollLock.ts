'use client';

import { useEffect } from 'react';

/**
 * Hook to lock body scroll when modal is open.
 * Call with true when modal opens, false when closes.
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (lock) {
      // Get original overflow value
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

      // Store in data attributes for restoration
      document.body.dataset.originalOverflow = originalStyle;
      document.body.dataset.originalPaddingRight = originalPaddingRight;

      // Lock scroll and compensate for potential scrollbar width change
      document.body.style.overflow = 'hidden';
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        // Restore original values
        document.body.style.overflow = document.body.dataset.originalOverflow || '';
        document.body.style.paddingRight = document.body.dataset.originalPaddingRight || '';
        delete document.body.dataset.originalOverflow;
        delete document.body.dataset.originalPaddingRight;
      };
    }
  }, [lock]);
}
