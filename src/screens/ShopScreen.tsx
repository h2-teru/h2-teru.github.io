import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { EQUIPMENT_CATEGORY_COLOR, EQUIPMENT_LIST, RARITY_COLOR, INTEL_TYPE_LABEL } from '../game/market';
import { CtaButton } from '../components/CtaButton';
import type { IntelItem, Equipment, EquipCategory, EquipId, IntelRarity } from '../game/market';

type Tab = 'sell' | 'buy' | 'installed';
type IntelFilter = 'ALL' | IntelRarity;
type EquipFilter = 'ALL' | Equipment['category'];

const MARKET_ORANGE = '#ff7800';
const SIGNAL_BLUE = '#4da3ff';
const RARITY_ORDER: Record<IntelRarity, number> = {
  COMMON: 0,
  RARE: 1,
  CRITICAL: 2,
};
const EQUIP_FILTERS: Array<[EquipFilter, string]> = [
  ['ALL', 'ALL'],
  ['IMPLANT', 'IMPLANT'],
  ['DECK', 'DECK'],
  ['UTILITY', 'UTILITY'],
];

const formatCred = (value: number) => `${value.toLocaleString()}¢`;
const isEquipCategory = (value: EquipFilter): value is EquipCategory =>
  value !== 'ALL';

function MarketStat({ label, value, tone = SIGNAL_BLUE }: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: '8px 8px 7px',
        border: `1px solid ${tone}24`,
        background: `linear-gradient(180deg, ${tone}12, rgba(0,0,0,0.28))`,
        boxShadow: `0 0 14px ${tone}12 inset`,
      }}
    >
      <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', marginBottom: 3 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: tone,
          letterSpacing: '0.03em',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          textShadow: `0 0 10px ${tone}44`,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
  tone = SIGNAL_BLUE,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
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
      }}
    >
      {label}
    </button>
  );
}

// ─── Intel Item Row ───────────────────────────────────────────────────────────

