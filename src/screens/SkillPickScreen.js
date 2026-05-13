import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { SKILL_DEFS } from '../game/skills';
import { playSfx } from '../utils/sfx';
export function SkillPickScreen() {
    const offeredSkills = useGameStore((s) => s.offeredSkills);
    const activeSkills = useGameStore((s) => s.activeSkills);
    const waveIndex = useGameStore((s) => s.waveIndex);
    const hackLevel = useGameStore((s) => s.hackLevel);
    const pickSkill = useGameStore((s) => s.pickSkill);
    const isInitial = waveIndex === 0;
    return (_jsxs("div", { className: "relative w-full h-full flex flex-col bg-black text-white font-mono overflow-hidden scanlines", children: [_jsxs("div", { className: "px-5 pt-4 pb-3 border-b border-white/[0.06]", children: [_jsxs("div", { className: "text-[9px] text-white/30 tracking-[0.35em] mb-0.5", children: ["MISSION_", String(hackLevel).padStart(3, '0')] }), _jsx("div", { className: "text-[11px] text-[#4da3ff] tracking-[0.2em]", children: isInitial ? '// LOADOUT_SELECT' : `// AUGMENT_PHASE · WAVE ${waveIndex}` })] }), _jsxs("div", { className: "px-5 pt-4 pb-2", children: [_jsx("div", { className: "text-[22px] font-normal tracking-[0.08em] leading-snug", children: isInitial ? 'モジュールを選択せよ' : 'アップグレードを選択せよ' }), _jsx("div", { className: "text-[11px] text-white/35 mt-1.5 tracking-[0.04em]", children: isInitial
                            ? 'このモジュールはミッション全体に適用される'
                            : 'ここまで生き延びた報酬だ。次のウェーブから適用される' })] }), activeSkills.length > 0 && (_jsxs("div", { className: "px-5 pb-3 pt-1", children: [_jsx("div", { className: "text-[9px] text-white/25 tracking-[0.25em] mb-2", children: "INSTALLED" }), _jsx("div", { className: "flex flex-wrap gap-2", children: activeSkills.map((id) => {
                            const def = SKILL_DEFS[id];
                            return (_jsx("div", { className: "text-[9px] px-2 py-1 tracking-[0.1em]", style: { border: `1px solid ${def.color}40`, color: def.color }, children: def.name }, id));
                        }) })] })), _jsx("div", { className: "flex-1 px-4 flex flex-col gap-3 justify-center py-2", children: offeredSkills.map((id) => (_jsx(SkillCard, { skill: SKILL_DEFS[id], onPick: () => {
                        playSfx('skill');
                        pickSkill(id);
                    } }, id))) }), _jsx("div", { className: "absolute bottom-1.5 left-0 right-0 text-center text-[9px] text-white/12 tracking-[0.3em]", children: "v0.1.4 \u00B7 NULLIFIER" })] }));
}
function SkillCard({ skill, onPick }) {
    const [hovered, setHovered] = useState(false);
    return (_jsxs("div", { onClick: onPick, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), className: "relative cursor-pointer p-4 transition-all duration-150", style: {
            border: `1px solid ${hovered ? skill.color : skill.color + '40'}`,
            backgroundColor: hovered ? `${skill.color}10` : 'rgba(255,255,255,0.02)',
            boxShadow: hovered
                ? `0 0 24px ${skill.color}20, inset 0 0 12px ${skill.color}08`
                : 'none',
        }, children: [_jsx("div", { className: "absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-150", style: {
                    backgroundColor: skill.color,
                    opacity: hovered ? 1 : 0.4,
                    boxShadow: hovered ? `0 0 8px ${skill.color}` : 'none',
                } }), _jsxs("div", { className: "pl-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsx("div", { className: "text-[18px] font-normal tracking-[0.12em] transition-all duration-150", style: {
                                    color: skill.color,
                                    textShadow: hovered ? `0 0 16px ${skill.color}` : 'none',
                                }, children: skill.name }), _jsx("div", { className: "text-[9px] tracking-[0.2em] transition-all", style: { color: hovered ? skill.color : 'rgba(255,255,255,0.25)' }, children: "SELECT \u203A" })] }), _jsx("div", { className: "text-[13px] text-white/80 tracking-[0.04em] mb-1", children: skill.desc }), _jsx("div", { className: "text-[10px] text-white/35 tracking-[0.02em] leading-relaxed", children: skill.flavorDesc })] })] }));
}
