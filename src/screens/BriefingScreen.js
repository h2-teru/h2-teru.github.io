import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { STAGES, RISK_COLOR } from '../data/stages';
import { useGameStore } from '../store/gameStore';
import { CtaButton } from '../components/CtaButton';
export function BriefingScreen() {
    const level = useGameStore((s) => s.hackLevel);
    const initStageRun = useGameStore((s) => s.initStageRun);
    const goStageSelect = () => useGameStore.setState({ screen: 'stage_select' });
    const stage = STAGES.find((s) => s.id === level) ?? STAGES[0];
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        setRevealed(false);
        const t = setTimeout(() => setRevealed(true), 200);
        return () => clearTimeout(t);
    }, [level]);
    const sigCount = `${stage.colorCount} COLORS`;
    const riskColor = RISK_COLOR[stage.risk] ?? '#4da3ff';
    return (_jsxs("div", { className: "relative w-full h-full flex flex-col bg-black text-white font-mono overflow-hidden scanlines", children: [_jsx("div", { className: "px-5 pt-4 pb-3 border-b border-white/[0.06]", children: _jsx("button", { onClick: goStageSelect, className: "text-[10px] text-white tracking-[0.15em] hover:brightness-125 transition-all", children: "\u2190 BACK" }) }), _jsxs("div", { className: `px-5 pt-5 pb-5 border-b border-white/[0.06] ${revealed ? 'scan-in' : 'opacity-0'}`, children: [_jsxs("div", { className: "flex items-center gap-2 text-[10px] tracking-[0.3em] text-white/35 mb-3", children: [_jsx("span", { className: "inline-block w-1.5 h-1.5 animate-flicker", style: { backgroundColor: riskColor, boxShadow: `0 0 6px ${riskColor}` } }), "MISSION_", String(level).padStart(3, '0'), " \u00B7 TARGET LOCKED"] }), _jsx("div", { className: "text-[26px] leading-tight tracking-[0.04em] font-normal", style: { textShadow: '0 0 20px rgba(255,255,255,0.25)' }, children: stage.name }), _jsxs("div", { className: "mt-5 flex items-start gap-8", children: [_jsx(RiskMeter, { risk: stage.risk, level: stage.riskLevel, color: riskColor }), _jsxs("div", { children: [_jsx("div", { className: "text-[9px] text-white/35 tracking-[0.25em] mb-1", children: "PAYOUT" }), _jsx("div", { className: "text-[28px] leading-none font-normal", style: { color: riskColor, textShadow: `0 0 16px ${riskColor}80` }, children: stage.reward })] })] })] }), _jsxs("div", { className: "px-5 py-3 flex gap-2 border-b border-white/[0.06]", children: [_jsx(InfoBadge, { label: "GRID", value: "6 \u00D7 9" }), _jsx(InfoBadge, { label: "SIGNAL", value: sigCount }), _jsx(InfoBadge, { label: "HACK", value: `#${String(level).padStart(3, '0')}` })] }), _jsxs("div", { className: "px-5 py-4 border-b border-white/[0.06]", children: [_jsx("div", { className: "text-[9px] text-[#4da3ff]/60 tracking-[0.2em] mb-2", children: "// CLIENT_MSG.enc" }), _jsxs("p", { className: "text-[11px] text-white/45 leading-relaxed", children: ["\"", stage.fullMsg, "\""] })] }), _jsxs("div", { className: "px-5 py-3 text-[10px] text-white/25 space-y-1 leading-relaxed", children: [_jsx("div", { children: "> \u30D1\u30CD\u30EB\u3092\u30BF\u30C3\u30D7\u3067 90\u00B0 \u56DE\u8EE2" }), _jsx("div", { children: "> \u540C\u8272 S \u2192 G \u3092\u7D50\u7DDA\u305B\u3088 / \u7570\u8272\u4EA4\u5DEE\u306F\u5341\u5B57\u30BB\u30EB\u306E\u307F\u8A31\u53EF" }), _jsx("div", { style: { color: `${riskColor}99` }, children: "> TRACE 100% \u3067\u5373\u6B7B" })] }), _jsx("div", { className: "mt-auto px-5 pb-6", children: _jsx(CtaButton, { onClick: initStageRun, marker: true, className: "breathe-blue active:brightness-90", children: "> INJECT \u00B7 SELECT LOADOUT" }) }), _jsx("div", { className: "absolute bottom-1.5 left-0 right-0 text-center text-[9px] text-white/12 tracking-[0.3em]", children: "v0.1.4 \u00B7 NULLIFIER" })] }));
}
function RiskMeter({ risk, level, color }) {
    return (_jsxs("div", { children: [_jsx("div", { className: "text-[9px] text-white/35 tracking-[0.25em] mb-2", children: "THREAT" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [Array.from({ length: 5 }, (_, i) => (_jsx("div", { className: "w-[10px] h-[22px] transition-all", style: {
                            backgroundColor: i < level ? color : 'rgba(255,255,255,0.07)',
                            boxShadow: i < level ? `0 0 8px ${color}` : 'none',
                        } }, i))), _jsx("span", { className: "ml-2 text-[13px] font-medium tracking-[0.15em]", style: { color }, children: risk })] })] }));
}
function InfoBadge({ label, value }) {
    return (_jsxs("div", { className: "border border-white/[0.1] px-3 py-1.5", children: [_jsx("div", { className: "text-[8px] text-white/30 tracking-[0.2em]", children: label }), _jsx("div", { className: "text-[12px] text-white/80 mt-0.5", children: value })] }));
}
