import LogoMark from '@/components/LogoMark';
import { cn } from '@/lib/utils';

/**
 * EventHub brand lockup — the ticket mark (LogoMark) next to the "EventHub"
 * wordmark. "Hub" carries the brand blue; "Event" follows the theme so it
 * stays readable in light and dark.
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
  // On a dark photo the navy `--primary` disappears, so the mark and "Hub"
  // switch to the light end of the blue ramp.
  const brand = light ? '#8AB4FF' : 'var(--primary)';

  // Layout/typography live in globals.css (`.eh-logo*`) so responsive rules
  // can shrink the lockup (the nav scales the mark down on phones); only the
  // tone-dependent colours stay inline.
  return (
    <span className={cn('eh-logo', className)}>
      <LogoMark size={size} color={brand} />

      <span className="eh-logo-stack">
        <span className="eh-logo-word" style={{ color: word }}>
          Event
          <span className="eh-logo-hub" style={{ color: brand }}>
            Hub
          </span>
        </span>
        {tagline && (
          <span
            className="eh-logo-tagline"
            style={{ color: light ? 'rgba(255,255,255,0.72)' : 'var(--foreground-dim)' }}
          >
            DISCOVER · BOOK · EXPERIENCE
          </span>
        )}
      </span>
    </span>
  );
}
