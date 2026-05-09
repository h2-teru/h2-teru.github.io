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
export default function App() {
    const screen = useGameStore((s) => s.screen);
    return (_jsx("div", { className: "w-screen h-[100dvh] flex items-center justify-center bg-black", children: _jsxs("div", { className: "relative bg-bg-900 overflow-hidden shadow-[0_0_60px_rgba(77,163,255,0.08)] border border-white/[0.06]", style: {
                width: 'min(100vw, 375px, calc(100dvh * 375 / 667))',
                height: 'min(100dvh, 667px, calc(100vw * 667 / 375))',
            }, children: [_jsxs("div", { className: "w-full h-full screen-enter", children: [screen === 'title' && _jsx(TitleScreen, {}), screen === 'home' && _jsx(HomeScreen, {}), screen === 'stage_select' && _jsx(StageSelectScreen, {}), screen === 'shop' && _jsx(ShopScreen, {}), screen === 'enhancement' && _jsx(EnhancementScreen, {}), screen === 'briefing' && _jsx(BriefingScreen, {}), screen === 'skill_pick' && _jsx(SkillPickScreen, {}), screen === 'hack' && _jsx(HackScreen, {}), screen === 'wave_result' && _jsx(WaveResultScreen, {}), screen === 'result' && _jsx(ResultScreen, {})] }, screen), _jsx(ScreenTransition, {}), _jsx(DebugMenu, {})] }) }));
}