function IntelRow({ item, selected, onToggle }: {
  item: IntelItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const rarityColor = RARITY_COLOR[item.rarity];
  const typeLabel   = INTEL_TYPE_LABEL[item.type];

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: selected ? 'rgba(77,163,255,0.07)' : 'rgba(0,0,0,0.35)',
        border: `1px solid ${selected ? 'rgba(77,163,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Selected accent bar */}
      {selected && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
          background: '#4da3ff',
          boxShadow: '0 0 6px #ff7800',
        }} />
      )}

      {/* Checkbox */}
      <div style={{
        width: 14, height: 14, borderRadius: 2, flexShrink: 0,
        border: `1px solid ${selected ? '#4da3ff' : 'rgba(255,255,255,0.2)'}`,
        background: selected ? '#4da3ff' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ fontSize: 9, color: '#000', fontWeight: 700 }}>✓</span>}
      </div>

      {/* Type badge */}
      <div style={{
        fontSize: 6, letterSpacing: '0.18em', padding: '2px 5px',
        border: `1px solid ${rarityColor}44`,
        color: rarityColor, borderRadius: 2, flexShrink: 0,
        fontFamily: 'monospace',
      }}>
        {typeLabel}
      </div>

      {/* Name + desc */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'monospace',
        }}>
          {item.name}
        </div>
        <div style={{
          fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'monospace',
        }}>
          {item.desc}
        </div>
      </div>

      {/* Rarity + value */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 7, color: rarityColor, letterSpacing: '0.15em',
          fontFamily: 'monospace', marginBottom: 2,
        }}>
          {item.rarity}
        </div>
        <div style={{
          fontSize: 12, color: '#4da3ff', letterSpacing: '0.05em',
          fontFamily: 'monospace',
        }}>
          {item.baseValue.toLocaleString()}<span style={{ fontSize: 9 }}>¢</span>
        </div>
      </div>
    </div>
  );
}

// ─── Equipment Card ───────────────────────────────────────────────────────────

function EquipCard({ equip, owned, canAfford, balance, onBuy }: {
  equip: Equipment;
  owned: boolean;
  canAfford: boolean;
  balance: number;
  onBuy: () => void;
}) {
  const [hov, setHov] = useState(false);
  const active = !owned && canAfford;
  const shortfall = Math.max(0, equip.price - balance);
  const categoryColor = EQUIPMENT_CATEGORY_COLOR[equip.category];
  const cardTone = owned ? SIGNAL_BLUE : equip.color;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        height: '100%',
        gap: 8,
        padding: '9px 10px 9px',
        background: owned
          ? 'linear-gradient(135deg, rgba(77,163,255,0.08), rgba(0,0,0,0.34))'
          : hov && active ? `linear-gradient(135deg, ${equip.color}12, rgba(0,0,0,0.34))` : 'rgba(0,0,0,0.35)',
        border: `1px solid ${
          owned       ? 'rgba(77,163,255,0.34)' :
          hov && active ? equip.color + '66' :
          'rgba(255,255,255,0.07)'}`,
        borderRadius: 3,
        opacity: 1,
        transition: 'all 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Left accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: cardTone,
        boxShadow: `0 0 8px ${cardTone}`,
        opacity: owned ? 0.82 : 0.62,
      }} />

      <div style={{ minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 5, minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{
            fontSize: 6,
            letterSpacing: '0.16em',
            padding: '2px 5px',
            border: `1px solid ${categoryColor}55`,
            color: categoryColor,
            fontFamily: 'monospace',
          }}>
            {equip.category}
          </div>
          <div style={{
            fontSize: 6,
            letterSpacing: '0.16em',
            padding: '2px 5px',
            border: `1px solid ${equip.color}45`,
            color: equip.color,
            fontFamily: 'monospace',
          }}>
            TIER {equip.tier}
          </div>
        </div>
        <div style={{
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
        }}>
          {equip.name}
        </div>
        <div style={{
          fontSize: 7.2,
          color: 'rgba(255,255,255,0.5)',
          marginTop: 4,
          lineHeight: 1.3,
          fontFamily: 'monospace',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {equip.desc}
        </div>
        <div style={{
          display: 'inline-block',
          marginTop: 'auto',
          fontSize: 7,
          padding: '3px 6px',
          border: `1px solid ${equip.color}36`,
          background: `${equip.color}0f`,
          color: equip.color + 'dd',
          letterSpacing: '0.12em',
          fontFamily: 'monospace',
        }}>
          {equip.effect}
        </div>
      </div>

      {/* Price / status */}
      <div style={{ textAlign: 'right', minWidth: 52, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {owned ? (
          <div style={{
            marginTop: 2,
            fontSize: 8, color: '#4da3ff', letterSpacing: '0.15em',
            fontFamily: 'monospace',
          }}>
            OWNED
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 10.5,
              color: canAfford ? '#4da3ff' : 'rgba(255,255,255,0.58)',
              letterSpacing: '0.05em', fontFamily: 'monospace',
            }}>
              {equip.price.toLocaleString()}<span style={{ fontSize: 9 }}>¢</span>
            </div>
            {!canAfford && (
              <div style={{
                marginTop: 2,
                fontSize: 6.5,
                color: 'rgba(255,120,0,0.82)',
                letterSpacing: '0.08em',
                fontFamily: 'monospace',
              }}>
                -{shortfall.toLocaleString()}¢
              </div>
            )}
            <button
              onClick={onBuy}
              disabled={!canAfford}
              style={{
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
              }}
            >
              BUY
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function OwnedEquipTile({ equip }: {
  equip: Equipment;
}) {
  const categoryColor = EQUIPMENT_CATEGORY_COLOR[equip.category];

  return (
    <div
      style={{
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
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: equip.color,
          boxShadow: `0 0 8px ${equip.color}`,
          opacity: 0.76,
        }}
      />
      <div style={{ minWidth: 0, paddingLeft: 2 }}>
        <div
          style={{
            fontSize: 9,
            lineHeight: 1.16,
            letterSpacing: '0.08em',
            color: '#4da3ff',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 0 10px rgba(77,163,255,0.28)',
          }}
        >
          {equip.name}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 6.5,
            letterSpacing: '0.12em',
            color: equip.color,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {equip.effect}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div
          style={{
            fontSize: 6,
            letterSpacing: '0.16em',
            padding: '2px 5px',
            border: `1px solid ${categoryColor}55`,
            color: categoryColor,
          }}
        >
          {equip.category}
        </div>
        <div style={{ fontSize: 6.5, color: 'rgba(77,163,255,0.64)', letterSpacing: '0.16em' }}>
          ACTIVE
        </div>
      </div>
    </div>
  );
}

function PurchaseConfirmModal({
  equip,
  balance,
  canAfford,
  onCancel,
  onConfirm,
}: {
  equip: Equipment;
  balance: number;
  canAfford: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const categoryColor = EQUIPMENT_CATEGORY_COLOR[equip.category];
  const afterBalance = Math.max(0, balance - equip.price);

  return (
    <div
      className="absolute inset-0 z-[90] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      style={{
        background: 'rgba(0,0,0,0.62)',
        backdropFilter: 'blur(5px)',
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 330,
          border: `1px solid ${MARKET_ORANGE}55`,
          background: 'linear-gradient(180deg, rgba(16,8,2,0.98), rgba(3,5,9,0.98))',
          boxShadow: '0 0 38px rgba(255,120,0,0.18), inset 0 0 28px rgba(255,120,0,0.06)',
        }}
      >
        <div
          className="px-4 py-3"
          style={{
            borderBottom: '1px solid rgba(255,120,0,0.18)',
            background: 'linear-gradient(90deg, rgba(255,120,0,0.13), rgba(77,163,255,0.04))',
          }}
        >
          <div className="text-[8px] tracking-[0.32em]" style={{ color: 'rgba(255,120,0,0.72)' }}>
            // CONFIRM PURCHASE
          </div>
          <div className="mt-1 text-[15px] tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {equip.name}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <span
              className="px-2 py-1 text-[7px] tracking-[0.16em]"
              style={{ border: `1px solid ${categoryColor}55`, color: categoryColor }}
            >
              {equip.category}
            </span>
            <span
              className="px-2 py-1 text-[7px] tracking-[0.16em]"
              style={{ border: `1px solid ${equip.color}55`, color: equip.color }}
            >
              TIER {equip.tier}
            </span>
            <span
              className="px-2 py-1 text-[7px] tracking-[0.16em]"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.42)' }}
            >
              {equip.stat}
            </span>
          </div>

          <div className="mt-3 text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)' }}>
            {equip.desc}
          </div>

          <div
            className="mt-3 px-3 py-2 text-[10px] tracking-[0.12em]"
            style={{
              border: `1px solid ${equip.color}36`,
              background: `${equip.color}10`,
              color: equip.color,
            }}
          >
            EFFECT :: {equip.effect}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div style={{ border: '1px solid rgba(77,163,255,0.18)', padding: '8px 7px' }}>
              <div className="text-[7px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.28)' }}>BALANCE</div>
              <div className="mt-1 text-[12px]" style={{ color: SIGNAL_BLUE }}>{formatCred(balance)}</div>
            </div>
            <div style={{ border: '1px solid rgba(255,120,0,0.22)', padding: '8px 7px' }}>
              <div className="text-[7px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.28)' }}>PRICE</div>
              <div className="mt-1 text-[12px]" style={{ color: MARKET_ORANGE }}>{formatCred(equip.price)}</div>
            </div>
            <div style={{ border: '1px solid rgba(180,79,255,0.2)', padding: '8px 7px' }}>
              <div className="text-[7px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.28)' }}>AFTER</div>
              <div className="mt-1 text-[12px]" style={{ color: '#b44fff' }}>{formatCred(afterBalance)}</div>
            </div>
          </div>

          <div className="mt-4 text-[10px] tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.52)' }}>
            この永久装備を購入しますか？
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="h-10 text-[10px] tracking-[0.18em] transition-all active:brightness-90"
              onClick={onCancel}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.035)',
                color: 'rgba(255,255,255,0.62)',
              }}
            >
              CANCEL
            </button>
            <button
              type="button"
              className="h-10 text-[10px] tracking-[0.18em] transition-all active:brightness-90"
              onClick={onConfirm}
              disabled={!canAfford}
              style={{
                border: '1px solid rgba(255,120,0,0.42)',
                background: canAfford ? MARKET_ORANGE : 'rgba(255,255,255,0.06)',
                color: canAfford ? '#000' : 'rgba(255,255,255,0.24)',
                cursor: canAfford ? 'pointer' : 'not-allowed',
                fontWeight: canAfford ? 700 : 400,
                boxShadow: canAfford ? '0 0 18px rgba(255,120,0,0.28)' : 'none',
              }}
            >
              BUY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ShopScreen ──────────────────────────────────────────────────────────

export function ShopScreen() {
  const goHome           = useGameStore((s) => s.goHome);
  const coins            = useGameStore((s) => s.coins);
  const intel            = useGameStore((s) => s.intel);
  const purchasedEquip   = useGameStore((s) => s.purchasedEquipment);
  const sellIntel        = useGameStore((s) => s.sellIntel);
  const buyEquipment     = useGameStore((s) => s.buyEquipment);

  const [tab, setTab]         = useState<Tab>('sell');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [flash, setFlash]     = useState<string | null>(null);
  const [intelFilter, setIntelFilter] = useState<IntelFilter>('ALL');
  const [equipFilter, setEquipFilter] = useState<EquipFilter>('ALL');
  const [pendingPurchase, setPendingPurchase] = useState<Equipment | null>(null);
  const knownPurchasedEquip = purchasedEquip.filter((id) =>
    EQUIPMENT_LIST.some((equip) => equip.id === id),
  );

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSell() {
    if (selected.size === 0) return;
    const ids = [...selected];
    const earned = marketValue(intel.filter(i => ids.includes(i.id)));
    sellIntel(ids);
    setSelected(new Set());
    setFlash(`+${earned.toLocaleString()}¢ 獲得`);
    setTimeout(() => setFlash(null), 2000);
  }

  function requestBuy(item: Equipment) {
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
    if (!pendingPurchase) return;
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
    const id: EquipId = pendingPurchase.id;
    const name = pendingPurchase.name;
    buyEquipment(id);
    setPendingPurchase(null);
    setFlash(`${name} を購入`);
    setTimeout(() => setFlash(null), 2000);
  }

  const marketValue = (items: IntelItem[]) =>
    Math.round(items.reduce((s, i) => s + i.baseValue, 0));
  const portfolioValue = marketValue(intel);
  const selectedValue = marketValue(intel.filter(i => selected.has(i.id)));
  const rarityCounts = intel.reduce<Record<IntelRarity, number>>(
    (acc, item) => ({ ...acc, [item.rarity]: acc[item.rarity] + 1 }),
    { COMMON: 0, RARE: 0, CRITICAL: 0 },
  );
  const filteredIntel = intel
    .filter(item => intelFilter === 'ALL' || item.rarity === intelFilter)
    .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || b.baseValue - a.baseValue);
  const filteredEquip = EQUIPMENT_LIST
    .filter(equip => {
      if (equipFilter === 'ALL') return true;
      return equip.category === equipFilter;
    })
    .sort((a, b) => a.price - b.price);
  const availableEquip = filteredEquip.filter(equip => !knownPurchasedEquip.includes(equip.id));
  const ownedEquip = filteredEquip.filter(equip => knownPurchasedEquip.includes(equip.id));
  const marketSignal = tab === 'buy'
    ? `${EQUIPMENT_LIST.length - knownPurchasedEquip.length} PERMANENT UPGRADES AVAILABLE`
    : tab === 'installed'
      ? `${knownPurchasedEquip.length} PERMANENT MODULES ACTIVE`
      : portfolioValue > 0
        ? `${formatCred(portfolioValue)} DATA READY`
        : 'NO PAYLOAD';

  const accentColor = MARKET_ORANGE;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none font-mono"
      style={{ background: '#030509' }}
    >
      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes bm-scan { from{transform:translateY(-100%)} to{transform:translateY(120vh)} }
        @keyframes bm-flash-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .bm-scrollless { scrollbar-width: none; -ms-overflow-style: none; }
        .bm-scrollless::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 3px)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(to bottom, transparent, ${accentColor}08, transparent)`,
        animation: 'bm-scan 10s linear infinite', zIndex: 41, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 39, pointerEvents: 'none',
        boxShadow: `inset 0 0 100px rgba(0,0,0,0.75), inset 0 0 40px rgba(0,0,0,0.4)`,
      }} />

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(77,163,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(77,163,255,0.025) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* ── Flash message ── */}
      {flash && (
        <div style={{
          position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, padding: '8px 16px',
          background: 'rgba(77,163,255,0.15)',
          border: `1px solid ${accentColor}66`,
          borderRadius: 4,
          fontSize: 11, color: accentColor, letterSpacing: '0.1em',
          fontFamily: 'monospace',
          animation: 'bm-flash-in 0.2s ease forwards',
          whiteSpace: 'nowrap',
        }}>
          {flash}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Header ── */}
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          borderBottom: `1px solid ${accentColor}18`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <button
              onClick={goHome}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 9, letterSpacing: '0.18em', color: '#ffffff',
                fontFamily: 'monospace',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#ffffff')}
            >
              ← BACK
            </button>
            <div style={{ marginTop: 4, fontSize: 7, color: `${accentColor}55`, letterSpacing: '0.3em' }}>
              // BLACK MARKET
            </div>
          </div>

          {/* Coin balance */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: 2 }}>
              BALANCE
            </div>
            <div style={{
              fontSize: 22, color: '#4da3ff', letterSpacing: '0.05em',
              fontFamily: 'monospace', lineHeight: 1,
              textShadow: '0 0 12px rgba(77,163,255,0.5)',
            }}>
              {coins.toLocaleString()}
              <span style={{ fontSize: 13, marginLeft: 3 }}>¢</span>
            </div>
          </div>
        </div>

        {/* ── Market overview ── */}
        <div style={{
          padding: '0 14px 10px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 6,
          flexShrink: 0,
        }}>
          <MarketStat label="LIQUID" value={formatCred(coins)} tone={SIGNAL_BLUE} />
          <MarketStat label="INTEL" value={formatCred(portfolioValue)} tone={MARKET_ORANGE} />
          <MarketStat label="GEAR" value={`${knownPurchasedEquip.length}/${EQUIPMENT_LIST.length}`} tone="#b44fff" />
        </div>
        <div style={{
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
        }}>
          <span style={{ color: `${MARKET_ORANGE}cc` }}>BROKER SIGNAL</span>
          <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{marketSignal}</span>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{
          display: 'flex', flexShrink: 0,
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
        }}>
          {(['sell', 'buy', 'installed'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(new Set()); }}
              style={{
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
              }}
            >
              {t === 'sell' ? 'SELL DATA' : t === 'buy' ? 'BUY EQUIPMENT' : 'INSTALLED'}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{
          display: 'flex',
          gap: 5,
          padding: '9px 14px 8px',
          flexWrap: 'wrap',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.045)',
        }}>
          {tab === 'sell'
            ? ([
                ['ALL', `ALL ${intel.length}`],
                ['COMMON', `COMMON ${rarityCounts.COMMON}`],
                ['RARE', `RARE ${rarityCounts.RARE}`],
                ['CRITICAL', `CRIT ${rarityCounts.CRITICAL}`],
              ] as Array<[IntelFilter, string]>).map(([key, label]) => (
                <FilterButton
                  key={key}
                  active={intelFilter === key}
                  label={label}
                  tone={key === 'ALL' ? MARKET_ORANGE : RARITY_COLOR[key]}
                  onClick={() => {
                    setIntelFilter(key);
                    setSelected(new Set());
                  }}
                />
              ))
            : EQUIP_FILTERS.map(([key, label]) => (
                <FilterButton
                  key={key}
                  active={equipFilter === key}
                  label={label}
                  tone={isEquipCategory(key) ? EQUIPMENT_CATEGORY_COLOR[key] : MARKET_ORANGE}
                  onClick={() => setEquipFilter(key)}
                />
              ))}
        </div>

        {/* ── Content ── */}
        <div
          className={tab === 'sell' ? 'bm-scrollless' : undefined}
          style={tab === 'sell'
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
              }}
        >
          {tab === 'sell' ? (
            filteredIntel.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 32, opacity: 0.2 }}>◎</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>
                  {intel.length === 0 ? 'NO INTEL IN INVENTORY' : 'NO MATCHING INTEL'}
                </div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}>
                  {intel.length === 0 ? 'ミッションをクリアして情報を入手してください' : '別の買い取りカテゴリを選択してください'}
                </div>
              </div>
            ) : (
              filteredIntel.map(item => (
                <IntelRow
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                />
              ))
            )
          ) : tab === 'buy' ? (
            <div style={{ minHeight: 0, flex: '1 1 auto' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                  fontSize: 7,
                  letterSpacing: '0.18em',
                  color: 'rgba(255,120,0,0.72)',
                }}
              >
                <span>// AVAILABLE STOCK</span>
                <span style={{ color: 'rgba(255,255,255,0.28)' }}>{availableEquip.length} ITEMS</span>
              </div>

              {availableEquip.length === 0 ? (
                <div style={{
                  height: '100%',
                  minHeight: 78,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.24)',
                }}>
                  <div style={{ fontSize: 24, opacity: 0.14 }}>◇</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em' }}>
                    {filteredEquip.length === 0 ? 'NO EQUIPMENT MATCH' : 'ALL FILTERED GEAR INSTALLED'}
                  </div>
                  <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}>
                    {filteredEquip.length === 0 ? '別の在庫カテゴリを選択してください' : '購入済み装備は INSTALLED タブに移動済み'}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridAutoRows: '126px',
                    gap: 7,
                    alignContent: 'start',
                  }}
                >
                  {availableEquip.map(equip => (
                    <EquipCard
                      key={equip.id}
                      equip={equip}
                      owned={false}
                      canAfford={coins >= equip.price}
                      balance={coins}
                      onBuy={() => requestBuy(equip)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ minHeight: 0, flex: '1 1 auto' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                  fontSize: 7,
                  letterSpacing: '0.18em',
                  color: 'rgba(77,163,255,0.72)',
                }}
              >
                <span>// INSTALLED GEAR</span>
                <span style={{ color: 'rgba(255,255,255,0.28)' }}>{ownedEquip.length} ACTIVE</span>
              </div>

              {ownedEquip.length === 0 ? (
                <div style={{
                  height: '100%',
                  minHeight: 78,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  border: '1px solid rgba(77,163,255,0.08)',
                  background: 'rgba(0,0,0,0.24)',
                }}>
                  <div style={{ fontSize: 24, opacity: 0.14 }}>◇</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.18em' }}>
                    NO INSTALLED GEAR
                  </div>
                  <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em' }}>
                    購入した永久装備がここに表示されます
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridAutoRows: '62px',
                    gap: 6,
                    alignContent: 'start',
                  }}
                >
                  {ownedEquip.map(equip => (
                    <OwnedEquipTile key={equip.id} equip={equip} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer action ── */}
        {tab === 'sell' && filteredIntel.length > 0 && (
          <div style={{
            padding: '12px 14px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
          }}>
            {/* Select all / deselect all */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 8,
            }}>
              <button
                onClick={() => setSelected(new Set(filteredIntel.map(i => i.id)))}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em',
                  fontFamily: 'monospace',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                SELECT ALL
              </button>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                {selected.size} selected · {selectedValue.toLocaleString()}¢
              </div>
              <button
                onClick={() => setSelected(new Set())}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em',
                  fontFamily: 'monospace',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                CLEAR
              </button>
            </div>

            <CtaButton
              onClick={handleSell}
              disabled={selected.size === 0}
              variant="custom"
              marker={selected.size > 0}
              style={{
                backgroundColor: selected.size > 0 ? '#4da3ff' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selected.size > 0 ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                color: selected.size > 0 ? '#000' : 'rgba(255,255,255,0.2)',
                fontFamily: 'monospace',
                boxShadow: selected.size > 0 ? '0 0 24px rgba(77,163,255,0.35)' : 'none',
              }}
            >
              {selected.size > 0
                ? `> SELL ${selected.size} ITEMS  → +${selectedValue.toLocaleString()}¢`
                : 'SELECT ITEMS TO SELL'}
            </CtaButton>
          </div>
        )}

        {/* Footer version */}
        <div style={{
          padding: '6px 16px',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.3em' }}>
            v0.1.4 · NULLIFIER
          </div>
        </div>
      </div>

      {pendingPurchase && (
        <PurchaseConfirmModal
          equip={pendingPurchase}
          balance={coins}
          canAfford={coins >= pendingPurchase.price && !knownPurchasedEquip.includes(pendingPurchase.id)}
          onCancel={() => setPendingPurchase(null)}
          onConfirm={confirmBuy}
        />
      )}
    </div>
  );
}
