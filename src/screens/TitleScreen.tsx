import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CtaButton } from '../components/CtaButton';
import { requestDeviceTiltPermission } from '../utils/deviceTilt';
import { playSfx } from '../utils/sfx';

const TITLE_EXIT_DELAY_MS = 820;

// Periodically glitches a data value for realism
function DataLabel({ val, x, y, size = 8 }: { val: string; x: string; y: string; size?: number }) {
  const [v, setV] = useState(val);
  useEffect(() => {
    const glitch = () => {
      if (Math.random() < 0.22) {
        setV(val.split('').map(c => Math.random() < 0.38 ? '0123456789abcdef'[~~(Math.random() * 16)] : c).join(''));
        setTimeout(() => setV(val), 85);
      }
    };
    const id = setInterval(glitch, 1700 + Math.random() * 2600);
    return () => clearInterval(id);
  }, [val]);

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontSize: size, whiteSpace: 'nowrap', pointerEvents: 'none',
      color: 'rgba(77,163,255,0.84)',
      letterSpacing: '0.07em',
      textShadow: '0 0 7px rgba(77,163,255,0.55)',
    }}>{v}</div>
  );
}

// ── ゲームの実際のコードラインをパネル背景に流す ──────────────────────────────
const CODE_LINES = [
  'import { UnionFind } from "./unionFind";',
  'export interface TraceConfig {',
  '  baseRatePerSec: number;',
  '  rotationCost: number;',
  '  initial: number;',
  '}',
  'export const DEFAULT_TRACE: TraceConfig = {',
  '  baseRatePerSec: 100 / 90,',
  '  rotationCost: 1.5,',
  '  initial: 0,',
  '};',
  'export function evaluate(board: Board): EvalResult {',
  '  const { rows, cols, cells, ports } = board;',
  '  const cellCount = rows * cols;',
  '  const portBaseId = cellCount * 2;',
  '  const uf = new UnionFind(portBaseId + ports.length);',
  '  for (let r = 0; r < rows; r++) {',
  '    for (let c = 0; c < cols; c++) {',
  '      const idx = r * cols + c;',
  '      const wires = rotatedWires(cells[idx]);',
  '      wires.forEach((wire, slot) => {',
  '        const myId = junctionId(idx, slot);',
  '        for (const side of wire) {',
  '          if (side !== 1 && side !== 2) continue;',
  '          const [dr, dc, opp] = NEIGHBOR_OFFSET[side];',
  '          const nr = r + dr; const nc = c + dc;',
  '          if (nr < 0 || nc < 0) continue;',
  '          if (nr >= rows || nc >= cols) continue;',
  '          const nIdx = nr * cols + nc;',
  '          uf.union(myId, junctionId(nIdx, nSlot));',
  '        }',
  '      });',
  '    }',
  '  }',
  '}',
  'export function elevateForDifficulty(',
  '  base: TraceConfig, level: number',
  '): TraceConfig {',
  '  const mult = 1 + (level - 1) * 0.15;',
  '  return {',
  '    baseRatePerSec: base.baseRatePerSec * mult,',
  '    rotationCost: base.rotationCost * mult,',
  '    initial: base.initial,',
  '  };',
  '}',
  'class Rng {',
  '  private state: number;',
  '  constructor(seed: number) {',
  '    this.state = seed | 0 || 1;',
  '  }',
  '  next(): number {',
  '    let t = (this.state += 0x6d2b79f5);',
  '    t = Math.imul(t ^ (t >>> 15), t | 1);',
  '    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);',
  '    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;',
  '  }',
  '  shuffle<T>(arr: T[]): T[] {',
  '    const copy = [...arr];',
  '    for (let i = copy.length - 1; i > 0; i--) {',
  '      const j = this.int(i + 1);',
  '      [copy[i], copy[j]] = [copy[j], copy[i]];',
  '    }',
  '    return copy;',
  '  }',
  '}',
  'function buildBoardForWave(',
  '  stageLevel: number, waveIndex: number',
  ') {',
  '  const colors = PUZZLE_COLORS[',
  '    Math.min(stageLevel, 5)] ?? ["red","blue"];',
  '  const progress = waveIndex / (WAVES_PER_STAGE - 1);',
  '  return generateBoard({',
  '    cols: 6, rows: 9, colors,',
  '    noiseDensity: 0.2 + (stageLevel-1)*0.07',
  '      + progress * 0.12,',
  '    seed: Date.now() + stageLevel*1337',
  '      + waveIndex * 97,',
  '  });',
  '}',
  'export function portTarget(port: Port,',
  '  board: Board): { cellIndex: number; side: Side } {',
  '  const { rows, cols } = board;',
  '  switch (port.side) {',
  '    case 0: return { cellIndex:',
  '      0 * cols + port.index, side: 0 };',
  '    case 2: return { cellIndex:',
  '      (rows-1) * cols + port.index, side: 2 };',
  '    case 3: return { cellIndex:',
  '      port.index * cols + 0, side: 3 };',
  '    case 1: return { cellIndex:',
  '      port.index * cols + (cols-1), side: 1 };',
  '  }',
  '}',
];

