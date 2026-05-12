import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { STAGES, RISK_COLOR } from '../data/stages';
import { useGameStore } from '../store/gameStore';
import { MapSelectionPulseEffects } from '../components/MapSelectionPulse';
// ─── Rank ─────────────────────────────────────────────────────────────────────
const HIDEOUT_EXIT_DELAY_MS = 560;
const RANK_TABLE = [
    { min: 0, label: 'UNKNOWN', color: 'rgba(200,200,220,0.45)' },
    { min: 1, label: 'OPERATIVE', color: '#4da3ff' },
    { min: 3, label: 'GHOST', color: '#4da3ff' },
    { min: 5, label: 'PHANTOM', color: '#ff7800' },
];
const getRank = (n) => [...RANK_TABLE].reverse().find(r => n >= r.min) ?? RANK_TABLE[0];
// ─── Hideout 3D Holographic UI ───────────────────────────────────────────────
const HIDEOUT_CODE_LINES = [
    'mount /hideout/sector7 --silent',
    'handshake: darknet.node::accepted',
    'scan contracts --filter=unlocked',
    'route market.gateway --masked',
    'sync operator.profile --rank',
    'trace residue: 00.02%',
    'vault cache: standby',
    'relay depth: 7 hops',
    'mesh latency: 13ms',
    'session integrity: nominal',
    'ghost channel: armed',
    'terminal compositor: online',
];
function HideoutCodeStream({ speed = 22, delay = 0, color = '#4da3ff', }) {
    const lines = [...HIDEOUT_CODE_LINES, ...HIDEOUT_CODE_LINES];
    return (_jsx("div", { style: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }, children: _jsx("div", { style: {
                animation: `hideout-code-scroll ${speed}s linear ${delay}s infinite`,
                fontFamily: 'monospace',
                fontSize: 5.4,
                lineHeight: 1.75,
                color: `${color}2f`,
                padding: '5px 7px',
                whiteSpace: 'nowrap',
            }, children: lines.map((line, i) => (_jsx("div", { children: line }, i))) }) }));
}
function HideoutGlassPanel({ tx, ty, tz, rx, ry, w, h, glow = 0.4, color = '#4da3ff', onClick, ariaLabel, pressed = false, disabled = false, children, }) {
    const [active, setActive] = useState(false);
    const isButton = Boolean(onClick);
    const isInteractive = isButton && !disabled;
    const effectColor = pressed ? '#ffffff' : color;
    const tone = (alpha) => `${effectColor}${Math.round(Math.max(0, Math.min(1, alpha)) * 255)
        .toString(16)
        .padStart(2, '0')}`;
    const lift = pressed
        ? 'translateY(1px) translateZ(30px) scale(0.985)'
        : active
            ? 'translateZ(24px) scale(1.018)'
            : '';
    const panelStyle = {
        position: 'absolute',
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        padding: 0,
        font: 'inherit',
        color: 'inherit',
        textAlign: 'left',
        appearance: 'none',
        cursor: isInteractive ? 'pointer' : 'default',
        pointerEvents: isInteractive ? 'auto' : 'none',
        transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) ${lift}`,
        background: pressed
            ? 'linear-gradient(145deg, rgba(255,255,255,0.26), rgba(255,255,255,0.1) 45%, rgba(0,0,0,0.16))'
            : `linear-gradient(145deg, ${color}${active ? '1f' : '12'}, rgba(0,10,24,0.24) 45%, rgba(0,0,0,0.16))`,
        border: `1px solid ${pressed ? 'rgba(255,255,255,0.92)' : active ? `${color}cc` : tone(glow)}`,
        boxShadow: active || pressed
            ? pressed
                ? '0 0 24px rgba(255,255,255,0.62), 0 0 70px rgba(255,255,255,0.2), inset 0 0 44px rgba(255,255,255,0.14)'
                : `0 0 24px ${color}58, 0 0 70px ${color}24, inset 0 0 44px ${color}12`
            : `0 0 16px ${tone(glow * 0.35)}, 0 0 44px ${tone(glow * 0.11)}, inset 0 0 38px ${tone(0.055)}`,
        overflow: 'hidden',
        transformStyle: 'preserve-3d',
        transition: isButton ? 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, filter 180ms ease' : undefined,
        filter: pressed ? 'grayscale(1) brightness(1.8) contrast(1.22)' : active ? 'brightness(1.25)' : 'none',
    };
    const content = (_jsxs(_Fragment, { children: [_jsx(HideoutCodeStream, { speed: 18 + Math.round(w / 18), delay: -(tx + ty) / 90, color: effectColor }), ['tl', 'tr', 'bl', 'br'].map((p) => (_jsx("div", { style: {
                    position: 'absolute',
                    width: 12,
                    height: 12,
                    ...(p[0] === 't' ? { top: 5 } : { bottom: 5 }),
                    ...(p[1] === 'l' ? { left: 5 } : { right: 5 }),
                    borderTop: p[0] === 't' ? `1px solid ${effectColor}dd` : undefined,
                    borderBottom: p[0] === 'b' ? `1px solid ${effectColor}dd` : undefined,
                    borderLeft: p[1] === 'l' ? `1px solid ${effectColor}dd` : undefined,
                    borderRight: p[1] === 'r' ? `1px solid ${effectColor}dd` : undefined,
                } }, p))), _jsx("div", { style: {
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: `radial-gradient(ellipse at 50% 42%, ${tone(0.09)}, transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.045), transparent 36%, ${tone(0.05)} 72%, transparent)`,
                } }), children] }));
    if (onClick) {
        return (_jsx("button", { type: "button", "aria-label": ariaLabel, disabled: disabled, className: pressed ? 'hideout-button-exit' : undefined, onClick: onClick, onMouseEnter: () => setActive(true), onMouseLeave: () => setActive(false), onFocus: () => setActive(true), onBlur: () => setActive(false), style: panelStyle, children: content }));
    }
    return (_jsx("div", { style: panelStyle, children: content }));
}
function HideoutBoardButtonPreview({ available, }) {
    const stage = STAGES[0];
    const riskColor = RISK_COLOR[stage.risk];
    const targetName = stage.name.split('·')[0].trim().toUpperCase();
    return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                    position: 'absolute',
                    left: 18,
                    top: 16,
                    fontSize: 8,
                    color: 'rgba(77,163,255,0.92)',
                    letterSpacing: '0.22em',
                }, children: "// DARKNET BOARD" }), _jsxs("div", { style: {
                    position: 'absolute',
                    right: 18,
                    top: 14,
                    textAlign: 'right',
                    fontSize: 6.5,
                    color: 'rgba(255,255,255,0.24)',
                    letterSpacing: '0.18em',
                }, children: ["AVAILABLE", _jsxs("span", { style: { display: 'block', color: '#4da3ff', fontSize: 13, letterSpacing: '0.03em', marginTop: 2 }, children: [available, _jsx("span", { style: { fontSize: 8, color: 'rgba(255,255,255,0.32)', marginLeft: 3 }, children: "TARGETS" })] })] }), _jsxs("svg", { viewBox: "0 0 282 154", "aria-hidden": true, style: {
                    position: 'absolute',
                    inset: 0,
                    width: 282,
                    height: 154,
                    overflow: 'hidden',
                }, children: [_jsx("defs", { children: _jsxs("radialGradient", { id: "hideout-board-map-core", cx: "50%", cy: "50%", r: "58%", children: [_jsx("stop", { offset: "0%", stopColor: riskColor, stopOpacity: "0.2" }), _jsx("stop", { offset: "65%", stopColor: riskColor, stopOpacity: "0.05" }), _jsx("stop", { offset: "100%", stopColor: riskColor, stopOpacity: "0" })] }) }), _jsx("rect", { x: "22", y: "39", width: "238", height: "72", fill: "url(#hideout-board-map-core)", opacity: "0.8" }), _jsx("text", { x: "24", y: "51", fontSize: "6.5", letterSpacing: "0.9", fill: "rgba(255,255,255,0.18)", fontFamily: "monospace", children: "N35\u00B044" }), _jsx("text", { x: "168", y: "104", fontSize: "6.5", letterSpacing: "0.9", fill: "rgba(255,255,255,0.14)", fontFamily: "monospace", children: "E139\u00B041" }), [
                        [54, 91],
                        [230, 61],
                        [205, 105],
                    ].map(([x, y]) => (_jsxs("g", { opacity: "0.42", children: [_jsx("circle", { cx: x, cy: y, r: "8", fill: "rgba(4,9,18,0.9)", stroke: riskColor, strokeWidth: "0.8" }), _jsx("circle", { cx: x, cy: y, r: "2.8", fill: riskColor, opacity: "0.7" })] }, `${x}-${y}`))), _jsxs("g", { transform: "translate(141 76)", children: [_jsx(MapSelectionPulseEffects, { cx: 0, cy: 0, color: riskColor, nodeId: stage.id, selected: true, showSelectionRing: true }), _jsx("line", { x1: "0", y1: "-13", x2: "0", y2: "-19", stroke: riskColor, strokeWidth: "0.8", strokeOpacity: "0.7" }), _jsx("circle", { cx: 0, cy: 0, r: 13, fill: `${riskColor}28`, stroke: riskColor, strokeWidth: 2, strokeOpacity: 1 }), _jsx("circle", { cx: 0, cy: 0, r: 4.5, fill: riskColor }), _jsx("text", { x: "0", y: "28", textAnchor: "middle", fontSize: "7.5", letterSpacing: "0.6", fontFamily: "monospace", fill: "rgba(255,255,255,0.65)", children: targetName.slice(0, 14) }), _jsx("circle", { cx: 11, cy: -11, r: 3.5, fill: "#00e676", stroke: "rgba(0,0,0,0.4)", strokeWidth: 0.8, children: _jsx("animate", { attributeName: "fill-opacity", values: "1;0.15;1", dur: "1.2s", repeatCount: "indefinite", calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.4 0 0.6 1;0.4 0 0.6 1" }) })] })] }), _jsxs("div", { style: {
                    position: 'absolute',
                    left: 18,
                    right: 18,
                    bottom: 17,
                    paddingTop: 9,
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }, children: [_jsx("div", { style: { width: 5, height: 5, borderRadius: '50%', background: '#4da3ff', boxShadow: '0 0 7px #4da3ff' } }), _jsx("div", { style: { fontSize: 7, color: 'rgba(77,163,255,0.78)', letterSpacing: '0.28em' }, children: "// TARGET_LOCKED" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }, children: [_jsx("div", { style: { fontSize: 12, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.12em' }, children: "DARKNET BOARD" }), _jsx("div", { style: { fontSize: 8, color: '#4da3ff', letterSpacing: '0.2em' }, children: stage.risk })] })] })] }));
}
function HideoutMarketButtonPreview({ coins, intelCount, }) {
    const marketColor = '#ff7800';
    const signalColor = '#4da3ff';
    const creditLevel = Math.min(5, Math.max(1, Math.ceil(coins / 600)));
    const fileLevel = Math.min(4, Math.max(1, intelCount || 1));
    const optionSlots = [
        { label: 'HEAT', price: '450', color: marketColor },
        { label: 'ROUTE', price: '900', color: signalColor },
        { label: 'CACHE', price: '980', color: '#b44fff' },
        { label: 'COLD', price: '560', color: '#9bff5d' },
        { label: 'WALL', price: '760', color: marketColor },
        { label: 'TORQ', price: '520', color: signalColor },
    ];
    return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                    position: 'absolute',
                    left: 18,
                    top: 17,
                    fontSize: 8,
                    color: 'rgba(255,120,0,0.92)',
                    letterSpacing: '0.22em',
                }, children: "// BLACK MARKET" }), _jsxs("div", { style: {
                    position: 'absolute',
                    right: 18,
                    top: 14,
                    textAlign: 'right',
                    fontSize: 6.5,
                    color: 'rgba(255,255,255,0.24)',
                    letterSpacing: '0.18em',
                }, children: ["BALANCE", _jsxs("span", { style: { display: 'block', color: signalColor, fontSize: 13, letterSpacing: '0.03em', marginTop: 2 }, children: [coins.toLocaleString(), _jsx("span", { style: { fontSize: 8, marginLeft: 2 }, children: "\u00A2" })] })] }), _jsxs("svg", { viewBox: "0 0 282 154", "aria-hidden": true, style: {
                    position: 'absolute',
                    inset: 0,
                    width: 282,
                    height: 154,
                    overflow: 'hidden',
                }, children: [_jsxs("defs", { children: [_jsxs("radialGradient", { id: "hideout-market-shop-core", cx: "50%", cy: "52%", r: "68%", children: [_jsx("stop", { offset: "0%", stopColor: marketColor, stopOpacity: "0.2" }), _jsx("stop", { offset: "54%", stopColor: marketColor, stopOpacity: "0.07" }), _jsx("stop", { offset: "100%", stopColor: marketColor, stopOpacity: "0" })] }), _jsxs("linearGradient", { id: "hideout-market-panel-line", x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [_jsx("stop", { offset: "0%", stopColor: marketColor, stopOpacity: "0" }), _jsx("stop", { offset: "48%", stopColor: marketColor, stopOpacity: "0.82" }), _jsx("stop", { offset: "100%", stopColor: marketColor, stopOpacity: "0" })] })] }), _jsx("rect", { x: "22", y: "38", width: "238", height: "76", fill: "url(#hideout-market-shop-core)", opacity: "0.9" }), _jsx("path", { d: "M48 47 H234", stroke: "url(#hideout-market-panel-line)", strokeWidth: "1", strokeOpacity: "0.58" }), _jsx("path", { d: "M48 106 H234", stroke: "url(#hideout-market-panel-line)", strokeWidth: "1", strokeOpacity: "0.46" }), _jsxs("g", { transform: "translate(49 49)", children: [_jsx("text", { x: "0", y: "0", fontSize: "5.8", letterSpacing: "1", fill: "rgba(255,255,255,0.28)", fontFamily: "monospace", children: "SELECT_STOCK" }), _jsx("text", { x: "185", y: "0", textAnchor: "end", fontSize: "5.8", letterSpacing: "0.9", fill: "rgba(255,120,0,0.46)", fontFamily: "monospace", children: "6 OPTIONS" }), optionSlots.map((item, i) => {
                                const x = (i % 2) * 96;
                                const y = 9 + Math.floor(i / 2) * 15;
                                const listed = i < Math.min(6, creditLevel + fileLevel);
                                const selected = i === 1;
                                return (_jsxs("g", { transform: `translate(${x} ${y})`, children: [_jsx("path", { d: "M0 0 H78 L86 7 V13 H0 Z", fill: selected ? `${item.color}24` : 'rgba(2,7,15,0.76)', stroke: String(item.color), strokeWidth: selected ? 1 : 0.72, strokeOpacity: listed ? (selected ? 0.88 : 0.52) : 0.2 }), _jsx("rect", { x: "5", y: "4", width: "6", height: "5", fill: String(item.color), opacity: listed ? 0.78 : 0.24 }), _jsx("text", { x: "16", y: "8.8", fontSize: "6", letterSpacing: "0.62", fill: listed ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.24)', fontFamily: "monospace", children: item.label }), _jsx("text", { x: "70", y: "8.8", textAnchor: "end", fontSize: "5.6", letterSpacing: "0.45", fill: listed ? String(item.color) : 'rgba(255,255,255,0.2)', fontFamily: "monospace", children: item.price }), selected && (_jsx("path", { d: "M80 4 L86 7 L80 10", fill: "none", stroke: marketColor, strokeWidth: "0.9", strokeOpacity: "0.95" }))] }, item.label));
                            })] }), _jsx("text", { x: "141", y: "116", textAnchor: "middle", fontSize: "6.2", letterSpacing: "1.1", fill: "rgba(255,120,0,0.42)", fontFamily: "monospace", children: "PERMANENT EQUIPMENT" })] }), _jsxs("div", { style: {
                    position: 'absolute',
                    left: 18,
                    right: 18,
                    bottom: 17,
                    paddingTop: 9,
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }, children: [_jsx("div", { style: { width: 5, height: 5, background: marketColor, boxShadow: `0 0 7px ${marketColor}` } }), _jsx("div", { style: { fontSize: 7, color: 'rgba(255,120,0,0.78)', letterSpacing: '0.28em' }, children: "// GEAR_VENDOR" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }, children: [_jsx("div", { style: { fontSize: 12, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.12em' }, children: "BLACK MARKET" }), _jsxs("div", { style: { fontSize: 8, color: signalColor, letterSpacing: '0.18em', whiteSpace: 'nowrap' }, children: [intelCount, " FILES"] })] })] })] }));
}
function HideoutBackgroundScene({ mouse }) {
    const driftX = mouse.x * -18;
    const driftY = mouse.y * -10;
    return (_jsx("div", { style: {
            position: 'absolute',
            inset: 0,
            perspective: '720px',
            perspectiveOrigin: '46% 37%',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.74,
            filter: 'blur(2.4px) saturate(1.08)',
        }, children: _jsxs("div", { style: {
                position: 'absolute',
                left: '46%',
                top: '38%',
                transformStyle: 'preserve-3d',
                transform: `translateX(${driftX}px) translateY(${driftY}px)`,
                animation: 'hideout-bg-drift 19s ease-in-out infinite',
                transition: 'transform 0.12s linear',
            }, children: [_jsx(HideoutGlassPanel, { tx: -178, ty: -88, tz: -65, rx: 6, ry: 40, w: 238, h: 318, glow: 0.28 }), _jsx(HideoutGlassPanel, { tx: 118, ty: -68, tz: -190, rx: 8, ry: -40, w: 218, h: 278, glow: 0.2 }), _jsx(HideoutGlassPanel, { tx: -238, ty: -58, tz: -215, rx: 10, ry: 58, w: 188, h: 255, glow: 0.16 }), _jsx(HideoutGlassPanel, { tx: 48, ty: -30, tz: -470, rx: 4, ry: 7, w: 208, h: 138, glow: 0.13 }), _jsx(HideoutGlassPanel, { tx: 208, ty: 88, tz: 45, rx: 15, ry: -30, w: 165, h: 118, glow: 0.22 }), _jsx(HideoutGlassPanel, { tx: -18, ty: -248, tz: -55, rx: 72, ry: 6, w: 320, h: 195, glow: 0.13 }), _jsx("div", { style: {
                        position: 'absolute',
                        width: 380,
                        height: 160,
                        marginLeft: -190,
                        marginTop: -80,
                        transform: 'translateX(-10px) translateY(220px) translateZ(-95px) rotateX(-70deg) rotateY(-8deg)',
                        background: 'radial-gradient(ellipse at 50% 50%, rgba(77,163,255,0.18), rgba(77,163,255,0.05) 46%, transparent 74%)',
                        filter: 'blur(16px)',
                        opacity: 0.58,
                    } })] }) }));
}
function HideoutHologramDeck({ available, coins, intelCount, mouse, exiting = false, pressedTarget = null, onOpenBoard, onOpenMarket, }) {
    const driftX = mouse.x * -12;
    const driftY = mouse.y * -8;
    return (_jsx("div", { style: {
            position: 'absolute',
            inset: 0,
            perspective: '840px',
            perspectiveOrigin: '50% 48%',
            pointerEvents: exiting ? 'none' : 'auto',
            zIndex: 10,
        }, children: _jsx("div", { style: {
                position: 'absolute',
                left: '50%',
                top: '49%',
                transformStyle: 'preserve-3d',
                transform: `translateX(${driftX}px) translateY(${driftY}px) scale(1.04)`,
                transition: 'transform 0.12s linear',
            }, children: _jsxs("div", { style: { position: 'absolute', transformStyle: 'preserve-3d', animation: 'hideout-scene-drift 18s ease-in-out infinite' }, children: [_jsx(HideoutGlassPanel, { tx: 0, ty: -108, tz: -86, rx: 6, ry: -8, w: 282, h: 154, glow: 0.52, onClick: onOpenBoard, ariaLabel: "Open darknet board", pressed: pressedTarget === 'board', disabled: exiting, children: _jsx(HideoutBoardButtonPreview, { available: available }) }), _jsx(HideoutGlassPanel, { tx: 0, ty: 100, tz: -112, rx: 7, ry: 8, w: 282, h: 154, glow: 0.46, color: "#ff7800", onClick: onOpenMarket, ariaLabel: "Open black market", pressed: pressedTarget === 'market', disabled: exiting, children: _jsx(HideoutMarketButtonPreview, { coins: coins, intelCount: intelCount }) })] }) }) }));
}
// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export function HomeScreen() {
    const completedStages = useGameStore((s) => s.completedStages);
    const coins = useGameStore((s) => s.coins);
    const intel = useGameStore((s) => s.intel);
    const goTitle = useGameStore((s) => s.goTitle);
    const set = useGameStore.setState;
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [entered, setEntered] = useState(false);
    const [exitingTo, setExitingTo] = useState(null);
    const containerRef = useRef(null);
    const exitTimerRef = useRef(0);
    const rank = getRank(completedStages.length);
    const available = STAGES.filter(s => completedStages.length >= s.requiredCompleted).length;
    useEffect(() => {
        const t = setTimeout(() => setEntered(true), 80);
        return () => clearTimeout(t);
    }, []);
    useEffect(() => () => clearTimeout(exitTimerRef.current), []);
    const handleMouseMove = useCallback((e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect)
            return;
        setMouse({
            x: (e.clientX - rect.left) / rect.width - 0.5,
            y: (e.clientY - rect.top) / rect.height - 0.5,
        });
    }, []);
    const px = (depth) => ({
        transform: `translate(${mouse.x * depth * -1}px, ${mouse.y * depth * -0.6}px)`,
        transition: 'transform 0.12s linear',
    });
    function goToWithExit(key) {
        if (exitingTo)
            return;
        setExitingTo(key);
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = window.setTimeout(() => set({ screen: key }), HIDEOUT_EXIT_DELAY_MS);
    }
    return (_jsxs("div", { ref: containerRef, onMouseMove: handleMouseMove, className: "relative w-full h-full overflow-hidden select-none font-mono", style: { background: '#020812' }, children: [_jsx("style", { children: `
        @keyframes sp-flicker { 0%,100%{opacity:1} 91%{opacity:.82} 93%{opacity:.1} 95%{opacity:1} 97%{opacity:.65} }
        @keyframes sp-room-in { from{opacity:0;filter:blur(6px) brightness(0.15)} to{opacity:1;filter:blur(0) brightness(1)} }
        @keyframes sp-hud-in  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sp-scan    { from{transform:translateY(-100%)} to{transform:translateY(120vh)} }
        @keyframes sp-pulse   { 0%,100%{opacity:.45} 50%{opacity:1} }
        @keyframes hideout-scene-drift {
          0%   { transform: rotateY(-5deg) rotateX(2deg) translateZ(-18px); }
          50%  { transform: rotateY(4deg) rotateX(-1.5deg) translateZ(18px); }
          100% { transform: rotateY(-5deg) rotateX(2deg) translateZ(-18px); }
        }
        @keyframes hideout-bg-drift {
          0%   { transform: rotateY(-4deg) rotateX(2deg) translateZ(-18px); }
          50%  { transform: rotateY(4deg) rotateX(-2.2deg) translateZ(22px); }
          100% { transform: rotateY(-4deg) rotateX(2deg) translateZ(-18px); }
        }
        @keyframes hideout-code-scroll {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @keyframes hideout-button-white-out {
          0%   { opacity:1; filter:grayscale(1) brightness(1.45) contrast(1.2); clip-path:inset(0); }
          8%   { opacity:1; filter:grayscale(1) brightness(2.1) contrast(1.65); clip-path:inset(0 0 0 0); }
          13%  { opacity:0.94; filter:grayscale(1) brightness(2.5) contrast(2.1); clip-path:inset(12% 0 0 0); }
          19%  { opacity:1; filter:grayscale(1) brightness(1.9) contrast(1.75); clip-path:inset(0 0 26% 0); }
          28%  { opacity:0.8; filter:grayscale(1) brightness(2.55) contrast(2.3); clip-path:inset(42% 0 8% 0); }
          38%  { opacity:0.62; filter:grayscale(1) brightness(1.9) contrast(2); clip-path:inset(0 0 56% 0); }
          52%  { opacity:0.36; filter:grayscale(1) brightness(2.65) contrast(2.6); clip-path:inset(68% 0 0 0); }
          68%  { opacity:0.12; filter:grayscale(1) brightness(0.9) contrast(1.8); clip-path:inset(0 0 88% 0); }
          100% { opacity:0; filter:grayscale(1) brightness(0.3) contrast(1.1); clip-path:inset(100% 0 0 0); }
        }
        @keyframes hideout-blackout {
          0%,54% { opacity:0; }
          100%   { opacity:1; }
        }
        .hideout-button-exit {
          animation: hideout-button-white-out 420ms steps(1, end) 60ms forwards;
          pointer-events: none;
        }
        .hideout-blackout {
          animation: hideout-blackout ${HIDEOUT_EXIT_DELAY_MS}ms ease-in forwards;
        }
      ` }), _jsx("div", { style: {
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: 'radial-gradient(ellipse 88% 62% at 46% 37%, rgba(0,30,80,0.4) 0%, rgba(0,12,35,0.14) 55%, transparent 80%)',
                } }), _jsxs("div", { style: {
                    position: 'absolute', inset: 0,
                    animation: entered ? 'sp-room-in 1.3s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
                    opacity: entered ? undefined : 0,
                }, children: [_jsx(HideoutBackgroundScene, { mouse: mouse }), _jsx("div", { style: {
                            position: 'absolute', top: '20%',
                            transform: `translateX(calc(-50% + ${mouse.x * -4}px)) translateY(${mouse.y * -2.4}px)`,
                            left: '50%', width: '68%', height: '48%', pointerEvents: 'none',
                            background: 'radial-gradient(ellipse at 50% 55%, rgba(77,163,255,0.09), rgba(77,163,255,0.025) 44%, transparent 76%)',
                            animation: 'sp-pulse 5s ease-in-out infinite',
                            transition: 'transform 0.12s linear',
                        } }), _jsx(HideoutHologramDeck, { available: available, coins: coins, intelCount: intel.length, mouse: mouse, exiting: Boolean(exitingTo), pressedTarget: exitingTo === 'stage_select'
                            ? 'board'
                            : exitingTo === 'shop'
                                ? 'market'
                                : null, onOpenBoard: () => goToWithExit('stage_select'), onOpenMarket: () => goToWithExit('shop') }), _jsx("div", { style: {
                            position: 'absolute', top: '14%', left: 0, width: '28%', height: '72%',
                            background: 'linear-gradient(to right, rgba(77,163,255,0.08), transparent)',
                            pointerEvents: 'none', ...px(3),
                        } }), _jsx("div", { style: {
                            position: 'absolute', top: '14%', right: 0, width: '28%', height: '72%',
                            background: 'linear-gradient(to left, rgba(255,120,0,0.08), transparent)',
                            pointerEvents: 'none', ...px(3),
                        } })] }), _jsx("div", { style: {
                    position: 'absolute', inset: 0, zIndex: 44, pointerEvents: 'none',
                    boxShadow: 'inset 0 0 130px rgba(0,0,0,0.88), inset 0 0 55px rgba(0,0,0,0.55)',
                } }), _jsxs("div", { style: {
                    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
                    padding: '11px 15px',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.82), transparent)',
                    borderBottom: '1px solid rgba(77,163,255,0.06)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    animation: entered ? 'sp-hud-in 0.6s 0.3s ease forwards' : 'none',
                    opacity: 0,
                }, children: [_jsxs("div", { children: [_jsx("button", { onClick: goTitle, disabled: Boolean(exitingTo), style: {
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                    fontSize: 9, letterSpacing: '0.18em', color: '#ffffff',
                                    fontFamily: 'monospace',
                                }, onMouseEnter: e => (e.currentTarget.style.color = '#ffffff'), onMouseLeave: e => (e.currentTarget.style.color = '#ffffff'), children: "\u2190 EXIT" }), _jsx("div", { style: { marginTop: 4, fontSize: 7, color: 'rgba(77,163,255,0.3)', letterSpacing: '0.3em' }, children: "// HIDEOUT TERMINAL" })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }, children: [_jsx("div", { style: {
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: rank.color, boxShadow: `0 0 7px ${rank.color}`,
                                            animation: 'sp-flicker 3.5s infinite',
                                        } }), _jsx("span", { style: { fontSize: 9, letterSpacing: '0.22em', color: rank.color, fontFamily: 'monospace' }, children: rank.label })] }), _jsxs("div", { style: { fontSize: 7.5, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginTop: 3, fontFamily: 'monospace' }, children: [completedStages.length, " / ", STAGES.length, " MISSIONS"] })] })] }), _jsxs("div", { style: {
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
                    padding: '7px 15px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    borderTop: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }, children: [_jsx("div", { style: { fontSize: 7, color: 'rgba(255,255,255,0.09)', letterSpacing: '0.3em', fontFamily: 'monospace' }, children: "v0.1.4 \u00B7 NULLIFIER" }), _jsxs("div", { style: { fontSize: 7, color: 'rgba(255,255,255,0.09)', letterSpacing: '0.2em', fontFamily: 'monospace' }, children: [available, " NODES ACTIVE"] })] }), exitingTo && (_jsx("div", { className: "absolute inset-0 z-[80] pointer-events-none hideout-blackout", style: { background: '#000', opacity: 0 } }))] }));
}
