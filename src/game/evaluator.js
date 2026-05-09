import { UnionFind } from './unionFind';
import { junctionId, NEIGHBOR_OFFSET, rotatedWires, wireHasSide } from './wires';
/**
 * ポートが盤面のどのセルに「向いている」かを返す。
 * - 北辺(side=0)のポートは row=0 の col=index にあるセルの N を見ている
 * - 南辺(side=2)のポートは row=rows-1 の col=index にあるセルの S を見ている
 * - 西辺(side=3)のポートは row=index の col=0 にあるセルの W を見ている
 * - 東辺(side=1)のポートは row=index の col=cols-1 にあるセルの E を見ている
 */
export function portTarget(port, board) {
    const { rows, cols } = board;
    switch (port.side) {
        case 0:
            return { cellIndex: 0 * cols + port.index, side: 0 };
        case 2:
            return { cellIndex: (rows - 1) * cols + port.index, side: 2 };
        case 3:
            return { cellIndex: port.index * cols + 0, side: 3 };
        case 1:
            return { cellIndex: port.index * cols + (cols - 1), side: 1 };
    }
}
export function evaluate(board) {
    const { rows, cols, cells, ports } = board;
    const cellCount = rows * cols;
    // ID 配分: junctions [0, cellCount*2), ports [cellCount*2, cellCount*2 + ports.length)
    const portBaseId = cellCount * 2;
    const uf = new UnionFind(portBaseId + ports.length);
    // 1. 隣接セル間の union
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const wires = rotatedWires(cells[idx]);
            wires.forEach((wire, slot) => {
                const myId = junctionId(idx, slot);
                for (const side of wire) {
                    // 東 (1) と 南 (2) 方向だけ処理して重複を避ける
                    if (side !== 1 && side !== 2)
                        continue;
                    const [dr, dc, opp] = NEIGHBOR_OFFSET[side];
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols)
                        continue;
                    const nIdx = nr * cols + nc;
                    const nWires = rotatedWires(cells[nIdx]);
                    nWires.forEach((nWire, nSlot) => {
                        if (wireHasSide(nWire, opp)) {
                            uf.union(myId, junctionId(nIdx, nSlot));
                        }
                    });
                }
            });
        }
    }
    // 2. ポートの union
    ports.forEach((port, i) => {
        const portId = portBaseId + i;
        const target = portTarget(port, board);
        const wires = rotatedWires(cells[target.cellIndex]);
        wires.forEach((wire, slot) => {
            if (wireHasSide(wire, target.side)) {
                uf.union(portId, junctionId(target.cellIndex, slot));
            }
        });
    });
    // 3. portsByRoot を作る
    const portsByRoot = new Map();
    ports.forEach((port, i) => {
        const root = uf.find(portBaseId + i);
        let arr = portsByRoot.get(root);
        if (!arr) {
            arr = [];
            portsByRoot.set(root, arr);
        }
        arr.push(port);
    });
    // 4. mixed-color チェック
    const invalidCells = new Set();
    let mixedColor = false;
    for (const ports of portsByRoot.values()) {
        const colors = new Set(ports.map((p) => p.color));
        if (colors.size > 1) {
            mixedColor = true;
            // この成分に属する全 junction のセルを違反として記録
        }
    }
    // 5. self-cross チェック (cross セルで両軸が同 root)
    let selfCross = false;
    for (let i = 0; i < cellCount; i++) {
        if (cells[i].type !== 'cross')
            continue;
        const r1 = uf.find(junctionId(i, 0));
        const r2 = uf.find(junctionId(i, 1));
        if (r1 === r2 && portsByRoot.get(r1)?.length) {
            selfCross = true;
            invalidCells.add(i);
        }
    }
    // 6. junction -> color マップ作成 (描画用)
    const rootColor = new Map();
    for (const [root, ports] of portsByRoot.entries()) {
        const colors = new Set(ports.map((p) => p.color));
        if (colors.size === 1) {
            rootColor.set(root, [...colors][0]);
        }
    }
    const junctionColors = new Map();
    for (let i = 0; i < cellCount; i++) {
        const wires = rotatedWires(cells[i]);
        for (let slot = 0; slot < wires.length; slot++) {
            const root = uf.find(junctionId(i, slot));
            const c = rootColor.get(root);
            if (c)
                junctionColors.set(junctionId(i, slot), c);
            // mixed-color のセルは赤枠表示用に invalidCells に
            if (portsByRoot.get(root) && new Set(portsByRoot.get(root).map((p) => p.color)).size > 1) {
                invalidCells.add(i);
            }
        }
    }
    // 7. ステータス決定
    if (mixedColor) {
        return {
            status: 'INVALID',
            detail: { status: 'INVALID', reason: 'mixed-color' },
            junctionColors,
            invalidCells,
        };
    }
    if (selfCross) {
        return {
            status: 'INVALID',
            detail: { status: 'INVALID', reason: 'self-cross' },
            junctionColors,
            invalidCells,
        };
    }
    // 8. 完成チェック
    const colorPorts = new Map();
    for (const p of ports) {
        let arr = colorPorts.get(p.color);
        if (!arr) {
            arr = [];
            colorPorts.set(p.color, arr);
        }
        arr.push(p);
    }
    const missing = [];
    for (const [color, colorPortList] of colorPorts.entries()) {
        const roots = new Set(colorPortList.map((p) => uf.find(portBaseId + ports.indexOf(p))));
        if (roots.size !== 1) {
            missing.push(color);
            continue;
        }
        const onlyRoot = [...roots][0];
        const kinds = new Set(portsByRoot.get(onlyRoot)?.map((p) => p.kind) ?? []);
        if (!kinds.has('start') || !kinds.has('goal')) {
            missing.push(color);
        }
    }
    if (missing.length === 0) {
        return {
            status: 'CLEAR',
            detail: { status: 'CLEAR' },
            junctionColors,
            invalidCells,
        };
    }
    return {
        status: 'INCOMPLETE',
        detail: { status: 'INCOMPLETE', missingColors: missing },
        junctionColors,
        invalidCells,
    };
}