function CodeStream({ speed = 22, delay = 0 }: { speed?: number; delay?: number }) {
  const lines = [...CODE_LINES, ...CODE_LINES];
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
    }}>
      <div style={{
        animation: `scroll-code ${speed}s linear ${delay}s infinite`,
        fontFamily: 'monospace',
        fontSize: 5.5,
        lineHeight: 1.75,
        color: 'rgba(77,163,255,0.18)',
        padding: '4px 7px',
        whiteSpace: 'nowrap',
      }}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function GlassPanel({
  tx, ty, tz, rx, ry,
  w, h, glow = 0.46,
  data = [],
  speed = 22,
  delay = 0,
}: {
  tx: number; ty: number; tz: number;
  rx: number; ry: number;
  w: number; h: number;
  glow?: number;
  data?: Array<{ val: string; x: string; y: string; size?: number }>;
  speed?: number;
  delay?: number;
}) {
  const edge = `rgba(77,163,255,${glow})`;
  return (
    <div style={{
      position: 'absolute',
      width: w, height: h,
      marginLeft: -w / 2, marginTop: -h / 2,
      transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
      background: 'rgba(0,20,50,0.2)',
      border: `1px solid ${edge}`,
      boxShadow: `0 0 14px rgba(77,163,255,${glow * 0.34}), 0 0 36px rgba(77,163,255,${glow * 0.12}), inset 0 0 40px rgba(0,40,90,0.1)`,
      overflow: 'hidden',
    }}>
      <CodeStream speed={speed} delay={delay} />
      {(['tl', 'tr', 'bl', 'br'] as const).map(p => (
        <div key={p} style={{
          position: 'absolute',
          width: 13, height: 13,
          ...(p[0] === 't' ? { top: 4 } : { bottom: 4 }),
          ...(p[1] === 'l' ? { left: 4 } : { right: 4 }),
          borderTop:    p[0] === 't' ? '1px solid rgba(77,163,255,0.88)' : undefined,
          borderBottom: p[0] === 'b' ? '1px solid rgba(77,163,255,0.88)' : undefined,
          borderLeft:   p[1] === 'l' ? '1px solid rgba(77,163,255,0.88)' : undefined,
          borderRight:  p[1] === 'r' ? '1px solid rgba(77,163,255,0.88)' : undefined,
        }} />
      ))}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at 50% 42%, rgba(77,163,255,0.08), transparent 62%), linear-gradient(135deg, rgba(77,163,255,0.08), transparent 38%, rgba(255,255,255,0.025) 72%, transparent)',
        opacity: 0.7,
      }} />
      {data.map((d, i) => <DataLabel key={i} {...d} />)}
    </div>
  );
}

