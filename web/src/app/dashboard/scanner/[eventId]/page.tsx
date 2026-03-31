'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { use } from 'react';

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

const RESULT_COLOR: Record<ScanResult, string> = {
  SUCCESS:      '#4A7C6F',
  ALREADY_USED: '#B8862D',
  INVALID:      '#dc2626',
  WRONG_EVENT:  '#dc2626',
  EXPIRED:      '#6B7280',
};

const RESULT_LABEL: Record<ScanResult, string> = {
  SUCCESS:      '✓ Valid Ticket',
  ALREADY_USED: '⚠ Already Used',
  INVALID:      '✗ Invalid',
  WRONG_EVENT:  '✗ Wrong Event',
  EXPIRED:      '✗ Event Expired',
};

function playBeep(ctx: AudioContext, success: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = success ? 880 : 220;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.15 : 0.4));
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + (success ? 0.15 : 0.4));
}

export default function ScannerPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<unknown>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scanningRef = useRef(true);

  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [offline, setOffline] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Offline detection
  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => { window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline); };
  }, []);

  const handleScan = useCallback(async (qrCode: string) => {
    if (!scanningRef.current) return;
    scanningRef.current = false;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

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
      const data = await res.json() as ScanResponse;
      setScanResult(data);
      playBeep(audioCtxRef.current, data.result === 'SUCCESS');
    } catch {
      setScanResult({ result: 'INVALID', message: 'Network error. Check connection.' });
      playBeep(audioCtxRef.current, false);
    }

    // Auto-reset after 3s
    setTimeout(() => {
      setScanResult(null);
      scanningRef.current = true;
    }, 3000);
  }, [eventId]);

  useEffect(() => {
    let stopped = false;

    async function startScanner() {
      try {
        // Dynamic import to avoid SSR issues
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        if (videoRef.current && !stopped) {
          await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
            if (result && !err) {
              void handleScan(result.getText());
            }
          });
        }
      } catch {
        setCameraError('Camera access denied. Please allow camera permissions.');
      }
    }

    void startScanner();

    return () => {
      stopped = true;
      if (readerRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (readerRef.current as any).reset?.();
        } catch { /* ignore */ }
      }
    };
  }, [handleScan]);

  const result = scanResult?.result;
  const color = result ? RESULT_COLOR[result] : 'transparent';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Offline Banner */}
      {offline && (
        <div style={{ width: '100%', background: '#dc2626', textAlign: 'center', padding: '8px', fontSize: '0.8125rem', fontWeight: 600 }}>
          No internet connection
        </div>
      )}

      <div style={{ padding: '20px 16px', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', color: '#B8862D', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
          Scanner
        </p>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px' }}>
          Scan Ticket
        </h1>

        {cameraError ? (
          <p style={{ color: '#dc2626', padding: '24px' }}>{cameraError}</p>
        ) : (
          /* Camera viewfinder */
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', maxWidth: '360px', margin: '0 auto', overflow: 'hidden', borderRadius: '8px' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              playsInline
            />
            {/* Scanning frame overlay */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '60%',
                aspectRatio: '1',
                border: `3px solid ${result ? color : 'rgba(255,255,255,0.8)'}`,
                borderRadius: '8px',
                transition: 'border-color 0.2s ease',
                boxShadow: result ? `0 0 20px ${color}40` : 'none',
              }} />
            </div>
          </div>
        )}

        {/* Result Panel */}
        {scanResult && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: `${color}18`,
            border: `2px solid ${color}`,
            borderRadius: '8px',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease',
          }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color, marginBottom: '8px' }}>
              {RESULT_LABEL[result!]}
            </p>
            {scanResult.holderName && (
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>{scanResult.holderName}</p>
            )}
            {scanResult.category && (
              <p style={{ fontSize: '0.875rem', color: '#aaa' }}>{scanResult.category}</p>
            )}
            {scanResult.seat && (
              <p style={{ fontSize: '0.875rem', color: '#aaa' }}>Seat: {scanResult.seat}</p>
            )}
            {scanResult.checkedAt && (
              <p style={{ fontSize: '0.8125rem', color: '#aaa', marginTop: '8px' }}>
                Previously checked in: {new Date(scanResult.checkedAt).toLocaleTimeString('fr-FR')}
              </p>
            )}
            {scanResult.message && !scanResult.holderName && (
              <p style={{ fontSize: '0.875rem', color: '#aaa' }}>{scanResult.message}</p>
            )}
          </div>
        )}

        {!scanResult && !cameraError && (
          <p style={{ marginTop: '16px', fontSize: '0.875rem', color: '#888' }}>
            Point camera at a ticket QR code
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
