import { useGameStore } from './store/gameStore';
import { TitleScreen } from './screens/TitleScreen';
import { HomeScreen } from './screens/HomeScreen';
import { StageSelectScreen } from './screens/StageSelectScreen';
import { ShopScreen } from './screens/ShopScreen';
import { EnhancementScreen } from './screens/EnhancementScreen';
import { BriefingScreen } from './screens/BriefingScreen';
import { SkillPickScreen } from './screens/SkillPickScreen';
import { HackScreen } from './screens/HackScreen';
import { WaveResultScreen } from './screens/WaveResultScreen';
import { ResultScreen } from './screens/ResultScreen';
import { ScreenTransition } from './components/ScreenTransition';
import { DebugMenu } from './components/DebugMenu';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="w-screen h-[100dvh] flex items-center justify-center bg-black">
      {/* 750×1334 (2× retina) = 375×667 CSS px を基準に縦比固定 */}
      <div
        className="relative bg-bg-900 overflow-hidden shadow-[0_0_60px_rgba(77,163,255,0.08)] border border-white/[0.06]"
        style={{
          width:  'min(100vw, 375px, calc(100dvh * 375 / 667))',
          height: 'min(100dvh, 667px, calc(100vw * 667 / 375))',
        }}
      >
        {/* screen-enter: key でスクリーン変更のたびに再マウント → アニメ再実行 */}
        <div key={screen} className="w-full h-full screen-enter">
          {screen === 'title'        && <TitleScreen />}
          {screen === 'home'         && <HomeScreen />}
          {screen === 'stage_select' && <StageSelectScreen />}
          {screen === 'shop'         && <ShopScreen />}
          {screen === 'enhancement'  && <EnhancementScreen />}
          {screen === 'briefing'     && <BriefingScreen />}
          {screen === 'skill_pick'   && <SkillPickScreen />}
          {screen === 'hack'         && <HackScreen />}
          {screen === 'wave_result'  && <WaveResultScreen />}
          {screen === 'result'       && <ResultScreen />}
        </div>

        {/* ノイズ → スキャンライン遷移オーバーレイ */}
        <ScreenTransition />
        <DebugMenu />
      </div>
    </div>
  );
}
