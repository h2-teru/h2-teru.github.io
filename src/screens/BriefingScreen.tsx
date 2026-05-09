import { useEffect, useState } from 'react';
import { STAGES, RISK_COLOR } from '../data/stages';
import { useGameStore } from '../store/gameStore';
import { CtaButton } from '../components/CtaButton';

export function BriefingScreen() {
  const level        = useGameStore((s) => s.hackLevel);
  const initStageRun = useGameStore((s) => s.initStageRun);
  const goStageSelect = () => useGameStore.setState({ screen: 'stage_select' });
  const stage     = STAGES.find((s) => s.id === level) ?? STAGES[0];

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, [level]);

  const sigCount  = `${stage.colorCount} COLORS`;
  const riskColor = RISK_COLOR[stage.risk] ?? '#4da3ff';

  return (
    <div className="relative w-full h-full flex flex-col bg-black text-white font-mono overflow-hidden scanlines">

      {/* ヘッダ */}
      <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
        <button
          onClick={goStageSelect}
          className="text-[10px] text-white tracking-[0.15em] hover:brightness-125 transition-all"
        >
          ← BACK
        </button>
      </div>

      {/* ヒーローブロック */}
      <div className={`px-5 pt-5 pb-5 border-b border-white/[0.06] ${revealed ? 'scan-in' : 'opacity-0'}`}>
        {/* ミッションバッジ */}
        <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] text-white/35 mb-3">
          <span
            className="inline-block w-1.5 h-1.5 animate-flicker"
            style={{ backgroundColor: riskColor, boxShadow: `0 0 6px ${riskColor}` }}
          />
          MISSION_{String(level).padStart(3, '0')} · TARGET LOCKED
        </div>

        {/* ターゲット名（ヒーロー） */}
        <div
          className="text-[26px] leading-tight tracking-[0.04em] font-normal"
          style={{ textShadow: '0 0 20px rgba(255,255,255,0.25)' }}
        >
          {stage.name}
        </div>

        {/* リスク + ペイアウト行 */}
        <div className="mt-5 flex items-start gap-8">
          <RiskMeter risk={stage.risk} level={stage.riskLevel} color={riskColor} />
          <div>
            <div className="text-[9px] text-white/35 tracking-[0.25em] mb-1">PAYOUT</div>
            <div
              className="text-[28px] leading-none font-normal"
              style={{ color: riskColor, textShadow: `0 0 16px ${riskColor}80` }}
            >
              {stage.reward}
            </div>
          </div>
        </div>
      </div>

      {/* バッジ行 */}
      <div className="px-5 py-3 flex gap-2 border-b border-white/[0.06]">
        <InfoBadge label="GRID" value="6 × 9" />
        <InfoBadge label="SIGNAL" value={sigCount} />
        <InfoBadge label="HACK" value={`#${String(level).padStart(3, '0')}`} />
      </div>

      {/* クライアントメッセージ */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="text-[9px] text-[#4da3ff]/60 tracking-[0.2em] mb-2">// CLIENT_MSG.enc</div>
        <p className="text-[11px] text-white/45 leading-relaxed">
          &quot;{stage.fullMsg}&quot;
        </p>
      </div>

      {/* 操作ガイド */}
      <div className="px-5 py-3 text-[10px] text-white/25 space-y-1 leading-relaxed">
        <div>&gt; パネルをタップで 90° 回転</div>
        <div>&gt; 同色 S → G を結線せよ / 異色交差は十字セルのみ許可</div>
        <div style={{ color: `${riskColor}99` }}>&gt; TRACE 100% で即死</div>
      </div>

      {/* CTAボタン */}
      <div className="mt-auto px-5 pb-6">
        <CtaButton
          onClick={initStageRun}
          marker
          className="breathe-blue active:brightness-90"
        >
          &gt; INJECT · SELECT LOADOUT
        </CtaButton>
      </div>

      <div className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] text-white/12 tracking-[0.3em]">
        v0.1.4 · NULLIFIER
      </div>
    </div>
  );
}

function RiskMeter({ risk, level, color }: { risk: string; level: number; color: string }) {
  return (
    <div>
      <div className="text-[9px] text-white/35 tracking-[0.25em] mb-2">THREAT</div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="w-[10px] h-[22px] transition-all"
            style={{
              backgroundColor: i < level ? color : 'rgba(255,255,255,0.07)',
              boxShadow: i < level ? `0 0 8px ${color}` : 'none',
            }}
          />
        ))}
        <span
          className="ml-2 text-[13px] font-medium tracking-[0.15em]"
          style={{ color }}
        >
          {risk}
        </span>
      </div>
    </div>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/[0.1] px-3 py-1.5">
      <div className="text-[8px] text-white/30 tracking-[0.2em]">{label}</div>
      <div className="text-[12px] text-white/80 mt-0.5">{value}</div>
    </div>
  );
}
