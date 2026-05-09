import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Screen } from '../store/gameStore';

const LABELS: Partial<Record<Screen, [string, string]>> = {
  title:        ['BOOT SEQUENCE',        'NULLIFIER v0.1.4'],
  home:         ['HIDEOUT',              '新宿地下 · SECTOR 7'],
  stage_select: ['DARKNET BOARD',        '依頼掲示板にアクセス中'],
  briefing:     ['MISSION BRIEFING',     'ターゲット情報を取得中'],
  skill_pick:   ['LOADOUT BAY',          'モジュール選択システム'],
  hack:         ['TARGET SYSTEM',        'ファイアウォール突破開始'],
  wave_result:  ['SECURE CHANNEL',       '結果を暗号化中'],
  result:       ['DEBRIEF TERMINAL',     'ミッションログを記録中'],
  shop:         ['BLACK MARKET',         '匿名接続を確立中'],
  enhancement:  ['AUGMENTATION CLINIC',  '施術室にアクセス中'],
};

const QUICK_PAIRS  = new Set(['wave_result→hack', 'hack→result']);
const FADE_PAIRS   = new Set(['title→home']);
const GLITCH_PAIRS = new Set<string>();
const SKIP_PAIRS   = new Set(['skill_pick→hack']);
const LINK_TRANSITION_MS = 1650;

// ── Canvas-based glitch noise transition ──────────────────────────────────────
// 半解像度キャンバス (CSS でフル表示) → ピクセル処理量を 1/4 に削減

const W = 188, H = 334;   // 375×667 の半分。CSS fill で拡大表示

