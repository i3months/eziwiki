'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Props for the PageTransition component
 */
interface PageTransitionProps {
  /** Child content to animate */
  children: React.ReactNode;
}

/**
 * Page transition wrapper that animates content on route changes
 *
 * Provides smooth fade-in and slide-up animations when navigating
 * between pages. The animation is triggered by pathname changes.
 *
 * @param props - Component props
 * @param props.children - Content to wrap with transition effects
 *
 * @example
 * ```tsx
 * <PageTransition>
 *   <article>Content here</article>
 * </PageTransition>
 * ```
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset animation on route change
    setIsVisible(false);

    // Trigger animation after a brief delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {children}
    </div>
  );
}
