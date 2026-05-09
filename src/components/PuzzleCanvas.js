import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { NEIGHBOR_OFFSET, rotatedWires, junctionId, wireHasSide } from '../game/wires';
const COLOR_HEX = {
    red: '#ff4d6d',
    blue: '#3aa8ff',
    yellow: '#ffd24d',
    green: '#9bff5d',
    purple: '#c87dff',
};
const COLOR_GLOW = {
    red: 'rgba(255, 77, 109, 0.65)',
    blue: 'rgba(58, 168, 255, 0.65)',
    yellow: 'rgba(255, 210, 77, 0.65)',
    green: 'rgba(155, 255, 93, 0.65)',
    purple: 'rgba(200, 125, 255, 0.65)',
};
const CLEAR_FLOW_FLARE = {
    red: { outer: '#ff2f5f', inner: '#ff7a98', core: '#fff0f4' },
    blue: { outer: '#2f7dff', inner: '#78bdff', core: '#f2fbff' },
    yellow: { outer: '#ffd24d', inner: '#ffe58a', core: '#fff8dc' },
    green: { outer: '#8cff55', inner: '#bcff8a', core: '#f4ffe8' },
    purple: { outer: '#b45dff', inner: '#d6a1ff', core: '#fbf0ff' },
};
const SIDE_TO_VEC = {
    0: [0, -1],
    1: [1, 0],
    2: [0, 1],
    3: [-1, 0],
};
const PORT_MARGIN_RATIO = 0.36;
const EDGE_PADDING = 2;
const PORT_OFFSET_RATIO = 0.21;
const PORT_RADIUS_RATIO = 0.13;
const CLEAR_FLOW_MS = 1000;
const CLEAR_FLOW_EASING = [0.86, 0, 0.12, 1];
function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}
function cubicBezierProgress(progress, x1, y1, x2, y2) {
    const x = clamp01(progress);
    if (x === 0 || x === 1)
        return x;
    let t = x;
    for (let i = 0; i < 5; i++) {
        const currentX = cubicBezierAxis(t, x1, x2) - x;
        const derivative = cubicBezierAxisDerivative(t, x1, x2);
        if (Math.abs(currentX) < 0.0001 || Math.abs(derivative) < 0.0001)
            break;
        t = clamp01(t - currentX / derivative);
    }
    return clamp01(cubicBezierAxis(t, y1, y2));
}
function cubicBezierAxis(t, a1, a2) {
    const inv = 1 - t;
    return 3 * inv * inv * t * a1 + 3 * inv * t * t * a2 + t * t * t;
}
function cubicBezierAxisDerivative(t, a1, a2) {
    const inv = 1 - t;
    return 3 * inv * inv * a1 + 6 * inv * t * (a2 - a1) + 3 * t * t * (1 - a2);
}
export function PuzzleCanvas({ board, evalResult, onCellTap, failed, danger, clearFlow = false }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const clearFlowStartedAt = useRef(null);
    // リサイズ (ResizeObserver でコンテナサイズの変化を追従)
    useEffect(() => {
        const handle = () => {
            const c = canvasRef.current;
            const wrap = containerRef.current;
            if (!c || !wrap)
                return;
            const rect = wrap.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0)
                return;
            const dpr = window.devicePixelRatio || 1;
            c.width = Math.max(1, Math.floor(rect.width * dpr));
            c.height = Math.max(1, Math.floor(rect.height * dpr));
            c.style.width = `${rect.width}px`;
            c.style.height = `${rect.height}px`;
            const ctx = c.getContext('2d');
            if (ctx)
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw();
        };
        handle();
        const ro = new ResizeObserver(handle);
        if (containerRef.current)
            ro.observe(containerRef.current);
        window.addEventListener('resize', handle);
        window.addEventListener('orientationchange', handle);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', handle);
            window.removeEventListener('orientationchange', handle);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // 描画
    useEffect(() => {
        draw();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [board, evalResult, failed, danger, clearFlow]);
    useEffect(() => {
        if (!clearFlow) {
            clearFlowStartedAt.current = null;
            draw();
            return;
        }
        clearFlowStartedAt.current = performance.now();
        let raf = 0;
        const tick = () => {
            draw();
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearFlow, board, evalResult]);
    function draw() {
        const c = canvasRef.current;
        if (!c)
            return;
        const ctx = c.getContext('2d');
        if (!ctx)
            return;
        const rect = c.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        const { cols, rows, cells, ports } = board;
        // ポート用の外周余白を詰め、盤面セルをできるだけ大きく見せる。
        const cellSize = Math.max(8, Math.min((W - EDGE_PADDING * 2) / (cols + PORT_MARGIN_RATIO * 2), (H - EDGE_PADDING * 2) / (rows + PORT_MARGIN_RATIO * 2)));
        const boardW = cellSize * cols;
        const boardH = cellSize * rows;
        const offsetX = (W - boardW) / 2;
        const offsetY = (H - boardH) / 2;
        ctx.clearRect(0, 0, W, H);
        // Color helpers
        const accentA = (a) => danger ? `rgba(255,77,109,${a})` : `rgba(77,163,255,${a})`;
        // ── 全体背景 ────────────────────────────────────────────
        ctx.fillStyle = '#01050c';
        ctx.fillRect(0, 0, W, H);
        const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.65);
        bgGrad.addColorStop(0, accentA(0.11));
        bgGrad.addColorStop(0.45, 'rgba(4,14,32,0.42)');
        bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
        // ── ボード背景 ───────────────────────────────────────────
        const plateGrad = ctx.createLinearGradient(offsetX, offsetY, offsetX, offsetY + boardH);
        plateGrad.addColorStop(0, '#031126');
        plateGrad.addColorStop(0.52, '#020a16');
        plateGrad.addColorStop(1, '#020814');
        ctx.fillStyle = plateGrad;
        ctx.fillRect(offsetX, offsetY, boardW, boardH);
        // Subtle inner terminal glow
        ctx.save();
        ctx.strokeStyle = accentA(0.08);
        ctx.lineWidth = 8;
        ctx.shadowColor = accentA(0.22);
        ctx.shadowBlur = 18;
        ctx.strokeRect(offsetX + 4, offsetY + 4, boardW - 8, boardH - 8);
        ctx.restore();
        // セル中心ドット
        ctx.fillStyle = 'rgba(77,163,255,0.045)';
        for (let r = 0; r < rows; r++) {
            for (let cc = 0; cc < cols; cc++) {
                ctx.beginPath();
                ctx.arc(offsetX + cc * cellSize + cellSize / 2, offsetY + r * cellSize + cellSize / 2, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // ═══════════════════════════════════════════════════════
        // HUD 装飾 — 直線的な端末フレーム
        // ═══════════════════════════════════════════════════════
        // ── 外側セカンドフレーム ────────────────────────────────
        {
            const outerPad = Math.min(offsetX * 0.42, offsetY * 0.42, 18);
            if (outerPad >= 9) {
                const rx = offsetX - outerPad, ry = offsetY - outerPad;
                const rw = boardW + outerPad * 2, rh = boardH + outerPad * 2;
                const n = Math.min(rw, rh) * 0.12;
                if (rx >= 3 && ry >= 3 && rx + rw <= W - 3 && ry + rh <= H - 3) {
                    ctx.save();
                    ctx.strokeStyle = accentA(0.20);
                    ctx.lineWidth = 0.7;
                    ctx.lineCap = 'square';
                    ctx.shadowBlur = 0;
                    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
                    // Horizontal data rails, no diagonal elements.
                    ctx.strokeStyle = accentA(0.14);
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(rx + n * 0.35, ry + 12);
                    ctx.lineTo(rx + rw - n * 0.35, ry + 12);
                    ctx.moveTo(rx + n * 0.35, ry + rh - 12);
                    ctx.lineTo(rx + rw - n * 0.35, ry + rh - 12);
                    ctx.stroke();
                    ctx.fillStyle = accentA(0.42);
                    const chipW = 18;
                    const chipH = 2;
                    ctx.fillRect(rx + 10, ry + 11, chipW, chipH);
                    ctx.fillRect(rx + rw - chipW - 10, ry + rh - 13, chipW, chipH);
                    ctx.restore();
                }
            }
        }
        // ── セル枠線 ────────────────────────────────────────────
        ctx.strokeStyle = accentA(0.075);
        ctx.lineWidth = 0.5;
        for (let r = 0; r <= rows; r++) {
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY + r * cellSize);
            ctx.lineTo(offsetX + boardW, offsetY + r * cellSize);
            ctx.stroke();
        }
        for (let cc = 0; cc <= cols; cc++) {
            ctx.beginPath();
            ctx.moveTo(offsetX + cc * cellSize, offsetY);
            ctx.lineTo(offsetX + cc * cellSize, offsetY + boardH);
            ctx.stroke();
        }
        // ── 連結 HUD ボーダー ──────────────────────────────────
        {
            ctx.save();
            ctx.lineCap = 'square';
            ctx.shadowColor = accentA(0.35);
            ctx.shadowBlur = 12;
            ctx.strokeStyle = accentA(0.82);
            ctx.lineWidth = 1.0;
            ctx.strokeRect(offsetX + 0.5, offsetY + 0.5, boardW - 1, boardH - 1);
            ctx.restore();
        }
        // ── エッジ目盛り線 ────────────────────────────────────────
        {
            const tLen = 4, tPad = 3;
            ctx.save();
            ctx.strokeStyle = 'rgba(205,230,255,0.24)';
            ctx.lineWidth = 0.65;
            ctx.shadowBlur = 0;
            for (let i = 0; i <= cols; i++) {
                const tx = offsetX + i * cellSize;
                ctx.beginPath();
                ctx.moveTo(tx, offsetY - tPad);
                ctx.lineTo(tx, offsetY - tPad - tLen);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(tx, offsetY + boardH + tPad);
                ctx.lineTo(tx, offsetY + boardH + tPad + tLen);
                ctx.stroke();
            }
            for (let i = 0; i <= rows; i++) {
                const ty = offsetY + i * cellSize;
                ctx.beginPath();
                ctx.moveTo(offsetX - tPad, ty);
                ctx.lineTo(offsetX - tPad - tLen, ty);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(offsetX + boardW + tPad, ty);
                ctx.lineTo(offsetX + boardW + tPad + tLen, ty);
                ctx.stroke();
            }
            ctx.restore();
        }
        // パーツ描画
        const wireWidth = Math.max(2, cellSize * 0.078);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const idx = row * cols + col;
                const cell = cells[idx];
                if (cell.type === 'empty')
                    continue;
                const cx = offsetX + col * cellSize + cellSize / 2;
                const cy = offsetY + row * cellSize + cellSize / 2;
                const wires = rotatedWires(cell);
                wires.forEach((wire, slot) => {
                    const jid = junctionId(idx, slot);
                    const color = evalResult?.junctionColors.get(jid);
                    drawWire(ctx, cx, cy, cellSize, wire, color, wireWidth);
                });
                // 違反セルは赤枠点滅
                if (evalResult?.invalidCells.has(idx)) {
                    ctx.strokeStyle = '#ff4d6d';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#ff4d6d';
                    ctx.shadowBlur = 8;
                    ctx.strokeRect(offsetX + col * cellSize + 2, offsetY + row * cellSize + 2, cellSize - 4, cellSize - 4);
                    ctx.shadowBlur = 0;
                }
            }
        }
        if (clearFlow && evalResult?.status === 'CLEAR') {
            const startedAt = clearFlowStartedAt.current ?? performance.now();
            clearFlowStartedAt.current = startedAt;
            const linearProgress = clamp01((performance.now() - startedAt) / CLEAR_FLOW_MS);
            const progress = cubicBezierProgress(linearProgress, ...CLEAR_FLOW_EASING);
            drawClearFlow(ctx, offsetX, offsetY, cellSize, rows, cols, wireWidth, progress);
        }
        // ポート描画 (システム感: Start=ひし形, Goal=二重四角)
        const portRadius = cellSize * PORT_RADIUS_RATIO;
        for (const port of ports) {
            const { x, y } = portPos(port, offsetX, offsetY, cellSize, rows, cols);
            ctx.fillStyle = COLOR_HEX[port.color];
            ctx.strokeStyle = COLOR_HEX[port.color];
            ctx.shadowColor = COLOR_GLOW[port.color];
            // 形状が潰れないよう発光は控えめに
            ctx.shadowBlur = 6;
            if (port.kind === 'start') {
                // ひし形 (45°回転した正方形) + 明確な枠
                ctx.beginPath();
                ctx.moveTo(x, y - portRadius);
                ctx.lineTo(x + portRadius, y);
                ctx.lineTo(x, y + portRadius);
                ctx.lineTo(x - portRadius, y);
                ctx.closePath();
                ctx.fill();
                // 輪郭を強調するため暗色の内枠を追加
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#05060a';
                ctx.stroke();
                ctx.strokeStyle = COLOR_HEX[port.color];
            }
            else {
                // 二重四角 (外枠のみ + 中心に小さい塗り四角)
                ctx.lineWidth = 2;
                ctx.strokeRect(x - portRadius, y - portRadius, portRadius * 2, portRadius * 2);
                const inner = portRadius * 0.55;
                ctx.fillRect(x - inner, y - inner, inner * 2, inner * 2);
            }
            ctx.shadowBlur = 0;
            // ラベル
            ctx.fillStyle = '#05060a';
            ctx.font = `bold ${Math.floor(portRadius * 0.9)}px JetBrains Mono`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(port.kind === 'start' ? 'S' : 'G', x, y);
        }
        if (failed) {
            // ヴィネット形式の失敗オーバーレイ
            const failGrad = ctx.createRadialGradient(W / 2, H / 2, H * 0.05, W / 2, H / 2, H * 0.75);
            failGrad.addColorStop(0, 'rgba(255,77,109,0)');
            failGrad.addColorStop(1, 'rgba(255,77,109,0.32)');
            ctx.fillStyle = failGrad;
            ctx.fillRect(0, 0, W, H);
            // ボード上にも薄い赤オーバーレイ
            ctx.fillStyle = 'rgba(255,77,109,0.1)';
            ctx.fillRect(offsetX, offsetY, boardW, boardH);
        }
    }
    function drawWire(ctx, cx, cy, cellSize, wire, color, lineWidth) {
        const half = cellSize / 2;
        const [s1, s2] = wire;
        const [v1x, v1y] = SIDE_TO_VEC[s1];
        const [v2x, v2y] = SIDE_TO_VEC[s2];
        const p1x = cx + v1x * half;
        const p1y = cy + v1y * half;
        const p2x = cx + v2x * half;
        const p2y = cy + v2y * half;
        const isStraight = s1 === ((s2 + 2) % 4);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const drawPath = () => {
            ctx.beginPath();
            if (isStraight) {
                ctx.moveTo(p1x, p1y);
                ctx.lineTo(p2x, p2y);
            }
            else {
                ctx.moveTo(p1x, p1y);
                ctx.lineTo(cx, cy);
                ctx.lineTo(p2x, p2y);
            }
        };
        if (color) {
            // シングルストロークのみ — グロー重複を防ぐためレイヤーは重ねない
            ctx.strokeStyle = COLOR_HEX[color];
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = COLOR_GLOW[color];
            ctx.shadowBlur = 6;
            drawPath();
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        else {
            ctx.strokeStyle = 'rgba(38,44,65,0.75)';
            ctx.lineWidth = lineWidth * 0.8;
            ctx.shadowBlur = 0;
            drawPath();
            ctx.stroke();
        }
    }
    function drawClearFlow(ctx, offsetX, offsetY, cellSize, rows, cols, wireWidth, progress) {
        const paths = buildClearFlowPaths(offsetX, offsetY, cellSize, rows, cols);
        if (paths.length === 0)
            return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const path of paths) {
            const visible = path.length * progress;
            const color = COLOR_HEX[path.color];
            const flare = CLEAR_FLOW_FLARE[path.color];
            // 薄い下地を全経路に敷き、S-G の接続先を途切れなく見せる。
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = colorWithAlpha(color, 0.1);
            ctx.lineWidth = wireWidth * 1.45;
            ctx.shadowBlur = 0;
            strokePolylinePortion(ctx, path.points, 0, path.length);
            // 参考のレンズフレア風に、線色ごとの光量を外側から段階的に重ねる。
            ctx.globalCompositeOperation = 'lighter';
            ctx.shadowColor = colorWithAlpha(flare.outer, 0.58);
            ctx.shadowBlur = Math.max(18, wireWidth * 4.2);
            ctx.strokeStyle = colorWithAlpha(flare.outer, 0.12);
            ctx.lineWidth = wireWidth * 5.4;
            strokePolylinePortion(ctx, path.points, 0, visible);
            ctx.shadowColor = colorWithAlpha(flare.outer, 0.68);
            ctx.shadowBlur = Math.max(12, wireWidth * 2.7);
            ctx.strokeStyle = colorWithAlpha(flare.outer, 0.3);
            ctx.lineWidth = wireWidth * 3.1;
            strokePolylinePortion(ctx, path.points, 0, visible);
            ctx.shadowColor = colorWithAlpha(flare.inner, 0.56);
            ctx.shadowBlur = Math.max(5, wireWidth * 1.15);
            ctx.strokeStyle = colorWithAlpha(flare.inner, 0.7);
            ctx.lineWidth = wireWidth * 1.35;
            strokePolylinePortion(ctx, path.points, 0, visible);
            ctx.strokeStyle = colorWithAlpha(flare.core, 0.42);
            ctx.lineWidth = Math.max(0.65, wireWidth * 0.1);
            ctx.shadowBlur = 0;
            strokePolylinePortion(ctx, path.points, 0, visible);
        }
        ctx.restore();
    }
    function buildClearFlowPaths(offsetX, offsetY, cellSize, rows, cols) {
        if (!evalResult || evalResult.status !== 'CLEAR')
            return [];
        const graph = new Map();
        const addEdge = (from, to, points, color) => {
            const length = polylineLength(points);
            const forward = { to, points, length, color };
            const backward = { to: from, points: points.slice().reverse(), length, color };
            const fromEdges = graph.get(from) ?? [];
            fromEdges.push(forward);
            graph.set(from, fromEdges);
            const toEdges = graph.get(to) ?? [];
            toEdges.push(backward);
            graph.set(to, toEdges);
        };
        const sideKey = (cellIndex, side) => `c:${cellIndex}:${side}`;
        const portKey = (portIndex) => `p:${portIndex}`;
        const cellCenter = (cellIndex) => {
            const row = Math.floor(cellIndex / cols);
            const col = cellIndex % cols;
            return {
                x: offsetX + col * cellSize + cellSize / 2,
                y: offsetY + row * cellSize + cellSize / 2,
            };
        };
        const sidePoint = (cellIndex, side) => {
            const center = cellCenter(cellIndex);
            const [vx, vy] = SIDE_TO_VEC[side];
            return {
                x: center.x + vx * cellSize / 2,
                y: center.y + vy * cellSize / 2,
            };
        };
        const cellHasSide = (cellIndex, side) => rotatedWires(board.cells[cellIndex]).some((wire) => wireHasSide(wire, side));
        for (let cellIndex = 0; cellIndex < board.cells.length; cellIndex++) {
            const cell = board.cells[cellIndex];
            if (cell.type === 'empty')
                continue;
            const center = cellCenter(cellIndex);
            const wires = rotatedWires(cell);
            wires.forEach((wire, slot) => {
                const color = evalResult.junctionColors.get(junctionId(cellIndex, slot));
                if (!color)
                    return;
                const [s1, s2] = wire;
                const p1 = sidePoint(cellIndex, s1);
                const p2 = sidePoint(cellIndex, s2);
                const isStraight = s1 === ((s2 + 2) % 4);
                addEdge(sideKey(cellIndex, s1), sideKey(cellIndex, s2), isStraight ? [p1, p2] : [p1, center, p2], color);
            });
        }
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cellIndex = row * cols + col;
                for (const side of [1, 2]) {
                    const [dr, dc, opposite] = NEIGHBOR_OFFSET[side];
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols)
                        continue;
                    const neighborIndex = nr * cols + nc;
                    if (!cellHasSide(cellIndex, side) || !cellHasSide(neighborIndex, opposite))
                        continue;
                    const jid = findJunctionBySide(cellIndex, side);
                    const color = typeof jid === 'number' ? evalResult.junctionColors.get(jid) : undefined;
                    if (!color)
                        continue;
                    addEdge(sideKey(cellIndex, side), sideKey(neighborIndex, opposite), [sidePoint(cellIndex, side), sidePoint(neighborIndex, opposite)], color);
                }
            }
        }
        board.ports.forEach((port, portIndex) => {
            const target = portTargetCell(port, rows, cols);
            if (!cellHasSide(target.cellIndex, target.side))
                return;
            addEdge(portKey(portIndex), sideKey(target.cellIndex, target.side), [portPos(port, offsetX, offsetY, cellSize, rows, cols), sidePoint(target.cellIndex, target.side)], port.color);
        });
        const colors = Array.from(new Set(board.ports.map((port) => port.color)));
        return colors
            .map((color) => {
            const startIndex = board.ports.findIndex((port) => port.color === color && port.kind === 'start');
            const goalIndex = board.ports.findIndex((port) => port.color === color && port.kind === 'goal');
            if (startIndex < 0 || goalIndex < 0)
                return null;
            const points = findFlowPolyline(graph, portKey(startIndex), portKey(goalIndex), color);
            if (points.length < 2)
                return null;
            return { color, points, length: polylineLength(points) };
        })
            .filter((path) => Boolean(path && path.length > 0));
        function findJunctionBySide(cellIndex, side) {
            const wires = rotatedWires(board.cells[cellIndex]);
            const slot = wires.findIndex((wire) => wireHasSide(wire, side));
            return slot >= 0 ? junctionId(cellIndex, slot) : null;
        }
    }
    function findFlowPolyline(graph, start, goal, color) {
        const queue = [start];
        const previous = new Map();
        previous.set(start, null);
        for (let head = 0; head < queue.length; head++) {
            const node = queue[head];
            if (node === goal)
                break;
            for (const edge of graph.get(node) ?? []) {
                if (edge.color !== color || previous.has(edge.to))
                    continue;
                previous.set(edge.to, { node, edge });
                queue.push(edge.to);
            }
        }
        if (!previous.has(goal))
            return [];
        const edges = [];
        let current = goal;
        while (current !== start) {
            const prev = previous.get(current);
            if (!prev)
                return [];
            edges.push(prev.edge);
            current = prev.node;
        }
        edges.reverse();
        const points = [];
        edges.forEach((edge, index) => {
            points.push(...(index === 0 ? edge.points : edge.points.slice(1)));
        });
        return points;
    }
    function strokePolylinePortion(ctx, points, fromDistance, toDistance) {
        const end = Math.max(0, toDistance);
        const start = Math.max(0, Math.min(fromDistance, end));
        if (end <= 0 || points.length < 2)
            return;
        let cursor = 0;
        let drawing = false;
        ctx.beginPath();
        for (let i = 1; i < points.length; i++) {
            const a = points[i - 1];
            const b = points[i];
            const segmentLength = distance(a, b);
            if (segmentLength <= 0.001)
                continue;
            const segmentStart = cursor;
            const segmentEnd = cursor + segmentLength;
            if (segmentEnd >= start && segmentStart <= end) {
                const localStart = Math.max(0, (start - segmentStart) / segmentLength);
                const localEnd = Math.min(1, (end - segmentStart) / segmentLength);
                if (localEnd > localStart) {
                    const p1 = lerpPoint(a, b, localStart);
                    const p2 = lerpPoint(a, b, localEnd);
                    if (!drawing) {
                        ctx.moveTo(p1.x, p1.y);
                        drawing = true;
                    }
                    else {
                        ctx.lineTo(p1.x, p1.y);
                    }
                    ctx.lineTo(p2.x, p2.y);
                }
            }
            cursor = segmentEnd;
            if (cursor > end)
                break;
        }
        if (drawing)
            ctx.stroke();
    }
    function polylineLength(points) {
        let total = 0;
        for (let i = 1; i < points.length; i++)
            total += distance(points[i - 1], points[i]);
        return total;
    }
    function distance(a, b) {
        return Math.hypot(b.x - a.x, b.y - a.y);
    }
    function lerpPoint(a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
        };
    }
    function colorWithAlpha(hex, alpha) {
        const normalized = hex.replace('#', '');
        const r = Number.parseInt(normalized.slice(0, 2), 16);
        const g = Number.parseInt(normalized.slice(2, 4), 16);
        const b = Number.parseInt(normalized.slice(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
    function portTargetCell(port, rows, cols) {
        switch (port.side) {
            case 0:
                return { cellIndex: port.index, side: 0 };
            case 2:
                return { cellIndex: (rows - 1) * cols + port.index, side: 2 };
            case 3:
                return { cellIndex: port.index * cols, side: 3 };
            case 1:
                return { cellIndex: port.index * cols + (cols - 1), side: 1 };
        }
    }
    function portPos(port, offsetX, offsetY, cellSize, rows, cols) {
        const cellCenter = (i) => offsetX + i * cellSize + cellSize / 2;
        const cellCenterY = (i) => offsetY + i * cellSize + cellSize / 2;
        const offset = cellSize * PORT_OFFSET_RATIO;
        switch (port.side) {
            case 0:
                return { x: cellCenter(port.index), y: offsetY - offset };
            case 2:
                return { x: cellCenter(port.index), y: offsetY + cellSize * rows + offset };
            case 3:
                return { x: offsetX - offset, y: cellCenterY(port.index) };
            case 1:
                return { x: offsetX + cellSize * cols + offset, y: cellCenterY(port.index) };
        }
    }
    function handlePointer(e) {
        const c = canvasRef.current;
        if (!c)
            return;
        const rect = c.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { cols, rows } = board;
        const cellSize = Math.max(8, Math.min((rect.width - EDGE_PADDING * 2) / (cols + PORT_MARGIN_RATIO * 2), (rect.height - EDGE_PADDING * 2) / (rows + PORT_MARGIN_RATIO * 2)));
        const boardW = cellSize * cols;
        const boardH = cellSize * rows;
        const offsetX = (rect.width - boardW) / 2;
        const offsetY = (rect.height - boardH) / 2;
        const col = Math.floor((x - offsetX) / cellSize);
        const row = Math.floor((y - offsetY) / cellSize);
        if (col < 0 || row < 0 || col >= cols || row >= rows)
            return;
        onCellTap(row * cols + col);
    }
    return (_jsx("div", { ref: containerRef, className: "relative w-full h-full", children: _jsx("canvas", { ref: canvasRef, onPointerDown: handlePointer, className: "absolute inset-0 touch-none" }) }));
}
