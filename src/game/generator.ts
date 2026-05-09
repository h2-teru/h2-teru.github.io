import type { Board, Cell, Color, PartType, Port, Rotation, Side } from './types';
import { evaluate } from './evaluator';

interface GenerateOptions {
  cols: number;
  rows: number;
  colors: Color[];
  /** 各色のスタート/ゴールのペア数。1なら1ペア、2なら2ペアずつ。 */
  pairsPerColor?: number;
  /** ノイズパーツの密度 (0〜1)。経路外セルにダミーパーツを配置する確率 */
  noiseDensity?: number;
  /** 失敗時の最大試行回数 */
  maxAttempts?: number;
  /** 乱数シード（再現性のため） */
  seed?: number;
}

export interface GeneratedBoard {
  board: Board;
  /** 完成時の正解 rotation 配列（ヒント用） */
  solutionRotations: Rotation[];
}

class Rng {
  private state: number;
  constructor(seed: number) {
    this.state = seed | 0 || 1;
  }
  next(): number {
    // mulberry32
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(arr.length)];
  }
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

interface CellSlot {
  /** このセルにすでに敷かれている方向（同色路線も別色路線も含む） */
  openings: Set<Side>;
  /** 各 opening の色（mix されていれば cross になる） */
  colorBySide: Map<Side, Color>;
}

const opposite = (s: Side): Side => (((s + 2) % 4) as Side);

/** スタート/ゴールに使う辺ポートのうち、被らないようにランダム選定 */
function pickPorts(
  cols: number,
  rows: number,
  colors: Color[],
  pairsPerColor: number,
  rng: Rng,
): Port[] {
  // 候補: 全 4 辺のセル数ぶん
  const candidates: Array<{ side: Side; index: number }> = [];
  for (let c = 0; c < cols; c++) {
    candidates.push({ side: 0, index: c });
    candidates.push({ side: 2, index: c });
  }
  for (let r = 0; r < rows; r++) {
    candidates.push({ side: 3, index: r });
    candidates.push({ side: 1, index: r });
  }
  const shuffled = rng.shuffle(candidates);
  const used = new Set<string>();
  const ports: Port[] = [];
  for (const color of colors) {
    for (let p = 0; p < pairsPerColor; p++) {
      let start: { side: Side; index: number } | null = null;
      let goal: { side: Side; index: number } | null = null;
      for (const cand of shuffled) {
        const key = `${cand.side}:${cand.index}`;
        if (used.has(key)) continue;
        if (!start) {
          start = cand;
          used.add(key);
        } else {
          // start と異なる辺 (できれば反対側) を選ぶ
          if (cand.side === start.side) continue;
          goal = cand;
          used.add(key);
          break;
        }
      }
      if (!start || !goal) {
        throw new Error('Not enough port slots on the board.');
      }
      ports.push({ ...start, color, kind: 'start' });
      ports.push({ ...goal, color, kind: 'goal' });
    }
  }
  return ports;
}

/** ポートが向き合うセルの (cellIndex, side) を返す */
function portTargetCell(
  port: Port,
  cols: number,
  rows: number,
): { row: number; col: number; side: Side } {
  switch (port.side) {
    case 0:
      return { row: 0, col: port.index, side: 0 };
    case 2:
      return { row: rows - 1, col: port.index, side: 2 };
    case 3:
      return { row: port.index, col: 0, side: 3 };
    case 1:
      return { row: port.index, col: cols - 1, side: 1 };
  }
}

const SIDE_DELTA: Record<Side, [number, number]> = {
  0: [-1, 0],
  1: [0, 1],
  2: [1, 0],
  3: [0, -1],
};

/**
 * グリッド経路探索: スタートセルからゴールセルまで、
 * - 既に同色が通っているセルは通れない
 * - 別色が通っているセルは交差(cross 化)で通過可（ただしそのセルが既に十字形に拡張可能か）
 */
