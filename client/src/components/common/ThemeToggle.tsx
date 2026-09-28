'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  collapsed?: boolean;
  onHover?: (e: React.MouseEvent<HTMLElement>, text: string) => void;
  onLeave?: () => void;
}

export function ThemeToggle({ collapsed = false, onHover, onLeave }: ThemeToggleProps = {}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`flex items-center rounded-xl text-sm font-medium text-muted-foreground opacity-50 ${
          collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full'
        }`}
      >
        <div className="h-5 w-5" />
        {!collapsed && <span>Theme</span>}
      </div>
    );
  }

  const isDark = theme === 'dark';
  const label = isDark ? 'Light Mode' : 'Dark Mode';

  if (collapsed) {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        onMouseEnter={(e) => onHover?.(e, label)}
        onMouseLeave={() => onLeave?.()}
        className="flex items-center justify-center h-10 w-10 mx-auto rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        aria-label={label}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span>{label}</span>
    </button>
  );
}
