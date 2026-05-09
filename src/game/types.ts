export type Side = 0 | 1 | 2 | 3; // 0:N 1:E 2:S 3:W
export type Rotation = 0 | 1 | 2 | 3;
export type Color = 'red' | 'blue' | 'yellow' | 'green' | 'purple';
export type PartType = 'empty' | 'straight' | 'L' | 'cross';

export interface Cell {
  type: PartType;
  rotation: Rotation;
  fixed?: boolean;
}

export interface Port {
  side: Side;
  index: number; // 該当辺における 0-based の位置
  color: Color;
  kind: 'start' | 'goal';
}

export interface Board {
  cols: number;
  rows: number;
  cells: Cell[]; // 行優先 (row * cols + col)
  ports: Port[];
}

export type EvalStatus =
  | { status: 'CLEAR' }
  | { status: 'INCOMPLETE'; missingColors: Color[] }
  | { status: 'INVALID'; reason: 'mixed-color' | 'self-cross' };

export interface EvalResult {
  status: EvalStatus['status'];
  detail: EvalStatus;
  /** Junction ID -> Color (接続済みのワイヤーに色を付けるため) */
  junctionColors: Map<number, Color>;
  /** 違反セルのインデックス（赤枠点滅用） */
  invalidCells: Set<number>;
}
