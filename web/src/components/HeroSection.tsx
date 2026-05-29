'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, EASE, DUR, splitChars, prefersReducedMotion } from '@/lib/gsap';

/* ── Static data ──────────────────────────────────────── */
const STATS    = [
  { num: 240, suffix: '+', label: 'Panoramas' },
  { num: 18,  suffix: '',  label: 'Cities'    },
  { num: 50,  suffix: 'K+',label: 'Explorers' },
];
const DESTINATIONS = [
  { city: 'Marrakech',   region: 'South',     num: '01', dark: true  },
  { city: 'Chefchaouen', region: 'North',     num: '02', dark: false },
  { city: 'Sahara',      region: 'Southeast', num: '03', dark: false },
  { city: 'Fez',         region: 'Central',   num: '04', dark: true  },
];

/* ── Particle canvas (unchanged raw canvas loop) ─────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    type P = { x:number;y:number;vx:number;vy:number;size:number;alpha:number;life:number;maxLife:number };
    const ps: P[] = [];
    let frame = 0, raf: number;
    const spawn = () => ps.push({ x: Math.random()*canvas.width, y: canvas.height+10, vx:(Math.random()-.5)*.4, vy:-(Math.random()*.6+.2), size:Math.random()*2+.5, alpha:0, life:0, maxLife:Math.random()*300+200 });
    const loop = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      frame++;
      if (frame%8===0 && ps.length<40) spawn();
      for (let i=ps.length-1;i>=0;i--) {
        const p=ps[i]; p.x+=p.vx; p.y+=p.vy; p.life++;
        const prog=p.life/p.maxLife;
        p.alpha = prog<.1 ? prog/.1 : prog>.8 ? 1-(prog-.8)/.2 : 1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=`rgba(46,139,106,${p.alpha*.5})`; ctx.fill();
        if (p.life>=p.maxLife) ps.splice(i,1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('resize',resize); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="particle-canvas" style={{ width:'100%', height:'100%' }} aria-hidden="true" />;
}

/* ── Main component ───────────────────────────────────── */
export default function HeroSection() {
  const sectionRef    = useRef<HTMLElement>(null);
  const eyebrowRef    = useRef<HTMLSpanElement>(null);
  const h1Line1Ref    = useRef<HTMLSpanElement>(null);
  const h1Line2Ref    = useRef<HTMLSpanElement>(null);
  const h1Line3Ref    = useRef<HTMLSpanElement>(null);
  const subtitleRef   = useRef<HTMLParagraphElement>(null);
  const ctaRef        = useRef<HTMLDivElement>(null);
  const statsRef      = useRef<HTMLDivElement>(null);
  const tilesRef      = useRef<HTMLDivElement>(null);
  const glow1Ref      = useRef<HTMLDivElement>(null);
  const glow2Ref      = useRef<HTMLDivElement>(null);
  const mouseGlowRef  = useRef<HTMLDivElement>(null);
  const patternRef    = useRef<HTMLDivElement>(null);

  /* ── Entrance timeline ─────────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.expo } });

      /* 1 — Eyebrow line slides up */
      if (eyebrowRef.current) {
        gsap.set(eyebrowRef.current, { y: 20, opacity: 0 });
        tl.to(eyebrowRef.current, { y: 0, opacity: 1, duration: DUR.normal }, 0.1);
      }

      /* 2 — Headline char-by-char on each line */
      const lines = [
        { ref: h1Line1Ref, delay: 0.25 },
        { ref: h1Line2Ref, delay: 0.38 },
        { ref: h1Line3Ref, delay: 0.52 },
      ];
      const restores: Array<() => void> = [];
      lines.forEach(({ ref, delay }) => {
        const el = ref.current;
        if (!el) return;
        const { chars, restore } = splitChars(el);
        restores.push(restore);
        gsap.set(chars, { y: '110%', opacity: 0, rotateX: -40 });
        tl.to(chars, {
          y: '0%', opacity: 1, rotateX: 0,
          stagger: 0.028,
          duration: DUR.slow,
          ease: EASE.expo,
        }, delay);
      });

      /* 3 — Subtitle word-by-word fade */
      if (subtitleRef.current) {
        gsap.set(subtitleRef.current, { y: 18, opacity: 0, filter: 'blur(4px)' });
        tl.to(subtitleRef.current, {
          y: 0, opacity: 1, filter: 'blur(0px)',
          duration: DUR.slow,
        }, 0.7);
      }

      /* 4 — CTA buttons */
      if (ctaRef.current) {
        gsap.set(ctaRef.current.children, { y: 20, opacity: 0 });
        tl.to(ctaRef.current.children, {
          y: 0, opacity: 1, stagger: 0.1, duration: DUR.normal,
        }, 0.82);
      }

      /* 5 — Stats stagger */
      if (statsRef.current) {
        const items = statsRef.current.querySelectorAll('.stat-item');
        gsap.set(items, { y: 16, opacity: 0 });
        tl.to(items, {
          y: 0, opacity: 1, stagger: 0.1, duration: DUR.normal,
        }, 0.95);
      }

      /* 6 — Destination tiles slide in from right */
      if (tilesRef.current) {
        const tiles = tilesRef.current.querySelectorAll('.dest-tile');
        gsap.set(tiles, { x: 60, opacity: 0, scale: 0.94 });
        tl.to(tiles, {
          x: 0, opacity: 1, scale: 1,
          stagger: 0.09,
          duration: DUR.cinematic,
          ease: EASE.expo,
        }, 0.2);
      }

      /* 7 — Ambient glows breathe in */
      if (glow1Ref.current && glow2Ref.current) {
        gsap.set([glow1Ref.current, glow2Ref.current], { scale: 0.6, opacity: 0 });
        tl.to([glow1Ref.current, glow2Ref.current], {
          scale: 1, opacity: 1,
          stagger: 0.2,
          duration: 1.8,
          ease: 'power2.out',
        }, 0);
      }

      // Cleanup split text on unmount
      return () => restores.forEach((r) => r());
    }, section);

    return () => ctx.revert();
  }, []);

  /* ── Parallax on scroll ────────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      /* Glow parallax layers */
      if (glow1Ref.current) {
        gsap.to(glow1Ref.current, {
          y: -80,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      }
      if (glow2Ref.current) {
        gsap.to(glow2Ref.current, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 2,
          },
        });
      }

      /* Pattern slow rotation + parallax */
      if (patternRef.current) {
        gsap.to(patternRef.current, {
          y: -60,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 3,
          },
        });
      }

      /* Hero content subtle scroll compression */
      const content = section.querySelector('.hero-content');
      if (content) {
        gsap.to(content, {
          y: -50,
          opacity: 0.6,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '60% top',
            scrub: 1.2,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  /* ── Mouse depth effect ────────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    let raf: number;
    let mouseX = 0, mouseY = 0;
    let currX = 0, currY = 0;

    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      mouseY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    };

    const tick = () => {
      currX += (mouseX - currX) * 0.06;
      currY += (mouseY - currY) * 0.06;

      if (mouseGlowRef.current) {
        gsap.set(mouseGlowRef.current, {
          x: currX * 80,
          y: currY * 60,
        });
      }
      if (tilesRef.current) {
        gsap.set(tilesRef.current, {
          rotateY: currX * 3,
          rotateX: -currY * 2,
        });
      }
      raf = requestAnimationFrame(tick);
    };

    section.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      section.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ── Tile 3D hover ─────────────────────────────────── */
  const onTileEnter = (tile: HTMLElement) => {
    if (prefersReducedMotion()) return;
    gsap.to(tile, { scale: 1.04, duration: 0.4, ease: EASE.out });
  };
  const onTileLeave = (tile: HTMLElement) => {
    if (prefersReducedMotion()) return;
    gsap.to(tile, { scale: 1, rotateX: 0, rotateY: 0, duration: 0.6, ease: EASE.expo });
  };
  const onTileMove = (tile: HTMLElement, e: React.MouseEvent) => {
    if (prefersReducedMotion()) return;
    const rect = tile.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const cy = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    gsap.to(tile, {
      rotateX: cy * -8,
      rotateY: cx * 8,
      duration: 0.2,
      ease: 'none',
      overwrite: 'auto',
    });
  };

  return (
    <section
      ref={sectionRef}
      className="min-h-screen pt-16 flex items-center relative overflow-hidden"
    >
      {/* Ambient background */}
      <div className="hero-ambient">
        <div ref={glow1Ref} className="hero-glow-1" />
        <div ref={glow2Ref} className="hero-glow-2" />
        <div className="hero-glow-3" />
        <div ref={patternRef} className="moroccan-pattern" />
        <div className="noise-overlay" />
        <div className="hero-vignette" />
        <ParticleCanvas />
        {/* Mouse depth glow */}
        <div
          ref={mouseGlowRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '500px', height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--primary-glow-soft) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            left: '60%', top: '40%',
            opacity: 0.7,
          }}
        />
      </div>

      <div className="hero-content max-w-7xl mx-auto px-4 sm:px-8 w-full py-16 sm:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">

          {/* Left content */}
          <div className="lg:col-span-3">
            <span ref={eyebrowRef} className="hero-eyebrow mb-6 block" style={{ opacity: 0 }}>
              Panoramic Experiences
            </span>

            <h1 className="font-playfair leading-[1.03]">
              <span
                ref={h1Line1Ref}
                className="block text-[clamp(2.25rem,6vw,6.5rem)]"
                style={{ letterSpacing: '-0.02em', display: 'block', overflow: 'hidden' }}
              >
                Discover
              </span>
              <span
                ref={h1Line2Ref}
                className="block text-[clamp(2.75rem,10vw,9.5rem)] leading-[0.92]"
                style={{ letterSpacing: '-0.03em', display: 'block', overflow: 'hidden' }}
              >
                <span className="text-gradient">Morocco</span>
              </span>
              <span
                ref={h1Line3Ref}
                className="block text-[clamp(1.5rem,4vw,4rem)] font-normal mt-3"
                style={{ letterSpacing: '-0.01em', color: 'var(--muted)', display: 'block', overflow: 'hidden' }}
              >
                through 360°
              </span>
            </h1>

            <p
              ref={subtitleRef}
              style={{ color: 'var(--muted)', fontSize: 'clamp(1rem,2vw,1.0625rem)', lineHeight: 1.9, maxWidth: '480px', marginTop: '28px', marginBottom: '40px', fontWeight: 300, opacity: 0 }}
            >
              Step inside the ancient medinas, golden deserts, and coastal cities
              of Morocco. Immersive panoramic journeys, from anywhere in the world.
            </p>

            <div ref={ctaRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <Link href="/register" className="btn-premium">
                Start Exploring
              </Link>
              <Link href="#experiences" className="btn-premium-outline">
                <span>View Experiences</span>
              </Link>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              style={{ display: 'flex', gap: 'clamp(24px,4vw,48px)', marginTop: 'clamp(40px,6vw,64px)', paddingTop: 'clamp(28px,4vw,40px)', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}
            >
              {STATS.map(({ num, suffix, label }) => (
                <div key={label} className="stat-item">
                  <p className="font-playfair" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.25rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {num}{suffix}
                  </p>
                  <p style={{ fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '4px' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — destination tiles */}
          <div className="lg:col-span-2">
            <div
              ref={tilesRef}
              className="grid grid-cols-2 gap-2 sm:gap-3 max-w-sm mx-auto lg:max-w-none"
              style={{ perspective: '800px' }}
            >
              {DESTINATIONS.map((dest) => (
                <div
                  key={dest.city}
                  className="dest-tile p-4 sm:p-6 aspect-square flex flex-col justify-between"
                  style={{
                    background: dest.dark ? 'var(--card-inverted-bg)' : 'var(--surface)',
                    color: dest.dark ? 'var(--card-inverted-text)' : 'var(--foreground)',
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                  }}
                  onMouseEnter={(e) => onTileEnter(e.currentTarget)}
                  onMouseLeave={(e) => onTileLeave(e.currentTarget)}
                  onMouseMove={(e) => onTileMove(e.currentTarget, e)}
                >
                  <div className="dest-overlay">
                    <span style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
                      Explore →
                    </span>
                  </div>
                  <span style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', opacity: 0.45, textTransform: 'uppercase' }}>
                    {dest.region}
                  </span>
                  <div>
                    <span className="font-playfair" style={{ fontSize: 'clamp(1.5rem,3vw,2.75rem)', opacity: 0.07, fontWeight: 800, display: 'block', lineHeight: 1 }}>
                      {dest.num}
                    </span>
                    <p className="font-playfair" style={{ fontSize: 'clamp(0.875rem,1.5vw,1.125rem)', fontWeight: 600, marginTop: '6px' }}>
                      {dest.city}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
