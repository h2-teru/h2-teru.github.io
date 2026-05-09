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
    <div className="app-viewport">
      <div className="app-frame">
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