function GlitchOverlay({ onDone }: { onDone: () => void }) {
  const DURATION   = 400;
  const N_SLICES   = 14;
  const SLICE_H    = H / N_SLICES;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [rgbShift, setRgbShift]   = useState(0);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = containerRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d')!;

    // Offscreen canvas for slice displacement (GPU-side drawImage)
    const off    = document.createElement('canvas');
    off.width    = W;
    off.height   = H;
    const offCtx = off.getContext('2d')!;

    // Reusable ImageData to avoid per-frame allocation
    const imgData = ctx.createImageData(W, H);
    const d       = imgData.data;

    let rafId          = 0;
    let lastCssUpdate  = 0;
    const t0           = performance.now();

    const frame = (now: number) => {
      const elapsed = now - t0;
      const t       = Math.min(1, elapsed / DURATION);

      // Bell curve: ramp up to peak at 45%, decay to 0
      const inten = t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.55;

      // Container opacity: fade in first 50ms, hold, fade out last 75ms
      const op = elapsed < 50
        ? elapsed / 50
        : elapsed > DURATION - 75
          ? 1 - (elapsed - (DURATION - 75)) / 75
          : 1;

      wrap.style.opacity = String(op);

      // ── Step 1: fill buffer with noise pixels ────────────────────────────
      const noiseDensity = 0.13 * inten;
      for (let i = 0; i < d.length; i += 4) {
        const r = Math.random();
        if (r < noiseDensity) {
          // Blue-biased bright noise
          const v   = 60 + Math.random() * 195;
          d[i]      = v * 0.08;
          d[i + 1]  = v * 0.38;
          d[i + 2]  = v;
        } else if (r < noiseDensity * 1.6) {
          // Dim blue-green static
          const v   = Math.random() * 90;
          d[i]      = v * 0.06;
          d[i + 1]  = v * 0.42;
          d[i + 2]  = v * 0.85;
        } else {
          // Dark base (title screen color)
          d[i]      = 2;
          d[i + 1]  = 8;
          d[i + 2]  = 18;
        }
        d[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      // ── Step 2: horizontal slice displacement via GPU drawImage ──────────
      offCtx.drawImage(canvas, 0, 0);   // snapshot current noise

      const displaceThresh = 0.48 * inten;
      ctx.fillStyle = '#020812';

      for (let i = 0; i < N_SLICES; i++) {
        if (Math.random() > displaceThresh) continue;
        const sy  = Math.round(i * SLICE_H);
        const sh  = Math.min(Math.ceil(SLICE_H) + 1, H - sy);
        if (sh <= 0) continue;

        // Large displacement ~20% of the time, small otherwise
        const range  = Math.random() < 0.22 ? 130 : 28;
        const shift  = Math.round((Math.random() - 0.5) * 2 * range * inten);
        if (Math.abs(shift) < 2) continue;

        ctx.fillRect(0, sy, W, sh);                              // clear gap
        ctx.drawImage(off, 0, sy, W, sh, shift, sy, W, sh);     // paste shifted
      }

      // ── Step 3: bright scan bars ─────────────────────────────────────────
      const nBars = Math.floor(Math.random() * 5 * inten);
      for (let i = 0; i < nBars; i++) {
        const y = Math.floor(Math.random() * H);
        const h = 1 + Math.floor(Math.random() * 3);
        ctx.fillStyle = `rgba(77,163,255,${0.3 + Math.random() * 0.55})`;
        ctx.fillRect(0, y, W, h);
      }

      // ── Step 4: white block corruption ───────────────────────────────────
      if (Math.random() < 0.22 * inten) {
        const bx = Math.floor(Math.random() * W);
        const by = Math.floor(Math.random() * H);
        const bw = 6 + Math.floor(Math.random() * 70 * inten);
        const bh = 1 + Math.floor(Math.random() * 4);
        ctx.fillStyle = `rgba(190,220,255,${0.6 + Math.random() * 0.4})`;
        ctx.fillRect(bx, by, bw, bh);
      }

      // ── Step 5: occasional full-height vertical color tear ───────────────
      if (Math.random() < 0.06 * inten) {
        const tx = Math.floor(Math.random() * W);
        const tw = 1 + Math.floor(Math.random() * 3);
        ctx.fillStyle = `rgba(77,163,255,${0.4 + Math.random() * 0.5})`;
        ctx.fillRect(tx, 0, tw, H);
      }

      // Update CSS overlays at ~30 fps to avoid React re-render cost
      if (now - lastCssUpdate > 33) {
        setRgbShift(Math.round(5 * inten));
        setShowLabel(inten > 0.38);
        lastCssUpdate = now;
      }

      if (elapsed < DURATION) {
        rafId = requestAnimationFrame(frame);
      } else {
        wrap.style.opacity = '0';
        onDone();
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0 }}>

      {/* Pixel noise canvas — half-res, CSS-scaled up (pixelated = no blur) */}
      <canvas
        ref={canvasRef}
        width={W} height={H}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', display: 'block',
          imageRendering: 'pixelated',
        }}
      />

      {/* RGB channel separation — red fringe */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,30,60,0.07)',
        transform: `translateX(${rgbShift}px)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }} />

      {/* RGB channel separation — cyan fringe */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,200,255,0.07)',
        transform: `translateX(${-rgbShift}px)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }} />

      {/* Scanline texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,10,28,0.35) 1px, rgba(0,10,28,0.35) 2px)',
      }} />

      {/* Destination label — appears at peak intensity */}
      {showLabel && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          textAlign: 'center', fontFamily: 'monospace',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: 8, color: 'rgba(77,163,255,0.55)',
            letterSpacing: '0.45em', marginBottom: 12,
          }}>
            // ROUTING TO TARGET
          </div>
          <div style={{
            fontSize: 20, color: '#fff', letterSpacing: '0.2em', fontWeight: 400,
            textShadow: '0 0 16px rgba(77,163,255,0.95), 0 0 48px rgba(77,163,255,0.4)',
          }}>
            HIDEOUT
          </div>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.12em', marginTop: 6,
          }}>
            新宿地下 · SECTOR 7
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main transition overlay ───────────────────────────────────────────────────

function LinkTransitionOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden clear-route-transition">
      <div className="absolute inset-0 clear-route-panel" />
      <div className="absolute left-1/2 top-1/2 clear-route-beam clear-route-beam-halo" />
      <div className="absolute left-1/2 top-1/2 clear-route-beam clear-route-beam-wide" />
      <div className="absolute left-1/2 top-1/2 clear-route-beam clear-route-beam-mid" />
      <div className="absolute left-1/2 top-1/2 clear-route-beam clear-route-beam-core" />
      <div className="absolute inset-0 flex items-center justify-center clear-route-copy">
        <div className="text-center font-mono">
          <div className="text-[9px] tracking-[0.45em] mb-3" style={{ color: 'rgba(180,225,255,0.62)' }}>
            // ACCESS_GRANTED
          </div>
          <div className="clear-route-null-text clear-route-glitch-text" data-text="NULL">NULL</div>
          <div className="clear-route-accepted-text clear-route-glitch-text" data-text="ACCEPTED">ACCEPTED</div>
        </div>
      </div>
    </div>
  );
}

