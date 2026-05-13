import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { unlockSfx } from './utils/sfx';
export default function App() {
    const screen = useGameStore((s) => s.screen);
    return (_jsx("div", { className: "app-viewport", children: _jsxs("div", { className: "app-frame", onPointerDownCapture: unlockSfx, onKeyDownCapture: unlockSfx, children: [_jsxs("div", { className: "w-full h-full screen-enter", children: [screen === 'title' && _jsx(TitleScreen, {}), screen === 'home' && _jsx(HomeScreen, {}), screen === 'stage_select' && _jsx(StageSelectScreen, {}), screen === 'shop' && _jsx(ShopScreen, {}), screen === 'enhancement' && _jsx(EnhancementScreen, {}), screen === 'briefing' && _jsx(BriefingScreen, {}), screen === 'skill_pick' && _jsx(SkillPickScreen, {}), screen === 'hack' && _jsx(HackScreen, {}), screen === 'wave_result' && _jsx(WaveResultScreen, {}), screen === 'result' && _jsx(ResultScreen, {})] }, screen), _jsx(ScreenTransition, {}), _jsx(DebugMenu, {})] }) }));
}
