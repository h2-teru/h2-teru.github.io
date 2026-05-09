/**
 * トレースゲージ管理
 * gauge(t) = baseRate * elapsedSec + Σ rotationCost
 */
export interface TraceConfig {
  /** 1秒あたりのゲージ上昇率 (%) */
  baseRatePerSec: number;
  /** 1回転あたりのゲージ上昇 (%) */
  rotationCost: number;
  /** 初期ゲージ (%) */
  initial: number;
}

export const DEFAULT_TRACE: TraceConfig = {
  baseRatePerSec: 100 / 90, // 90秒で 100%
  rotationCost: 1.5,
  initial: 0,
};

export function elevateForDifficulty(base: TraceConfig, level: number): TraceConfig {
  const mult = 1 + (level - 1) * 0.15;
  return {
    baseRatePerSec: base.baseRatePerSec * mult,
    rotationCost: base.rotationCost * mult,
    initial: base.initial,
  };
}
