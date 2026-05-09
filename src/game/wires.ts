import type { Cell, PartType, Rotation, Side } from './types';

/** rotation = 0 の素のワイヤー定義。各ワイヤーは [Side, Side] のペア */
const BASE_WIRES: Record<PartType, ReadonlyArray<readonly [Side, Side]>> = {
  empty: [],
  straight: [[0, 2]],
  L: [[0, 1]],
  cross: [
    [0, 2],
    [1, 3],
  ],
};

/** 隣接セル方向: side -> [dr, dc, opposite side] */
export const NEIGHBOR_OFFSET: Record<Side, readonly [number, number, Side]> = {
  0: [-1, 0, 2],
  1: [0, 1, 3],
  2: [1, 0, 0],
  3: [0, -1, 1],
};

const rotateSide = (s: Side, r: Rotation): Side => (((s + r) % 4) as Side);

/**
 * セルのワイヤー集合を回転後の状態で返す。
 * 戻り値: ワイヤー配列。各ワイヤーは [Side, Side]
 */
export function rotatedWires(cell: Cell): Array<[Side, Side]> {
  const base = BASE_WIRES[cell.type];
  const r = cell.rotation;
  const result: Array<[Side, Side]> = [];
  for (const [a, b] of base) {
    result.push([rotateSide(a, r), rotateSide(b, r)]);
  }
  return result;
}

/** ワイヤーが特定の Side に開いているか */
export function wireHasSide(wire: readonly [Side, Side], side: Side): boolean {
  return wire[0] === side || wire[1] === side;
}

/**
 * Junction ID = cellIndex * 2 + wireSlot
 * cross は wireSlot 0/1 を持つ。straight/L は 0 のみ。empty は持たない。
 */
export function junctionId(cellIndex: number, wireSlot: number): number {
  return cellIndex * 2 + wireSlot;
}
