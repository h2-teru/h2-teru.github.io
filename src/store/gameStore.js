import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { evaluate } from '../game/evaluator';
import { generateBoard } from '../game/generator';
import { DEFAULT_TRACE, elevateForDifficulty } from '../game/trace';
import { applySkillsToTrace, pickRandomSkills } from '../game/skills';
import { EQUIPMENT_LIST, generateIntelForStage } from '../game/market';
export const WAVES_PER_STAGE = 10;
const CLEAR_FREEZE_MS = 1000;
const SKILL_PICK_BEFORE_WAVES = new Set([0, 3]);
const PUZZLE_COLORS = {
    1: ['red', 'blue'],
    2: ['red', 'blue'],
    3: ['red', 'blue', 'yellow'],
    4: ['red', 'blue', 'yellow'],
    5: ['red', 'blue', 'yellow', 'green'],
};
function buildBoardForWave(stageLevel, waveIndex, equipment = []) {
    const colors = PUZZLE_COLORS[Math.min(stageLevel, 5)] ?? ['red', 'blue'];
    const progress = waveIndex / Math.max(WAVES_PER_STAGE - 1, 1);
    const baseNoise = 0.2 + (stageLevel - 1) * 0.07 + progress * 0.12;
    const noiseDensity = equipment.includes('route_compiler')
        ? Math.max(0.08, baseNoise * 0.84)
        : baseNoise;
    return generateBoard({
        cols: 6,
        rows: 9,
        colors,
        pairsPerColor: 1,
        noiseDensity,
        seed: Date.now() + stageLevel * 1337 + waveIndex * 97,
    });
}
export const useGameStore = create()(persist((set, get) => ({
    screen: 'title',
    hackLevel: 1,
    completedStages: [],
    board: null,
    evalResult: null,
    trace: DEFAULT_TRACE,
    startedAt: null,
    rotations: 0,
    clearedAt: null,
    outcome: 'pending',
    waveIndex: 0,
    wavesCleared: 0,
    activeSkills: [],
    offeredSkills: [],
    firewallAvailable: false,
    coins: 0,
    intel: [],
    purchasedEquipment: [],
    pendingReward: null,
    goTitle: () => set({
        screen: 'title',
        board: null,
        evalResult: null,
        hackLevel: 1,
        startedAt: null,
        rotations: 0,
        clearedAt: null,
        outcome: 'pending',
        waveIndex: 0,
        wavesCleared: 0,
        activeSkills: [],
        offeredSkills: [],
        firewallAvailable: false,
        pendingReward: null,
    }),
    goHome: () => set({ screen: 'home' }),
    startRun: () => set({ screen: 'home' }),
    selectStage: (stageId) => {
        set({ hackLevel: stageId });
        get().startBriefing();
    },
    startBriefing: () => set({ screen: 'briefing' }),
    initStageRun: () => {
        set({
            waveIndex: 0,
            wavesCleared: 0,
            activeSkills: [],
            firewallAvailable: false,
            outcome: 'pending',
            board: null,
            evalResult: null,
        });
        const offered = pickRandomSkills(3, [], Date.now());
        set({ offeredSkills: offered, screen: 'skill_pick' });
    },
    pickSkill: (id) => {
        const { activeSkills, firewallAvailable } = get();
        set({
            activeSkills: [...activeSkills, id],
            firewallAvailable: firewallAvailable || id === 'firewall',
        });
        get().beginWave();
    },
    beginWave: () => {
        const { hackLevel, waveIndex, activeSkills, purchasedEquipment, firewallAvailable } = get();
        const { board } = buildBoardForWave(hackLevel, waveIndex, purchasedEquipment);
        const baseTrace = elevateForDifficulty(DEFAULT_TRACE, hackLevel);
        let trace = applySkillsToTrace(baseTrace, activeSkills, waveIndex);
        // Equipment passive effects on trace
        if (purchasedEquipment.includes('heat_sink')) {
            trace = { ...trace, baseRatePerSec: trace.baseRatePerSec * 0.82 };
        }
        if (purchasedEquipment.includes('torque_limiter')) {
            trace = { ...trace, rotationCost: trace.rotationCost * 0.86 };
        }
        if (purchasedEquipment.includes('cold_buffer')) {
            trace = { ...trace, initial: Math.max(-30, trace.initial - 8) };
        }
        const initialEval = evaluate(board);
        set({
            screen: 'hack',
            board,
            evalResult: initialEval,
            trace,
            startedAt: performance.now(),
            rotations: 0,
            clearedAt: null,
            outcome: 'pending',
            // firewall_kit restores firewall each wave
            firewallAvailable: firewallAvailable || purchasedEquipment.includes('firewall_kit'),
        });
    },
    rotateCell: (cellIndex) => {
        const { board, outcome } = get();
        if (!board || outcome !== 'pending')
            return;
        const cell = board.cells[cellIndex];
        if (!cell || cell.type === 'empty' || cell.fixed)
            return;
        const newCells = board.cells.slice();
        newCells[cellIndex] = {
            ...cell,
            rotation: ((cell.rotation + 1) % 4),
        };
        const newBoard = { ...board, cells: newCells };
        const result = evaluate(newBoard);
        const cleared = result.status === 'CLEAR';
        if (cleared) {
            const newWavesCleared = get().wavesCleared + 1;
            set({
                board: newBoard,
                evalResult: result,
                rotations: get().rotations + 1,
                clearedAt: performance.now(),
                outcome: 'clearing',
                wavesCleared: newWavesCleared,
            });
            setTimeout(() => {
                if (get().outcome !== 'clearing')
                    return;
                if (newWavesCleared >= WAVES_PER_STAGE) {
                    // Calculate reward for this stage clear
                    const { hackLevel, startedAt, clearedAt, purchasedEquipment } = get();
                    const elapsed = startedAt && clearedAt ? (clearedAt - startedAt) / 1000 : 10;
                    const base = Math.max(50, Math.round(800 / Math.max(elapsed, 5)) * hackLevel * 10);
                    const mult = purchasedEquipment.includes('neural_cache') ? 1.2 : 1;
                    const pendingCoins = Math.round(base * mult);
                    const pendingIntel = generateIntelForStage(hackLevel);
                    set({
                        outcome: 'stage_cleared',
                        screen: 'result',
                        pendingReward: { coins: pendingCoins, intel: pendingIntel },
                    });
                }
                else {
                    set({ screen: 'wave_result' });
                }
            }, CLEAR_FREEZE_MS);
        }
        else {
            set({
                board: newBoard,
                evalResult: result,
                rotations: get().rotations + 1,
                clearedAt: null,
                outcome: 'pending',
            });
        }
    },
    markTraced: () => {
        if (get().outcome !== 'pending')
            return;
        set({ outcome: 'traced' });
        setTimeout(() => {
            if (get().outcome === 'traced')
                set({ screen: 'result' });
        }, 1500);
    },
    consumeFirewall: () => {
        set({ firewallAvailable: false });
    },
    continueAfterWave: () => {
        const { waveIndex, activeSkills } = get();
        const nextWaveIndex = waveIndex + 1;
        set({ waveIndex: nextWaveIndex });
        if (SKILL_PICK_BEFORE_WAVES.has(nextWaveIndex)) {
            const offered = pickRandomSkills(3, activeSkills, Date.now());
            set({ offeredSkills: offered, screen: 'skill_pick' });
        }
        else {
            get().beginWave();
        }
    },
    next: () => {
        const { outcome, hackLevel, completedStages, pendingReward, coins, intel } = get();
        if (outcome === 'stage_cleared') {
            const newCompleted = completedStages.includes(hackLevel)
                ? completedStages
                : [...completedStages, hackLevel];
            set({
                completedStages: newCompleted,
                screen: 'home',
                coins: coins + (pendingReward?.coins ?? 0),
                intel: [...intel, ...(pendingReward?.intel ?? [])],
                pendingReward: null,
            });
        }
        else {
            set({ screen: 'home' });
        }
    },
    debugPlayClearSequence: () => {
        const hackLevel = 1;
        const waveIndex = 0;
        const { board, solutionRotations } = buildBoardForWave(hackLevel, waveIndex);
        const solvedBoard = {
            ...board,
            cells: board.cells.map((cell, index) => ({
                ...cell,
                rotation: cell.type === 'empty' ? 0 : solutionRotations[index],
            })),
        };
        const now = performance.now();
        set({
            screen: 'hack',
            hackLevel,
            board: solvedBoard,
            evalResult: evaluate(solvedBoard),
            trace: elevateForDifficulty(DEFAULT_TRACE, hackLevel),
            startedAt: now - 8400,
            rotations: 12,
            clearedAt: now,
            outcome: 'clearing',
            waveIndex,
            wavesCleared: 1,
            activeSkills: [],
            offeredSkills: [],
            firewallAvailable: false,
            pendingReward: null,
        });
        setTimeout(() => {
            if (get().outcome !== 'clearing')
                return;
            set({ screen: 'wave_result' });
        }, CLEAR_FREEZE_MS);
    },
    // ── Market ──────────────────────────────────────────────────────────────────
    sellIntel: (ids) => {
        const { intel, coins } = get();
        const earned = Math.round(intel
            .filter(item => ids.includes(item.id))
            .reduce((sum, item) => sum + item.baseValue, 0));
        set({
            intel: intel.filter(item => !ids.includes(item.id)),
            coins: coins + earned,
        });
    },
    buyEquipment: (id) => {
        const { coins, purchasedEquipment } = get();
        const item = EQUIPMENT_LIST.find(e => e.id === id);
        if (!item || coins < item.price || purchasedEquipment.includes(id))
            return;
        set({
            coins: coins - item.price,
            purchasedEquipment: [...purchasedEquipment, id],
        });
    },
}), {
    name: 'nullifier-meta-v1',
    partialize: (state) => ({
        completedStages: state.completedStages,
        coins: state.coins,
        intel: state.intel,
        purchasedEquipment: state.purchasedEquipment,
    }),
}));
