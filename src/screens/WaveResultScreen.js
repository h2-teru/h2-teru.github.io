import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useGameStore, WAVES_PER_STAGE } from '../store/gameStore';
import { SKILL_DEFS } from '../game/skills';
import { CtaButton } from '../components/CtaButton';
const RESULT_REVEAL_DELAY_MS = 1680;
export function WaveResultScreen() {
    const wavesCleared = useGameStore((s) => s.wavesCleared);
    const activeSkills = useGameStore((s) => s.activeSkills);
    const level = useGameStore((s) => s.hackLevel);
    const rotations = useGameStore((s) => s.rotations);
    const startedAt = useGameStore((s) => s.startedAt);
    const clearedAt = useGameStore((s) => s.clearedAt);
    const continueAfterWave = useGameStore((s) => s.continueAfterWave);
    const elapsed = startedAt && clearedAt ? (clearedAt - startedAt) / 1000 : 0;
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), RESULT_REVEAL_DELAY_MS);
        return () => clearTimeout(t);
    }, []);
    return (_jsxs("div", { className: "relative w-full h-full flex flex-col bg-black text-white font-mono overflow-hidden scanlines", children: [_jsx("div", { className: "absolute inset-0 pointer-events-none", style: { boxShadow: 'inset 0 0 80px rgba(77,163,255,0.07)' } }), _jsxs("div", { className: `relative z-10 flex flex-col h-full p-6 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`, children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] text-[#4da3ff]/50 tracking-[0.35em] mb-2", children: "// SECURITY_BREACHED" }), _jsx("div", { className: "text-[33px] font-normal tracking-[0.08em] glitch-title", "data-text": "SECURITY HACKED", style: { animation: 'neon-flicker 4s linear infinite' }, children: "SECURITY HACKED" }), _jsxs("div", { className: "text-[11px] text-white/35 mt-2 tracking-[0.12em]", children: ["FIREWALL LAYER ", wavesCleared, " / ", WAVES_PER_STAGE, " BREACHED", ' · ', "MISSION_", String(level).padStart(3, '0')] })] }), _jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "flex justify-between text-[9px] text-white/25 tracking-[0.2em] mb-1.5", children: [_jsx("span", { children: "INTRUSION PROGRESS" }), _jsxs("span", { children: [Math.round((wavesCleared / WAVES_PER_STAGE) * 100), "%"] })] }), _jsxs("div", { className: "h-[4px] bg-white/[0.06] relative overflow-hidden", children: [_jsx("div", { className: "absolute left-0 top-0 bottom-0 transition-all duration-700", style: {
                                            width: `${(wavesCleared / WAVES_PER_STAGE) * 100}%`,
                                            background: 'linear-gradient(90deg, #0066cc, #4da3ff)',
                                            boxShadow: '0 0 8px rgba(77,163,255,0.6)',
                                        } }), Array.from({ length: WAVES_PER_STAGE - 1 }, (_, i) => (_jsx("div", { className: "absolute top-0 bottom-0 w-[1px] bg-black/60", style: { left: `${((i + 1) / WAVES_PER_STAGE) * 100}%` } }, i)))] }), _jsx("div", { className: "flex justify-between mt-1.5", children: Array.from({ length: WAVES_PER_STAGE }, (_, i) => (_jsx("div", { className: "w-[6px] h-[6px]", style: {
                                        backgroundColor: i < wavesCleared ? '#4da3ff' : 'rgba(255,255,255,0.1)',
                                        boxShadow: i < wavesCleared ? '0 0 4px rgba(77,163,255,0.6)' : 'none',
                                    } }, i))) })] }), _jsxs("div", { className: "mt-5 grid grid-cols-2 gap-[6px]", children: [_jsx(StatCell, { label: "WAVE", value: `${wavesCleared} / ${WAVES_PER_STAGE}` }), _jsx(StatCell, { label: "ELAPSED", value: `${elapsed.toFixed(1)}s` }), _jsx(StatCell, { label: "ROTATIONS", value: String(rotations) }), _jsx(StatCell, { label: "EFFICIENCY", value: `${Math.round(800 / Math.max(elapsed, 5))}x`, accent: true })] }), activeSkills.length > 0 && (_jsxs("div", { className: "mt-5", children: [_jsx("div", { className: "text-[9px] text-white/25 tracking-[0.25em] mb-2", children: "MODULES ACTIVE" }), _jsx("div", { className: "flex flex-wrap gap-2", children: activeSkills.map((id) => {
                                    const def = SKILL_DEFS[id];
                                    return (_jsx("div", { className: "text-[9px] px-2 py-1 tracking-[0.1em]", style: { border: `1px solid ${def.color}40`, color: def.color }, children: def.name }, id));
                                }) })] })), _jsx("div", { className: "mt-auto pt-4 space-y-3", children: _jsx(CtaButton, { onClick: continueAfterWave, marker: true, className: "breathe-blue active:brightness-90", children: "> CONTINUE MISSION" }) })] }), _jsx("div", { className: `absolute bottom-1.5 left-0 right-0 text-center text-[9px] text-white/12 tracking-[0.3em] z-10 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`, children: "v0.1.4 \u00B7 NULLIFIER" })] }));
}
function StatCell({ label, value, accent, }) {
    return (_jsxs("div", { className: "border bg-white/[0.02] p-3", style: { borderColor: accent ? 'rgba(77,163,255,0.25)' : 'rgba(255,255,255,0.08)' }, children: [_jsx("div", { className: "text-[9px] tracking-[0.28em] text-white/30 uppercase", children: label }), _jsx("div", { className: "text-[16px] font-medium mt-1", style: accent ? { color: '#4da3ff', textShadow: '0 0 8px rgba(77,163,255,0.5)' } : {}, children: value })] }));
}