function findPath(
  startCell: { row: number; col: number; entrySide: Side },
  goalCell: { row: number; col: number; entrySide: Side },
  slots: CellSlot[],
  cols: number,
  rows: number,
  color: Color,
  rng: Rng,
): Array<{ row: number; col: number; from: Side; to: Side }> | null {
  // BFS。状態は (row, col, 入射 side)。
  // ただし汎用性のため簡略化: (row, col) のみで状態管理し、各セルに「どの side から入るか」を保持
  type Node = {
    row: number;
    col: number;
    from: Side; // このセルへ入った時の側
    parent: Node | null;
  };
  const visited = new Set<string>();
  const startKey = `${startCell.row},${startCell.col}`;
  const queue: Node[] = [
    { row: startCell.row, col: startCell.col, from: startCell.entrySide, parent: null },
  ];
  visited.add(startKey);

  while (queue.length > 0) {
    // 軽くランダム性を入れるため、先頭をランダムに pop（厳密 BFS ではないが探索で十分）
    const idx = rng.int(Math.min(3, queue.length));
    const cur = queue.splice(idx, 1)[0];

    if (cur.row === goalCell.row && cur.col === goalCell.col) {
      // 経路を組み立てる
      const path: Array<{ row: number; col: number; from: Side; to: Side }> = [];
      let n: Node | null = cur;
      // ゴールのセルでは出口は goalCell.entrySide
      let nextTo: Side = goalCell.entrySide;
      while (n) {
        path.unshift({ row: n.row, col: n.col, from: n.from, to: nextTo });
        nextTo = opposite(n.from);
        n = n.parent;
      }
      // 中継セルが「同色既通過」「別色 cross 化不可」かチェックしてフィルタ
      for (const step of path) {
        const slot = slots[step.row * cols + step.col];
        if (!slot) continue;
        // 同色がすでに通っているならNG
        for (const [, col] of slot.colorBySide) {
          if (col === color) return null;
        }
        // すでに 2 方向以上が他色で使われていたら（cross は 4 方向のみ許可）厳しい
        if (slot.openings.size + 2 > 4) return null;
      }
      return path;
    }

    const sides: Side[] = rng.shuffle([0, 1, 2, 3]);
    for (const out of sides) {
      // cur の入射と同じ side からは出ない（U ターン禁止）
      if (out === cur.from) continue;
      const [dr, dc] = SIDE_DELTA[out];
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      const key = `${nr},${nc}`;
      if (visited.has(key)) continue;
      // 隣セルが既に同色を含むなら通れない
      const nslot = slots[nr * cols + nc];
      if (nslot) {
        let sameColor = false;
        for (const [, c] of nslot.colorBySide) {
          if (c === color) {
            sameColor = true;
            break;
          }
        }
        if (sameColor) continue;
      }
      visited.add(key);
      queue.push({ row: nr, col: nc, from: opposite(out), parent: cur });
    }
  }
  return null;
}

/**
 * 経路を slot に書き込む
 */
function applyPath(
  path: Array<{ row: number; col: number; from: Side; to: Side }>,
  slots: CellSlot[],
  cols: number,
  color: Color,
): void {
  for (const step of path) {
    const idx = step.row * cols + step.col;
    let slot = slots[idx];
    if (!slot) {
      slot = { openings: new Set(), colorBySide: new Map() };
      slots[idx] = slot;
    }
    slot.openings.add(step.from);
    slot.openings.add(step.to);
    slot.colorBySide.set(step.from, color);
    slot.colorBySide.set(step.to, color);
  }
}

/**
 * slot から PartType と「正解 rotation」を決める
 */
function determineParts(
  slots: CellSlot[],
  cellCount: number,
): { types: PartType[]; rotations: Rotation[] } {
  const types: PartType[] = new Array(cellCount).fill('empty');
  const rotations: Rotation[] = new Array(cellCount).fill(0);
  for (let i = 0; i < cellCount; i++) {
    const slot = slots[i];
    if (!slot || slot.openings.size === 0) continue;

    const sides = [...slot.openings].sort((a, b) => a - b) as Side[];
    if (sides.length === 4) {
      types[i] = 'cross';
      rotations[i] = 0;
    } else if (sides.length === 2) {
      const [a, b] = sides;
      if ((b - a + 4) % 4 === 2) {
        // 反対同士 = straight
        types[i] = 'straight';
        // 0,2 -> rotation 0 / 1,3 -> rotation 1
        rotations[i] = a === 0 ? 0 : 1;
      } else {
        // L字
        types[i] = 'L';
        // base L = sides {0,1} (rotation 0)
        // 回転後の sides は { rot, rot+1 mod 4 }
        // つまり rotation = a (連続するペアの最小値)
        // ただし {3,0} の場合は a=3 になる
        const sortedAdj = ((b - a + 4) % 4 === 1) ? [a, b] : [b, a];
        rotations[i] = sortedAdj[0] as Rotation;
      }
    } else {
      // 1方向だけ = 不正だが、ノイズ用にL字としておく
      types[i] = 'L';
      rotations[i] = 0;
    }
  }
  return { types, rotations };
}

