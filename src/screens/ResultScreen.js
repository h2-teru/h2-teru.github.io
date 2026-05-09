import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLOR, INTEL_TYPE_LABEL } from '../game/market';
import { CtaButton } from '../components/CtaButton';
const SUCCESS_RESULT_REVEAL_DELAY_MS = 1680;
export function ResultScreen() {
    const outcome = useGameStore((s) => s.outcome);
    const level = useGameStore((s) => s.hackLevel);
    const rotations = useGameStore((s) => s.rotations);
    const startedAt = useGameStore((s) => s.startedAt);
    const clearedAt = useGameStore((s) => s.clearedAt);
    const pendingReward = useGameStore((s) => s.pendingReward);
    const next = useGameStore((s) => s.next);
    const success = outcome === 'stage_cleared';
    const elapsed = startedAt ? ((clearedAt ?? performance.now()) - startedAt) / 1000 : 0;
    const credits = pendingReward?.coins ?? (success ? Math.max(50, Math.round(800 / Math.max(elapsed, 5)) * level * 10) : 0);
    const acquiredIntel = pendingReward?.intel ?? [];
    const [visible, setVisible] = useState(!success);
    useEffect(() => {
        if (!success) {
            setVisible(true);
            return;
        }
        setVisible(false);
        const t = setTimeout(() => setVisible(true), SUCCESS_RESULT_REVEAL_DELAY_MS);
        return () => clearTimeout(t);
    }, [success]);
    // クレジットカウントアップ
    const [displayCredits, setDisplayCredits] = useState(0);
    useEffect(() => {
        if (!success || !visible)
            return;
        const duration = 1400;
        const start = performance.now();
        let rafId = 0;
        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplayCredits(Math.round(eased * credits));
            if (t < 1)
                rafId = requestAnimationFrame(tick);
        };
        setDisplayCredits(0);
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [success, visible, credits]);
    return (_jsxs("div", { className: "relative w-full h-full flex flex-col bg-black text-white font-mono overflow-hidden scanlines", style: success ? {} : { background: '#0a0004' }, children: [!success && (_jsx("div", { className: "absolute inset-0 pointer-events-none z-0", style: { boxShadow: 'inset 0 0 100px rgba(255,77,109,0.25)' } })), _jsx("div", { className: `result-scroll relative z-10 h-full min-h-0 overflow-hidden transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`, children: _jsxs("div", { className: "result-inner flex h-full min-h-0 flex-col", children: [_jsx("div", { className: "result-hero scan-in", children: success ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-[10px] text-[#4da3ff]/50 tracking-[0.35em] mb-2", children: "// MISSION_COMPLETE" }), _jsx("div", { className: "leading-none font-normal tracking-[0.15em] glitch-title", "data-text": "NULLIFIED", style: {
                                            fontSize: 'clamp(34px, 12vw, 52px)',
                                            animation: 'neon-flicker 4s linear infinite',
                                        }, children: "NULLIFIED" }), _jsx("div", { className: "text-[11px] text-white/35 mt-2.5 tracking-[0.15em]", children: "ALL BARRIERS DOWN \u00B7 MISSION COMPLETE" }), _jsxs("div", { className: "result-reward mt-6 value-flash", children: [_jsx("div", { className: "text-[9px] text-white/30 tracking-[0.3em] mb-1", children: "REWARD" }), _jsxs("div", { className: "leading-none font-normal tabular-nums", style: {
                                                    fontSize: 'clamp(32px, 10vw, 44px)',
                                                    color: '#4da3ff',
                                                    textShadow: '0 0 18px rgba(77,163,255,0.75), 0 0 40px rgba(77,163,255,0.35)',
                                                }, children: [displayCredits.toLocaleString(), _jsx("span", { className: "ml-1", style: { fontSize: 'clamp(16px, 5vw, 22px)' }, children: "\u00A2" })] })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-[10px] tracking-[0.35em] mb-2", style: { color: 'rgba(255,77,109,0.55)' }, children: "// TRACE_COMPLETE" }), _jsx("div", { className: "leading-none font-normal tracking-[0.12em] glitch", style: {
                                            fontSize: 'clamp(34px, 12vw, 52px)',
                                            color: '#ff4d6d',
                                            textShadow: '0 0 20px rgba(255,77,109,0.9), 0 0 50px rgba(255,77,109,0.45)',
                                        }, children: "TRACED" }), _jsx("div", { className: "leading-none font-normal tracking-[0.25em] mt-1", style: {
                                            fontSize: 'clamp(18px, 6vw, 26px)',
                                            color: 'rgba(255,77,109,0.65)',
                                        }, children: "DEAD" }), _jsx("div", { className: "text-[11px] text-white/30 mt-2.5 tracking-[0.12em]", children: "SENTINEL HAS LOCATED YOU \u00B7 RUN TERMINATED" })] })) }), _jsxs("div", { className: "result-stats mt-5 grid grid-cols-2 gap-[6px]", children: [_jsx(StatCell, { label: "MISSION", value: `#${String(level).padStart(3, '0')}` }), _jsx(StatCell, { label: "LAST WAVE", value: `${elapsed.toFixed(1)}s` }), _jsx(StatCell, { label: "ROTATIONS", value: String(rotations) }), success && (_jsx(StatCell, { label: "EFFICIENCY", value: `${Math.round(800 / Math.max(elapsed, 5))}x`, accent: true })), !success && (_jsx(StatCell, { label: "REWARD", value: "0 \u00A2", danger: true }))] }), success && acquiredIntel.length > 0 && (_jsxs("div", { className: "result-intel mt-5", children: [_jsx("div", { className: "text-[9px] tracking-[0.28em] text-white/25 mb-2", children: "// INTEL ACQUIRED" }), _jsx("div", { className: "flex flex-col gap-1.5", children: acquiredIntel.map(item => (_jsxs("div", { className: "result-intel-row flex items-center gap-2 px-3 py-2", style: {
                                            background: 'rgba(255,120,0,0.05)',
                                            border: '1px solid rgba(255,120,0,0.18)',
                                            borderRadius: 3,
                                        }, children: [_jsx("div", { className: "text-[6px] tracking-[0.15em] px-1.5 py-0.5 border rounded", style: {
                                                    color: RARITY_COLOR[item.rarity],
                                                    borderColor: RARITY_COLOR[item.rarity] + '44',
                                                }, children: INTEL_TYPE_LABEL[item.type] }), _jsx("div", { className: "flex-1 text-[10px] text-white/70 tracking-wide truncate", children: item.name }), _jsx("div", { className: "text-[10px] shrink-0", style: { color: RARITY_COLOR[item.rarity] }, children: item.rarity }), _jsxs("div", { className: "text-[11px] text-[#4da3ff] shrink-0 tabular-nums", children: [item.baseValue.toLocaleString(), _jsx("span", { className: "text-[8px]", children: "\u00A2" })] })] }, item.id))) }), _jsx("div", { className: "result-intel-note text-[8px] text-white/20 tracking-[0.12em] mt-2", children: "\u2192 BLACK MARKET \u3067\u58F2\u5374\u3057\u3066\u30AF\u30EC\u30B8\u30C3\u30C8\u306B\u63DB\u91D1\u3067\u304D\u307E\u3059" })] })), _jsxs("div", { className: "result-sys mt-5 border-l-2 pl-4 text-[11px] text-white/40 leading-relaxed", style: { borderColor: success ? '#4da3ff' : '#ff4d6d40' }, children: [_jsx("div", { className: "text-[9px] tracking-[0.2em] mb-1.5", style: { color: success ? '#4da3ff' : 'rgba(255,77,109,0.5)' }, children: "// SYS_MSG" }), success ? (_jsxs("p", { children: ["> \u5168\u30D0\u30EA\u30A2\u3092\u7A81\u7834\u3002\u30DF\u30C3\u30B7\u30E7\u30F3\u5B8C\u4E86\u3060\u3002", _jsx("br", {}), "> \u30C7\u30FC\u30BF\u306F\u65E2\u306B\u624B\u5143\u306B\u3042\u308B\u3002\u6B21\u306E\u30BF\u30FC\u30B2\u30C3\u30C8\u3078\u9032\u3081\u3002"] })) : (_jsxs("p", { children: ["> \u6B8B\u5FF5\u3002\u3053\u306E\u8EAB\u4F53\uFF08\u30A2\u30D0\u30BF\u30FC\uFF09\u306F\u713C\u304B\u308C\u305F\u3002", _jsx("br", {}), "> \u75D5\u8DE1\u306F\u6D88\u53BB\u3055\u308C\u305F\u3002\u30BF\u30A4\u30C8\u30EB\u306B\u623B\u308C\u3002"] }))] }), _jsx("div", { className: "result-actions mt-auto pt-4", children: success ? (_jsx(CtaButton, { onClick: next, marker: true, className: "breathe-blue active:brightness-90", children: "> MISSION COMPLETE \u00B7 RETURN" })) : (_jsx(CtaButton, { onClick: next, variant: "danger", marker: true, style: { color: '#ffffff', textShadow: 'none' }, children: "> BACK TO BOARD" })) }), _jsx("div", { className: "result-version mt-4 text-center text-[9px] text-white/12 tracking-[0.3em] transition-opacity duration-500", children: "v0.1.4 \u00B7 NULLIFIER" })] }) })] }));
}
function StatCell({ label, value, accent, danger, }) {
    return (_jsxs("div", { className: "result-stat border bg-white/[0.02] p-3", style: {
            borderColor: accent
                ? 'rgba(77,163,255,0.25)'
                : danger
                    ? 'rgba(255,77,109,0.2)'
                    : 'rgba(255,255,255,0.08)',
        }, children: [_jsx("div", { className: "text-[9px] tracking-[0.28em] text-white/30 uppercase", children: label }), _jsx("div", { className: "text-[16px] font-medium mt-1", style: accent
                    ? { color: '#4da3ff', textShadow: '0 0 8px rgba(77,163,255,0.5)' }
                    : danger
                        ? { color: 'rgba(255,77,109,0.7)' }
                        : {}, children: value })] }));
}