// ── Ghost panels: appear/vanish for virus-spread effect ───────────────────────
const GHOST_CONFIG = [
  { tx: -130, ty: -190, tz: -130, rx:  5, ry:  32, w: 120, h:  78, anim: 'ghost-blink',   dur: 4.2, del: 0.0 },
  { tx: -290, ty:  -20, tz: -170, rx:  7, ry:  52, w:  88, h: 125, anim: 'ghost-blink-2', dur: 5.8, del: 1.5 },
  { tx:  230, ty:  -10, tz: -290, rx:  5, ry: -38, w: 110, h:  85, anim: 'ghost-blink-3', dur: 3.6, del: 0.8 },
  { tx:  155, ty:   90, tz: -390, rx:  9, ry: -47, w:  95, h: 135, anim: 'ghost-blink',   dur: 6.1, del: 2.2 },
  { tx:  -55, ty: -115, tz: -610, rx:  2, ry:  -4, w: 155, h:  95, anim: 'ghost-blink-2', dur: 7.2, del: 0.3 },
  { tx:   85, ty:   45, tz: -560, rx:  4, ry:  14, w: 135, h: 108, anim: 'ghost-blink-3', dur: 4.8, del: 3.1 },
  { tx:  -95, ty:  105, tz:   25, rx: 19, ry:  27, w: 108, h:  68, anim: 'ghost-blink',   dur: 5.3, del: 1.8 },
  { tx:  145, ty: -155, tz: -105, rx:  3, ry: -22, w:  88, h: 118, anim: 'ghost-blink-2', dur: 3.9, del: 0.6 },
  { tx: -175, ty:   65, tz: -330, rx: 11, ry:  47, w:  68, h:  52, anim: 'ghost-blink-3', dur: 4.4, del: 2.5 },
  { tx:  265, ty:  -95, tz: -360, rx:  6, ry: -52, w:  82, h:  62, anim: 'ghost-blink',   dur: 6.7, del: 1.2 },
  { tx:   25, ty:  165, tz: -255, rx: -52, ry: -9, w: 195, h:  78, anim: 'ghost-blink-2', dur: 5.1, del: 3.8 },
  { tx:  -55, ty: -305, tz: -155, rx: 67, ry:   9, w: 175, h:  98, anim: 'ghost-blink-3', dur: 4.6, del: 0.9 },
] as const;