/** ノイズセルを追加 */
function addNoise(
  types: PartType[],
  cellCount: number,
  noiseDensity: number,
  rng: Rng,
): void {
  for (let i = 0; i < cellCount; i++) {
    if (types[i] !== 'empty') continue;
    if (rng.next() > noiseDensity) continue;
    const r = rng.next();
    if (r < 0.5) types[i] = 'L';
    else if (r < 0.85) types[i] = 'straight';
    else types[i] = 'cross';
  }
}

/** rotation を乱す。ただし「正解と異なる」ことを保証 */
function shuffleRotations(
  types: PartType[],
  solution: Rotation[],
  rng: Rng,
): Rotation[] {
  const result: Rotation[] = new Array(types.length).fill(0);
  for (let i = 0; i < types.length; i++) {
    if (types[i] === 'empty') {
      result[i] = 0;
      continue;
    }
    if (types[i] === 'cross') {
      result[i] = 0; // cross は対称なので回転意味なし
      continue;
    }
    if (types[i] === 'straight') {
      // 対称性: rotation 0 と 2 は同じ、 1 と 3 は同じ
      // 解が 0 系 (0/2) なら 1 系を選ぶ
      const sym = solution[i] % 2;
      const r = (sym + 1) % 2;
      result[i] = (r === 0 ? rng.pick([0, 2]) : rng.pick([1, 3])) as Rotation;
      continue;
    }
    // L 字
    const offset = (rng.int(3) + 1) as 1 | 2 | 3;
    result[i] = (((solution[i] + offset) % 4) as Rotation);
  }
  return result;
}

export function generateBoard(opts: GenerateOptions): GeneratedBoard {
  const {
    cols,
    rows,
    colors,
    pairsPerColor = 1,
    noiseDensity = 0.35,
    maxAttempts = 80,
    seed = Date.now() & 0xffffffff,
  } = opts;

  const cellCount = cols * rows;
  let attempt = 0;
  let lastError: unknown = null;
  while (attempt < maxAttempts) {
    attempt++;
    const rng = new Rng(seed + attempt * 7919);
    try {
      const ports = pickPorts(cols, rows, colors, pairsPerColor, rng);
      const slots: CellSlot[] = new Array(cellCount).fill(null);

      let success = true;
      // 色ごとに経路を引く
      const colorOrder = rng.shuffle(colors);
      for (const color of colorOrder) {
        for (let p = 0; p < pairsPerColor; p++) {
          const start = ports.find(
            (po) => po.color === color && po.kind === 'start' && !(po as any)._used,
          );
          const goal = ports.find(
            (po) => po.color === color && po.kind === 'goal' && !(po as any)._used,
          );
          if (!start || !goal) {
            success = false;
            break;
          }
          (start as any)._used = true;
          (goal as any)._used = true;

          const startCell = portTargetCell(start, cols, rows);
          const goalCell = portTargetCell(goal, cols, rows);

          // スタートセルに入射するのはポートからの方向 = startCell.side
          // ゴールセルから出ていくのも goalCell.side
          const path = findPath(
            { row: startCell.row, col: startCell.col, entrySide: startCell.side },
            { row: goalCell.row, col: goalCell.col, entrySide: goalCell.side },
            slots,
            cols,
            rows,
            color,
            rng,
          );
          if (!path) {
            success = false;
            break;
          }
          applyPath(path, slots, cols, color);
        }
        if (!success) break;
      }

      // _used フラグを掃除
      ports.forEach((p) => delete (p as any)._used);

      if (!success) continue;

      const { types, rotations: solutionRotations } = determineParts(slots, cellCount);
      addNoise(types, cellCount, noiseDensity, rng);
      const startRotations = shuffleRotations(types, solutionRotations, rng);

      const cells: Cell[] = types.map((t, i) => ({
        type: t,
        rotation: t === 'empty' ? 0 : startRotations[i],
      }));

      const board: Board = { cols, rows, cells, ports };

      // 検証: 解の rotation を当てれば CLEAR になることを確認
      const solutionCells = cells.map((c, i) => ({
        ...c,
        rotation: c.type === 'empty' ? 0 : solutionRotations[i],
      }));
      const verify = evaluate({ ...board, cells: solutionCells });
      if (verify.status !== 'CLEAR') {
        // 生成バグ。再試行
        continue;
      }

      return { board, solutionRotations };
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  throw new Error(
    `Failed to generate a valid board after ${maxAttempts} attempts. Last error: ${String(lastError)}`,
  );
}
