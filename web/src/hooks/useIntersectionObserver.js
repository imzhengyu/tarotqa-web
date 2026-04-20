import { useState, useEffect, useRef } from 'react';
import { INTERSECTION } from '../constants';

/**
 * IntersectionObserver hook for lazy loading
 * @param {Object} options - IntersectionObserver options
 * @param {string} options.rootMargin - Margin around root (default: '200px' for preload)
 * @param {boolean} options.enabled - Whether observer is enabled
 */
export function useIntersectionObserver({
  rootMargin = INTERSECTION.ROOT_MARGIN_DEFAULT,
  enabled = true
} = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: treat as always intersecting
      setIsIntersecting(true);
      setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            setHasIntersected(true);
            // Once visible, stop observing
            observer.unobserve(element);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin,
        threshold: 0
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, rootMargin]);

  return { elementRef, isIntersecting, hasIntersected };
}

export default useIntersectionObserver;