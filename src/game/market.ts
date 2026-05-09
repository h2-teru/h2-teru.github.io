export type IntelRarity = 'COMMON' | 'RARE' | 'CRITICAL';
export type IntelType = 'LOG_FRAGMENT' | 'PERSONNEL' | 'RESEARCH' | 'MILITARY' | 'ARCHIVE';

export interface IntelItem {
  id: string;
  type: IntelType;
  name: string;
  stageId: number;
  baseValue: number;
  rarity: IntelRarity;
  desc: string;
}

export type EquipId =
  | 'heat_sink'
  | 'torque_limiter'
  | 'cold_buffer'
  | 'firewall_kit'
  | 'neural_cache'
  | 'route_compiler';

export type EquipCategory = 'IMPLANT' | 'DECK' | 'UTILITY';
export type EquipTier = 'I' | 'II' | 'III';

export interface Equipment {
  id: EquipId;
  name: string;
  jpName: string;
  category: EquipCategory;
  tier: EquipTier;
  price: number;
  desc: string;
  effect: string;
  stat: string;
  color: string;
}

export const RARITY_COLOR: Record<IntelRarity, string> = {
  COMMON:   '#4da3ff',
  RARE:     '#ff7800',
  CRITICAL: '#ff2d55',
};

export const INTEL_TYPE_LABEL: Record<IntelType, string> = {
  LOG_FRAGMENT: 'LOG',
  PERSONNEL:    'PERS',
  RESEARCH:     'RSCH',
  MILITARY:     'MIL',
  ARCHIVE:      'ARCH',
};

export const EQUIPMENT_CATEGORY_COLOR: Record<EquipCategory, string> = {
  IMPLANT:  '#4da3ff',
  DECK:     '#9bff5d',
  UTILITY:  '#ff7800',
};

export const EQUIPMENT_LIST: Equipment[] = [
  {
    id: 'heat_sink',
    name: 'HEAT SINK',
    jpName: '熱拡散モジュール',
    category: 'IMPLANT',
    tier: 'I',
    price: 450,
    desc: '時間経過による追跡を常時遅らせる。',
    effect: 'TRACE SPD −18%',
    stat: 'TIME TRACE',
    color: '#4da3ff',
  },
  {
    id: 'torque_limiter',
    name: 'TORQUE LIMITER',
    jpName: 'トルクリミッター',
    category: 'IMPLANT',
    tier: 'I',
    price: 520,
    desc: '回転操作で発生する痕跡を抑える。',
    effect: 'ROTATE COST −14%',
    stat: 'ROTATION',
    color: '#9bff5d',
  },
  {
    id: 'cold_buffer',
    name: 'COLD BUFFER',
    jpName: 'コールドバッファ',
    category: 'DECK',
    tier: 'I',
    price: 560,
    desc: '各ウェーブ開始時の初期トレースを下げる。',
    effect: 'START TRACE −8',
    stat: 'OPENING',
    color: '#9bff5d',
  },
  {
    id: 'firewall_kit',
    name: 'FIREWALL KIT',
    jpName: 'ファイアウォールキット',
    category: 'UTILITY',
    tier: 'II',
    price: 760,
    desc: '各ウェーブで一度だけトレース到達を防ぐ。',
    effect: 'BLOCK ×1/wave',
    stat: 'SURVIVAL',
    color: '#ff7800',
  },
  {
    id: 'neural_cache',
    name: 'NEURAL CACHE',
    jpName: 'ニューラルキャッシュ',
    category: 'IMPLANT',
    tier: 'II',
    price: 980,
    desc: 'データ圧縮効率を上げ、成功報酬を増やす。',
    effect: 'REWARD +20%',
    stat: 'PAYOUT',
    color: '#b44fff',
  },
  {
    id: 'route_compiler',
    name: 'ROUTE COMPILER',
    jpName: 'ルートコンパイラ',
    category: 'DECK',
    tier: 'II',
    price: 900,
    desc: '侵入前にダミー配線を間引く。',
    effect: 'NOISE −16%',
    stat: 'BOARD GEN',
    color: '#9bff5d',
  },
];

// ─── Intel drop pool per stage ────────────────────────────────────────────────

const INTEL_POOL: Record<number, Array<{
  type: IntelType; name: string; value: number; rarity: IntelRarity; desc: string;
}>> = {
  1: [
    { type: 'LOG_FRAGMENT', name: 'KASUMI Bank ログ断片',  value: 80,  rarity: 'COMMON', desc: '小口座の取引履歴。バイヤーが欲しがっている。' },
    { type: 'PERSONNEL',    name: '行員IDリスト',          value: 110, rarity: 'COMMON', desc: 'KASUMI中間管理職の個人情報。' },
  ],
  2: [
    { type: 'LOG_FRAGMENT', name: 'NeoTel 通信ログ',       value: 150, rarity: 'COMMON', desc: '傍受した通話の断片データ。' },
    { type: 'PERSONNEL',    name: '監視オペレーター名簿',  value: 220, rarity: 'RARE',   desc: '追跡者のリスト。業界では高値が付く。' },
  ],
  3: [
    { type: 'RESEARCH',  name: 'ゲノム配列 v0.3',       value: 380, rarity: 'RARE',   desc: '未発表の遺伝子研究データ。競合他社が狙う。' },
    { type: 'PERSONNEL', name: 'CyberMed 研究員リスト', value: 200, rarity: 'COMMON', desc: '研究チームの個人情報。' },
  ],
  4: [
    { type: 'MILITARY', name: 'ドローン制御プロトコル', value: 620,  rarity: 'RARE',     desc: '軍事ドローンのファームウェア断片。' },
    { type: 'MILITARY', name: 'AeroCorp 設計仕様書',   value: 800,  rarity: 'CRITICAL', desc: '次世代兵器仕様。超高額の取引案件。' },
  ],
  5: [
    { type: 'ARCHIVE', name: '[REDACTED] Zero Floor 記録', value: 1400, rarity: 'CRITICAL', desc: '政府極秘アーカイブ。正体不明の買い手あり。' },
    { type: 'ARCHIVE', name: '封印されたプロトコル',        value: 1150, rarity: 'CRITICAL', desc: '存在自体が危険な情報。慎重に扱え。' },
  ],
};

let _idCounter = 0;
const uid = () => `intel_${Date.now()}_${++_idCounter}`;

export function generateIntelForStage(stageId: number): IntelItem[] {
  const pool = INTEL_POOL[stageId] ?? [];
  return pool.map(({ value, ...t }) => ({ ...t, baseValue: value, id: uid(), stageId }));
}
