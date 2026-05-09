import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const variantStyles = {
    primary: {
        backgroundColor: '#4da3ff',
        color: '#000',
        boxShadow: '0 0 24px rgba(77,163,255,0.35)',
    },
    danger: {
        backgroundColor: 'rgba(255,77,109,0.18)',
        border: '1px solid rgba(255,77,109,0.4)',
        color: '#ff4d6d',
        textShadow: '0 0 8px rgba(255,77,109,0.6)',
    },
    ghost: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        color: '#4da3ff',
        boxShadow: '0 4px 24px rgba(0,0,0,0.7), 0 1px 0 rgba(77,163,255,0.15) inset',
        textShadow: '0 0 10px rgba(77,163,255,0.6)',
    },
    muted: {
        backgroundColor: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(77,163,255,0.1)',
        color: 'rgba(255,255,255,0.22)',
    },
    custom: {},
};
export function CtaButton({ children, className = '', marker = false, style, type = 'button', variant = 'primary', ...buttonProps }) {
    return (_jsx("button", { type: type, className: `w-full h-11 flex items-center justify-start pl-4 pr-4 text-left leading-none tracking-[0.22em] text-[13px] font-medium transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`, style: { ...variantStyles[variant], ...style }, ...buttonProps, children: _jsxs("span", { className: "inline-flex items-center", children: [children, marker && (_jsx("span", { "aria-hidden": "true", className: "ml-1.5 h-[1.15em] w-[0.36em] shrink-0 bg-current animate-flicker opacity-70" }))] }) }));
}
