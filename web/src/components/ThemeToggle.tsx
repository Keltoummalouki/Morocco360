'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Icon toggle. Icon visibility is driven by the `[data-theme]` attribute via
 * the `dark:` variant (wired to that attribute in globals.css), so there's no
 * server/client render mismatch — no hydration flash.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { toggle } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn('text-foreground', className)}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <Sun className="size-[18px] dark:hidden" />
      <Moon className="hidden size-[18px] dark:block" />
    </Button>
  );
}
