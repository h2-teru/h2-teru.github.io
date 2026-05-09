import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { RARITY_COLOR, INTEL_TYPE_LABEL } from '../game/market';
import { CtaButton } from '../components/CtaButton';

const SUCCESS_RESULT_REVEAL_DELAY_MS = 1680;

export function ResultScreen() {
  const outcome       = useGameStore((s) => s.outcome);
  const level         = useGameStore((s) => s.hackLevel);
  const rotations     = useGameStore((s) => s.rotations);
  const startedAt     = useGameStore((s) => s.startedAt);
  const clearedAt     = useGameStore((s) => s.clearedAt);
  const pendingReward = useGameStore((s) => s.pendingReward);
  const next   = useGameStore((s) => s.next);
  const goHome = useGameStore((s) => s.goHome);

  const success  = outcome === 'stage_cleared';
  const elapsed  = startedAt ? ((clearedAt ?? performance.now()) - startedAt) / 1000 : 0;
  const credits  = pendingReward?.coins ?? (success ? Math.max(50, Math.round(800 / Math.max(elapsed, 5)) * level * 10) : 0);
  const acquiredIntel = pendingReward?.intel ?? [];

  const [visible, setVisible] = useState(!success);
  useEffect(() => {
    if (!success) {
      setVisible(true);
      return;
    }

    setVisible(false);
    const t = setTimeout(() => setVisible(true), SUCCESS_RESULT_REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [success]);

  // クレジットカウントアップ
  const [displayCredits, setDisplayCredits] = useState(0);
  useEffect(() => {
    if (!success || !visible) return;
    const duration = 1400;
    const start = performance.now();
    let rafId = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayCredits(Math.round(eased * credits));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    setDisplayCredits(0);
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [success, visible, credits]);

  return (
    <div
      className="relative w-full h-full flex flex-col bg-black text-white font-mono overflow-hidden scanlines"
      style={success ? {} : { background: '#0a0004' }}
    >
      {/* 失敗時: 赤ヴィネット固定 */}
      {!success && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ boxShadow: 'inset 0 0 100px rgba(255,77,109,0.25)' }}
        />
      )}

      <div className={`result-scroll relative z-10 h-full min-h-0 overflow-y-auto transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="result-inner flex min-h-full flex-col">
        {/* ── アウトカムヒーロー ── */}
        <div className="result-hero scan-in">
          {success ? (
            <>
              <div className="text-[10px] text-[#4da3ff]/50 tracking-[0.35em] mb-2">
                // MISSION_COMPLETE
              </div>
              <div
                className="leading-none font-normal tracking-[0.15em] glitch-title"
                data-text="NULLIFIED"
                style={{
                  fontSize: 'clamp(34px, 12vw, 52px)',
                  animation: 'neon-flicker 4s linear infinite',
                }}
              >
                NULLIFIED
              </div>
              <div className="text-[11px] text-white/35 mt-2.5 tracking-[0.15em]">
                ALL BARRIERS DOWN · MISSION COMPLETE
              </div>

              {/* クレジットカウントアップ */}
              <div className="result-reward mt-6 value-flash">
                <div className="text-[9px] text-white/30 tracking-[0.3em] mb-1">REWARD</div>
                <div
                  className="leading-none font-normal tabular-nums"
                  style={{
                    fontSize: 'clamp(32px, 10vw, 44px)',
                    color: '#4da3ff',
                    textShadow: '0 0 18px rgba(77,163,255,0.75), 0 0 40px rgba(77,163,255,0.35)',
                  }}
                >
                  {displayCredits.toLocaleString()}
                  <span className="ml-1" style={{ fontSize: 'clamp(16px, 5vw, 22px)' }}>¢</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                className="text-[10px] tracking-[0.35em] mb-2"
                style={{ color: 'rgba(255,77,109,0.55)' }}
              >
                // TRACE_COMPLETE
              </div>
              <div
                className="leading-none font-normal tracking-[0.12em] glitch"
                style={{
                  fontSize: 'clamp(34px, 12vw, 52px)',
                  color: '#ff4d6d',
                  textShadow: '0 0 20px rgba(255,77,109,0.9), 0 0 50px rgba(255,77,109,0.45)',
                }}
              >
                TRACED
              </div>
              <div
                className="leading-none font-normal tracking-[0.25em] mt-1"
                style={{
                  fontSize: 'clamp(18px, 6vw, 26px)',
                  color: 'rgba(255,77,109,0.65)',
                }}
              >
                DEAD
              </div>
              <div className="text-[11px] text-white/30 mt-2.5 tracking-[0.12em]">
                SENTINEL HAS LOCATED YOU · RUN TERMINATED
              </div>
            </>
          )}
        </div>

        {/* ── ステータスグリッド ── */}
        <div className="result-stats mt-5 grid grid-cols-2 gap-[6px]">
          <StatCell label="MISSION"   value={`#${String(level).padStart(3, '0')}`} />
          <StatCell label="LAST WAVE" value={`${elapsed.toFixed(1)}s`} />
          <StatCell label="ROTATIONS" value={String(rotations)} />
          {success && (
            <StatCell label="EFFICIENCY" value={`${Math.round(800 / Math.max(elapsed, 5))}x`} accent />
          )}
          {!success && (
            <StatCell label="REWARD" value="0 ¢" danger />
          )}
        </div>

        {/* ── 取得インテル ── */}
        {success && acquiredIntel.length > 0 && (
          <div className="result-intel mt-5">
            <div className="text-[9px] tracking-[0.28em] text-white/25 mb-2">
              // INTEL ACQUIRED
            </div>
            <div className="flex flex-col gap-1.5">
              {acquiredIntel.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2"
                  style={{
                    background: 'rgba(255,120,0,0.05)',
                    border: '1px solid rgba(255,120,0,0.18)',
                    borderRadius: 3,
                  }}
                >
                  <div
                    className="text-[6px] tracking-[0.15em] px-1.5 py-0.5 border rounded"
                    style={{
                      color: RARITY_COLOR[item.rarity],
                      borderColor: RARITY_COLOR[item.rarity] + '44',
                    }}
                  >
                    {INTEL_TYPE_LABEL[item.type]}
                  </div>
                  <div className="flex-1 text-[10px] text-white/70 tracking-wide truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] shrink-0" style={{ color: RARITY_COLOR[item.rarity] }}>
                    {item.rarity}
                  </div>
                  <div className="text-[11px] text-[#4da3ff] shrink-0 tabular-nums">
                    {item.baseValue.toLocaleString()}<span className="text-[8px]">¢</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[8px] text-white/20 tracking-[0.12em] mt-2">
              → BLACK MARKET で売却してクレジットに換金できます
            </div>
          </div>
        )}

        {/* システムメッセージ */}
        <div
          className="result-sys mt-5 border-l-2 pl-4 text-[11px] text-white/40 leading-relaxed"
          style={{ borderColor: success ? '#4da3ff' : '#ff4d6d40' }}
        >
          <div
            className="text-[9px] tracking-[0.2em] mb-1.5"
            style={{ color: success ? '#4da3ff' : 'rgba(255,77,109,0.5)' }}
          >
            // SYS_MSG
          </div>
          {success ? (
            <p>
              &gt; 全バリアを突破。ミッション完了だ。<br />
              &gt; データは既に手元にある。次のターゲットへ進め。
            </p>
          ) : (
            <p>
              &gt; 残念。この身体（アバター）は焼かれた。<br />
              &gt; 痕跡は消去された。タイトルに戻れ。
            </p>
          )}
        </div>

        {/* ── ボタン ── */}
        <div className="result-actions mt-auto pt-4 space-y-3">
          {success ? (
            <CtaButton
              onClick={next}
              marker
              className="breathe-blue active:brightness-90"
            >
              &gt; MISSION COMPLETE · RETURN
            </CtaButton>
          ) : (
            <CtaButton
              onClick={next}
              variant="danger"
              marker
              style={{ color: '#ffffff', textShadow: 'none' }}
            >
              &gt; BACK TO BOARD
            </CtaButton>
          )}
          <CtaButton
            onClick={goHome}
            variant="ghost"
            className="result-secondary-action backdrop-blur-sm"
            style={{ color: '#ffffff', textShadow: 'none' }}
          >
            ← HIDEOUT
          </CtaButton>
        </div>
        <div className="result-version mt-4 text-center text-[9px] text-white/12 tracking-[0.3em] transition-opacity duration-500">
          v0.1.4 · NULLIFIER
        </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className="result-stat border bg-white/[0.02] p-3"
      style={{
        borderColor: accent
          ? 'rgba(77,163,255,0.25)'
          : danger
          ? 'rgba(255,77,109,0.2)'
          : 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="text-[9px] tracking-[0.28em] text-white/30 uppercase">{label}</div>
      <div
        className="text-[16px] font-medium mt-1"
        style={
          accent
            ? { color: '#4da3ff', textShadow: '0 0 8px rgba(77,163,255,0.5)' }
            : danger
            ? { color: 'rgba(255,77,109,0.7)' }
            : {}
        }
      >
        {value}
      </div>
    </div>
  );
}
