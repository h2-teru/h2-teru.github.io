interface Props {
  value: number;
  firewallAvailable?: boolean;
}

export function TraceBar({ value, firewallAvailable }: Props) {
  const v       = Math.max(0, Math.min(100, value));
  const danger  = v >= 80;
  const warning = v >= 60;

  const barColor = danger ? '#ff4d6d' : warning ? '#ffb454' : '#4da3ff';
  const barGlow  = danger
    ? '0 0 12px rgba(255,77,109,1), 0 0 28px rgba(255,77,109,0.5)'
    : warning
    ? '0 0 8px rgba(255,180,84,0.8)'
    : '0 0 8px rgba(77,163,255,0.7)';

  return (
    <div
      className="w-full select-none px-2 py-0.5 border"
      style={{
        borderColor: danger ? 'rgba(255,77,109,0.22)' : 'rgba(77,163,255,0.16)',
        background: 'linear-gradient(180deg, rgba(4,13,26,0.86), rgba(2,7,14,0.72))',
        boxShadow: danger
          ? 'inset 0 0 22px rgba(255,77,109,0.06)'
          : 'inset 0 0 22px rgba(77,163,255,0.05)',
      }}
    >
      {/* Header row */}
      <div className="flex justify-between items-center mb-0.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-[8px] tracking-[0.36em] uppercase ${danger ? 'glitch' : ''}`}
            style={{ color: danger ? '#ff4d6d' : warning ? '#ffb454' : 'rgba(77,163,255,0.65)' }}
          >
            TRACE_DETECT
          </span>
          {firewallAvailable && (
            <span
              className="text-[8px] tracking-[0.18em] px-1.5 leading-none"
              style={{
                color: '#4da3ff',
                border: '1px solid rgba(77,163,255,0.3)',
                background: 'rgba(77,163,255,0.08)',
                paddingTop: 2,
                paddingBottom: 2,
              }}
            >
              FW·READY
            </span>
          )}
        </div>
        <span
          className="text-[11px] tabular-nums font-medium"
          style={{ color: barColor, textShadow: danger ? '0 0 10px rgba(255,77,109,0.8)' : 'none' }}
        >
          {v.toFixed(1)}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)' }}>%</span>
        </span>
      </div>

      {/* Bar container — includes zone markers and labels */}
      <div className="relative">
        {/* Zone threshold lines (sit above the bar, drawn as absolute within relative parent) */}
        <div
          className="absolute z-10"
          style={{ left: '60%', top: -2, bottom: 10, width: 1, background: 'rgba(255,180,84,0.38)' }}
        />
        <div
          className="absolute z-10"
          style={{ left: '80%', top: -2, bottom: 10, width: 1, background: 'rgba(255,77,109,0.38)' }}
        />

        {/* Bar track */}
        <div
          className="relative h-[9px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.045)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Section dividers */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pct => (
            <div
              key={pct}
              className="absolute top-0 bottom-0 z-[2]"
              style={{ left: `${pct}%`, width: 1, background: pct % 20 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.045)' }}
            />
          ))}

          {/* Fill */}
          <div
            className={`absolute inset-y-0 left-0 transition-[width] duration-75 ease-linear ${danger ? 'pulse-red' : ''}`}
            style={{
              width: `${v}%`,
              background: `linear-gradient(90deg, ${barColor}, rgba(255,255,255,0.78))`,
              boxShadow: barGlow,
            }}
          />

          {/* Shimmer */}
          <div
            className="absolute inset-y-0 w-[30%]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
              animation: 'shimmer 2.2s linear infinite',
              left: 0,
            }}
          />
        </div>

        {/* Zone labels */}
        <div className="relative h-[8px]">
          <span
            className="absolute text-[7px] tracking-[0.1em] -translate-x-1/2"
            style={{ left: '60%', top: 0, color: warning ? 'rgba(255,180,84,0.65)' : 'rgba(255,180,84,0.25)' }}
          >
            WARN
          </span>
          <span
            className="absolute text-[7px] tracking-[0.1em] -translate-x-1/2"
            style={{ left: '80%', top: 0, color: danger ? 'rgba(255,77,109,0.75)' : 'rgba(255,77,109,0.25)' }}
          >
            CRIT
          </span>
        </div>
      </div>
    </div>
  );
}
