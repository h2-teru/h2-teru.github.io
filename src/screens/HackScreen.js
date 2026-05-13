import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { PuzzleCanvas } from '../components/PuzzleCanvas';
import { TraceBar } from '../components/TraceBar';
import { useGameStore, WAVES_PER_STAGE } from '../store/gameStore';
import { SKILL_DEFS } from '../game/skills';
import { playSfx } from '../utils/sfx';
const CLEARED_TELEMETRY_CARDS = [
    { label: 'AUTH', value: 'CHAIN VERIFIED', meta: 'SIG 7A-01' },
    { label: 'ROOT', value: 'KEY ACCEPTED', meta: 'TOKEN LIVE' },
    { label: 'TRACE', value: 'ECHO SILENCED', meta: '00.0%' },
];
const CLEARED_STATUS_ROWS = [
    { label: 'PORT', value: 'CLOSED' },
    { label: 'MEM', value: 'CLEAN' },
    { label: 'FIELD', value: 'STABLE' },
    { label: 'EXFIL', value: 'READY' },
];
const PROGRAM_RAIN_COLUMNS = [
    { left: '4%', width: 72, duration: 18, delay: -8.4, opacity: 0.32, lines: ['const node=0x7A', 'AUTH::scan()', 'if(trace<80)', 'packet.sync', '0b10110100', 'SIG:77-AF', 'route.mask()', 'await link'] },
    { left: '17%', width: 84, duration: 24, delay: -16.2, opacity: 0.22, lines: ['root.access', 'while(true)', 'mem[0x03FF]', 'decrypt.key', 'STREAM:ON', 'port.close()', 'hash::9F2C', 'signal.map'] },
    { left: '31%', width: 68, duration: 20, delay: -3.8, opacity: 0.28, lines: ['try{inject}', 'grid.rotate', 'TRACE=12.8', 'xor payload', 'NULL::exec', 'ping 13ms', 'cache.clean', 'link.blue'] },
    { left: '46%', width: 92, duration: 26, delay: -21.5, opacity: 0.2, lines: ['function breach()', 'return ACCESS', 'addr:139.41', 'socket.open', 'route[3]=ok', 'mask.active', 'seed:0xC0DE', 'emit(signal)'] },
    { left: '62%', width: 74, duration: 19, delay: -10.8, opacity: 0.3, lines: ['AUTH_TOKEN', 'wave.next()', 'trace.delta', 'fork daemon', 'ssl.strip', '0x00FFAA19', 'kill switch', 'exfil.ready'] },
    { left: '77%', width: 86, duration: 23, delay: -5.6, opacity: 0.24, lines: ['SELECT *', 'from logs', 'where ghost', 'proxy.chain', 'cipher.lock', 'route.bank', 'signal.red', 'bootleg API'] },
    { left: '91%', width: 64, duration: 17, delay: -13.1, opacity: 0.34, lines: ['ACK 200', 'SYN flood', 'memcpy()', 'host.null', 'grid[6x9]', 'chmod +x', 'port:443', 'safehouse'] },
];
const PROGRAM_RAIN_TEMPLATES = [
    (hex, node) => `auth.${node}.0x${hex}`,
    (hex, node) => `trace[${node}]=${hex}`,
    (hex) => `packet:${hex}.sync`,
    (hex) => `route.mask/${hex}`,
    (hex) => `SIG_${hex}_OK`,
    (hex) => `mem[0x${hex}]`,
    (hex) => `xor.key=${hex}`,
    (hex) => `port.${Number.parseInt(hex.slice(0, 2), 16)}`,
    (hex) => `await.${hex}.link`,
    (hex) => `NULL::${hex}`,
    (hex) => `daemon.${hex}`,
    (hex) => `grid.hash:${hex}`,
    (hex) => `cache.flush(${hex})`,
    (hex) => `cipher/${hex}`,
    (hex, node) => `${node}.proxy.${hex}`,
    (hex) => `exfil.${hex}.ready`,
];
function getProgramRainLine(columnIndex, lineIndex, globalTick, source, embedded) {
    const sourceCode = source.charCodeAt((lineIndex + columnIndex) % source.length);
    const cadence = embedded
        ? 2 + ((columnIndex * 3 + lineIndex * 5 + sourceCode) % 5)
        : 3 + ((columnIndex * 5 + lineIndex * 7 + sourceCode) % 6);
    const phase = columnIndex * 17 + lineIndex * 11 + sourceCode + (embedded ? 23 : 0);
    const localTick = Math.floor((globalTick + phase) / cadence);
    const value = (localTick * 4099 + columnIndex * 631 + lineIndex * 97 + sourceCode * 17) & 0xffff;
    const hex = value.toString(16).toUpperCase().padStart(4, '0');
    const node = source.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toLowerCase() || 'node';
    const template = PROGRAM_RAIN_TEMPLATES[(localTick * 7 + columnIndex * 5 + lineIndex * 3 + sourceCode) % PROGRAM_RAIN_TEMPLATES.length];
    return template(hex, node);
}
export function HackScreen() {
    const board = useGameStore((s) => s.board);
    const evalResult = useGameStore((s) => s.evalResult);
    const trace = useGameStore((s) => s.trace);
    const startedAt = useGameStore((s) => s.startedAt);
    const rotations = useGameStore((s) => s.rotations);
    const clearedAt = useGameStore((s) => s.clearedAt);
    const outcome = useGameStore((s) => s.outcome);
    const rotateCell = useGameStore((s) => s.rotateCell);
    const beginWave = useGameStore((s) => s.beginWave);
    const markTraced = useGameStore((s) => s.markTraced);
    const consumeFirewall = useGameStore((s) => s.consumeFirewall);
    const firewallAvailable = useGameStore((s) => s.firewallAvailable);
    const level = useGameStore((s) => s.hackLevel);
    const wavesCleared = useGameStore((s) => s.wavesCleared);
    const activeSkills = useGameStore((s) => s.activeSkills);
    const goHome = useGameStore((s) => s.goHome);
    const [now, setNow] = useState(performance.now());
    const [paused, setPaused] = useState(false);
    const [firewallSub, setFirewallSub] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [skillsOpen, setSkillsOpen] = useState(false);
    const [pauseOffsetMs, setPauseOffsetMs] = useState(0);
    const firewallSubRef = useRef(0);
    const pauseStartedRef = useRef(null);
    useEffect(() => {
        const onVis = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, []);
    const timingPaused = paused || menuOpen;
    useEffect(() => {
        const current = performance.now();
        if (timingPaused && pauseStartedRef.current === null) {
            pauseStartedRef.current = current;
            setNow(current);
        }
        if (!timingPaused && pauseStartedRef.current !== null) {
            const pausedFor = current - pauseStartedRef.current;
            pauseStartedRef.current = null;
            setPauseOffsetMs((offset) => offset + pausedFor);
            setNow(current);
        }
    }, [timingPaused]);
    useEffect(() => {
        let raf = 0;
        const loop = () => {
            if (!timingPaused)
                setNow(performance.now());
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [timingPaused]);
    useEffect(() => {
        setPauseOffsetMs(0);
        pauseStartedRef.current = null;
        setMenuOpen(false);
        setSkillsOpen(false);
    }, [startedAt]);
    useEffect(() => {
        if (outcome === 'clearing')
            playSfx('clear');
        if (outcome === 'traced')
            playSfx('fail');
    }, [outcome]);
    const elapsedMs = startedAt ? Math.max(0, (clearedAt ?? now) - startedAt - pauseOffsetMs) : 0;
    const elapsedSec = elapsedMs / 1000;
    const rawTrace = trace.initial + trace.baseRatePerSec * elapsedSec + rotations * trace.rotationCost;
    const traceValue = Math.min(100, rawTrace - firewallSub);
    const danger = traceValue >= 80;
    useEffect(() => {
        if (outcome !== 'pending')
            return;
        if (rawTrace >= 100 && firewallAvailable && firewallSubRef.current === 0) {
            const sub = rawTrace - 60;
            firewallSubRef.current = sub;
            setFirewallSub(sub);
            consumeFirewall();
            return;
        }
        if (traceValue >= 100)
            markTraced();
    }, [rawTrace, traceValue, outcome, firewallAvailable, consumeFirewall, markTraced]);
    useEffect(() => {
        if (!board && outcome === 'pending')
            beginWave();
    }, [board, beginWave, outcome]);
    useEffect(() => {
        if (outcome === 'pending')
            return;
        setMenuOpen(false);
        setSkillsOpen(false);
    }, [outcome]);
    if (!board) {
        return (_jsx("div", { className: "relative w-full h-full flex items-center justify-center bg-black text-[#4da3ff] font-mono overflow-hidden scanlines", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-[9px] tracking-[0.42em] text-[#4da3ff]/45 mb-3", children: "// TARGET_SYSTEM" }), _jsx("div", { className: "text-[18px] tracking-[0.22em] animate-flicker", children: "INITIALIZING" })] }) }));
    }
    const accentColor = danger ? '#ff4d6d' : '#4da3ff';
    const accentAlpha = danger ? 'rgba(255,77,109,' : 'rgba(77,163,255,';
    const handleCellTap = (cellIndex) => {
        const cell = board.cells[cellIndex];
        if (outcome !== 'pending' || !cell || cell.type === 'empty' || cell.fixed) {
            playSfx('blocked');
        }
        else {
            playSfx('rotate');
        }
        rotateCell(cellIndex);
    };
    const endRun = () => {
        setMenuOpen(false);
        setSkillsOpen(false);
        goHome();
    };
    return (_jsxs("div", { className: "relative w-full h-full flex flex-col font-mono overflow-hidden", style: { background: 'linear-gradient(180deg, #020611 0%, #040b15 42%, #010407 100%)' }, children: [_jsx("div", { className: "absolute inset-0 pointer-events-none z-[1]", style: {
                    backgroundImage: `
            radial-gradient(circle at 18% 10%, ${accentAlpha}0.18) 0, transparent 28%),
            radial-gradient(circle at 86% 34%, rgba(255,255,255,0.055) 0, transparent 24%),
            linear-gradient(${accentAlpha}0.055) 1px, transparent 1px),
            linear-gradient(90deg, ${accentAlpha}0.045) 1px, transparent 1px),
            repeating-linear-gradient(0deg, transparent 0, transparent 2px, ${accentAlpha}0.018) 2px, ${accentAlpha}0.018) 3px)
          `,
                    backgroundSize: '100% 100%, 100% 100%, 24px 24px, 24px 24px, 100% 3px',
                    backgroundPosition: '0 0',
                } }), _jsx("div", { className: "absolute inset-x-0 top-0 h-28 pointer-events-none z-[2]", style: {
                    background: `linear-gradient(180deg, ${accentAlpha}0.14) 0%, transparent 70%)`,
                } }), _jsx(ProgramRainBackground, { danger: danger }), danger && outcome === 'pending' && (_jsx("div", { className: "absolute inset-0 pointer-events-none z-30 danger-vignette" })), outcome !== 'cleared' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "shrink-0 relative z-10", style: {
                            padding: '7px 12px 5px',
                            borderBottom: `1px solid ${danger ? 'rgba(255,77,109,0.18)' : 'rgba(77,163,255,0.1)'}`,
                            background: `linear-gradient(180deg, rgba(3,12,28,0.95) 0%, rgba(2,8,18,0.72) 100%), linear-gradient(90deg, ${accentAlpha}0.12) 0%, transparent 45%, ${accentAlpha}0.08) 100%)`,
                            boxShadow: `0 1px 0 ${accentAlpha}0.14), 0 14px 34px rgba(0,0,0,0.35)`,
                        }, children: [_jsxs("div", { className: "flex items-start justify-between mb-1.5", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsxs("div", { className: "relative w-[7px] h-[7px] shrink-0 mt-[2px]", children: [_jsx("div", { className: "absolute inset-0 rounded-full", style: {
                                                            backgroundColor: accentColor,
                                                            opacity: 0.45,
                                                            animation: 'ping-once 1.4s ease-out infinite',
                                                        } }), _jsx("div", { className: "relative w-full h-full rounded-full", style: {
                                                            backgroundColor: accentColor,
                                                            boxShadow: `0 0 7px ${accentColor}`,
                                                        } })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[9px] tracking-[0.42em] mb-[2px]", style: { color: `${accentAlpha}0.48)` }, children: "// TARGET_SYSTEM" }), _jsxs("div", { className: "text-[15px] tracking-[0.16em] leading-none", style: {
                                                            color: danger ? '#ff4d6d' : 'rgba(255,255,255,0.9)',
                                                            textShadow: danger ? '0 0 14px rgba(255,77,109,0.55)' : `0 0 14px ${accentAlpha}0.18)`,
                                                        }, children: ["HACK ", _jsx("span", { style: { color: accentColor }, children: "#" }), String(level).padStart(3, '0')] })] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsxs("div", { className: "min-w-[50px] text-right px-1.5 py-0.5 border border-white/[0.06] bg-black/20", children: [_jsx("div", { className: "text-[8px] tracking-[0.28em] mb-[2px]", style: { color: 'rgba(255,255,255,0.2)' }, children: "ROTATE" }), _jsx("div", { className: "text-[12px] tabular-nums", style: { color: 'rgba(255,255,255,0.58)' }, children: String(rotations).padStart(2, '0') })] }), _jsxs("div", { className: "min-w-[58px] text-right px-1.5 py-0.5 border border-white/[0.06] bg-black/20", children: [_jsx("div", { className: "text-[8px] tracking-[0.28em] mb-[2px]", style: { color: 'rgba(255,255,255,0.2)' }, children: "ELAPSED" }), _jsxs("div", { className: "text-[12px] tabular-nums", style: { color: danger ? '#ff4d6d' : 'rgba(255,255,255,0.58)' }, children: [elapsedSec.toFixed(1), _jsx("span", { style: { color: 'rgba(255,255,255,0.25)' }, children: "s" })] })] }), outcome === 'pending' && (_jsx("button", { type: "button", "aria-label": "Open in-game menu", "aria-expanded": menuOpen, onClick: () => setMenuOpen((open) => !open), className: "relative h-[34px] w-[34px] shrink-0 active:brightness-125", style: {
                                                    border: `1px solid ${menuOpen ? `${accentAlpha}0.48)` : 'rgba(255,255,255,0.08)'}`,
                                                    background: menuOpen
                                                        ? `linear-gradient(180deg, ${accentAlpha}0.16), rgba(0,0,0,0.5))`
                                                        : 'rgba(0,0,0,0.28)',
                                                    boxShadow: menuOpen ? `0 0 14px ${accentAlpha}0.2)` : 'none',
                                                }, children: _jsx("span", { className: "absolute inset-0 flex flex-col items-center justify-center gap-[4px]", children: [0, 1, 2].map((line) => (_jsx("span", { "aria-hidden": "true", className: "block h-px w-[15px]", style: {
                                                            background: menuOpen ? accentColor : 'rgba(255,255,255,0.46)',
                                                            boxShadow: menuOpen ? `0 0 8px ${accentColor}` : 'none',
                                                        } }, line))) }) }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-[8px] tracking-[0.24em] shrink-0", style: { color: 'rgba(255,255,255,0.2)' }, children: "WAVE" }), _jsx("div", { className: "flex-1 flex gap-[3px]", children: Array.from({ length: WAVES_PER_STAGE }, (_, i) => {
                                            const isCurrent = i === wavesCleared;
                                            const isDone = i < wavesCleared;
                                            return (_jsx("div", { className: "relative overflow-hidden", style: {
                                                    flex: isCurrent ? '0 0 20px' : '0 0 8px',
                                                    height: 4,
                                                    transition: 'flex 0.3s ease',
                                                    background: isDone
                                                        ? 'rgba(77,163,255,0.45)'
                                                        : isCurrent
                                                            ? accentColor
                                                            : 'rgba(255,255,255,0.08)',
                                                    boxShadow: isCurrent ? `0 0 8px ${accentColor}` : 'none',
                                                }, children: isCurrent && outcome === 'pending' && (_jsx("div", { className: "absolute inset-0", style: {
                                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
                                                        animation: 'shimmer 1.6s linear infinite',
                                                    } })) }, i));
                                        }) }), _jsxs("span", { className: "text-[10px] tabular-nums shrink-0", style: { color: 'rgba(255,255,255,0.3)' }, children: [wavesCleared + 1, _jsxs("span", { style: { color: 'rgba(255,255,255,0.18)' }, children: ["/", WAVES_PER_STAGE] })] })] })] }), _jsx("div", { className: "shrink-0 px-2.5 py-1 relative z-10 border-b border-white/[0.04]", style: {
                            background: 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.05))',
                        }, children: _jsx(TraceBar, { value: traceValue, firewallAvailable: firewallAvailable }) }), _jsxs("div", { className: "flex-1 relative px-0.5 py-0.5 z-10 min-h-0", children: [_jsx("div", { className: "absolute inset-x-0.5 top-0.5 bottom-0.5 pointer-events-none", style: {
                                    border: `1px solid ${accentAlpha}0.18)`,
                                    boxShadow: `inset 0 0 40px rgba(0,0,0,0.38), 0 0 24px ${accentAlpha}0.08)`,
                                } }), _jsx(PuzzleCanvas, { board: board, evalResult: evalResult, onCellTap: handleCellTap, failed: outcome === 'traced', danger: danger, clearFlow: outcome === 'clearing' }), _jsx(ProgramRainBackground, { danger: danger, embedded: true }), outcome === 'pending' && (_jsx("div", { className: "absolute inset-0 pointer-events-none overflow-hidden z-[5]", children: _jsx("div", { style: {
                                        position: 'absolute',
                                        left: 6,
                                        right: 6,
                                        height: 72,
                                        background: `linear-gradient(to bottom, transparent, ${accentAlpha}0.055), transparent)`,
                                        animation: 'scanline-sweep 6s linear infinite',
                                    } }) })), outcome === 'traced' && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", style: { background: 'rgba(18,2,6,0.92)', backdropFilter: 'blur(6px)' }, children: _jsxs("div", { className: "text-center scan-in px-6", children: [_jsx("div", { className: "text-[9px] tracking-[0.45em] mb-3", style: { color: 'rgba(255,77,109,0.55)' }, children: "// TRACE_COMPLETE" }), _jsx("div", { className: "text-[44px] font-normal tracking-[0.15em] leading-none glitch", style: {
                                                color: '#ff4d6d',
                                                textShadow: '0 0 20px rgba(255,77,109,0.9), 0 0 50px rgba(255,77,109,0.45)',
                                            }, children: "TRACED" }), _jsx("div", { className: "text-[15px] tracking-[0.3em] mt-1 font-normal", style: { color: 'rgba(255,77,109,0.65)' }, children: "DEAD" }), _jsx("div", { className: "mt-4 mx-auto", style: {
                                                width: 80,
                                                height: 1,
                                                background: 'linear-gradient(90deg, transparent, rgba(255,77,109,0.4), transparent)',
                                            } })] }) })), paused && !menuOpen && outcome === 'pending' && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center", style: { background: 'rgba(2,8,18,0.92)' }, children: _jsx("div", { className: "text-[20px] tracking-[0.35em] animate-flicker", style: { textShadow: '0 0 12px rgba(255,255,255,0.4)' }, children: "[ PAUSED ]" }) }))] }), _jsx("div", { className: "shrink-0 relative z-10", style: {
                            padding: '2px 12px 3px',
                            minHeight: 22,
                            borderTop: `1px solid ${danger ? 'rgba(255,77,109,0.14)' : 'rgba(77,163,255,0.08)'}`,
                            background: 'linear-gradient(to top, rgba(2,6,14,0.85) 0%, transparent 100%)',
                        }, children: _jsxs("div", { className: "text-[9px] tracking-[0.12em]", children: [evalResult?.status === 'INVALID' && evalResult.detail.status === 'INVALID' && (_jsxs("span", { className: "glitch", style: { color: '#ff4d6d' }, children: ["! CONFLICT: ", evalResult.detail.reason.toUpperCase()] })), evalResult?.status === 'INCOMPLETE' && evalResult.detail.status === 'INCOMPLETE' && (_jsxs("span", { style: { color: 'rgba(255,255,255,0.35)' }, children: ["> MISSING: ", evalResult.detail.missingColors.join(', ').toUpperCase()] })), evalResult?.status === 'CLEAR' && (_jsx("span", { style: { color: '#4da3ff', textShadow: '0 0 6px rgba(77,163,255,0.55)' }, children: "> ALL SIGNALS LINKED \u00B7 EXTRACTING..." })), !evalResult && outcome === 'pending' && (_jsx("span", { style: { color: 'rgba(255,255,255,0.16)' }, children: "> AWAITING_INPUT" }))] }) }), outcome === 'pending' && menuOpen && (_jsx(InGameMenu, { activeSkills: activeSkills, skillsOpen: skillsOpen, accentColor: accentColor, danger: danger, onEndRun: endRun, onClose: () => setMenuOpen(false), onToggleSkills: () => setSkillsOpen((open) => !open) }))] })), outcome === 'cleared' && (_jsx(ClearedOverlay, {}))] }));
}
// ── Streaming program background ───────────────────────────────
function ProgramRainBackground({ danger, embedded = false }) {
    const [textTick, setTextTick] = useState(0);
    const color = danger
        ? embedded ? 'rgba(255,96,124,0.34)' : 'rgba(255,77,109,0.3)'
        : embedded ? 'rgba(110,235,255,0.32)' : 'rgba(85,230,255,0.26)';
    const glow = danger
        ? embedded ? 'rgba(255,77,109,0.42)' : 'rgba(255,77,109,0.3)'
        : embedded ? 'rgba(77,196,255,0.42)' : 'rgba(77,163,255,0.28)';
    useEffect(() => {
        const interval = window.setInterval(() => setTextTick((tick) => (tick + 1) % 8192), embedded ? 120 : 150);
        return () => window.clearInterval(interval);
    }, [embedded]);
    return (_jsx("div", { "aria-hidden": true, className: `absolute inset-0 pointer-events-none overflow-hidden ${embedded ? 'z-[4]' : 'z-[3]'}`, style: {
            opacity: embedded ? 0.42 : 0.96,
            mixBlendMode: 'screen',
            WebkitMaskImage: embedded
                ? 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
                : 'linear-gradient(to bottom, transparent 0%, black 9%, black 82%, transparent 100%)',
            maskImage: embedded
                ? 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
                : 'linear-gradient(to bottom, transparent 0%, black 9%, black 82%, transparent 100%)',
        }, children: PROGRAM_RAIN_COLUMNS.map((column, columnIndex) => (_jsx("div", { className: "absolute top-0", style: {
                left: column.left,
                width: column.width,
                color,
                opacity: embedded ? Math.min(0.56, column.opacity + 0.12) : column.opacity,
                fontSize: embedded ? (columnIndex % 2 === 0 ? 8 : 7.5) : (columnIndex % 2 === 0 ? 7.5 : 7),
                lineHeight: embedded ? 1.8 : 1.72,
                letterSpacing: embedded ? '0.09em' : '0.08em',
                textShadow: `0 0 ${embedded ? 14 : 10}px ${glow}`,
                animation: `hack-code-rain ${embedded ? column.duration * 0.92 : column.duration}s linear infinite`,
                animationDelay: `${column.delay}s`,
                willChange: 'transform',
            }, children: [...column.lines, ...column.lines, ...column.lines, ...column.lines].map((line, lineIndex) => (_jsx("div", { style: {
                    whiteSpace: 'nowrap',
                    opacity: lineIndex % 5 === 0 ? 0.55 : 1,
                }, children: getProgramRainLine(columnIndex, lineIndex, textTick, line, embedded) }, lineIndex))) }, column.left))) }));
}
function InGameMenu({ activeSkills, skillsOpen, accentColor, danger, onEndRun, onClose, onToggleSkills, }) {
    return (_jsx("div", { className: "absolute inset-0 z-40 flex items-center justify-center px-6 font-mono scan-in", style: {
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
        }, children: _jsxs("div", { className: "relative w-full max-w-[304px]", style: {
                border: `1px solid ${danger ? 'rgba(255,77,109,0.28)' : 'rgba(77,163,255,0.3)'}`,
                background: 'linear-gradient(180deg, rgba(3,12,28,0.98), rgba(0,0,0,0.93))',
                boxShadow: `0 20px 58px rgba(0,0,0,0.68), 0 0 34px ${danger ? 'rgba(255,77,109,0.12)' : 'rgba(77,163,255,0.16)'}`,
            }, children: [_jsxs("button", { type: "button", "aria-label": "Close in-game menu", onClick: onClose, className: "absolute right-2 top-2 h-8 w-8 active:brightness-125", style: {
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.025)',
                    }, children: [_jsx("span", { className: "absolute left-1/2 top-1/2 h-px w-[14px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white/60" }), _jsx("span", { className: "absolute left-1/2 top-1/2 h-px w-[14px] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-white/60" })] }), _jsxs("div", { className: "px-4 pb-3 pt-4 border-b border-white/[0.06]", children: [_jsx("div", { className: "text-[8px] tracking-[0.32em]", style: { color: `${danger ? 'rgba(255,77,109,' : 'rgba(77,163,255,'}0.58)` }, children: "// OPS_MENU" }), _jsx("div", { className: "mt-1 text-[17px] tracking-[0.18em] text-white/78", children: "SESSION PAUSED" }), _jsx("div", { className: "mt-1 text-[9px] tracking-[0.14em] text-white/30", children: "CLOCK HOLD \u00B7 TRACE SUSPENDED" })] }), _jsxs("div", { className: "p-3 space-y-2", children: [_jsxs("button", { type: "button", onClick: onToggleSkills, className: "w-full px-3 py-3 text-left border bg-white/[0.025] active:brightness-125", style: { borderColor: skillsOpen ? `${accentColor}66` : 'rgba(255,255,255,0.08)' }, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-[12px] tracking-[0.16em] text-white/82", children: "SKILL LIST" }), _jsx("span", { className: "text-[10px] tabular-nums", style: { color: accentColor }, children: activeSkills.length })] }), _jsx("div", { className: "mt-1 text-[8px] tracking-[0.12em] text-white/30", children: "ACQUIRED MODULES" })] }), skillsOpen && (_jsx("div", { className: "max-h-[190px] overflow-y-auto px-3 py-2", style: {
                                border: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(0,0,0,0.24)',
                            }, children: activeSkills.length === 0 ? (_jsx("div", { className: "py-3 text-center text-[9px] tracking-[0.16em] text-white/28", children: "NO MODULES ACTIVE" })) : (_jsx("div", { className: "space-y-2", children: activeSkills.map((id) => {
                                    const skill = SKILL_DEFS[id];
                                    return (_jsxs("div", { className: "pl-2", style: { borderLeft: `2px solid ${skill.color}` }, children: [_jsx("div", { className: "text-[10px] tracking-[0.14em]", style: { color: skill.color }, children: skill.name }), _jsx("div", { className: "mt-0.5 text-[8px] leading-relaxed text-white/35", children: skill.desc })] }, id));
                                }) })) })), _jsxs("button", { type: "button", onClick: onEndRun, className: "w-full px-3 py-3 text-left border active:brightness-125", style: {
                                borderColor: 'rgba(255,77,109,0.26)',
                                background: 'linear-gradient(90deg, rgba(255,77,109,0.13), rgba(255,77,109,0.025))',
                            }, children: [_jsx("div", { className: "text-[12px] tracking-[0.16em]", style: { color: '#ff4d6d' }, children: "END RUN" }), _jsx("div", { className: "mt-1 text-[8px] tracking-[0.12em] text-white/30", children: "RETURN TO HIDEOUT" })] })] })] }) }));
}
function ClearedOverlay() {
    return (_jsxs("div", { className: "absolute inset-0 z-50 overflow-hidden", style: {
            background: 'linear-gradient(180deg, #020814 0%, #030b17 48%, #010408 100%)',
            backdropFilter: 'blur(6px)',
        }, children: [_jsx("div", { className: "absolute inset-0 pointer-events-none", style: {
                    backgroundImage: `
            linear-gradient(rgba(77,163,255,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(77,163,255,0.04) 1px, transparent 1px),
            radial-gradient(circle at 18% 22%, rgba(77,163,255,0.13), transparent 30%),
            radial-gradient(circle at 84% 74%, rgba(255,77,109,0.08), transparent 26%)
          `,
                    backgroundSize: '24px 24px, 24px 24px, 100% 100%, 100% 100%',
                } }), _jsx("div", { className: "absolute inset-x-0 top-0 h-16 pointer-events-none", style: { background: 'linear-gradient(180deg, rgba(77,163,255,0.16), transparent)' } }), _jsxs("div", { className: "absolute inset-x-5 top-5", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 text-[8px] tracking-[0.24em]", children: [_jsx("span", { style: { color: 'rgba(77,163,255,0.54)' }, children: "// ACCESS_GRANTED" }), _jsx("span", { style: { color: 'rgba(255,255,255,0.22)' }, children: "TRACE 00.0" })] }), _jsx("div", { className: "mt-3 h-px", style: {
                            background: 'linear-gradient(90deg, rgba(77,163,255,0.4), rgba(255,255,255,0.06) 50%, rgba(77,163,255,0.22))',
                        } }), _jsx("div", { className: "mt-3 grid grid-cols-3 gap-1.5", children: CLEARED_TELEMETRY_CARDS.map((card, index) => (_jsxs("div", { className: "scan-in min-w-0 px-2 py-2", style: {
                                border: '1px solid rgba(77,163,255,0.12)',
                                background: 'linear-gradient(180deg, rgba(77,163,255,0.055), rgba(0,0,0,0.14))',
                                boxShadow: 'inset 0 0 18px rgba(77,163,255,0.035)',
                                animationDelay: `${index * 70}ms`,
                            }, children: [_jsx("div", { className: "text-[7px] tracking-[0.22em]", style: { color: 'rgba(255,255,255,0.2)' }, children: card.label }), _jsx("div", { className: "mt-1 text-[7px] tracking-[0.12em] truncate", style: { color: 'rgba(77,163,255,0.5)' }, children: card.value }), _jsx("div", { className: "mt-0.5 text-[7px] tracking-[0.1em] truncate", style: { color: 'rgba(255,255,255,0.16)' }, children: card.meta })] }, card.label))) })] }), _jsx("div", { className: "relative z-10 h-full flex items-center justify-center px-6", children: _jsxs("div", { className: "text-center scan-in w-full", children: [_jsx("div", { className: "text-[9px] tracking-[0.45em] mb-4", style: { color: 'rgba(77,163,255,0.52)' }, children: "// ACCESS_GRANTED" }), _jsx("div", { className: "text-[48px] font-normal tracking-[0.26em] leading-none glitch-title", "data-text": "NULL", style: { animation: 'neon-flicker 4s linear infinite' }, children: "NULL" }), _jsx("div", { className: "mt-5 text-[40px] font-normal tracking-[0.16em] leading-none glitch-title", "data-text": "ACCEPTED", style: { animation: 'neon-flicker 4s linear infinite' }, children: "ACCEPTED" }), _jsx("div", { className: "text-[9px] tracking-[0.3em] mt-5", style: { color: 'rgba(255,255,255,0.28)' }, children: "SECURITY :: NULLIFIED" }), _jsx("div", { className: "mt-4 mx-auto", style: {
                                width: 140,
                                height: 1,
                                background: 'linear-gradient(90deg, transparent, rgba(77,163,255,0.48), transparent)',
                            } })] }) }), _jsx("div", { className: "absolute inset-x-5 bottom-7 grid grid-cols-4 overflow-hidden", style: {
                    borderTop: '1px solid rgba(77,163,255,0.16)',
                    borderBottom: '1px solid rgba(77,163,255,0.08)',
                    background: 'linear-gradient(90deg, rgba(77,163,255,0.05), rgba(0,0,0,0.1), rgba(77,163,255,0.035))',
                }, children: CLEARED_STATUS_ROWS.map((row, index) => (_jsxs("div", { className: "px-1.5 py-2 min-w-0", style: {
                        borderLeft: index === 0 ? 'none' : '1px solid rgba(77,163,255,0.08)',
                    }, children: [_jsx("div", { className: "text-[7px] tracking-[0.16em] truncate", style: { color: 'rgba(255,255,255,0.18)' }, children: row.label }), _jsx("div", { className: "text-[8px] tracking-[0.12em] truncate", style: { color: 'rgba(77,163,255,0.46)', textShadow: '0 0 8px rgba(77,163,255,0.22)' }, children: row.value })] }, row.label))) })] }));
}
