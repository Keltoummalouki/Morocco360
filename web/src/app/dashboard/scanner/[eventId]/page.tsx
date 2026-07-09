'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { use } from 'react';
import { gsap, EASE, DUR } from '@/lib/gsap';

type ScanResult = 'SUCCESS' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT' | 'EXPIRED';

interface ScanResponse {
  result: ScanResult;
  message?: string;
  holderName?: string;
  category?: string;
  eventName?: string;
  checkedAt?: string;
  seat?: string;
}

const RESULT_CONFIG: Record<ScanResult, { color: string; bg: string; icon: string; label: string }> = {
  SUCCESS:      { color: '#2E8B6A', bg: 'rgba(46,139,106,0.12)',  icon: '✓', label: 'Valid Ticket'   },
  ALREADY_USED: { color: '#C49A3C', bg: 'rgba(196,154,60,0.12)',  icon: '⚠', label: 'Already Used'  },
  INVALID:      { color: '#E05252', bg: 'rgba(224,82,82,0.1)',    icon: '✗', label: 'Invalid'        },
  WRONG_EVENT:  { color: '#E05252', bg: 'rgba(224,82,82,0.1)',    icon: '✗', label: 'Wrong Event'    },
  EXPIRED:      { color: '#7A9488', bg: 'rgba(122,148,136,0.1)',  icon: '✗', label: 'Event Expired'  },
};

function playBeep(ctx: AudioContext, success: boolean) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = success ? 880 : 220;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.18 : 0.45));
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime  + (success ? 0.18 : 0.45));
}

