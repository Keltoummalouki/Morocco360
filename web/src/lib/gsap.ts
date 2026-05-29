/**
 * Central GSAP configuration.
 * Import from here everywhere — guarantees ScrollTrigger is registered exactly once,
 * and that reduced-motion is respected globally.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Respect prefers-reduced-motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const applyMotion = () => {
    gsap.globalTimeline.timeScale(mq.matches ? 0 : 1);
    if (mq.matches) {
      // Kill all scroll triggers and skip all animations
      ScrollTrigger.getAll().forEach((st) => st.kill());
    }
  };
  applyMotion();
  mq.addEventListener('change', applyMotion);

  // Smooth refresh on resize
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Defaults — premium easing
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8,
  });
}

export { gsap, ScrollTrigger };

/** Shared easing constants */
export const EASE = {
  out:    'power3.out',
  inOut:  'power3.inOut',
  expo:   'expo.out',
  back:   'back.out(1.4)',
  elastic:'elastic.out(1, 0.4)',
  circ:   'circ.out',
} as const;

/** Standard durations (seconds) */
export const DUR = {
  fast:   0.35,
  normal: 0.65,
  slow:   0.9,
  cinematic: 1.2,
} as const;

/** Check reduced-motion preference */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Split text element into character <span>s for char-by-char animation.
 * Returns the spans array and a cleanup function.
 */
export function splitChars(el: HTMLElement): { chars: HTMLElement[]; restore: () => void } {
  const original = el.innerHTML;
  const text = el.textContent ?? '';
  el.innerHTML = text
    .split('')
    .map((ch) =>
      ch === ' '
        ? '<span style="display:inline-block;width:0.3em"> </span>'
        : `<span style="display:inline-block;will-change:transform,opacity">${ch}</span>`,
    )
    .join('');
  const chars = Array.from(el.querySelectorAll('span')) as HTMLElement[];
  return {
    chars,
    restore: () => { el.innerHTML = original; },
  };
}

/**
 * Split text into word <span>s.
 */
export function splitWords(el: HTMLElement): { words: HTMLElement[]; restore: () => void } {
  const original = el.innerHTML;
  const text = el.textContent ?? '';
  el.innerHTML = text
    .split(' ')
    .filter(Boolean)
    .map((w) => `<span style="display:inline-block;overflow:hidden;vertical-align:top"><span style="display:inline-block;will-change:transform,opacity">${w}</span></span>`)
    .join(' ');
  const words = Array.from(el.querySelectorAll('span > span')) as HTMLElement[];
  return {
    words,
    restore: () => { el.innerHTML = original; },
  };
}
