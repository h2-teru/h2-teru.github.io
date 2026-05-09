import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TraceBar({ value, firewallAvailable }) {
    const v = Math.max(0, Math.min(100, value));
    const danger = v >= 80;
    const warning = v >= 60;
    const barColor = danger ? '#ff4d6d' : warning ? '#ffb454' : '#4da3ff';
    const barGlow = danger
        ? '0 0 12px rgba(255,77,109,1), 0 0 28px rgba(255,77,109,0.5)'
        : warning
            ? '0 0 8px rgba(255,180,84,0.8)'
            : '0 0 8px rgba(77,163,255,0.7)';
    return (_jsxs("div", { className: "w-full select-none px-2 py-0.5 border", style: {
            borderColor: danger ? 'rgba(255,77,109,0.22)' : 'rgba(77,163,255,0.16)',
            background: 'linear-gradient(180deg, rgba(4,13,26,0.86), rgba(2,7,14,0.72))',
            boxShadow: danger
                ? 'inset 0 0 22px rgba(255,77,109,0.06)'
                : 'inset 0 0 22px rgba(77,163,255,0.05)',
        }, children: [_jsxs("div", { className: "flex justify-between items-center mb-0.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `text-[8px] tracking-[0.36em] uppercase ${danger ? 'glitch' : ''}`, style: { color: danger ? '#ff4d6d' : warning ? '#ffb454' : 'rgba(77,163,255,0.65)' }, children: "TRACE_DETECT" }), firewallAvailable && (_jsx("span", { className: "text-[8px] tracking-[0.18em] px-1.5 leading-none", style: {
                                    color: '#4da3ff',
                                    border: '1px solid rgba(77,163,255,0.3)',
                                    background: 'rgba(77,163,255,0.08)',
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                }, children: "FW\u00B7READY" }))] }), _jsxs("span", { className: "text-[11px] tabular-nums font-medium", style: { color: barColor, textShadow: danger ? '0 0 10px rgba(255,77,109,0.8)' : 'none' }, children: [v.toFixed(1), _jsx("span", { style: { fontSize: 9, color: 'rgba(255,255,255,0.28)' }, children: "%" })] })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute z-10", style: { left: '60%', top: -2, bottom: 10, width: 1, background: 'rgba(255,180,84,0.38)' } }), _jsx("div", { className: "absolute z-10", style: { left: '80%', top: -2, bottom: 10, width: 1, background: 'rgba(255,77,109,0.38)' } }), _jsxs("div", { className: "relative h-[9px] overflow-hidden", style: {
                            background: 'rgba(255,255,255,0.045)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                        }, children: [[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pct => (_jsx("div", { className: "absolute top-0 bottom-0 z-[2]", style: { left: `${pct}%`, width: 1, background: pct % 20 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.045)' } }, pct))), _jsx("div", { className: `absolute inset-y-0 left-0 transition-[width] duration-75 ease-linear ${danger ? 'pulse-red' : ''}`, style: {
                                    width: `${v}%`,
                                    background: `linear-gradient(90deg, ${barColor}, rgba(255,255,255,0.78))`,
                                    boxShadow: barGlow,
                                } }), _jsx("div", { className: "absolute inset-y-0 w-[30%]", style: {
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
                                    animation: 'shimmer 2.2s linear infinite',
                                    left: 0,
                                } })] }), _jsxs("div", { className: "relative h-[8px]", children: [_jsx("span", { className: "absolute text-[7px] tracking-[0.1em] -translate-x-1/2", style: { left: '60%', top: 0, color: warning ? 'rgba(255,180,84,0.65)' : 'rgba(255,180,84,0.25)' }, children: "WARN" }), _jsx("span", { className: "absolute text-[7px] tracking-[0.1em] -translate-x-1/2", style: { left: '80%', top: 0, color: danger ? 'rgba(255,77,109,0.75)' : 'rgba(255,77,109,0.25)' }, children: "CRIT" })] })] })] }));
}