type Phase = 'idle' | 'cover' | 'reveal' | 'glitch' | 'fade' | 'link';

export function ScreenTransition() {
  const screen   = useGameStore((s) => s.screen);
  const outcome  = useGameStore((s) => s.outcome);
  const prevRef  = useRef<Screen | null>(null);
  const timerRef = useRef(0);
  const rafRef   = useRef(0);

  const [phase,   setPhase]   = useState<Phase>('idle');
  const [scanPct, setScanPct] = useState(0);
  const [label,   setLabel]   = useState<[string, string] | undefined>();

  useLayoutEffect(() => {
    const prev = prevRef.current;
    prevRef.current = screen;

    if (prev === null || prev === screen) return;

    if (screen === 'hack' && outcome === 'clearing') {
      setPhase('idle');
      return;
    }

    if (SKIP_PAIRS.has(`${prev}→${screen}`)) {
      setPhase('idle');
      return;
    }

    if (FADE_PAIRS.has(`${prev}→${screen}`)) {
      setPhase('fade');
      timerRef.current = window.setTimeout(() => setPhase('idle'), 540);
      return () => {
        clearTimeout(timerRef.current);
        setPhase('idle');
      };
    }

    // Glitch: GlitchOverlay owns its lifecycle; just set phase
    if (GLITCH_PAIRS.has(`${prev}→${screen}`)) {
      setPhase('glitch');
      return () => setPhase('idle');
    }

    const isClearLinkTransition =
      prev === 'hack' && (screen === 'wave_result' || (screen === 'result' && outcome === 'stage_cleared'));

    if (isClearLinkTransition) {
      setPhase('link');
      timerRef.current = window.setTimeout(() => setPhase('idle'), LINK_TRANSITION_MS);
      return () => {
        clearTimeout(timerRef.current);
        setPhase('idle');
      };
    }

    const quick     = QUICK_PAIRS.has(`${prev}→${screen}`);
    const coverDur  = quick ? 75  : 195;
    const revealDur = quick ? 120 : 235;

    setLabel(LABELS[screen]);
    setScanPct(0);
    setPhase('cover');

    timerRef.current = window.setTimeout(() => {
      setPhase('reveal');
      const t0   = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / revealDur);
        setScanPct(p * 100);
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setPhase('idle');
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, coverDur);

    return () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      setPhase('idle');
    };
  }, [screen, outcome]);

  if (phase === 'idle') return null;

  return (
    <div className="absolute inset-0 z-[200] pointer-events-none overflow-hidden">

      {phase === 'glitch' && (
        <GlitchOverlay onDone={() => setPhase('idle')} />
      )}

      {phase === 'fade' && (
        <div
          className="absolute inset-0"
          style={{
            background: '#000',
            animation: 'title-route-fade-reveal 540ms ease-out forwards',
          }}
        />
      )}

      {phase === 'link' && <LinkTransitionOverlay />}

      {phase === 'cover' && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.97)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(77,163,255,0.025) 0px, rgba(77,163,255,0.025) 1px, transparent 1px, transparent 3px)',
          }} />
          {label && (
            <div className="text-center px-8" style={{ fontFamily: 'monospace' }}>
              <div style={{ fontSize: 8, color: 'rgba(77,163,255,0.5)', letterSpacing: '0.45em', marginBottom: 14 }}>
                // ROUTING TO TARGET
              </div>
              <div style={{
                fontSize: 22, color: '#fff', letterSpacing: '0.18em', fontWeight: 400,
                textShadow: '0 0 18px rgba(77,163,255,0.95), 0 0 50px rgba(77,163,255,0.4)',
              }}>
                {label[0]}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', marginTop: 6 }}>
                {label[1]}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'reveal' && (
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to bottom,
            transparent 0%,
            transparent calc(${scanPct}% - 2px),
            rgba(77,163,255,0.65) calc(${scanPct}% - 2px),
            rgba(77,163,255,0.22) ${scanPct}%,
            rgba(0,0,0,0.97) ${scanPct}%,
            rgba(0,0,0,0.97) 100%
          )`,
        }} />
      )}
    </div>
  );
}