export default function ScannerPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const readerRef    = useRef<unknown>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const scanningRef  = useRef(true);

  // GSAP refs
  const frameRef     = useRef<HTMLDivElement>(null);
  const scanLineRef  = useRef<HTMLDivElement>(null);
  const resultRef    = useRef<HTMLDivElement>(null);
  const pulseRef     = useRef<HTMLDivElement>(null);
  const pageRef      = useRef<HTMLDivElement>(null);

  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [offline,    setOffline]    = useState(false);
  const [cameraErr,  setCameraErr]  = useState<string | null>(null);

  // Scan line animation
  const scanLineAnim = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    // Page entrance
    if (pageRef.current) {
      gsap.fromTo(pageRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: DUR.slow, ease: EASE.expo }
      );
    }
  }, []);

  // Start the scan-line loop when camera is active
  useEffect(() => {
    if (cameraErr || !scanLineRef.current) return;

    const line = scanLineRef.current;
    gsap.set(line, { y: 0, opacity: 0.8 });

    scanLineAnim.current = gsap.to(line, {
      y: '100%',
      duration: 2.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    return () => { scanLineAnim.current?.kill(); };
  }, [cameraErr]);

  /* ── Offline ──────────────────────────────────────── */
  useEffect(() => {
    const on = () => setOffline(true);
    const off = () => setOffline(false);
    window.addEventListener('offline', on);
    window.addEventListener('online',  off);
    return () => { window.removeEventListener('offline', on); window.removeEventListener('online', off); };
  }, []);

  /* ── Scan handling + animations ─────────────────── */
  const handleScan = useCallback(async (qrCode: string) => {
    if (!scanningRef.current) return;
    scanningRef.current = false;

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();

    // Pause scan line
    scanLineAnim.current?.pause();

    // Flash the frame
    if (frameRef.current) {
      gsap.to(frameRef.current, { borderColor: 'rgba(255,255,255,0.9)', duration: 0.1, yoyo: true, repeat: 1 });
    }

    let data: ScanResponse;
    try {
      const res = await fetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, eventId }),
      });
      if (res.status === 401) {
        window.location.href = `/login?redirect=/dashboard/scanner/${eventId}`;
        return;
      }
      data = await res.json() as ScanResponse;
    } catch {
      data = { result: 'INVALID', message: 'Network error.' };
    }

    const cfg = RESULT_CONFIG[data.result];
    const success = data.result === 'SUCCESS';

    // Color the frame
    if (frameRef.current) {
      gsap.to(frameRef.current, {
        borderColor: cfg.color,
        boxShadow: `0 0 40px ${cfg.color}50, inset 0 0 20px ${cfg.color}18`,
        duration: 0.3,
        ease: EASE.out,
      });
    }

    playBeep(audioCtxRef.current!, success);
    setScanResult(data);

    // Animate result panel in
    requestAnimationFrame(() => {
      if (!resultRef.current) return;
      gsap.fromTo(resultRef.current,
        { y: 20, opacity: 0, scale: 0.96 },
        { y: 0,  opacity: 1, scale: 1, duration: 0.4, ease: EASE.expo }
      );

      // Pulse ring on success
      if (success && pulseRef.current) {
        gsap.fromTo(pulseRef.current,
          { scale: 1, opacity: 0.7 },
          { scale: 2.8, opacity: 0, duration: 0.8, ease: 'power2.out', repeat: 2, repeatDelay: 0.15 }
        );
      }
    });

    // Auto-reset after 3s
    setTimeout(() => {
      const el = resultRef.current;
      if (el) {
        gsap.to(el, {
          y: 10, opacity: 0, duration: 0.3, ease: 'power2.in',
          onComplete: () => {
            setScanResult(null);
            scanningRef.current = true;
            scanLineAnim.current?.resume();
            if (frameRef.current) {
              gsap.to(frameRef.current, {
                borderColor: 'rgba(255,255,255,0.7)',
                boxShadow: 'none',
                duration: 0.4,
              });
            }
          },
        });
      } else {
        setScanResult(null);
        scanningRef.current = true;
        scanLineAnim.current?.resume();
      }
    }, 3000);
  }, [eventId]);

  /* ── Camera init ─────────────────────────────────── */
  useEffect(() => {
    let stopped = false;
    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        if (videoRef.current && !stopped) {
          await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
            if (result && !err) void handleScan(result.getText());
          });
        }
      } catch {
        setCameraErr('Camera access denied. Please allow camera permissions.');
      }
    }
    void start();
    return () => {
      stopped = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { (readerRef.current as any)?.reset?.(); } catch { /* ignore */ }
    };
  }, [handleScan]);

  const result = scanResult?.result;
  const cfg    = result ? RESULT_CONFIG[result] : null;

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--foreground)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: 0,
      }}
    >
      {/* Offline banner */}
      {offline && (
        <div style={{ width: '100%', background: '#E05252', textAlign: 'center', padding: '8px 16px', fontSize: '0.8125rem', fontWeight: 600, color: '#fff' }}>
          No internet connection
        </div>
      )}

      <div style={{ padding: '32px 20px', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.6875rem', letterSpacing: '0.28em', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            Scanner
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Scan Ticket
          </h1>
        </div>

        {cameraErr ? (
          <div style={{ padding: '32px', border: '1px solid rgba(224,82,82,0.3)', background: 'rgba(224,82,82,0.06)', color: '#E05252', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            {cameraErr}
          </div>
        ) : (
          /* Camera viewfinder */
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px', margin: '0 auto', aspectRatio: '1', overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />

            {/* Dark overlay with cut-out */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Scan frame */}
              <div
                ref={frameRef}
                style={{
                  width: '65%', aspectRatio: '1',
                  border: `2.5px solid ${cfg ? cfg.color : 'rgba(255,255,255,0.75)'}`,
                  borderRadius: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.3s ease',
                }}
              >
                {/* Corner accents */}
                {['tl','tr','bl','br'].map((pos) => (
                  <div key={pos} style={{
                    position: 'absolute',
                    width: '18px', height: '18px',
                    ...(pos.includes('t') ? { top: -1 } : { bottom: -1 }),
                    ...(pos.includes('l') ? { left: -1 } : { right: -1 }),
                    borderColor: cfg?.color ?? 'var(--primary)',
                    borderStyle: 'solid',
                    borderWidth: 0,
                    ...(pos === 'tl' ? { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 } :
                        pos === 'tr' ? { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 } :
                        pos === 'bl' ? { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 } :
                                       { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 }),
                  }} />
                ))}

                {/* Scan line */}
                <div
                  ref={scanLineRef}
                  style={{
                    position: 'absolute',
                    top: 0, left: '5%', right: '5%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
                    boxShadow: '0 0 8px var(--primary-glow)',
                    borderRadius: '2px',
                  }}
                />
              </div>

              {/* Success pulse ring */}
              {result === 'SUCCESS' && (
                <div
                  ref={pulseRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '12px',
                    border: `2px solid ${RESULT_CONFIG.SUCCESS.color}`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Result panel */}
        {scanResult && cfg && (
          <div
            ref={resultRef}
            style={{
              marginTop: '24px',
              padding: '24px',
              background: cfg.bg,
              border: `1.5px solid ${cfg.color}40`,
              borderRadius: '10px',
              textAlign: 'center',
              opacity: 0,
            }}
          >
            {/* Big icon */}
            <div style={{
              width: '56px', height: '56px',
              borderRadius: '50%',
              background: `${cfg.color}20`,
              border: `2px solid ${cfg.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
              margin: '0 auto 16px',
              color: cfg.color,
            }}>
              {cfg.icon}
            </div>

            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: cfg.color, marginBottom: '10px', letterSpacing: '-0.01em' }}>
              {cfg.label}
            </p>

            {scanResult.holderName && (
              <p style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '4px' }}>
                {scanResult.holderName}
              </p>
            )}
            {scanResult.category && (
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '2px' }}>
                {scanResult.category}
              </p>
            )}
            {scanResult.seat && (
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '2px' }}>
                Seat: {scanResult.seat}
              </p>
            )}
            {scanResult.checkedAt && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '10px' }}>
                Previously: {new Date(scanResult.checkedAt).toLocaleTimeString('fr-FR')}
              </p>
            )}
            {scanResult.message && !scanResult.holderName && (
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{scanResult.message}</p>
            )}
          </div>
        )}

        {!scanResult && !cameraErr && (
          <p style={{ marginTop: '20px', fontSize: '0.875rem', color: 'var(--muted)' }}>
            Point camera at a ticket QR code
          </p>
        )}
      </div>
    </div>
  );
}
