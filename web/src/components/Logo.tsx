import LogoMark from '@/components/LogoMark';

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

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}
    >
      <LogoMark size={size} />

      <span
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          gap: 3,
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
            fontWeight: 800,
            fontSize: '1.15rem',
            letterSpacing: '-0.02em',
            color: word,
          }}
        >
          Morocco
          <span
            style={{
              background: 'linear-gradient(92deg, #E7A43A 0%, #C25A32 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            360
          </span>
        </span>
        {tagline && (
          <span
            style={{
              fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
              fontWeight: 600,
              fontSize: '0.5rem',
              letterSpacing: '0.2em',
              color: light ? 'rgba(255,255,255,0.72)' : 'var(--foreground-dim)',
            }}
          >
            DISCOVER · BOOK · EXPERIENCE
          </span>
        )}
      </span>
    </span>
  );
}
