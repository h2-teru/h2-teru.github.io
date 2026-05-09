import type { TraceConfig } from './trace';

export type SkillId =
  | 'slow_trace'
  | 'cold_start'
  | 'low_friction'
  | 'ghost_step'
  | 'firewall';

export interface Skill {
  id: SkillId;
  name: string;
  desc: string;
  flavorDesc: string;
  color: string;
}

export const SKILL_DEFS: Record<SkillId, Skill> = {
  slow_trace: {
    id: 'slow_trace',
    name: 'THROTTLE',
    desc: 'トレース上昇速度 −25%',
    flavorDesc: '敵の追跡アルゴリズムに遅延パケットを注入する',
    color: '#4da3ff',
  },
  cold_start: {
    id: 'cold_start',
    name: 'COLD BOOT',
    desc: 'ハック開始トレース −15',
    flavorDesc: 'コールドスタートで初期スキャンをすり抜ける',
    color: '#9bff5d',
  },
  low_friction: {
    id: 'low_friction',
    name: 'NULL DRAG',
    desc: '回転コスト −50%',
    flavorDesc: '操作ノイズを最小化して痕跡を隠滅する',
    color: '#ffb454',
  },
  ghost_step: {
    id: 'ghost_step',
    name: 'GHOST STEP',
    desc: 'ウェーブ毎に開始トレース −8（累積）',
    flavorDesc: '移動の度にフットプリントを自動消去する',
    color: '#c77dff',
  },
  firewall: {
    id: 'firewall',
    name: 'FIREWALL',
    desc: 'トレース100%到達を1回だけ無効',
    flavorDesc: '最後の砦。一度だけ死から逃げられる',
    color: '#ff4d6d',
  },
};

export const ALL_SKILL_IDS = Object.keys(SKILL_DEFS) as SkillId[];

export function applySkillsToTrace(
  base: TraceConfig,
  skills: SkillId[],
  waveIndex: number,
): TraceConfig {
  let cfg = { ...base };
  for (const s of skills) {
    switch (s) {
      case 'slow_trace':
        cfg = { ...cfg, baseRatePerSec: cfg.baseRatePerSec * 0.75 };
        break;
      case 'cold_start':
        cfg = { ...cfg, initial: Math.max(0, cfg.initial - 15) };
        break;
      case 'low_friction':
        cfg = { ...cfg, rotationCost: cfg.rotationCost * 0.5 };
        break;
      case 'ghost_step':
        cfg = { ...cfg, initial: Math.max(0, cfg.initial - 8 * waveIndex) };
        break;
      // 'firewall' is handled in HackScreen
    }
  }
  return cfg;
}

export function pickRandomSkills(
  count: number,
  exclude: SkillId[],
  rngSeed: number,
): SkillId[] {
  const available = ALL_SKILL_IDS.filter((id) => !exclude.includes(id));
  let seed = rngSeed;
  const lcg = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(seed) / 0x7fffffff;
  };
  const arr = [...available];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}
