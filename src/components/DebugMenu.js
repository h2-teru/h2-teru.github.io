import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
export function DebugMenu() {
    const [open, setOpen] = useState(false);
    const screen = useGameStore((s) => s.screen);
    const coins = useGameStore((s) => s.coins);
    const debugPlayClearSequence = useGameStore((s) => s.debugPlayClearSequence);
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                return;
            }
            if (event.key.toLowerCase() !== 'e')
                return;
            if (!event.metaKey && !event.ctrlKey)
                return;
            event.preventDefault();
            setOpen((value) => !value);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
    const playClearSequence = () => {
        debugPlayClearSequence();
        setOpen(false);
    };
    if (!open)
        return null;
    return (_jsx("div", { className: "absolute inset-0 z-[300] flex items-center justify-center px-4", "data-testid": "debug-menu", style: {
            background: 'rgba(8,10,14,0.68)',
            backdropFilter: 'blur(2px)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        }, onMouseDown: (event) => {
            if (event.target === event.currentTarget)
                setOpen(false);
        }, children: _jsxs("div", { className: "w-full max-w-[340px] overflow-hidden", style: {
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                background: '#f8fafc',
                boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
            }, children: [_jsxs("div", { className: "flex items-center justify-between px-3 py-2", style: { background: '#fffbeb', borderBottom: '1px solid #f59e0b' }, children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold tracking-[0.16em]", style: { color: '#92400e' }, children: "DEBUG ONLY" }), _jsx("div", { className: "mt-0.5 text-[15px] font-semibold", style: { color: '#111827' }, children: "\u958B\u767A\u8005\u30B3\u30DE\u30F3\u30C9\u4E00\u89A7" })] }), _jsx("button", { type: "button", className: "h-8 w-8 text-[16px] font-semibold transition-colors", "aria-label": "Close debug menu", onClick: () => setOpen(false), style: {
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: 6,
                                background: '#ffffff',
                            }, children: "\u00D7" })] }), _jsxs("div", { className: "px-3 py-2.5", children: [_jsx("div", { className: "mb-2 rounded-[6px] px-3 py-2 text-[11px] leading-snug", style: { background: '#e0f2fe', color: '#0f172a', border: '1px solid #bae6fd' }, children: "\u958B\u767A\u7528\u30AA\u30FC\u30D0\u30FC\u30EC\u30A4\u3067\u3059\u3002\u30B2\u30FC\u30E0\u5185UI\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002" }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(StatusPill, { label: "Current Screen", value: screen.toUpperCase() }), _jsx(StatusPill, { label: "Coins", value: `${coins.toLocaleString()}¢` })] }), _jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]", style: { color: '#475569' }, children: "Preview" }), _jsxs("button", { type: "button", "data-testid": "debug-play-clear-sequence", className: "w-full rounded-[6px] px-3 py-2 text-left transition-colors active:scale-[0.99]", onClick: playClearSequence, style: {
                                        border: '1px solid #dbe3ee',
                                        background: '#ffffff',
                                        color: '#111827',
                                    }, children: [_jsxs("span", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-[12px] font-semibold", children: "Play Clear Sequence" }), _jsx("span", { className: "shrink-0 rounded-[4px] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em]", style: { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }, children: "state preview" })] }), _jsx("span", { className: "mt-0.5 block text-[10px] leading-snug", style: { color: '#64748b' }, children: "\u7DDA\u304C\u7E4B\u304C\u308B\u6F14\u51FA \u2192 NULL ACCEPTED \u2192 SECURITY HACKED" })] })] }), _jsx("div", { className: "mt-2 text-[10px]", style: { color: '#64748b' }, children: "CMD + E toggles this panel. ESC closes it." })] })] }) }));
}
function StatusPill({ label, value }) {
    return (_jsxs("div", { className: "rounded-[6px] px-2.5 py-1.5", style: { background: '#ffffff', border: '1px solid #e5e7eb' }, children: [_jsx("div", { className: "text-[9px] font-medium", style: { color: '#64748b' }, children: label }), _jsx("div", { className: "mt-0.5 truncate text-[12px] font-semibold", style: { color: '#111827' }, children: value })] }));
}
