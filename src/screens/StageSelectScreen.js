import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { STAGES } from '../data/stages';
import { useGameStore } from '../store/gameStore';
import { CtaButton } from '../components/CtaButton';
const SVG_W = 400;
const SVG_H = 520;
const MIN_ZOOM = 0.7;
const MAX_ZOOM = 4;
const PANEL_RATIO = 0.56; // パネルが占める高さの割合
const SELECTED_NODE_FOCUS_Y = 0.28;
const CITY_HALF_X = 820;
const CITY_HALF_Z = 1040;
const INITIAL_FOCUS_MARGIN_X = 24;
const INITIAL_FOCUS_MARGIN_Y = 48;
const SELECTED_CAMERA_OFFSET_X = -96;
const SELECTED_CAMERA_OFFSET_Z = 286;
const SELECTED_CAMERA_HEIGHT = 210;
const SELECTED_CAMERA_RADIUS = Math.hypot(SELECTED_CAMERA_OFFSET_X, SELECTED_CAMERA_OFFSET_Z);
const SELECTED_CAMERA_BASE_ANGLE = Math.atan2(SELECTED_CAMERA_OFFSET_Z, SELECTED_CAMERA_OFFSET_X);
const SELECTED_CAMERA_ORBIT_SPEED = 0.00013;
const NODES = [
    { id: 1, x: 142, y: 214, code: 'KSM-03', coord: 'N35°41 E139°41' },
    { id: 2, x: 322, y: 106, code: 'NTL-CC', coord: 'N35°42 E139°47' },
    { id: 3, x: 196, y: 258, code: 'CML-GV', coord: 'N35°39 E139°44' },
    { id: 4, x: 70, y: 415, code: 'ACH-DM', coord: 'N35°37 E139°40' },
    { id: 5, x: 328, y: 398, code: 'OGA-ZF', coord: 'N35°38 E139°48' },
];
const BOARD_RISK_COLOR = {
    LOW: '#4da3ff',
    MED: '#ffb454',
    HIGH: '#ff4d6d',
};
const CITY_WORLD_SCALE = 2.35;
const DRAG_SENSITIVITY = 0.38;
const TOWER_PICK_PAD_PX = 8;
const PAN_PAD = 165; // ソフト上限 (SVG units)
const RUBBER_K = 0.28; // ラバーバンド抵抗係数 (0=動かない, 1=通常)
function makeSeededRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}
function svgToCityWorld(x, y) {
    return {
        x: (x - SVG_W / 2) * CITY_WORLD_SCALE,
        z: (y - SVG_H / 2) * CITY_WORLD_SCALE,
    };
}
function getLocationTowerMetrics(stage) {
    return {
        height: 92 + stage.riskLevel * 18,
        width: 26 + stage.riskLevel * 2.5,
        depth: 26 + stage.riskLevel * 2.1,
    };
}
function getLatestUnlockedNode(completedCount) {
    const latestStage = STAGES.reduce((latest, stage) => {
        if (completedCount < stage.requiredCompleted)
            return latest;
        if (!latest)
            return stage;
        if (stage.requiredCompleted > latest.requiredCompleted)
            return stage;
        if (stage.requiredCompleted === latest.requiredCompleted && stage.id > latest.id)
            return stage;
        return latest;
    }, null);
    return NODES.find(node => node.id === latestStage?.id) ?? NODES[0];
}
function BoardGlassPanel({ x, y, w, h, rotate, opacity, color = '#4da3ff' }) {
    return (_jsx("div", { "aria-hidden": true, style: {
            position: 'absolute',
            left: x,
            top: y,
            width: w,
            height: h,
            transform: `translate(-50%, -50%) rotate(${rotate}deg) skewY(-5deg)`,
            opacity,
            border: `1px solid ${color}44`,
            background: `linear-gradient(145deg, ${color}18, rgba(2,10,24,0.12) 44%, rgba(255,255,255,0.035))`,
            boxShadow: `0 0 34px ${color}16, inset 0 0 30px ${color}0d`,
            backdropFilter: 'blur(8px) saturate(1.2)',
        } }));
}
function BoardBackdrop() {
    return (_jsxs("div", { className: "absolute inset-0 pointer-events-none overflow-hidden", "aria-hidden": true, children: [_jsx("div", { className: "absolute inset-0", style: {
                    background: 'radial-gradient(ellipse 90% 70% at 44% 14%, rgba(36,103,172,0.2), transparent 64%), radial-gradient(ellipse 78% 62% at 78% 76%, rgba(85,230,255,0.07), transparent 70%), linear-gradient(180deg, #01040a 0%, #020b17 48%, #01040b 100%)',
                } }), _jsx("div", { className: "absolute inset-0", style: {
                    background: 'linear-gradient(90deg, rgba(77,163,255,0.08), transparent 30%, rgba(85,230,255,0.04) 72%, transparent), linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.5))',
                } }), _jsxs("div", { className: "absolute inset-0", style: {
                    perspective: 760,
                    transformStyle: 'preserve-3d',
                    filter: 'blur(1.4px)',
                }, children: [_jsx(BoardGlassPanel, { x: "18%", y: "30%", w: 230, h: 360, rotate: 8, opacity: 0.26 }), _jsx(BoardGlassPanel, { x: "82%", y: "36%", w: 210, h: 330, rotate: -11, opacity: 0.18, color: "#55e6ff" }), _jsx(BoardGlassPanel, { x: "48%", y: "13%", w: 320, h: 145, rotate: -3, opacity: 0.14 }), _jsx(BoardGlassPanel, { x: "72%", y: "78%", w: 250, h: 170, rotate: 6, opacity: 0.12, color: "#7bbdff" })] }), _jsx("div", { className: "absolute inset-0", style: {
                    background: 'linear-gradient(to right, rgba(77,163,255,0.055), transparent 36%, transparent 68%, rgba(85,230,255,0.032)), linear-gradient(to bottom, rgba(0,0,0,0.26), rgba(0,0,0,0.1) 34%, rgba(0,0,0,0.66))',
                } })] }));
}
// ソフト上限を center 空間で返す
function getClampRange(zoom, cW, cH) {
    const vbW = SVG_W / zoom;
    const vbH = vbW * cH / cW;
    const minPadY = Math.max(0, (vbH - SVG_H) / 2 + 36);
    const padY = Math.max(PAN_PAD, minPadY);
    return {
        cxMin: vbW / 2 - PAN_PAD,
        cxMax: SVG_W - vbW / 2 + PAN_PAD,
        cyMin: vbH / 2 - padY,
        cyMax: SVG_H - vbH / 2 + padY,
    };
}
function clampValue(v, min, max) {
    if (min > max)
        return (min + max) / 2;
    return Math.max(min, Math.min(max, v));
}
function clampWithInnerMargin(v, min, max, margin) {
    if (min > max)
        return (min + max) / 2;
    const safeMargin = Math.min(margin, Math.max(0, (max - min) / 2));
    return clampValue(v, min + safeMargin, max - safeMargin);
}
function getInitialOverviewCenter(focus, zoom, cW, cH) {
    const { cxMin, cxMax, cyMin, cyMax } = getClampRange(zoom, cW, cH);
    return {
        x: clampWithInnerMargin(focus.x, cxMin, cxMax, INITIAL_FOCUS_MARGIN_X),
        y: clampWithInnerMargin(focus.y, cyMin, cyMax, INITIAL_FOCUS_MARGIN_Y),
    };
}
function getOverviewCamera(center, zoom, width, height) {
    const camera = new THREE.PerspectiveCamera(43, width / height, 1, 2600);
    const focus = svgToCityWorld(center.x, center.y);
    const zoomT = THREE.MathUtils.clamp((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM), 0, 1);
    const cameraHeight = THREE.MathUtils.lerp(940, 390, Math.min(1, zoomT * 1.15));
    const back = THREE.MathUtils.lerp(130, 255, Math.min(1, zoomT * 1.1));
    camera.position.set(focus.x - 35, cameraHeight, focus.z + back);
    camera.lookAt(new THREE.Vector3(focus.x, 0, focus.z));
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    return camera;
}
function getOffscreenTargetIndicators({ center, zoom, containerSize, completedCount, }) {
    const { w, h } = containerSize;
    if (w <= 1 || h <= 1)
        return [];
    const edgeX = Math.min(78, Math.max(48, w * 0.18));
    const topEdge = 88;
    const bottomEdge = Math.max(topEdge + 32, h - 66);
    const leftEdge = edgeX;
    const rightEdge = Math.max(leftEdge + 32, w - edgeX);
    const safeLeft = 18;
    const safeTop = 80;
    const safeRight = w - 18;
    const safeBottom = h - 48;
    const camera = getOverviewCamera(center, zoom, w, h);
    const indicators = [];
    NODES.forEach(node => {
        const stage = STAGES.find(s => s.id === node.id);
        if (!stage || completedCount < stage.requiredCompleted)
            return;
        const p = svgToCityWorld(node.x, node.y);
        const { height, width, depth } = getLocationTowerMetrics(stage);
        const halfW = (width * 1.1) / 2;
        const halfD = (depth * 1.1) / 2;
        const topY = height * 1.02;
        const corners = [
            new THREE.Vector3(p.x - halfW, 0, p.z - halfD),
            new THREE.Vector3(p.x + halfW, 0, p.z - halfD),
            new THREE.Vector3(p.x - halfW, 0, p.z + halfD),
            new THREE.Vector3(p.x + halfW, 0, p.z + halfD),
            new THREE.Vector3(p.x - halfW, topY, p.z - halfD),
            new THREE.Vector3(p.x + halfW, topY, p.z - halfD),
            new THREE.Vector3(p.x - halfW, topY, p.z + halfD),
            new THREE.Vector3(p.x + halfW, topY, p.z + halfD),
        ];
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let hasVisibleCorner = false;
        corners.forEach(corner => {
            const projected = corner.project(camera);
            if (projected.z < -1 || projected.z > 1)
                return;
            hasVisibleCorner = true;
            const x = (projected.x + 1) * 0.5 * w;
            const y = (1 - projected.y) * 0.5 * h;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
        const intersectsViewport = hasVisibleCorner &&
            maxX >= safeLeft &&
            minX <= safeRight &&
            maxY >= safeTop &&
            minY <= safeBottom;
        if (intersectsViewport)
            return;
        const projectedCenter = new THREE.Vector3(p.x, height * 0.58, p.z).project(camera);
        if (!Number.isFinite(projectedCenter.x) || !Number.isFinite(projectedCenter.y))
            return;
        const screenX = (projectedCenter.x + 1) * 0.5 * w;
        const screenY = (1 - projectedCenter.y) * 0.5 * h;
        const dx = screenX - w / 2;
        const dy = screenY - h / 2;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        indicators.push({
            id: node.id,
            code: node.code,
            x: clampValue(screenX, leftEdge, rightEdge),
            y: clampValue(screenY, topEdge, bottomEdge),
            angle,
            color: BOARD_RISK_COLOR[stage.risk],
        });
    });
    return indicators;
}
// ソフト上限を超えた分だけ抵抗をかける
function rubberBand(v, min, max) {
    if (v < min)
        return min - (min - v) * RUBBER_K;
    if (v > max)
        return max + (v - max) * RUBBER_K;
    return v;
}
// ── グリッドグリッチフレーム ──────────────────────────────────
// 8px グリッドで水平スライスを独立シフトするイン/アウト演出
const G_SLICES = 8;
const G_GRID = 8; // px
function GlitchFrame({ w, h, isExiting, children }) {
    const containerRef = useRef(null);
    const sliceRefs = useRef([]);
    const exitingRef = useRef(false);
    // ── イン ────────────────────────────────────────────────────
    useEffect(() => {
        const ENTER_MS = 100;
        const MAX_G = 7;
        const SCALE_FROM = 0.25;
        const initOff = Array.from({ length: G_SLICES }, () => (Math.floor(Math.random() * (MAX_G * 2 + 1)) - MAX_G) * G_GRID);
        const burstUntil = new Array(G_SLICES).fill(0);
        const burstOff = new Array(G_SLICES).fill(0);
        const alphaUntil = new Array(G_SLICES).fill(0);
        const alphaVal = new Array(G_SLICES).fill(1);
        let rafId = 0;
        const t0 = performance.now();
        const snap = (v) => Math.round(v / G_GRID) * G_GRID;
        const tick = (now) => {
            // アウトが開始したらイン側ループを停止
            if (exitingRef.current)
                return;
            const els = sliceRefs.current;
            const container = containerRef.current;
            const elapsed = now - t0;
            const t = Math.min(1, elapsed / ENTER_MS);
            const ease = 1 - Math.pow(1 - t, 3);
            const scale = SCALE_FROM + (1 - SCALE_FROM) * ease;
            if (container)
                container.style.transform = `scale(${scale.toFixed(4)})`;
            els.forEach((el, i) => {
                if (!el)
                    return;
                let off = snap(initOff[i] * (1 - ease));
                const burstProb = 0.38 * (1 - t);
                if (t < 0.8 && now > burstUntil[i] && Math.random() < burstProb) {
                    burstOff[i] = (Math.floor(Math.random() * 9) - 4) * G_GRID;
                    burstUntil[i] = now + 8 + Math.random() * 24;
                }
                if (now < burstUntil[i])
                    off += burstOff[i];
                const alphaProb = 0.40 * (1 - t);
                if (t < 0.75 && now > alphaUntil[i] && Math.random() < alphaProb) {
                    alphaVal[i] = Math.random() < 0.45 ? 0 : 0.2 + Math.random() * 0.8;
                    alphaUntil[i] = now + 10 + Math.random() * 28;
                }
                const baseAlpha = elapsed > 16 ? 1 : 0;
                const alpha = now < alphaUntil[i] ? alphaVal[i] : baseAlpha;
                el.style.transform = `translateX(${off}px)`;
                el.style.opacity = String(alpha);
            });
            if (t < 1) {
                rafId = requestAnimationFrame(tick);
            }
            else {
                if (container)
                    container.style.transform = 'scale(1)';
                els.forEach(el => { if (el) {
                    el.style.transform = 'translateX(0)';
                    el.style.opacity = '1';
                } });
            }
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, []);
    // ── アウト (独立ループ) ───────────────────────────────────────
    useEffect(() => {
        if (!isExiting)
            return;
        exitingRef.current = true;
        const NOISE_MS = 100; // フェーズ1: スケール固定でノイズのみ
        const SCALE_MS = 80; // フェーズ2: 縮小 + フェード
        const MAX_G = 7;
        const SCALE_FROM = 0.25;
        const snap = (v) => Math.round(v / G_GRID) * G_GRID;
        const burstOff = Array.from({ length: G_SLICES }, () => (Math.floor(Math.random() * (MAX_G * 2 + 1)) - MAX_G) * G_GRID);
        const alphaVal = Array.from({ length: G_SLICES }, () => Math.random() < 0.5 ? 0 : 0.15 + Math.random() * 0.85);
        let rafId = 0;
        const t0 = performance.now();
        const tick = (now) => {
            const els = sliceRefs.current;
            const container = containerRef.current;
            const elapsed = now - t0;
            // 毎フレーム高確率でオフセット・アルファを更新
            els.forEach((el, i) => {
                if (!el)
                    return;
                if (Math.random() < 0.75) {
                    burstOff[i] = snap((Math.floor(Math.random() * (MAX_G * 2 + 1)) - MAX_G) * G_GRID);
                }
                if (Math.random() < 0.75) {
                    alphaVal[i] = Math.random() < 0.5 ? 0 : 0.15 + Math.random() * 0.85;
                }
            });
            if (elapsed < NOISE_MS) {
                // フェーズ1: ノイズのみ、スケール = 1
                if (container)
                    container.style.transform = 'scale(1)';
                els.forEach((el, i) => {
                    if (!el)
                        return;
                    el.style.transform = `translateX(${burstOff[i]}px)`;
                    el.style.opacity = String(alphaVal[i]);
                });
                rafId = requestAnimationFrame(tick);
            }
            else {
                // フェーズ2: 縮小 + フェード
                const t = Math.min(1, (elapsed - NOISE_MS) / SCALE_MS);
                const ease = 1 - Math.pow(1 - t, 3);
                const scale = 1 - (1 - SCALE_FROM) * ease;
                if (container)
                    container.style.transform = `scale(${scale.toFixed(4)})`;
                els.forEach((el, i) => {
                    if (!el)
                        return;
                    el.style.transform = `translateX(${burstOff[i]}px)`;
                    el.style.opacity = String(Math.max(0, alphaVal[i] * (1 - t)));
                });
                if (t < 1)
                    rafId = requestAnimationFrame(tick);
                else
                    els.forEach(el => { if (el)
                        el.style.opacity = '0'; });
            }
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [isExiting]);
    const sliceH = h / G_SLICES;
    return (_jsx("div", { ref: containerRef, style: { position: 'relative', width: w, height: h, overflow: 'hidden', transform: 'scale(0.25)' }, children: Array.from({ length: G_SLICES }, (_, i) => {
            const top = Math.round(i * sliceH);
            const bottom = Math.round(h - (i + 1) * sliceH);
            return (_jsx("div", { ref: el => { sliceRefs.current[i] = el; }, style: {
                    position: 'absolute', inset: 0,
                    clipPath: `inset(${top}px 0 ${bottom}px 0)`,
                    opacity: 0,
                }, children: _jsx("div", { style: { position: 'absolute', inset: 0 }, children: children }) }, i));
        }) }));
}
function CityScene3D({ active, selectedId, center, zoom, completedStages, overviewReturnKey }) {
    const canvasRef = useRef(null);
    const activeRef = useRef(active);
    const selectedIdRef = useRef(selectedId);
    const centerRef = useRef(center);
    const zoomRef = useRef(zoom);
    const completedStagesRef = useRef(completedStages);
    const overviewReturnKeyRef = useRef(overviewReturnKey);
    activeRef.current = active;
    selectedIdRef.current = selectedId;
    centerRef.current = center;
    zoomRef.current = zoom;
    completedStagesRef.current = completedStages;
    overviewReturnKeyRef.current = overviewReturnKey;
    useEffect(() => {
        activeRef.current = active;
        selectedIdRef.current = selectedId;
        centerRef.current = center;
        zoomRef.current = zoom;
        completedStagesRef.current = completedStages;
        overviewReturnKeyRef.current = overviewReturnKey;
    }, [active, selectedId, center, zoom, completedStages, overviewReturnKey]);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x020812, 1120, 2360);
        const camera = new THREE.PerspectiveCamera(40, 1, 1, 2600);
        const currentLook = new THREE.Vector3(0, 0, 0);
        const desiredPos = new THREE.Vector3();
        const desiredLook = new THREE.Vector3();
        const returnStartPos = new THREE.Vector3();
        const returnStartLook = new THREE.Vector3();
        let returnStartFov = 43;
        const root = new THREE.Group();
        scene.add(root);
        const ambient = new THREE.AmbientLight(0x9ecaff, 0.68);
        scene.add(ambient);
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
        keyLight.position.set(-420, 720, 360);
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0x4da3ff, 1.12);
        rimLight.position.set(480, 420, -520);
        scene.add(rimLight);
        const groundGeo = new THREE.PlaneGeometry(CITY_HALF_X * 2.55, CITY_HALF_Z * 2.45);
        const groundMat = new THREE.MeshBasicMaterial({
            color: 0x06101c,
            transparent: true,
            opacity: 0.92,
            side: THREE.DoubleSide,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        root.add(ground);
        const plateGeo = new THREE.PlaneGeometry(CITY_HALF_X * 2.12, CITY_HALF_Z * 2.04);
        const plateMat = new THREE.MeshBasicMaterial({
            color: 0x103458,
            transparent: true,
            opacity: 0.26,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.rotation.x = -Math.PI / 2;
        plate.position.y = 0.6;
        root.add(plate);
        const rng = makeSeededRandom(73021);
        const targetWorlds = NODES.map(node => svgToCityWorld(node.x, node.y));
        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const edgeGeo = new THREE.EdgesGeometry(boxGeo);
        const lowMat = new THREE.MeshStandardMaterial({
            color: 0x0b2034,
            roughness: 0.72,
            metalness: 0.24,
            transparent: true,
            opacity: 0.98,
        });
        const highMat = new THREE.MeshStandardMaterial({
            color: 0x12395a,
            roughness: 0.58,
            metalness: 0.32,
            transparent: true,
            opacity: 0.96,
        });
        const edgeMat = new THREE.LineBasicMaterial({
            color: 0x8cc4ff,
            transparent: true,
            opacity: 0.48,
            depthWrite: false,
        });
        const softEdgeMat = new THREE.LineBasicMaterial({
            color: 0x4da3ff,
            transparent: true,
            opacity: 0.24,
            depthWrite: false,
        });
        for (let x = -CITY_HALF_X; x <= CITY_HALF_X; x += 28) {
            for (let z = -CITY_HALF_Z; z <= CITY_HALF_Z; z += 28) {
                const distToCenter = Math.hypot(x * 0.82, z * 0.62);
                const nearestTarget = Math.min(...targetWorlds.map(target => Math.hypot(x - target.x, z - target.z)));
                const cluster = Math.max(0, 1 - nearestTarget / 210);
                const cityFalloff = Math.max(0.34, 1 - distToCenter / 980);
                if (nearestTarget < 34)
                    continue;
                if (rng() < 0.18 - cluster * 0.1)
                    continue;
                const width = 9 + rng() * 17 + cluster * 6;
                const depth = 9 + rng() * 18 + cluster * 5;
                const height = 8 +
                    Math.pow(rng(), 1.65) * 62 * cityFalloff +
                    cluster * (48 + rng() * 42) +
                    (rng() < 0.035 ? 52 + rng() * 78 : 0);
                const jx = (rng() - 0.5) * 8;
                const jz = (rng() - 0.5) * 8;
                const mat = height > 72 ? highMat : lowMat;
                const building = new THREE.Mesh(boxGeo, mat);
                building.position.set(x + jx, height / 2, z + jz);
                building.scale.set(width, height, depth);
                root.add(building);
                const edges = new THREE.LineSegments(edgeGeo, height > 72 ? edgeMat : softEdgeMat);
                edges.position.copy(building.position);
                edges.scale.copy(building.scale);
                root.add(edges);
            }
        }
        const locationTowers = [];
        NODES.forEach(node => {
            const stage = STAGES.find(s => s.id === node.id);
            const p = svgToCityWorld(node.x, node.y);
            const riskColor = new THREE.Color(BOARD_RISK_COLOR[stage.risk]);
            const { height: bodyHeight, width: bodyWidth, depth: bodyDepth } = getLocationTowerMetrics(stage);
            const group = new THREE.Group();
            group.position.set(p.x, 0, p.z);
            root.add(group);
            const riskWhiteMix = stage.risk === 'LOW' ? 0.24 : stage.risk === 'MED' ? 0.14 : 0.1;
            const bodyColor = riskColor.clone().lerp(new THREE.Color(0xffffff), riskWhiteMix);
            const shellColor = riskColor.clone().lerp(new THREE.Color(0xffffff), 0.08);
            const edgeColor = riskColor.clone().lerp(new THREE.Color(0xffffff), 0.24);
            const coreColor = riskColor.clone().lerp(new THREE.Color(0x06101c), 0.68);
            const coreMat = new THREE.MeshStandardMaterial({
                color: coreColor,
                emissive: riskColor.clone().multiplyScalar(0.38),
                emissiveIntensity: 0.55,
                roughness: 0.48,
                metalness: 0.34,
            });
            const core = new THREE.Mesh(boxGeo, coreMat);
            core.position.y = bodyHeight / 2;
            core.scale.set(bodyWidth * 0.84, bodyHeight * 0.985, bodyDepth * 0.84);
            core.visible = false;
            group.add(core);
            const bodyMat = new THREE.MeshBasicMaterial({
                color: bodyColor,
                transparent: true,
                opacity: 0,
                side: THREE.FrontSide,
                depthWrite: false,
            });
            const body = new THREE.Mesh(boxGeo, bodyMat);
            body.position.y = bodyHeight / 2;
            body.scale.set(bodyWidth, bodyHeight, bodyDepth);
            group.add(body);
            const bloomShell = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({
                color: shellColor,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: false,
            }));
            bloomShell.position.copy(body.position);
            bloomShell.scale.set(bodyWidth * 1.06, bodyHeight * 1.02, bodyDepth * 1.06);
            group.add(bloomShell);
            const holoShell = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({
                color: bodyColor,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
            }));
            holoShell.position.copy(body.position);
            holoShell.scale.set(bodyWidth * 1.01, bodyHeight * 1.005, bodyDepth * 1.01);
            group.add(holoShell);
            const edgeMatLocal = new THREE.LineBasicMaterial({
                color: edgeColor,
                transparent: true,
                opacity: 0.78,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const edge = new THREE.LineSegments(edgeGeo, edgeMatLocal);
            edge.position.copy(body.position);
            edge.scale.copy(body.scale);
            group.add(edge);
            const glowMatLocal = new THREE.LineBasicMaterial({
                color: riskColor,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const glow = new THREE.LineSegments(edgeGeo, glowMatLocal);
            glow.position.copy(body.position);
            glow.scale.copy(body.scale);
            group.add(glow);
            locationTowers.push({
                id: node.id,
                requiredCompleted: stage.requiredCompleted,
                group,
                core,
                body,
                bloomShell,
                holoShell,
                edge,
                glow,
            });
        });
        const targetGroup = new THREE.Group();
        targetGroup.visible = false;
        scene.add(targetGroup);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const blueRingMat = new THREE.MeshBasicMaterial({
            color: 0x4da3ff,
            transparent: true,
            opacity: 0.52,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const ringA = new THREE.Mesh(new THREE.TorusGeometry(48, 1.1, 8, 112), ringMat);
        ringA.rotation.x = Math.PI / 2;
        ringA.position.y = 3;
        targetGroup.add(ringA);
        const ringB = new THREE.Mesh(new THREE.TorusGeometry(78, 0.9, 8, 112), blueRingMat);
        ringB.rotation.x = Math.PI / 2;
        ringB.position.y = 5;
        targetGroup.add(ringB);
        const resize = () => {
            const { width, height } = canvas.getBoundingClientRect();
            const w = Math.max(1, Math.floor(width));
            const h = Math.max(1, Math.floor(height));
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();
        const overviewFocus = svgToCityWorld(centerRef.current.x, centerRef.current.y);
        camera.position.set(overviewFocus.x - 35, 900, overviewFocus.z + 130);
        currentLook.set(overviewFocus.x, 0, overviewFocus.z);
        camera.lookAt(currentLook);
        let rafId = 0;
        let handledOverviewReturnKey = overviewReturnKeyRef.current;
        let returningToOverview = false;
        let overviewReturnStartedAt = 0;
        let selectedOrbitId = null;
        let selectedOrbitStartedAt = 0;
        const overviewReturnMs = 760;
        const tick = () => {
            const now = performance.now();
            const activeNow = activeRef.current;
            const selectedNode = NODES.find(node => node.id === selectedIdRef.current) ?? null;
            const completedCount = completedStagesRef.current.length;
            if (activeNow && selectedNode) {
                if (selectedOrbitId !== selectedNode.id) {
                    selectedOrbitId = selectedNode.id;
                    selectedOrbitStartedAt = now;
                }
                returningToOverview = false;
                handledOverviewReturnKey = overviewReturnKeyRef.current;
            }
            else {
                selectedOrbitId = null;
                if (overviewReturnKeyRef.current !== handledOverviewReturnKey) {
                    returningToOverview = true;
                    handledOverviewReturnKey = overviewReturnKeyRef.current;
                    overviewReturnStartedAt = now;
                    returnStartPos.copy(camera.position);
                    returnStartLook.copy(currentLook);
                    returnStartFov = camera.fov;
                }
            }
            locationTowers.forEach(tower => {
                const unlocked = completedCount >= tower.requiredCompleted;
                const selected = activeNow && selectedNode?.id === tower.id;
                const pulse = 0.5 + Math.sin(now * 0.005 + tower.id * 1.7) * 0.5;
                tower.group.scale.setScalar(1);
                const bodyMat = tower.body.material;
                const coreMat = tower.core.material;
                const bloomShellMat = tower.bloomShell.material;
                const holoShellMat = tower.holoShell.material;
                const edgeMatLocal = tower.edge.material;
                const glowMatLocal = tower.glow.material;
                tower.core.visible = unlocked;
                coreMat.emissiveIntensity = selected ? 0.72 + pulse * 0.14 : 0.48 + pulse * 0.1;
                bodyMat.opacity = unlocked ? (selected ? 0.24 + pulse * 0.04 : 0.16 + pulse * 0.04) : 0;
                bloomShellMat.opacity = unlocked ? (selected ? 0.12 + pulse * 0.04 : 0.07 + pulse * 0.035) : 0;
                holoShellMat.opacity = unlocked ? (selected ? 0.13 + pulse * 0.04 : 0.08 + pulse * 0.035) : 0;
                edgeMatLocal.opacity = unlocked ? (selected ? 0.74 : 0.62 + pulse * 0.05) : 0.05;
                glowMatLocal.opacity = unlocked ? (selected ? 0.46 : 0.34 + pulse * 0.1) : 0.02;
                tower.bloomShell.visible = unlocked;
                tower.holoShell.visible = unlocked;
            });
            if (activeNow && selectedNode) {
                const selectedStage = STAGES.find(stage => stage.id === selectedNode.id);
                const selectedRiskColor = new THREE.Color(selectedStage ? BOARD_RISK_COLOR[selectedStage.risk] : '#4da3ff');
                ringMat.color.copy(selectedRiskColor.clone().lerp(new THREE.Color(0xffffff), 0.38));
                blueRingMat.color.copy(selectedRiskColor);
                const p = svgToCityWorld(selectedNode.x, selectedNode.y);
                const orbitAngle = SELECTED_CAMERA_BASE_ANGLE + Math.max(0, now - selectedOrbitStartedAt) * SELECTED_CAMERA_ORBIT_SPEED;
                targetGroup.visible = true;
                targetGroup.position.set(p.x, 0, p.z);
                desiredPos.set(p.x + Math.cos(orbitAngle) * SELECTED_CAMERA_RADIUS, SELECTED_CAMERA_HEIGHT, p.z + Math.sin(orbitAngle) * SELECTED_CAMERA_RADIUS);
                desiredLook.set(p.x, 18, p.z);
                camera.position.lerp(desiredPos, 0.065);
                currentLook.lerp(desiredLook, 0.075);
                camera.fov = THREE.MathUtils.lerp(camera.fov, 46, 0.045);
            }
            else {
                targetGroup.visible = false;
                const focus = svgToCityWorld(centerRef.current.x, centerRef.current.y);
                const zoomT = THREE.MathUtils.clamp((zoomRef.current - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM), 0, 1);
                const height = THREE.MathUtils.lerp(940, 390, Math.min(1, zoomT * 1.15));
                const back = THREE.MathUtils.lerp(130, 255, Math.min(1, zoomT * 1.1));
                desiredPos.set(focus.x - 35, height, focus.z + back);
                desiredLook.set(focus.x, 0, focus.z);
                if (returningToOverview) {
                    const t = THREE.MathUtils.clamp((now - overviewReturnStartedAt) / overviewReturnMs, 0, 1);
                    const ease = t < 0.5
                        ? 4 * t * t * t
                        : 1 - Math.pow(-2 * t + 2, 3) / 2;
                    camera.position.copy(returnStartPos).lerp(desiredPos, ease);
                    currentLook.copy(returnStartLook).lerp(desiredLook, ease);
                    camera.fov = THREE.MathUtils.lerp(returnStartFov, 43, ease);
                    if (t >= 1) {
                        returningToOverview = false;
                        camera.position.copy(desiredPos);
                        currentLook.copy(desiredLook);
                        camera.fov = 43;
                    }
                }
                else {
                    camera.position.copy(desiredPos);
                    currentLook.copy(desiredLook);
                    camera.fov = 43;
                }
            }
            camera.lookAt(currentLook);
            camera.updateProjectionMatrix();
            ringA.rotation.z += 0.012;
            ringB.rotation.z -= 0.009;
            renderer.render(scene, camera);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            scene.traverse((obj) => {
                const disposable = obj;
                disposable.geometry?.dispose();
                const material = disposable.material;
                if (Array.isArray(material))
                    material.forEach(m => m.dispose());
                else
                    material?.dispose();
            });
            renderer.dispose();
        };
    }, []);
    return (_jsx("canvas", { ref: canvasRef, "data-testid": "darknet-city-3d-canvas", className: "absolute inset-0 h-full w-full pointer-events-none", style: {
            zIndex: 2,
            opacity: active ? 1 : 0.98,
            transition: 'opacity 420ms cubic-bezier(0.22, 1, 0.36, 1)',
        } }));
}
// ── 詳細パネル ─────────────────────────────────────────────────
function DetailPanel({ stage, isLocked, completedCount, accepting, onAccept, onClose }) {
    const riskColor = BOARD_RISK_COLOR[stage.risk];
    const shortfall = stage.requiredCompleted - completedCount;
    return (_jsxs("div", { className: "flex flex-col h-full font-mono text-white", style: {
            background: 'linear-gradient(160deg, rgba(5,15,31,0.82) 0%, rgba(2,8,18,0.94) 56%, rgba(1,4,10,0.98) 100%)',
            backdropFilter: 'blur(18px) saturate(1.24)',
            borderTop: `1px solid ${isLocked ? 'rgba(255,77,109,0.3)' : riskColor + '40'}`,
            boxShadow: `0 -20px 46px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 34px ${riskColor}18`,
        }, children: [_jsxs("div", { className: "relative h-8 shrink-0", children: [_jsx("div", { className: "absolute left-1/2 top-2.5 w-8 h-[3px] -translate-x-1/2 rounded-full bg-white/15" }), _jsx("button", { type: "button", "aria-label": "Close target detail", onClick: onClose, className: "absolute right-3 top-1.5 flex h-6 w-6 items-center justify-center font-mono text-[11px] tracking-normal text-white/80 transition hover:text-white", style: {
                            background: 'rgba(255,255,255,0.035)',
                            border: '1px solid rgba(255,255,255,0.16)',
                            boxShadow: '0 0 12px rgba(77,163,255,0.08), inset 0 0 12px rgba(255,255,255,0.025)',
                        }, children: "X" })] }), _jsxs("div", { className: "flex-1 overflow-hidden px-4 pb-2", children: [_jsxs("div", { className: "pt-1 pb-2 border-b border-white/[0.06]", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full shrink-0", style: { backgroundColor: isLocked ? '#ff4d6d' : riskColor,
                                            boxShadow: `0 0 5px ${isLocked ? '#ff4d6d' : riskColor}` } }), _jsx("span", { className: "text-[8px] tracking-[0.28em]", style: { color: isLocked ? 'rgba(255,77,109,0.55)' : riskColor + '88' }, children: isLocked ? 'ACCESS DENIED' : '// TARGET_LOCKED' })] }), _jsx("div", { className: "text-[18px] font-normal tracking-[0.04em] leading-tight text-white/90 truncate", children: stage.name }), _jsx("div", { className: "text-[9px] text-white/25 mt-0.5 tracking-[0.08em]", children: NODES.find(n => n.id === stage.id)?.coord ?? '' })] }), isLocked ? (_jsxs("div", { className: "py-3", children: [_jsx("div", { className: "text-[11px] text-white/45 leading-snug mb-1.5", children: "\u3053\u306E\u30BF\u30FC\u30B2\u30C3\u30C8\u3078\u306E\u30A2\u30AF\u30BB\u30B9\u306B\u306F" }), _jsxs("div", { className: "text-[18px]", style: { color: '#4da3ff' }, children: ["\u5B9F\u7E3E \u3042\u3068 ", shortfall, " \u4EF6"] }), _jsxs("div", { className: "text-[10px] text-white/28 mt-1", children: ["\u73FE\u5728: ", completedCount, " / ", stage.requiredCompleted] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "py-2 flex items-center justify-between border-b border-white/[0.06]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[7px] text-white/28 tracking-[0.22em] mb-1.5", children: "THREAT" }), _jsxs("div", { className: "flex items-center gap-1", children: [Array.from({ length: 5 }, (_, i) => (_jsx("div", { className: "w-2 h-3.5", style: {
                                                            backgroundColor: i < stage.riskLevel ? riskColor : 'rgba(255,255,255,0.07)',
                                                            boxShadow: i < stage.riskLevel ? `0 0 4px ${riskColor}` : 'none',
                                                        } }, i))), _jsx("span", { className: "ml-1.5 text-[10px] tracking-[0.12em]", style: { color: riskColor }, children: stage.risk })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-[7px] text-white/28 tracking-[0.22em] mb-1", children: "REWARD" }), _jsx("div", { className: "text-[20px] font-normal leading-none", style: { color: riskColor, textShadow: `0 0 12px ${riskColor}60` }, children: stage.reward })] })] }), _jsxs("div", { className: "py-2 border-b border-white/[0.06]", children: [_jsx("div", { className: "text-[7px] text-[#4da3ff]/40 tracking-[0.18em] mb-1", children: "// CLIENT_MSG.enc" }), _jsxs("p", { className: "text-[10px] text-white/45 leading-snug line-clamp-2", children: ["\"", stage.teaser, "\""] })] }), _jsx("div", { className: "py-2 border-b border-white/[0.06] flex gap-5", children: [
                                    { label: 'WAVES', val: '10' },
                                    { label: 'SIGNALS', val: `${stage.colorCount}` },
                                    { label: 'GRID', val: '6×9' },
                                ].map(s => (_jsxs("div", { children: [_jsx("div", { className: "text-[7px] text-white/22 tracking-[0.22em] mb-0.5", children: s.label }), _jsx("div", { className: "text-[15px] font-normal text-white/75", children: s.val })] }, s.label))) })] })), !isLocked && (_jsx("div", { className: "pt-2", children: _jsx(CtaButton, { onClick: onAccept, disabled: accepting, variant: "custom", marker: true, style: {
                                backgroundColor: riskColor === '#ff4d6d' ? 'rgba(255,77,109,0.2)' : '#4da3ff',
                                border: riskColor === '#ff4d6d' ? `1px solid ${riskColor}60` : 'none',
                                color: riskColor === '#ff4d6d' ? riskColor : '#000',
                                boxShadow: riskColor === '#ff4d6d' ? `0 0 20px ${riskColor}22` : '0 0 24px rgba(77,163,255,0.35)',
                            }, children: accepting ? 'CONNECTING' : '> ACCEPT MISSION' }) }))] })] }));
}
function TargetDirectionHUD({ indicator, onActivate, }) {
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        const rafId = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(rafId);
    }, []);
    const shown = indicator.visible && entered;
    return (_jsx("button", { type: "button", "data-testid": "offscreen-target-indicator", "aria-label": `Move to ${indicator.code}`, className: "absolute font-mono", onPointerDown: event => event.stopPropagation(), onPointerUp: event => event.stopPropagation(), onClick: event => {
            event.stopPropagation();
            onActivate(indicator.id);
        }, style: {
            left: indicator.x,
            top: indicator.y,
            zIndex: 18,
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: indicator.visible ? 'pointer' : 'default',
            pointerEvents: indicator.visible ? 'auto' : 'none',
            opacity: shown ? 1 : 0,
            transform: `translate(-50%, -50%) scale(${shown ? 1 : 0.92})`,
            transition: 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 180ms ease',
            filter: `drop-shadow(0 0 10px ${indicator.color}88)`,
            willChange: 'opacity, transform',
        }, children: _jsxs("div", { className: "relative flex items-center gap-2", style: {
                minWidth: 92,
                height: 34,
                padding: '5px 9px 5px 7px',
                color: indicator.color,
                background: 'linear-gradient(90deg, rgba(2,8,18,0.84), rgba(4,18,36,0.44) 72%, rgba(2,8,18,0.12))',
                border: `1px solid ${indicator.color}66`,
                boxShadow: `0 0 18px ${indicator.color}22, inset 0 0 18px ${indicator.color}14`,
                clipPath: 'polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% 100%, 9px 100%, 0 calc(100% - 9px))',
            }, children: [_jsx("span", { className: "block shrink-0", style: {
                        width: 15,
                        height: 15,
                        transform: `rotate(${indicator.angle}deg)`,
                        clipPath: 'polygon(0 23%, 100% 50%, 0 77%, 24% 50%)',
                        background: indicator.color,
                        boxShadow: `0 0 12px ${indicator.color}`,
                    } }), _jsxs("span", { className: "leading-none", children: [_jsx("span", { className: "block text-[6px] leading-none", style: { color: 'rgba(255,255,255,0.42)', letterSpacing: '0.24em' }, children: "TARGET" }), _jsx("span", { className: "block mt-1 text-[10px] leading-none", style: { color: '#e8f7ff', letterSpacing: '0.14em', textShadow: `0 0 8px ${indicator.color}` }, children: indicator.code })] }), _jsx("span", { className: "absolute left-1.5 right-1.5 bottom-1", style: {
                        height: 1,
                        background: `linear-gradient(90deg, transparent, ${indicator.color}99, transparent)`,
                    } })] }) }));
}
function MapActionHint({ visible }) {
    return (_jsx("div", { "data-testid": "stage-select-action-hint", className: "absolute left-1/2 font-mono pointer-events-none text-[18px] leading-none text-white", style: {
            top: '66%',
            zIndex: 16,
            opacity: visible ? 1 : 0,
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 640ms ease-in-out',
            letterSpacing: '0.24em',
            whiteSpace: 'nowrap',
            textShadow: '0 0 16px rgba(255,255,255,0.38), 0 0 28px rgba(77,163,255,0.26)',
        }, children: _jsx("span", { className: "stage-select-hint-fade", children: "SELECT AREA" }) }));
}
// ── メイン画面 ──────────────────────────────────────────────────
export function StageSelectScreen() {
    const completedStages = useGameStore(s => s.completedStages);
    const selectStage = useGameStore(s => s.selectStage);
    const goHome = useGameStore(s => s.goHome);
    const initialMapFocus = getLatestUnlockedNode(completedStages.length);
    const [selectedId, setSelectedId] = useState(null);
    // panelVisible はドラッグで消えたあと戻らない (selectedId とは独立)
    const [panelVisible, setPanelVisible] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredId, setHoveredId] = useState(null);
    const [overviewReturnKey, setOverviewReturnKey] = useState(0);
    const [renderedOffscreenIndicators, setRenderedOffscreenIndicators] = useState([]);
    // ロックエリアタップ時の警告ポップアップ
    const [lockPopupId, setLockPopupId] = useState(null);
    const [lockPopupExiting, setLockPopupExiting] = useState(false);
    const lockTimerRef = useRef(0);
    function handleLockedTap(nodeId) {
        clearTimeout(lockTimerRef.current);
        setLockPopupId(nodeId);
        setLockPopupExiting(false);
        lockTimerRef.current = window.setTimeout(() => {
            setLockPopupExiting(true);
            lockTimerRef.current = window.setTimeout(() => {
                setLockPopupId(null);
                setLockPopupExiting(false);
            }, 200);
        }, 2400);
    }
    const initialMapFocusRef = useRef(initialMapFocus);
    const [center, setCenter] = useState(() => ({
        x: initialMapFocusRef.current.x,
        y: initialMapFocusRef.current.y,
    }));
    const [zoom, setZoom] = useState(1);
    // sync refs for event handlers (stale closure 回避)
    const stateRef = useRef({
        center: { x: initialMapFocusRef.current.x, y: initialMapFocusRef.current.y },
        zoom: 1,
    });
    const isDraggingRef = useRef(false);
    const panelVisibleRef = useRef(false);
    const [containerSize, setContainerSize] = useState({ w: 430, h: 800 });
    const containerSizeRef = useRef({ w: 430, h: 800 });
    containerSizeRef.current = containerSize;
    const mapRef = useRef(null);
    const animRef = useRef(0);
    // コンテナサイズ計測 (マップは常に 100%、サイズ変化なし)
    useEffect(() => {
        const el = mapRef.current;
        if (!el)
            return;
        const measure = () => {
            const { width: w, height: h } = el.getBoundingClientRect();
            containerSizeRef.current = { w, h };
            setContainerSize({ w, h });
        };
        measure();
        // 初期ズーム: 解放済みの最新エリアを中心に、画面比率に合わせて調整
        const { width: w, height: h } = el.getBoundingClientRect();
        const fitZoom = Math.max(MIN_ZOOM, Math.min(1, SVG_W * h / (SVG_H * w)));
        const focus = initialMapFocusRef.current;
        const nextCenter = getInitialOverviewCenter(focus, fitZoom, w, h);
        stateRef.current = { center: nextCenter, zoom: fitZoom };
        setCenter(nextCenter);
        setZoom(fitZoom);
    }, []);
    // ポインタ追跡
    const pointersRef = useRef(new Map());
    const dragRef = useRef(null);
    const pinchRef = useRef(null);
    // 1ジェスチャー内で移動やピンチが発生したか。タップ誤爆防止用
    const hasMovedRef = useRef(false);
    // ── 座標変換 ──────────────────────────────────────────────────
    function screenToSvg(clientX, clientY) {
        const el = mapRef.current;
        if (!el)
            return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const { w, h } = containerSizeRef.current;
        const { center: c, zoom: z } = stateRef.current;
        const vbW = SVG_W / z;
        const vbH = vbW * h / w;
        return { x: (c.x - vbW / 2) + px / w * vbW, y: (c.y - vbH / 2) + py / h * vbH };
    }
    function getNodeAt(clientX, clientY) {
        const el = mapRef.current;
        if (!el)
            return null;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0)
            return null;
        const camera = new THREE.PerspectiveCamera(43, rect.width / rect.height, 1, 2600);
        const look = new THREE.Vector3();
        const activeStage = selectedId ? STAGES.find(s => s.id === selectedId) : null;
        const useSelectedCamera = panelVisibleRef.current &&
            selectedId !== null &&
            activeStage != null &&
            completedStages.length >= activeStage.requiredCompleted;
        if (useSelectedCamera) {
            const selectedNode = NODES.find(node => node.id === selectedId);
            if (selectedNode) {
                const p = svgToCityWorld(selectedNode.x, selectedNode.y);
                camera.position.set(p.x - 96, 210, p.z + 286);
                look.set(p.x, 18, p.z);
                camera.fov = 46;
            }
        }
        else {
            const { center: c, zoom: z } = stateRef.current;
            const focus = svgToCityWorld(c.x, c.y);
            const zoomT = THREE.MathUtils.clamp((z - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM), 0, 1);
            const height = THREE.MathUtils.lerp(940, 390, Math.min(1, zoomT * 1.15));
            const back = THREE.MathUtils.lerp(130, 255, Math.min(1, zoomT * 1.1));
            camera.position.set(focus.x - 35, height, focus.z + back);
            look.set(focus.x, 0, focus.z);
            camera.fov = 43;
        }
        camera.lookAt(look);
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
        let best = null;
        for (const node of NODES) {
            const stage = STAGES.find(s => s.id === node.id);
            const { height, width, depth } = getLocationTowerMetrics(stage);
            const p = svgToCityWorld(node.x, node.y);
            const halfW = (width * 1.22) / 2;
            const halfD = (depth * 1.22) / 2;
            const topY = height * 1.04 + 5;
            const corners = [
                new THREE.Vector3(p.x - halfW, 0, p.z - halfD),
                new THREE.Vector3(p.x + halfW, 0, p.z - halfD),
                new THREE.Vector3(p.x - halfW, 0, p.z + halfD),
                new THREE.Vector3(p.x + halfW, 0, p.z + halfD),
                new THREE.Vector3(p.x - halfW, topY, p.z - halfD),
                new THREE.Vector3(p.x + halfW, topY, p.z - halfD),
                new THREE.Vector3(p.x - halfW, topY, p.z + halfD),
                new THREE.Vector3(p.x + halfW, topY, p.z + halfD),
            ];
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            let visible = false;
            for (const corner of corners) {
                const projected = corner.project(camera);
                if (projected.z < -1 || projected.z > 1)
                    continue;
                visible = true;
                const x = rect.left + (projected.x + 1) * 0.5 * rect.width;
                const y = rect.top + (1 - projected.y) * 0.5 * rect.height;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
            if (!visible)
                continue;
            minX -= TOWER_PICK_PAD_PX;
            minY -= TOWER_PICK_PAD_PX;
            maxX += TOWER_PICK_PAD_PX;
            maxY += TOWER_PICK_PAD_PX;
            if (clientX >= minX && clientX <= maxX && clientY >= minY && clientY <= maxY) {
                const cx = (minX + maxX) / 2;
                const cy = (minY + maxY) / 2;
                const distance = Math.hypot(clientX - cx, clientY - cy);
                if (!best || distance < best.distance)
                    best = { node, distance };
            }
        }
        return best?.node ?? null;
    }
    function applyState(cx, cy, z) {
        stateRef.current = { center: { x: cx, y: cy }, zoom: z };
        setCenter({ x: cx, y: cy });
        setZoom(z);
    }
    function animateTo(targetCx, targetCy, targetZ, ms = 340) {
        cancelAnimationFrame(animRef.current);
        const { center: sc, zoom: sz } = stateRef.current;
        const t0 = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - t0) / ms);
            const ease = 1 - Math.pow(1 - t, 3);
            applyState(sc.x + (targetCx - sc.x) * ease, sc.y + (targetCy - sc.y) * ease, sz + (targetZ - sz) * ease);
            if (t < 1)
                animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
    }
    // ── ポインタイベント ──────────────────────────────────────────
    function onPointerDown(e) {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointersRef.current.size === 1) {
            hasMovedRef.current = false; // 新しいジェスチャー開始 → リセット
            dragRef.current = {
                px: e.clientX, py: e.clientY,
                startCx: stateRef.current.center.x,
                startCy: stateRef.current.center.y,
                moved: false,
            };
            pinchRef.current = null;
        }
        else if (pointersRef.current.size === 2) {
            hasMovedRef.current = true; // 2本指 = ピンチ確定、タップではない
            const pts = [...pointersRef.current.values()];
            const d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            const mx = (pts[0].x + pts[1].x) / 2;
            const my = (pts[0].y + pts[1].y) / 2;
            const anc = screenToSvg(mx, my);
            pinchRef.current = { d, z: stateRef.current.zoom, anchorX: anc.x, anchorY: anc.y };
            dragRef.current = null;
            isDraggingRef.current = false;
            setIsDragging(false);
            cancelAnimationFrame(animRef.current);
        }
    }
    function onPointerMove(e) {
        if (!pointersRef.current.has(e.pointerId))
            return;
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const { w, h } = containerSizeRef.current;
        // ── ピンチズーム ──
        if (pointersRef.current.size >= 2 && pinchRef.current) {
            const pts = [...pointersRef.current.values()];
            const newD = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            const newMx = (pts[0].x + pts[1].x) / 2;
            const newMy = (pts[0].y + pts[1].y) / 2;
            const el = mapRef.current;
            const rect = el.getBoundingClientRect();
            const relMx = newMx - rect.left;
            const relMy = newMy - rect.top;
            const newZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.z * newD / pinchRef.current.d));
            const vbW = SVG_W / newZ;
            const vbH = vbW * h / w;
            applyState(pinchRef.current.anchorX + vbW * (0.5 - relMx / w), pinchRef.current.anchorY + vbH * (0.5 - relMy / h), newZ);
            return;
        }
        // ── ドラッグパン ──
        if (dragRef.current) {
            const dx = e.clientX - dragRef.current.px;
            const dy = e.clientY - dragRef.current.py;
            if (!dragRef.current.moved && Math.hypot(dx, dy) > 5) {
                dragRef.current.moved = true;
                hasMovedRef.current = true; // ドラッグ確定
                isDraggingRef.current = true;
                setIsDragging(true);
                // ドラッグ開始でパネル・選択・ポップアップを永続的に解除
                setPanelVisible(false);
                panelVisibleRef.current = false;
                setSelectedId(null);
                clearTimeout(lockTimerRef.current);
                setLockPopupId(null);
                setLockPopupExiting(false);
                cancelAnimationFrame(animRef.current);
            }
            if (dragRef.current.moved) {
                const z = stateRef.current.zoom;
                const vbW = SVG_W / z;
                const vbH = vbW * h / w;
                const rawCx = dragRef.current.startCx - dx * DRAG_SENSITIVITY * vbW / w;
                const rawCy = dragRef.current.startCy - dy * DRAG_SENSITIVITY * vbH / h;
                const { cxMin, cxMax, cyMin, cyMax } = getClampRange(z, w, h);
                const cx = rubberBand(rawCx, cxMin, cxMax);
                const cy = rubberBand(rawCy, cyMin, cyMax);
                stateRef.current.center = { x: cx, y: cy };
                setCenter({ x: cx, y: cy });
            }
        }
        // ホバー (デスクトップ)
        if (!isDraggingRef.current && pointersRef.current.size <= 1) {
            setHoveredId(getNodeAt(e.clientX, e.clientY)?.id ?? null);
        }
    }
    function onPointerUp(e) {
        const wasDrag = dragRef.current?.moved ?? false;
        const { clientX, clientY } = e;
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) {
            dragRef.current = null;
            pinchRef.current = null;
            isDraggingRef.current = false;
            setIsDragging(false);
            // ラバーバンドのスナップバック
            if (wasDrag) {
                const { w, h } = containerSizeRef.current;
                const { center: c, zoom: z } = stateRef.current;
                const { cxMin, cxMax, cyMin, cyMax } = getClampRange(z, w, h);
                const snapCx = clampValue(c.x, cxMin, cxMax);
                const snapCy = clampValue(c.y, cyMin, cyMax);
                if (snapCx !== c.x || snapCy !== c.y) {
                    animateTo(snapCx, snapCy, z, 280);
                }
            }
            if (!hasMovedRef.current) {
                // タップ判定 (ドラッグ・ピンチがなかった場合のみ)
                const node = getNodeAt(clientX, clientY);
                const locked = node
                    ? completedStages.length < STAGES.find(s => s.id === node.id).requiredCompleted
                    : false;
                if (node && locked) {
                    handleLockedTap(node.id);
                }
                else if (node && !locked) {
                    handleNodeTap(node.id);
                }
                else if (panelVisibleRef.current) {
                    // マップの空きをタップ → パネルを閉じる
                    setPanelVisible(false);
                    panelVisibleRef.current = false;
                    setSelectedId(null);
                }
            }
            // wasDrag の場合はパネルを戻さない (panelVisible は既に false のまま)
        }
        else if (pointersRef.current.size === 1) {
            pinchRef.current = null;
            const [, pos] = [...pointersRef.current.entries()][0];
            dragRef.current = {
                px: pos.x, py: pos.y,
                startCx: stateRef.current.center.x,
                startCy: stateRef.current.center.y,
                moved: false,
            };
        }
    }
    function onWheel(e) {
        e.preventDefault();
        const newZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, stateRef.current.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
        const el = mapRef.current;
        if (!el)
            return;
        const rect = el.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const anc = screenToSvg(e.clientX, e.clientY);
        const { w, h } = containerSizeRef.current;
        const vbW = SVG_W / newZ;
        const vbH = vbW * h / w;
        applyState(anc.x + vbW * (0.5 - px / w), anc.y + vbH * (0.5 - py / h), newZ);
    }
    function handleNodeTap(id) {
        setAccepting(false);
        setSelectedId(id);
        setPanelVisible(true);
        panelVisibleRef.current = true;
        const node = NODES.find(n => n.id === id);
        const targetZ = Math.max(stateRef.current.zoom, 1.6);
        // ヘッダーと詳細パネルの間で見た目の中心に来るよう、少し低めにフォーカスする。
        const { w, h } = containerSizeRef.current;
        const vbH = (SVG_W / targetZ) * h / w;
        const panelOffsetSvg = vbH * (0.5 - SELECTED_NODE_FOCUS_Y);
        animateTo(node.x, node.y + panelOffsetSvg, targetZ);
    }
    function handleOffscreenTargetTap(id) {
        clearTimeout(lockTimerRef.current);
        setLockPopupId(null);
        setLockPopupExiting(false);
        const stage = STAGES.find(s => s.id === id);
        if (!stage)
            return;
        if (completedStages.length < stage.requiredCompleted) {
            handleLockedTap(id);
            return;
        }
        handleNodeTap(id);
    }
    function handleClose() {
        const node = selectedId ? NODES.find(n => n.id === selectedId) : null;
        if (node) {
            cancelAnimationFrame(animRef.current);
            const { w, h } = containerSizeRef.current;
            const z = stateRef.current.zoom;
            const { cxMin, cxMax, cyMin, cyMax } = getClampRange(z, w, h);
            applyState(clampValue(node.x, cxMin, cxMax), clampValue(node.y, cyMin, cyMax), z);
        }
        setPanelVisible(false);
        panelVisibleRef.current = false;
        setSelectedId(null);
        setOverviewReturnKey(key => key + 1);
    }
    function handleAccept() {
        if (!selectedId || accepting)
            return;
        const stage = STAGES.find(s => s.id === selectedId);
        if (completedStages.length < stage.requiredCompleted)
            return;
        setAccepting(true);
        setTimeout(() => selectStage(selectedId), 380);
    }
    const selectedStage = STAGES.find(s => s.id === selectedId) ?? null;
    const isLocked = selectedStage
        ? completedStages.length < selectedStage.requiredCompleted
        : false;
    const unlockedCount = STAGES.filter(s => completedStages.length >= s.requiredCompleted).length;
    const cameraActive = panelVisible && selectedStage !== null && !isLocked;
    const offscreenIndicators = panelVisible
        ? []
        : getOffscreenTargetIndicators({
            center,
            zoom,
            containerSize,
            completedCount: completedStages.length,
        });
    const offscreenIndicatorSignature = offscreenIndicators
        .map(indicator => [
        indicator.id,
        Math.round(indicator.x),
        Math.round(indicator.y),
        Math.round(indicator.angle),
        indicator.code,
        indicator.color,
    ].join(':'))
        .join('|');
    useEffect(() => {
        const nextIds = new Set(offscreenIndicators.map(indicator => indicator.id));
        setRenderedOffscreenIndicators(previous => {
            const next = offscreenIndicators.map(indicator => ({
                ...indicator,
                visible: true,
            }));
            previous.forEach(indicator => {
                if (!nextIds.has(indicator.id)) {
                    next.push({ ...indicator, visible: false });
                }
            });
            return next;
        });
        const timeoutId = window.setTimeout(() => {
            setRenderedOffscreenIndicators(previous => previous.filter(indicator => indicator.visible));
        }, 260);
        return () => window.clearTimeout(timeoutId);
    }, [offscreenIndicatorSignature]);
    return (_jsxs("div", { className: "relative w-full h-full flex flex-col text-white font-mono overflow-hidden", style: { background: '#020812' }, children: [_jsx(BoardBackdrop, {}), _jsxs("div", { className: "shrink-0", style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    padding: '12px 15px 14px',
                    background: 'linear-gradient(180deg, rgba(1,5,12,0.98) 0%, rgba(2,8,18,0.92) 66%, rgba(2,8,18,0.78) 100%)',
                    borderBottom: '1px solid rgba(77,163,255,0.18)',
                    backdropFilter: 'blur(8px) saturate(1.25)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    boxShadow: '0 14px 36px rgba(0,0,0,0.54), 0 1px 0 rgba(255,255,255,0.035) inset',
                }, children: [_jsx("div", { "aria-hidden": true, style: {
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: -72,
                            height: 72,
                            pointerEvents: 'none',
                            background: 'linear-gradient(to bottom, rgba(2,8,18,0.52) 0%, rgba(2,8,18,0.22) 48%, transparent 100%)',
                        } }), _jsxs("div", { style: { position: 'relative', zIndex: 1 }, children: [_jsx("button", { onClick: goHome, style: {
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: 9,
                                    letterSpacing: '0.18em',
                                    color: '#ffffff',
                                    fontFamily: 'monospace',
                                }, onMouseEnter: e => (e.currentTarget.style.color = '#ffffff'), onMouseLeave: e => (e.currentTarget.style.color = '#ffffff'), children: "\u2190 BACK" }), _jsx("div", { style: { marginTop: 4, fontSize: 7, color: 'rgba(77,163,255,0.3)', letterSpacing: '0.3em' }, children: "DARKNET BOARD" })] }), _jsxs("div", { style: { position: 'relative', zIndex: 1, textAlign: 'right' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }, children: [_jsx("div", { className: "animate-flicker", style: {
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: '#4da3ff',
                                            boxShadow: '0 0 7px #4da3ff',
                                        } }), _jsx("span", { style: { fontSize: 9, letterSpacing: '0.22em', color: '#4da3ff', fontFamily: 'monospace' }, children: "AVAILABLE" })] }), _jsxs("div", { style: { fontSize: 7.5, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginTop: 3, fontFamily: 'monospace' }, children: [unlockedCount, " / ", STAGES.length, " TARGETS"] })] })] }), _jsxs("div", { className: "absolute inset-0 overflow-hidden", style: { zIndex: 10 }, children: [_jsxs("div", { ref: mapRef, className: "absolute inset-0", style: {
                            background: '#020812',
                            backdropFilter: 'blur(3px) saturate(1.18)',
                        }, children: [_jsx(CityScene3D, { active: cameraActive, selectedId: selectedId, center: center, zoom: zoom, completedStages: completedStages, overviewReturnKey: overviewReturnKey }), _jsx("div", { className: "absolute inset-0 pointer-events-none z-10", style: {
                                    backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.008) 0px, rgba(255,255,255,0.008) 1px, transparent 1px, transparent 5px)',
                                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.04) 72px, black 168px)',
                                    maskImage: 'linear-gradient(to bottom, transparent 0, rgba(0,0,0,0.04) 72px, black 168px)',
                                } }), _jsx("div", { "aria-hidden": true, className: "absolute top-0 left-0 right-0 pointer-events-none", style: {
                                    height: 238,
                                    zIndex: 11,
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.24) 0%, rgba(1,5,12,0.2) 28%, rgba(2,8,17,0.12) 58%, rgba(3,11,22,0.04) 82%, transparent 100%)',
                                } }), _jsx("div", { className: "absolute inset-0 pointer-events-none z-10", style: { boxShadow: 'inset 0 0 64px rgba(0,0,0,0.52), inset 0 0 22px rgba(77,163,255,0.045)' } }), renderedOffscreenIndicators.map(indicator => (_jsx(TargetDirectionHUD, { indicator: indicator, onActivate: handleOffscreenTargetTap }, indicator.id))), _jsx(MapActionHint, { visible: !panelVisible && lockPopupId === null && !isDragging }), _jsx("div", { className: "absolute inset-0", style: {
                                    zIndex: 15, touchAction: 'none',
                                    cursor: isDragging ? 'grabbing' : (hoveredId ? 'pointer' : 'grab'),
                                }, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerLeave: () => setHoveredId(null), onPointerCancel: onPointerUp, onWheel: onWheel }), lockPopupId && (() => {
                                const s = STAGES.find(st => st.id === lockPopupId);
                                const shortfall = s.requiredCompleted - completedStages.length;
                                return (_jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none", style: { zIndex: 17 }, children: _jsx(GlitchFrame, { w: 280, h: 280, isExiting: lockPopupExiting, children: _jsxs("div", { className: "font-mono", style: {
                                                position: 'absolute', inset: 0,
                                                background: 'rgba(6,4,12,0.97)',
                                                border: '1px solid rgba(255,77,109,0.5)',
                                                boxShadow: '0 0 28px rgba(255,77,109,0.25)',
                                                padding: '20px 18px',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                            }, children: [_jsx("div", { className: "absolute inset-0 pointer-events-none", style: {
                                                        backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,77,109,0.03) 0px, rgba(255,77,109,0.03) 1px, transparent 1px, transparent 3px)',
                                                    } }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }, children: [_jsx("div", { style: { width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ff4d6d', boxShadow: '0 0 6px #ff4d6d' } }), _jsx("span", { style: { fontSize: 8, color: 'rgba(255,77,109,0.7)', letterSpacing: '0.35em' }, children: "ACCESS_DENIED" })] }), _jsx("div", { style: { fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', marginBottom: 20, borderBottom: '1px solid rgba(255,77,109,0.15)', paddingBottom: 16 }, children: s.name.split('·')[0].trim().toUpperCase() }), _jsxs("div", { style: { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 16 }, children: ["\u3053\u306E\u30BF\u30FC\u30B2\u30C3\u30C8\u3078\u306E", _jsx("br", {}), "\u30A2\u30AF\u30BB\u30B9\u306B\u306F"] }), _jsxs("div", { style: { fontSize: 32, color: '#ff4d6d', letterSpacing: '0.02em', lineHeight: 1, textShadow: '0 0 18px rgba(255,77,109,0.55)', marginBottom: 8 }, children: ["\u3042\u3068 ", shortfall, " \u4EF6"] }), _jsx("div", { style: { fontSize: 9, color: 'rgba(255,77,109,0.5)', letterSpacing: '0.2em', marginBottom: 20 }, children: "\u306E\u5B9F\u7E3E\u304C\u5FC5\u8981" }), _jsxs("div", { style: { fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', borderTop: '1px solid rgba(255,77,109,0.15)', paddingTop: 14 }, children: ["PROGRESS \u00B7 ", completedStages.length, " / ", s.requiredCompleted] })] }) }) }));
                            })()] }), _jsx("div", { style: {
                            position: 'absolute',
                            bottom: 0, left: 0, right: 0,
                            height: `${PANEL_RATIO * 100}%`,
                            transform: panelVisible ? 'translateY(0)' : 'translateY(100%)',
                            transition: 'transform 380ms cubic-bezier(0.32, 0.72, 0, 1)',
                            zIndex: 20,
                            pointerEvents: panelVisible ? 'auto' : 'none',
                        }, children: selectedStage && (_jsx(DetailPanel, { stage: selectedStage, isLocked: isLocked, completedCount: completedStages.length, accepting: accepting, onAccept: handleAccept, onClose: handleClose })) })] })] }));
}
