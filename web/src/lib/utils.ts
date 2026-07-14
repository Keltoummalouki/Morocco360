import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pin a Select dropdown to the width of its (closed) trigger.
 *
 * shadcn's SelectContent defaults to position="item-aligned", which sizes the
 * panel to its WIDEST item — one very long option (e.g. a bad city name in the
 * data) then stretches the panel far past the trigger. Radix only exposes
 * --radix-select-trigger-width in popper mode, so pass `position="popper"`
 * alongside this class.
 */
export const selectContentFit =
  'w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]';

/** Let a long option label wrap onto several lines instead of overflowing. */
export const selectItemWrap = 'whitespace-normal break-words leading-snug';