function GhostPanel({
  tx, ty, tz, rx, ry, w, h, anim, dur, del,
}: {
  tx: number; ty: number; tz: number;
  rx: number; ry: number;
  w: number; h: number;
  anim: string; dur: number; del: number;
}) {
  const lines = [...CODE_LINES, ...CODE_LINES];
  return (
    <div style={{
      position: 'absolute',
      width: w, height: h,
      marginLeft: -w / 2, marginTop: -h / 2,
      transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
      background: 'rgba(0,15,40,0.12)',
      border: '1px solid rgba(77,163,255,0.28)',
      boxShadow: '0 0 8px rgba(77,163,255,0.06)',
      overflow: 'hidden',
      animation: `${anim} ${dur}s ease-in-out ${del}s infinite`,
      opacity: 0,
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          animation: `scroll-code ${dur * 1.4}s linear ${-del * 0.7}s infinite`,
          fontFamily: 'monospace', fontSize: 5, lineHeight: 1.6,
          color: 'rgba(77,163,255,0.1)', padding: '3px 5px', whiteSpace: 'nowrap',
        }}>
          {lines.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>
      {(['tl', 'tr', 'bl', 'br'] as const).map(p => (
        <div key={p} style={{
          position: 'absolute', width: 6, height: 6,
          ...(p[0] === 't' ? { top: 2 } : { bottom: 2 }),
          ...(p[1] === 'l' ? { left: 2 } : { right: 2 }),
          borderTop:    p[0] === 't' ? '1px solid rgba(77,163,255,0.55)' : undefined,
          borderBottom: p[0] === 'b' ? '1px solid rgba(77,163,255,0.55)' : undefined,
          borderLeft:   p[1] === 'l' ? '1px solid rgba(77,163,255,0.55)' : undefined,
          borderRight:  p[1] === 'r' ? '1px solid rgba(77,163,255,0.55)' : undefined,
        }} />
      ))}
    </div>
  );
}

export function TitleScreen() {
  const startRun = useGameStore((s) => s.startRun);
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const startTimerRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 320);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => clearTimeout(startTimerRef.current), []);

  const requestTitleGyroPermission = useCallback(() => {
    void requestDeviceTiltPermission();
  }, []);

  const handleStart = () => {
    if (exiting) return;
    playSfx('start');
    setExiting(true);
    clearTimeout(startTimerRef.current);
    startTimerRef.current = window.setTimeout(startRun, TITLE_EXIT_DELAY_MS);
  };

  return (
    <div
      className="relative w-full h-full font-mono overflow-hidden select-none"
      onClickCapture={requestTitleGyroPermission}
      style={{ background: '#020812' }}
    >
      <style>{`
        @keyframes scene-drift {
          0%   { transform: rotateY(-4deg) rotateX(2deg)   translateZ(-18px); }
          50%  { transform: rotateY(4deg)  rotateX(-2.2deg) translateZ(22px); }
          100% { transform: rotateY(-4deg) rotateX(2deg)   translateZ(-18px); }
        }
        @keyframes cursor-blink {
          0%,49%  { opacity: 1; }
          50%,100%{ opacity: 0; }
        }
        @keyframes convergence-pulse {
          0%,100% { opacity: 0.75; }
          50%     { opacity: 1; }
        }
        @keyframes scroll-code {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @keyframes logo-glitch-r {
          0%,11.9%,12.4%,74.9%,75.3%,100% {
            opacity:0; clip-path:inset(0); transform:translateX(0);
          }
          12%,12.3% {
            opacity:0.7; clip-path:polygon(0 18%,100% 18%,100% 32%,0 32%);
            transform:translateX(8px);
          }
          75%,75.2% {
            opacity:0.65; clip-path:polygon(0 55%,100% 55%,100% 68%,0 68%);
            transform:translateX(-6px);
          }
        }
        @keyframes logo-glitch-c {
          0%,31.9%,32.5%,88.9%,89.3%,100% {
            opacity:0; clip-path:inset(0); transform:translateX(0);
          }
          32%,32.4% {
            opacity:0.65; clip-path:polygon(0 62%,100% 62%,100% 78%,0 78%);
            transform:translateX(-9px);
          }
          89%,89.2% {
            opacity:0.6; clip-path:polygon(0 8%,100% 8%,100% 22%,0 22%);
            transform:translateX(7px);
          }
        }
        @keyframes ghost-blink {
          0%,100%    { opacity:0; }
          8%         { opacity:0.92; }
          38%        { opacity:0.78; }
          45%,92%    { opacity:0; }
        }
        @keyframes ghost-blink-2 {
          0%,55%,90%,100% { opacity:0; }
          62%             { opacity:0.88; }
          80%             { opacity:0.72; }
        }
        @keyframes ghost-blink-3 {
          0%,30%,68%,100% { opacity:0; }
          38%             { opacity:0.95; }
          58%             { opacity:0.82; }
        }
        @keyframes node-ping {
          0%,100% { transform:scale(1); opacity:0.85; }
          50%     { transform:scale(2.4); opacity:0; }
        }
        @keyframes title-ui-glitch-out {
          0%   { opacity:1; filter:none; clip-path:inset(0); }
          8%   { opacity:1; filter:brightness(1.8) contrast(1.8); clip-path:inset(0 0 0 0); }
          13%  { opacity:0.92; filter:brightness(2.3) contrast(2.4); clip-path:inset(12% 0 0 0); }
          19%  { opacity:1; filter:brightness(1.2) contrast(1.8); clip-path:inset(0 0 26% 0); }
          28%  { opacity:0.78; filter:brightness(2.4) contrast(2.7) saturate(0.2); clip-path:inset(42% 0 8% 0); }
          38%  { opacity:0.6; filter:brightness(1.7) contrast(2.2); clip-path:inset(0 0 56% 0); }
          52%  { opacity:0.34; filter:brightness(2.7) contrast(3.2) saturate(0); clip-path:inset(68% 0 0 0); }
          68%  { opacity:0.12; filter:brightness(0.8) contrast(1.8); clip-path:inset(0 0 88% 0); }
          100% { opacity:0; filter:brightness(0.3) contrast(1.1); clip-path:inset(100% 0 0 0); }
        }
        @keyframes title-start-press {
          0%   { transform:translateY(0) scale(1); filter:brightness(1); }
          22%  { transform:translateY(1px) scale(0.985); filter:brightness(1.9) contrast(1.35); }
          38%  { transform:translateY(0) scale(1.01); filter:brightness(1.35); }
          100% { transform:translateY(0) scale(1); filter:brightness(0.72); }
        }
        @keyframes title-blackout {
          0%,64% { opacity:0; }
          100%   { opacity:1; }
        }
        .title-foreground-exit {
          animation: title-ui-glitch-out 620ms steps(1, end) 120ms forwards;
          pointer-events: none;
        }
        .title-start-pressed {
          animation: title-start-press 300ms ease-out forwards;
        }
        .title-blackout {
          animation: title-blackout ${TITLE_EXIT_DELAY_MS}ms ease-in forwards;
        }
      `}</style>

      {/* ── AMBIENT FILL ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 88% 62% at 46% 37%, rgba(0,30,80,0.4) 0%, rgba(0,12,35,0.14) 55%, transparent 80%)',
      }} />

      {/* ── 3D GLASS PANEL SCENE ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ perspective: '720px', perspectiveOrigin: '46% 37%' }}
      >
        <div style={{
          position: 'absolute',
          left: '46%', top: '37%',
          transformStyle: 'preserve-3d',
          animation: 'scene-drift 16s ease-in-out infinite',
        }}>
          {/* Panel A — large left wall, dominant foreground */}
          <GlassPanel
            tx={-178} ty={-88} tz={-65}
            rx={6} ry={40} w={238} h={318} glow={0.54}
            speed={20} delay={0}
            data={[
              { val: '10.69', x: '13px', y: '15px' },
              { val: '1.2343  RT', x: '13px', y: '31px' },
              { val: '──────────', x: '13px', y: '44px', size: 6 },
              { val: '0x4f2a', x: '13px', y: '56%' },
              { val: 'TRACE_HDR', x: '13px', y: 'calc(56% + 15px)', size: 7 },
            ]}
          />

          {/* Panel B — right receding wall */}
          <GlassPanel
            tx={118} ty={-68} tz={-190}
            rx={8} ry={-40} w={218} h={278} glow={0.36}
            speed={28} delay={-7}
            data={[
              { val: 'FG 4', x: '55%', y: '12px' },
              { val: '9.81143', x: '13px', y: '26px' },
              { val: '──────────', x: '13px', y: '38px', size: 6 },
              { val: '10.60958', x: '13px', y: '59%' },
            ]}
          />

          {/* Panel C — steep left slab, adds depth to left wall */}
          <GlassPanel
            tx={-238} ty={-58} tz={-215}
            rx={10} ry={58} w={188} h={255} glow={0.26}
            speed={35} delay={-14}
            data={[
              { val: '8.28', x: '13px', y: '16px' },
              { val: '3', x: '48px', y: '16px' },
            ]}
          />

          {/* Low atmosphere haze, kept line-free so the title scene stays clean. */}
          <div style={{
            position: 'absolute',
            width: 360,
            height: 150,
            marginLeft: -180,
            marginTop: -75,
            transform: 'translateX(-22px) translateY(214px) translateZ(-80px) rotateX(-70deg) rotateY(-8deg)',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(77,163,255,0.15), rgba(77,163,255,0.045) 46%, transparent 74%)',
            filter: 'blur(16px)',
            opacity: 0.54,
          }} />

          {/* Panel E — far background panel */}
          <GlassPanel
            tx={48} ty={-30} tz={-470}
            rx={4} ry={7} w={208} h={138} glow={0.18}
            speed={18} delay={-10}
            data={[
              { val: 'SYS::0x2b', x: '12px', y: '11px', size: 7 },
              { val: 'NET_TRACE', x: '12px', y: '25px', size: 7 },
            ]}
          />

          {/* Panel F — near foreground right */}
          <GlassPanel
            tx={208} ty={88} tz={45}
            rx={15} ry={-30} w={165} h={118} glow={0.44}
            speed={16} delay={-3}
            data={[
              { val: 'PASS', x: '12px', y: '11px' },
              { val: '0x31 · 0.31', x: '12px', y: '26px', size: 7 },
            ]}
          />

          {/* Panel G — ceiling slab */}
          <GlassPanel
            tx={-18} ty={-248} tz={-55}
            rx={72} ry={6} w={320} h={195} glow={0.2}
            speed={30} delay={-18}
            data={[
              { val: 'ALT_0x8f', x: '16px', y: '22%', size: 7 },
              { val: '2.7183', x: '58%', y: '22%', size: 7 },
            ]}
          />

          {/* ── Ghost panels: virus-spread cascade ── */}
          {GHOST_CONFIG.map((g, i) => (
            <GhostPanel
              key={i}
              tx={g.tx} ty={g.ty} tz={g.tz}
              rx={g.rx} ry={g.ry}
              w={g.w} h={g.h}
              anim={g.anim} dur={g.dur} del={g.del}
            />
          ))}
        </div>
      </div>

      {/* ── CONVERGENCE GLOW at panel intersection ── */}
      <div className="absolute pointer-events-none" style={{
        left: '44%', top: '35%',
        transform: 'translate(-50%, -50%)',
        animation: 'convergence-pulse 5s ease-in-out infinite',
      }}>
        <div style={{
          width: 260, height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(77,163,255,0.16) 0%, rgba(50,120,200,0.07) 40%, transparent 68%)',
          filter: 'blur(24px)',
        }} />
      </div>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 108% 108% at 50% 50%, transparent 35%, rgba(0,5,18,0.85) 100%)',
        zIndex: 6,
      }} />

      {/* ── TITLE TYPOGRAPHY ── */}
      <div
        className={`absolute left-0 right-0 z-10 ${exiting ? 'title-foreground-exit' : ''}`}
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          paddingLeft: 'clamp(22px, 6.5%, 38px)',
          paddingRight: 'clamp(22px, 6.5%, 38px)',
          opacity: ready ? 1 : 0,
          transition: exiting ? 'none' : 'opacity 1.1s ease 0.5s',
        }}
      >
        {/* シンボルマーク */}
        <img
          src="/symbol.png"
          alt=""
          style={{ height: 28, width: 'auto', display: 'block', marginBottom: 12, filter: 'brightness(0) invert(1)' }}
        />

        <div style={{
          fontSize: 8, letterSpacing: '0.46em',
          color: 'rgba(77,163,255,0.38)',
          marginBottom: 8, fontWeight: 300,
        }}>
          // INTRUSION FRAMEWORK
        </div>

        {/* NULLIFIERロゴタイプ（グリッチ） */}
        <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
          <img
            src="/logo-text.png"
            alt="NULLIFIER"
            style={{ width: '100%', height: 'auto', display: 'block', filter: 'brightness(0) invert(1)', opacity: 0.95 }}
          />
          <img
            src="/logo-text.png"
            aria-hidden
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              filter: 'brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(310deg)',
              animation: 'logo-glitch-r 9s linear infinite',
              opacity: 0,
            }}
          />
          <img
            src="/logo-text.png"
            aria-hidden
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              filter: 'brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(160deg)',
              animation: 'logo-glitch-c 13s linear infinite 2.3s',
              opacity: 0,
            }}
          />
        </div>

        <div style={{
          width: 50, height: 1,
          background: 'linear-gradient(to right, rgba(77,163,255,0.6), transparent)',
          margin: '12px 0 10px',
        }} />
        <div style={{
          fontSize: 9, letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.18)', fontWeight: 300,
        }}>
          HACK THE CITY · STAY INVISIBLE
        </div>

        {/* ── BUTTONS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 28 }}>
          <CtaButton
            onClick={handleStart}
            marker
            className={`active:brightness-90 ${exiting ? 'title-start-pressed' : ''}`}
            style={{
              background: '#4da3ff',
              boxShadow: '0 0 28px rgba(77,163,255,0.45)',
            }}
          >
            &gt; START THE GAME
          </CtaButton>
          <CtaButton
            onClick={() => {}}
            variant="muted"
            className="font-light"
          >
            &gt; OPTIONS
          </CtaButton>
        </div>
      </div>

      {/* ── LOGO MARK ── */}
      <div
        className={`absolute z-10 ${exiting ? 'title-foreground-exit' : ''}`}
        style={{
          bottom: 'clamp(30px, 7vh, 50px)',
          right: 'clamp(22px, 6.5%, 38px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: ready ? 0.28 : 0,
          transition: 'opacity 1.1s ease 1.1s',
        }}
      >
        <img
          src="/symbol.png"
          alt=""
          style={{ height: 14, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.5 }}
        />
      </div>

      {/* Version */}
      <div
        className={`absolute bottom-1.5 left-0 right-0 text-center z-10 pointer-events-none ${exiting ? 'title-foreground-exit' : ''}`}
        style={{ fontSize: 8, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.07)' }}
      >
        v0.1.4 · NULLIFIER
      </div>

      {exiting && (
        <div className="absolute inset-0 z-30 pointer-events-none title-blackout" style={{ background: '#000', opacity: 0 }} />
      )}
    </div>
  );
}
