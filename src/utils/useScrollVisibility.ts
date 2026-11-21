import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect scroll direction and toggle visibility for headers and bottom docks.
 * - Scrolling DOWN hides the elements (returns false).
 * - Scrolling UP shows the elements (returns true).
 * - Near the top (scrollY < 30px) always visible (returns true).
 */
export function useScrollVisibility(threshold = 8): boolean {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          const diff = currentScrollY - lastScrollY.current;

          if (currentScrollY <= 30) {
            setIsVisible(true);
          } else if (diff > threshold) {
            // Scrolling DOWN -> hide
            setIsVisible(false);
          } else if (diff < -threshold) {
            // Scrolling UP -> show
            setIsVisible(true);
          }

          lastScrollY.current = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true });
  }, [threshold]);

  return isVisible;
}
