export const DEFAULT_TRACE = {
    baseRatePerSec: 100 / 90, // 90秒で 100%
    rotationCost: 1.5,
    initial: 0,
};
export function elevateForDifficulty(base, level) {
    const mult = 1 + (level - 1) * 0.15;
    return {
        baseRatePerSec: base.baseRatePerSec * mult,
        rotationCost: base.rotationCost * mult,
        initial: base.initial,
    };
}
