'use client';

import React, { useLayoutEffect, useRef, type ReactNode } from 'react';

export function StickyHeader({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      const height = Math.floor(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--site-header-height', `${height}px`);
    };

    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-[45] w-full bg-white print:hidden">
      {children}
    </header>
  );
}
