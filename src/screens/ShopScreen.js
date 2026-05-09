import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { EQUIPMENT_CATEGORY_COLOR, EQUIPMENT_LIST, RARITY_COLOR, INTEL_TYPE_LABEL } from '../game/market';
import { CtaButton } from '../components/CtaButton';
const MARKET_ORANGE = '#ff7800';
const SIGNAL_BLUE = '#4da3ff';
const RARITY_ORDER = {
    COMMON: 0,
    RARE: 1,
    CRITICAL: 2,
};
const EQUIP_FILTERS = [
    ['ALL', 'ALL'],
    ['IMPLANT', 'IMPLANT'],
    ['DECK', 'DECK'],
    ['UTILITY', 'UTILITY'],
];
const formatCred = (value) => `${value.toLocaleString()}¢`;
const isEquipCategory = (value) => value !== 'ALL';
function MarketStat({ label, value, tone = SIGNAL_BLUE }) {
    return (_jsxs("div", { style: {
            minWidth: 0,
            padding: '8px 8px 7px',
            border: `1px solid ${tone}24`,
            background: `linear-gradient(180deg, ${tone}12, rgba(0,0,0,0.28))`,
            boxShadow: `0 0 14px ${tone}12 inset`,
        }, children: [_jsx("div", { style: { fontSize: 6.5, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', marginBottom: 3 }, children: label }), _jsx("div", { style: {
                    fontSize: 13,
                    color: tone,
                    letterSpacing: '0.03em',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    textShadow: `0 0 10px ${tone}44`,
                }, children: value })] }));
}
function FilterButton({ active, label, onClick, tone = SIGNAL_BLUE, }) {
    return (_jsx("button", { type: "button", onClick: onClick, style: {
            height: 24,
            padding: '0 9px',
            border: `1px solid ${active ? tone + '88' : 'rgba(255,255,255,0.08)'}`,
            background: active ? `${tone}18` : 'rgba(0,0,0,0.22)',
            color: active ? tone : 'rgba(255,255,255,0.34)',
            cursor: 'pointer',
            fontSize: 7,
            letterSpacing: '0.14em',
            fontFamily: 'monospace',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
        }, children: label }));
}
// ─── Intel Item Row ───────────────────────────────────────────────────────────
function IntelRow({ item, selected, onToggle }) {
    const rarityColor = RARITY_COLOR[item.rarity];
    const typeLabel = INTEL_TYPE_LABEL[item.type];
    return (_jsxs("div", { onClick: onToggle, style: {
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: selected ? 'rgba(77,163,255,0.07)' : 'rgba(0,0,0,0.35)',
            border: `1px solid ${selected ? 'rgba(77,163,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 3,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
            position: 'relative',
            overflow: 'hidden',
        }, children: [selected && (_jsx("div", { style: {
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                    background: '#4da3ff',
                    boxShadow: '0 0 6px #ff7800',
                } })), _jsx("div", { style: {
                    width: 14, height: 14, borderRadius: 2, flexShrink: 0,
                    border: `1px solid ${selected ? '#4da3ff' : 'rgba(255,255,255,0.2)'}`,
                    background: selected ? '#4da3ff' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }, children: selected && _jsx("span", { style: { fontSize: 9, color: '#000', fontWeight: 700 }, children: "\u2713" }) }), _jsx("div", { style: {
                    fontSize: 6, letterSpacing: '0.18em', padding: '2px 5px',
                    border: `1px solid ${rarityColor}44`,
                    color: rarityColor, borderRadius: 2, flexShrink: 0,
                    fontFamily: 'monospace',
                }, children: typeLabel }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                            fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            fontFamily: 'monospace',
                        }, children: item.name }), _jsx("div", { style: {
                            fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            fontFamily: 'monospace',
                        }, children: item.desc })] }), _jsxs("div", { style: { textAlign: 'right', flexShrink: 0 }, children: [_jsx("div", { style: {
                            fontSize: 7, color: rarityColor, letterSpacing: '0.15em',
                            fontFamily: 'monospace', marginBottom: 2,
                        }, children: item.rarity }), _jsxs("div", { style: {
                            fontSize: 12, color: '#4da3ff', letterSpacing: '0.05em',
                            fontFamily: 'monospace',
                        }, children: [item.baseValue.toLocaleString(), _jsx("span", { style: { fontSize: 9 }, children: "\u00A2" })] })] })] }));
}
// ─── Equipment Card ───────────────────────────────────────────────────────────
function EquipCard({ equip, owned, canAfford, balance, onBuy }) {
    const [hov, setHov] = useState(false);
    const active = !owned && canAfford;
    const shortfall = Math.max(0, equip.price - balance);
    const categoryColor = EQUIPMENT_CATEGORY_COLOR[equip.category];
    const cardTone = owned ? SIGNAL_BLUE : equip.color;
    return (_jsxs("div", { style: {
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            height: '100%',
            gap: 8,
            padding: '9px 10px 9px',
            background: owned
                ? 'linear-gradient(135deg, rgba(77,163,255,0.08), rgba(0,0,0,0.34))'
                : hov && active ? `linear-gradient(135deg, ${equip.color}12, rgba(0,0,0,0.34))` : 'rgba(0,0,0,0.35)',
            border: `1px solid ${owned ? 'rgba(77,163,255,0.34)' :
                hov && active ? equip.color + '66' :
                    'rgba(255,255,255,0.07)'}`,
            borderRadius: 3,
            opacity: 1,
            transition: 'all 0.15s',
            position: 'relative',
            overflow: 'hidden',
        }, onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false), children: [_jsx("div", { style: {
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                    background: cardTone,
                    boxShadow: `0 0 8px ${cardTone}`,
                    opacity: owned ? 0.82 : 0.62,
                } }), _jsxs("div", { style: { minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: { display: 'flex', gap: 5, marginBottom: 5, minWidth: 0, flexWrap: 'wrap' }, children: [_jsx("div", { style: {
                                    fontSize: 6,
                                    letterSpacing: '0.16em',
                                    padding: '2px 5px',
                                    border: `1px solid ${categoryColor}55`,
                                    color: categoryColor,
                                    fontFamily: 'monospace',
                                }, children: equip.category }), _jsxs("div", { style: {
                                    fontSize: 6,
                                    letterSpacing: '0.16em',
                                    padding: '2px 5px',
                                    border: `1px solid ${equip.color}45`,
                                    color: equip.color,
                                    fontFamily: 'monospace',
                                }, children: ["TIER ", equip.tier] })] }), _jsx("div", { style: {
                            fontSize: 10.5,
                            lineHeight: 1.18,
                            letterSpacing: '0.08em',
                            fontFamily: 'monospace',
                            color: owned ? '#4da3ff' : 'rgba(255,255,255,0.9)',
                            textShadow: owned ? '0 0 10px rgba(77,163,255,0.35)' : 'none',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }, children: equip.name }), _jsx("div", { style: {
                            fontSize: 7.2,
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: 4,
                            lineHeight: 1.3,
                            fontFamily: 'monospace',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }, children: equip.desc }), _jsx("div", { style: {
                            display: 'inline-block',
                            marginTop: 'auto',
                            fontSize: 7,
                            padding: '3px 6px',
                            border: `1px solid ${equip.color}36`,
                            background: `${equip.color}0f`,
                            color: equip.color + 'dd',
                            letterSpacing: '0.12em',
                            fontFamily: 'monospace',
                        }, children: equip.effect })] }), _jsx("div", { style: { textAlign: 'right', minWidth: 52, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }, children: owned ? (_jsx("div", { style: {
                        marginTop: 2,
                        fontSize: 8, color: '#4da3ff', letterSpacing: '0.15em',
                        fontFamily: 'monospace',
                    }, children: "OWNED" })) : (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                                fontSize: 10.5,
                                color: canAfford ? '#4da3ff' : 'rgba(255,255,255,0.58)',
                                letterSpacing: '0.05em', fontFamily: 'monospace',
                            }, children: [equip.price.toLocaleString(), _jsx("span", { style: { fontSize: 9 }, children: "\u00A2" })] }), !canAfford && (_jsxs("div", { style: {
                                marginTop: 2,
                                fontSize: 6.5,
                                color: 'rgba(255,120,0,0.82)',
                                letterSpacing: '0.08em',
                                fontFamily: 'monospace',
                            }, children: ["-", shortfall.toLocaleString(), "\u00A2"] })), _jsx("button", { onClick: onBuy, disabled: !canAfford, style: {
                                marginTop: 'auto',
                                minWidth: 45,
                                height: 22,
                                fontSize: 8, letterSpacing: '0.15em',
                                padding: '0 9px',
                                border: 'none',
                                background: canAfford ? MARKET_ORANGE : 'rgba(255,255,255,0.06)',
                                color: canAfford ? '#000' : 'rgba(255,255,255,0.2)',
                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                fontFamily: 'monospace',
                                fontWeight: canAfford ? 600 : 400,
                                transition: 'all 0.15s',
                                boxShadow: canAfford ? '0 0 12px rgba(255,120,0,0.34)' : 'none',
                            }, children: "BUY" })] })) })] }));
}
function OwnedEquipTile({ equip }) {
    const categoryColor = EQUIPMENT_CATEGORY_COLOR[equip.category];
    return (_jsxs("div", { style: {
            minWidth: 0,
            height: 62,
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 7,
            padding: '8px 9px',
            border: '1px solid rgba(77,163,255,0.24)',
            background: 'linear-gradient(135deg, rgba(77,163,255,0.08), rgba(0,0,0,0.32))',
            boxShadow: 'inset 0 0 16px rgba(77,163,255,0.05)',
            position: 'relative',
            overflow: 'hidden',
        }, children: [_jsx("div", { style: {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: equip.color,
                    boxShadow: `0 0 8px ${equip.color}`,
                    opacity: 0.76,
                } }), _jsxs("div", { style: { minWidth: 0, paddingLeft: 2 }, children: [_jsx("div", { style: {
                            fontSize: 9,
                            lineHeight: 1.16,
                            letterSpacing: '0.08em',
                            color: '#4da3ff',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textShadow: '0 0 10px rgba(77,163,255,0.28)',
                        }, children: equip.name }), _jsx("div", { style: {
                            marginTop: 4,
                            fontSize: 6.5,
                            letterSpacing: '0.12em',
                            color: equip.color,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                        }, children: equip.effect })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }, children: [_jsx("div", { style: {
                            fontSize: 6,
                            letterSpacing: '0.16em',
                            padding: '2px 5px',
                            border: `1px solid ${categoryColor}55`,
                            color: categoryColor,
                        }, children: equip.category }), _jsx("div", { style: { fontSize: 6.5, color: 'rgba(77,163,255,0.64)', letterSpacing: '0.16em' }, children: "ACTIVE" })] })] }));
}
function PurchaseConfirmModal({ equip, balance, canAfford, onCancel, onConfirm, }) {
    const categoryColor = EQUIPMENT_CATEGORY_COLOR[equip.category];
    const afterBalance = Math.max(0, balance - equip.price);
    return (_jsx("div", { className: "absolute inset-0 z-[90] flex items-center justify-center px-5", role: "dialog", "aria-modal": "true", style: {
            background: 'rgba(0,0,0,0.62)',
            backdropFilter: 'blur(5px)',
        }, onMouseDown: (event) => {
            if (event.target === event.currentTarget)
                onCancel();
        }, children: _jsxs("div", { className: "w-full", style: {
                maxWidth: 330,
                border: `1px solid ${MARKET_ORANGE}55`,
                background: 'linear-gradient(180deg, rgba(16,8,2,0.98), rgba(3,5,9,0.98))',
                boxShadow: '0 0 38px rgba(255,120,0,0.18), inset 0 0 28px rgba(255,120,0,0.06)',
            }, children: [_jsxs("div", { className: "px-4 py-3", style: {
                        borderBottom: '1px solid rgba(255,120,0,0.18)',
                        background: 'linear-gradient(90deg, rgba(255,120,0,0.13), rgba(77,163,255,0.04))',
                    }, children: [_jsx("div", { className: "text-[8px] tracking-[0.32em]", style: { color: 'rgba(255,120,0,0.72)' }, children: "// CONFIRM PURCHASE" }), _jsx("div", { className: "mt-1 text-[15px] tracking-[0.15em]", style: { color: 'rgba(255,255,255,0.9)' }, children: equip.name })] }), _jsxs("div", { className: "px-4 py-4", children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("span", { className: "px-2 py-1 text-[7px] tracking-[0.16em]", style: { border: `1px solid ${categoryColor}55`, color: categoryColor }, children: equip.category }), _jsxs("span", { className: "px-2 py-1 text-[7px] tracking-[0.16em]", style: { border: `1px solid ${equip.color}55`, color: equip.color }, children: ["TIER ", equip.tier] }), _jsx("span", { className: "px-2 py-1 text-[7px] tracking-[0.16em]", style: { border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.42)' }, children: equip.stat })] }), _jsx("div", { className: "mt-3 text-[10px] leading-relaxed", style: { color: 'rgba(255,255,255,0.58)' }, children: equip.desc }), _jsxs("div", { className: "mt-3 px-3 py-2 text-[10px] tracking-[0.12em]", style: {
                                border: `1px solid ${equip.color}36`,
                                background: `${equip.color}10`,
                                color: equip.color,
                            }, children: ["EFFECT :: ", equip.effect] }), _jsxs("div", { className: "mt-4 grid grid-cols-3 gap-2", children: [_jsxs("div", { style: { border: '1px solid rgba(77,163,255,0.18)', padding: '8px 7px' }, children: [_jsx("div", { className: "text-[7px] tracking-[0.16em]", style: { color: 'rgba(255,255,255,0.28)' }, children: "BALANCE" }), _jsx("div", { className: "mt-1 text-[12px]", style: { color: SIGNAL_BLUE }, children: formatCred(balance) })] }), _jsxs("div", { style: { border: '1px solid rgba(255,120,0,0.22)', padding: '8px 7px' }, children: [_jsx("div", { className: "text-[7px] tracking-[0.16em]", style: { color: 'rgba(255,255,255,0.28)' }, children: "PRICE" }), _jsx("div", { className: "mt-1 text-[12px]", style: { color: MARKET_ORANGE }, children: formatCred(equip.price) })] }), _jsxs("div", { style: { border: '1px solid rgba(180,79,255,0.2)', padding: '8px 7px' }, children: [_jsx("div", { className: "text-[7px] tracking-[0.16em]", style: { color: 'rgba(255,255,255,0.28)' }, children: "AFTER" }), _jsx("div", { className: "mt-1 text-[12px]", style: { color: '#b44fff' }, children: formatCred(afterBalance) })] })] }), _jsx("div", { className: "mt-4 text-[10px] tracking-[0.08em]", style: { color: 'rgba(255,255,255,0.52)' }, children: "\u3053\u306E\u6C38\u4E45\u88C5\u5099\u3092\u8CFC\u5165\u3057\u307E\u3059\u304B\uFF1F" }), _jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2", children: [_jsx("button", { type: "button", className: "h-10 text-[10px] tracking-[0.18em] transition-all active:brightness-90", onClick: onCancel, style: {
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        background: 'rgba(255,255,255,0.035)',
                                        color: 'rgba(255,255,255,0.62)',
                                    }, children: "CANCEL" }), _jsx("button", { type: "button", className: "h-10 text-[10px] tracking-[0.18em] transition-all active:brightness-90", onClick: onConfirm, disabled: !canAfford, style: {
                                        border: '1px solid rgba(255,120,0,0.42)',
                                        background: canAfford ? MARKET_ORANGE : 'rgba(255,255,255,0.06)',
                                        color: canAfford ? '#000' : 'rgba(255,255,255,0.24)',
                                        cursor: canAfford ? 'pointer' : 'not-allowed',
                                        fontWeight: canAfford ? 700 : 400,
                                        boxShadow: canAfford ? '0 0 18px rgba(255,120,0,0.28)' : 'none',
                                    }, children: "BUY" })] })] })] }) }));
}
// ─── Main ShopScreen ──────────────────────────────────────────────────────────
export function ShopScreen() {
    const goHome = useGameStore((s) => s.goHome);
    const coins = useGameStore((s) => s.coins);
    const intel = useGameStore((s) => s.intel);
    const purchasedEquip = useGameStore((s) => s.purchasedEquipment);
    const sellIntel = useGameStore((s) => s.sellIntel);
    const buyEquipment = useGameStore((s) => s.buyEquipment);
    const [tab, setTab] = useState('sell');
    const [selected, setSelected] = useState(new Set());
    const [flash, setFlash] = useState(null);
    const [intelFilter, setIntelFilter] = useState('ALL');
    const [equipFilter, setEquipFilter] = useState('ALL');
    const [pendingPurchase, setPendingPurchase] = useState(null);
    const knownPurchasedEquip = purchasedEquip.filter((id) => EQUIPMENT_LIST.some((equip) => equip.id === id));
    function toggleSelect(id) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }
    function handleSell() {
        if (selected.size === 0)
            return;
        const ids = [...selected];
        const earned = marketValue(intel.filter(i => ids.includes(i.id)));
        sellIntel(ids);
        setSelected(new Set());
        setFlash(`+${earned.toLocaleString()}¢ 獲得`);
        setTimeout(() => setFlash(null), 2000);
    }
    function requestBuy(item) {
        if (knownPurchasedEquip.includes(item.id)) {
            setFlash(`${item.name} は導入済み`);
            setTimeout(() => setFlash(null), 2000);
            return;
        }
        if (coins < item.price) {
            setFlash(`${formatCred(item.price - coins)} 不足`);
            setTimeout(() => setFlash(null), 2000);
            return;
        }
        setPendingPurchase(item);
    }
    function confirmBuy() {
        if (!pendingPurchase)
            return;
        if (knownPurchasedEquip.includes(pendingPurchase.id)) {
            setFlash(`${pendingPurchase.name} は導入済み`);
            setPendingPurchase(null);
            setTimeout(() => setFlash(null), 2000);
            return;
        }
        if (coins < pendingPurchase.price) {
            setFlash(`${formatCred(pendingPurchase.price - coins)} 不足`);
            setPendingPurchase(null);
            setTimeout(() => setFlash(null), 2000);
            return;
        }
        const id = pendingPurchase.id;
        const name = pendingPurchase.name;
        buyEquipment(id);
        setPendingPurchase(null);
        setFlash(`${name} を購入`);
        setTimeout(() => setFlash(null), 2000);
    }
    const marketValue = (items) => Math.round(items.reduce((s, i) => s + i.baseValue, 0));
    const portfolioValue = marketValue(intel);
    const selectedValue = marketValue(intel.filter(i => selected.has(i.id)));
    const rarityCounts = intel.reduce((acc, item) => ({ ...acc, [item.rarity]: acc[item.rarity] + 1 }), { COMMON: 0, RARE: 0, CRITICAL: 0 });
    const filteredIntel = intel
        .filter(item => intelFilter === 'ALL' || item.rarity === intelFilter)
        .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || b.baseValue - a.baseValue);
    const filteredEquip = EQUIPMENT_LIST
        .filter(equip => {
        if (equipFilter === 'ALL')
            return true;
        return equip.category === equipFilter;
    })
        .sort((a, b) => a.price - b.price);
    const availableEquip = filteredEquip.filter(equip => !knownPurchasedEquip.includes(equip.id));
    const ownedEquip = filteredEquip.filter(equip => knownPurchasedEquip.includes(equip.id));
    const availableRows = Math.max(1, Math.ceil(availableEquip.length / 2));
    const ownedRows = Math.max(1, Math.ceil(ownedEquip.length / 2));
    const marketSignal = tab === 'buy'
        ? `${EQUIPMENT_LIST.length - knownPurchasedEquip.length} PERMANENT UPGRADES AVAILABLE`
        : tab === 'installed'
            ? `${knownPurchasedEquip.length} PERMANENT MODULES ACTIVE`
            : portfolioValue > 0
                ? `${formatCred(portfolioValue)} DATA READY`
                : 'NO PAYLOAD';
    const accentColor = MARKET_ORANGE;
    return (_jsxs("div", { className: "relative w-full h-full overflow-hidden select-none font-mono", style: { background: '#030509' }, children: [_jsx("style", { children: `
        @keyframes bm-scan { from{transform:translateY(-100%)} to{transform:translateY(120vh)} }
        @keyframes bm-flash-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .bm-scrollless { scrollbar-width: none; -ms-overflow-style: none; }
        .bm-scrollless::-webkit-scrollbar { display: none; }
      ` }), _jsx("div", { style: {
                    position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none',
                    backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)',
                } }), _jsx("div", { style: {
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(to bottom, transparent, ${accentColor}08, transparent)`,
                    animation: 'bm-scan 10s linear infinite', zIndex: 41, pointerEvents: 'none',
                } }), _jsx("div", { style: {
                    position: 'absolute', inset: 0, zIndex: 39, pointerEvents: 'none',
                    boxShadow: `inset 0 0 100px rgba(0,0,0,0.75), inset 0 0 40px rgba(0,0,0,0.4)`,
                } }), _jsx("div", { style: {
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: `
          linear-gradient(rgba(77,163,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(77,163,255,0.025) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                } }), flash && (_jsx("div", { style: {
                    position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 60, padding: '8px 16px',
                    background: 'rgba(77,163,255,0.15)',
                    border: `1px solid ${accentColor}66`,
                    borderRadius: 4,
                    fontSize: 11, color: accentColor, letterSpacing: '0.1em',
                    fontFamily: 'monospace',
                    animation: 'bm-flash-in 0.2s ease forwards',
                    whiteSpace: 'nowrap',
                }, children: flash })), _jsxs("div", { style: { position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsxs("div", { style: {
                            padding: '12px 16px',
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
                            borderBottom: `1px solid ${accentColor}18`,
                            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                            flexShrink: 0,
                        }, children: [_jsxs("div", { children: [_jsx("button", { onClick: goHome, style: {
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                            fontSize: 9, letterSpacing: '0.18em', color: '#ffffff',
                                            fontFamily: 'monospace',
                                        }, onMouseEnter: e => (e.currentTarget.style.color = '#ffffff'), onMouseLeave: e => (e.currentTarget.style.color = '#ffffff'), children: "\u2190 BACK" }), _jsx("div", { style: { marginTop: 4, fontSize: 7, color: `${accentColor}55`, letterSpacing: '0.3em' }, children: "// BLACK MARKET" })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: 2 }, children: "BALANCE" }), _jsxs("div", { style: {
                                            fontSize: 22, color: '#4da3ff', letterSpacing: '0.05em',
                                            fontFamily: 'monospace', lineHeight: 1,
                                            textShadow: '0 0 12px rgba(77,163,255,0.5)',
                                        }, children: [coins.toLocaleString(), _jsx("span", { style: { fontSize: 13, marginLeft: 3 }, children: "\u00A2" })] })] })] }), _jsxs("div", { style: {
                            padding: '0 14px 10px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: 6,
                            flexShrink: 0,
                        }, children: [_jsx(MarketStat, { label: "LIQUID", value: formatCred(coins), tone: SIGNAL_BLUE }), _jsx(MarketStat, { label: "INTEL", value: formatCred(portfolioValue), tone: MARKET_ORANGE }), _jsx(MarketStat, { label: "GEAR", value: `${knownPurchasedEquip.length}/${EQUIPMENT_LIST.length}`, tone: "#b44fff" })] }), _jsxs("div", { style: {
                            margin: '0 14px 10px',
                            padding: '7px 9px',
                            border: `1px solid ${MARKET_ORANGE}2f`,
                            background: 'linear-gradient(90deg, rgba(255,120,0,0.12), rgba(77,163,255,0.045))',
                            color: 'rgba(255,255,255,0.64)',
                            fontSize: 7.5,
                            letterSpacing: '0.16em',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 10,
                            flexShrink: 0,
                        }, children: [_jsx("span", { style: { color: `${MARKET_ORANGE}cc` }, children: "BROKER SIGNAL" }), _jsx("span", { style: { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }, children: marketSignal })] }), _jsx("div", { style: {
                            display: 'flex', flexShrink: 0,
                            borderBottom: `1px solid rgba(255,255,255,0.06)`,
                        }, children: ['sell', 'buy', 'installed'].map(t => (_jsx("button", { onClick: () => { setTab(t); setSelected(new Set()); }, style: {
                                flex: 1, padding: '10px 0',
                                background: tab === t ? `${accentColor}12` : 'transparent',
                                border: 'none',
                                borderBottom: `2px solid ${tab === t ? accentColor : 'transparent'}`,
                                cursor: 'pointer',
                                fontSize: 9,
                                letterSpacing: '0.25em',
                                color: tab === t ? accentColor : 'rgba(255,255,255,0.3)',
                                fontFamily: 'monospace',
                                transition: 'all 0.15s',
                            }, children: t === 'sell' ? 'SELL DATA' : t === 'buy' ? 'BUY EQUIPMENT' : 'INSTALLED' }, t))) }), _jsx("div", { style: {
                            display: 'flex',
                            gap: 5,
                            padding: '9px 14px 8px',
                            flexWrap: 'wrap',
                            flexShrink: 0,
                            borderBottom: '1px solid rgba(255,255,255,0.045)',
                        }, children: tab === 'sell'
                            ? [
                                ['ALL', `ALL ${intel.length}`],
                                ['COMMON', `COMMON ${rarityCounts.COMMON}`],
                                ['RARE', `RARE ${rarityCounts.RARE}`],
                                ['CRITICAL', `CRIT ${rarityCounts.CRITICAL}`],
                            ].map(([key, label]) => (_jsx(FilterButton, { active: intelFilter === key, label: label, tone: key === 'ALL' ? MARKET_ORANGE : RARITY_COLOR[key], onClick: () => {
                                    setIntelFilter(key);
                                    setSelected(new Set());
                                } }, key)))
                            : EQUIP_FILTERS.map(([key, label]) => (_jsx(FilterButton, { active: equipFilter === key, label: label, tone: isEquipCategory(key) ? EQUIPMENT_CATEGORY_COLOR[key] : MARKET_ORANGE, onClick: () => setEquipFilter(key) }, key))) }), _jsx("div", { className: tab === 'sell' ? 'bm-scrollless' : undefined, style: tab === 'sell'
                            ? {
                                flex: 1,
                                overflowY: 'auto',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }
                            : {
                                flex: 1,
                                overflow: 'hidden',
                                padding: '10px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 9,
                            }, children: tab === 'sell' ? (filteredIntel.length === 0 ? (_jsxs("div", { style: {
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 12,
                            }, children: [_jsx("div", { style: { fontSize: 32, opacity: 0.2 }, children: "\u25CE" }), _jsx("div", { style: { fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }, children: intel.length === 0 ? 'NO INTEL IN INVENTORY' : 'NO MATCHING INTEL' }), _jsx("div", { style: { fontSize: 8, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }, children: intel.length === 0 ? 'ミッションをクリアして情報を入手してください' : '別の買い取りカテゴリを選択してください' })] })) : (filteredIntel.map(item => (_jsx(IntelRow, { item: item, selected: selected.has(item.id), onToggle: () => toggleSelect(item.id) }, item.id))))) : tab === 'buy' ? (_jsxs("div", { style: { minHeight: 0, height: '100%', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 6,
                                        fontSize: 7,
                                        letterSpacing: '0.18em',
                                        color: 'rgba(255,120,0,0.72)',
                                    }, children: [_jsx("span", { children: "// AVAILABLE STOCK" }), _jsxs("span", { style: { color: 'rgba(255,255,255,0.28)' }, children: [availableEquip.length, " ITEMS"] })] }), availableEquip.length === 0 ? (_jsxs("div", { style: {
                                        height: '100%',
                                        minHeight: 78,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        background: 'rgba(0,0,0,0.24)',
                                    }, children: [_jsx("div", { style: { fontSize: 24, opacity: 0.14 }, children: "\u25C7" }), _jsx("div", { style: { fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em' }, children: filteredEquip.length === 0 ? 'NO EQUIPMENT MATCH' : 'ALL FILTERED GEAR INSTALLED' }), _jsx("div", { style: { fontSize: 7.5, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }, children: filteredEquip.length === 0 ? '別の在庫カテゴリを選択してください' : '購入済み装備は INSTALLED タブに移動済み' })] })) : (_jsx("div", { style: {
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gridTemplateRows: `repeat(${availableRows}, minmax(0, 1fr))`,
                                        gap: 7,
                                        alignContent: 'start',
                                        minHeight: 0,
                                        flex: '1 1 auto',
                                    }, children: availableEquip.map(equip => (_jsx(EquipCard, { equip: equip, owned: false, canAfford: coins >= equip.price, balance: coins, onBuy: () => requestBuy(equip) }, equip.id))) }))] })) : (_jsxs("div", { style: { minHeight: 0, height: '100%', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 6,
                                        fontSize: 7,
                                        letterSpacing: '0.18em',
                                        color: 'rgba(77,163,255,0.72)',
                                    }, children: [_jsx("span", { children: "// INSTALLED GEAR" }), _jsxs("span", { style: { color: 'rgba(255,255,255,0.28)' }, children: [ownedEquip.length, " ACTIVE"] })] }), ownedEquip.length === 0 ? (_jsxs("div", { style: {
                                        height: '100%',
                                        minHeight: 78,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        border: '1px solid rgba(77,163,255,0.08)',
                                        background: 'rgba(0,0,0,0.24)',
                                    }, children: [_jsx("div", { style: { fontSize: 24, opacity: 0.14 }, children: "\u25C7" }), _jsx("div", { style: { fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em' }, children: "NO INSTALLED GEAR" }), _jsx("div", { style: { fontSize: 7.5, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }, children: "\u8CFC\u5165\u3057\u305F\u6C38\u4E45\u88C5\u5099\u304C\u3053\u3053\u306B\u8868\u793A\u3055\u308C\u307E\u3059" })] })) : (_jsx("div", { style: {
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gridTemplateRows: `repeat(${ownedRows}, minmax(0, 1fr))`,
                                        gap: 6,
                                        alignContent: 'start',
                                        minHeight: 0,
                                        flex: '1 1 auto',
                                    }, children: ownedEquip.map(equip => (_jsx(OwnedEquipTile, { equip: equip }, equip.id))) }))] })) }), tab === 'sell' && filteredIntel.length > 0 && (_jsxs("div", { style: {
                            padding: '12px 14px', flexShrink: 0,
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                        }, children: [_jsxs("div", { style: {
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    marginBottom: 8,
                                }, children: [_jsx("button", { onClick: () => setSelected(new Set(filteredIntel.map(i => i.id))), style: {
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                            fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em',
                                            fontFamily: 'monospace',
                                        }, onMouseEnter: e => (e.currentTarget.style.color = accentColor), onMouseLeave: e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)'), children: "SELECT ALL" }), _jsxs("div", { style: { fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', fontFamily: 'monospace' }, children: [selected.size, " selected \u00B7 ", selectedValue.toLocaleString(), "\u00A2"] }), _jsx("button", { onClick: () => setSelected(new Set()), style: {
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                            fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em',
                                            fontFamily: 'monospace',
                                        }, onMouseEnter: e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)'), onMouseLeave: e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)'), children: "CLEAR" })] }), _jsx(CtaButton, { onClick: handleSell, disabled: selected.size === 0, variant: "custom", marker: selected.size > 0, style: {
                                    backgroundColor: selected.size > 0 ? '#4da3ff' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${selected.size > 0 ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                                    cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                                    color: selected.size > 0 ? '#000' : 'rgba(255,255,255,0.2)',
                                    fontFamily: 'monospace',
                                    boxShadow: selected.size > 0 ? '0 0 24px rgba(77,163,255,0.35)' : 'none',
                                }, children: selected.size > 0
                                    ? `> SELL ${selected.size} ITEMS  → +${selectedValue.toLocaleString()}¢`
                                    : 'SELECT ITEMS TO SELL' })] })), _jsx("div", { style: {
                            padding: '6px 16px',
                            borderTop: '1px solid rgba(255,255,255,0.03)',
                            flexShrink: 0,
                        }, children: _jsx("div", { style: { fontSize: 7, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.3em' }, children: "v0.1.4 \u00B7 NULLIFIER" }) })] }), pendingPurchase && (_jsx(PurchaseConfirmModal, { equip: pendingPurchase, balance: coins, canAfford: coins >= pendingPurchase.price && !knownPurchasedEquip.includes(pendingPurchase.id), onCancel: () => setPendingPurchase(null), onConfirm: confirmBuy }))] }));
}
