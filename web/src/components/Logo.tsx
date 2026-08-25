import LogoMark from '@/components/LogoMark';
import { cn } from '@/lib/utils';

/**
 * Morocco360 brand lockup — the pictorial mark (LogoMark) next to the
 * "Morocco360" wordmark. "360" keeps the brand's gold→terracotta tone; the
 * word colour follows the theme so it stays readable in light and dark.
 * Pass tone="light" to place the lockup on a dark photo.
 */
export default function Logo({
  size = 32,
  tone = 'default',
  tagline = false,
  className,
}: {
  size?: number;
  tone?: 'default' | 'light';
  tagline?: boolean;
  className?: string;
}) {
  const light = tone === 'light';
  const word = light ? '#ffffff' : 'var(--foreground)';

  // Layout/typography live in globals.css (`.m360-logo*`) so responsive rules
  // can shrink the lockup (the nav scales the mark down on phones); only the
  // tone-dependent colours stay inline.
  return (
    <span className={cn('m360-logo', className)}>
      <LogoMark size={size} />

      <span className="m360-logo-stack">
        <span className="m360-logo-word" style={{ color: word }}>
          Morocco
          <span className="m360-logo-360">360</span>
        </span>
        {tagline && (
          <span
            className="m360-logo-tagline"
            style={{ color: light ? 'rgba(255,255,255,0.72)' : 'var(--foreground-dim)' }}
          >
            DISCOVER · BOOK · EXPERIENCE
          </span>
        )}
      </span>
    </span>
  );
}
