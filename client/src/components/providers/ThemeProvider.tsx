'use client';

/**
 * @file ThemeProvider.tsx
 * @description Wraps the app with next-themes ThemeProvider for light/dark mode support.
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
