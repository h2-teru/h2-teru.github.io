import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function DebugMenu() {
  const [open, setOpen] = useState(false);
  const screen = useGameStore((s) => s.screen);
  const coins = useGameStore((s) => s.coins);
  const debugPlayClearSequence = useGameStore((s) => s.debugPlayClearSequence);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (event.key.toLowerCase() !== 'e') return;
      if (!event.metaKey && !event.ctrlKey) return;

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

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[300] flex items-center justify-center px-4"
      data-testid="debug-menu"
      style={{
        background: 'rgba(8,10,14,0.68)',
        backdropFilter: 'blur(2px)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        className="w-full max-w-[340px] overflow-hidden"
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          background: '#f8fafc',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        }}
      >
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ background: '#fffbeb', borderBottom: '1px solid #f59e0b' }}
        >
          <div>
            <div className="text-[10px] font-semibold tracking-[0.16em]" style={{ color: '#92400e' }}>
              DEBUG ONLY
            </div>
            <div className="mt-0.5 text-[15px] font-semibold" style={{ color: '#111827' }}>
              開発者コマンド一覧
            </div>
          </div>
          <button
            type="button"
            className="h-8 w-8 text-[16px] font-semibold transition-colors"
            aria-label="Close debug menu"
            onClick={() => setOpen(false)}
            style={{
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              background: '#ffffff',
            }}
          >
            ×
          </button>
        </div>

        <div className="px-3 py-2.5">
          <div
            className="mb-2 rounded-[6px] px-3 py-2 text-[11px] leading-snug"
            style={{ background: '#e0f2fe', color: '#0f172a', border: '1px solid #bae6fd' }}
          >
            開発用オーバーレイです。ゲーム内UIではありません。
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatusPill label="Current Screen" value={screen.toUpperCase()} />
            <StatusPill label="Coins" value={`${coins.toLocaleString()}¢`} />
          </div>

          <div className="mt-3">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#475569' }}>
              Preview
            </div>
            <button
              type="button"
              data-testid="debug-play-clear-sequence"
              className="w-full rounded-[6px] px-3 py-2 text-left transition-colors active:scale-[0.99]"
              onClick={playClearSequence}
              style={{
                border: '1px solid #dbe3ee',
                background: '#ffffff',
                color: '#111827',
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold">Play Clear Sequence</span>
                <span
                  className="shrink-0 rounded-[4px] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em]"
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                >
                  state preview
                </span>
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug" style={{ color: '#64748b' }}>
                線が繋がる演出 → NULL ACCEPTED → SECURITY HACKED
              </span>
            </button>
          </div>

          <div
            className="mt-2 text-[10px]"
            style={{ color: '#64748b' }}
          >
            CMD + E toggles this panel. ESC closes it.
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[6px] px-2.5 py-1.5"
      style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
    >
      <div className="text-[9px] font-medium" style={{ color: '#64748b' }}>
        {label}
      </div>
      <div className="mt-0.5 truncate text-[12px] font-semibold" style={{ color: '#111827' }}>
        {value}
      </div>
    </div>
  );
}
