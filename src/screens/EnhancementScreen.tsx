import { useGameStore } from '../store/gameStore';
import { CtaButton } from '../components/CtaButton';

export function EnhancementScreen() {
  const goHome = useGameStore((s) => s.goHome);

  return (
    <div className="relative w-full h-full flex flex-col bg-black text-white font-mono overflow-hidden scanlines">
      <div className="px-5 pt-4 pb-3 border-b border-white/[0.06] flex items-center justify-between">
        <button
          onClick={goHome}
          className="text-[10px] text-white tracking-[0.15em] hover:text-white transition-colors"
        >
          ← BACK
        </button>
        <div className="text-[11px] text-[#4da3ff] tracking-wide">
          &gt; augment.sys · OFFLINE
          <span className="inline-block w-[5px] h-[9px] ml-0.5 align-middle bg-[#4da3ff] animate-flicker" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div
          className="text-[48px] leading-none"
          style={{ color: 'rgba(155,255,93,0.35)', textShadow: '0 0 20px rgba(155,255,93,0.15)' }}
        >
          ⬡
        </div>
        <div className="text-center">
          <div className="text-[10px] tracking-[0.35em] text-white/25 mb-2">// AUGMENT</div>
          <div
            className="text-[22px] tracking-[0.12em] font-normal"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.15)' }}
          >
            COMING SOON
          </div>
          <div className="text-[11px] text-white/30 mt-3 leading-relaxed">
            サイバネティクスや神経強化を<br />アップグレードできるようになる予定
          </div>
        </div>
      </div>

      <div className="px-5 pb-6">
        <CtaButton
          onClick={goHome}
          variant="ghost"
          className="backdrop-blur-sm"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.06) inset',
            color: '#ffffff',
            textShadow: 'none',
          }}
        >
          ← BACK TO HIDEOUT
        </CtaButton>
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-white/12 tracking-[0.3em]">
        v0.1.4 · NULLIFIER
      </div>
    </div>
  );
}
