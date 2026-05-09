import { useEffect, useRef } from 'react';

function RotatingSelectionRing({ cx, cy, r, stroke, durSec = 20, isExiting = false }: {
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  durSec?: number;
  isExiting?: boolean;
}) {
  const circleRef    = useRef<SVGCircleElement>(null);
  const isExitingRef = useRef(false);
  const exitStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isExiting && !isExitingRef.current) {
      isExitingRef.current = true;
      exitStartRef.current = null;
    }
  }, [isExiting]);

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    let rafId = 0;
    const t0       = performance.now();
    const ENTER_MS = 500;
    const EXIT_MS  = 350;
    const R_FROM   = 56;

    const tick = (now: number) => {
      const elapsed = now - t0;
      const angle = (elapsed / (durSec * 1000)) * 360 % 360;
      el.setAttribute('transform', `rotate(${angle.toFixed(2)},${cx},${cy})`);

      if (isExitingRef.current) {
        if (exitStartRef.current === null) exitStartRef.current = now;
        const t       = Math.min(1, (now - exitStartRef.current) / EXIT_MS);
        const easeOut = 1 - (1 - t) * (1 - t);
        el.setAttribute('r',              (r + (R_FROM - r) * easeOut).toFixed(2));
        el.setAttribute('stroke-opacity', (0.85 * (1 - easeOut)).toFixed(3));
      } else if (elapsed < ENTER_MS) {
        const t       = elapsed / ENTER_MS;
        const easeOut = 1 - Math.pow(1 - t, 3);
        el.setAttribute('r',              (R_FROM + (r - R_FROM) * easeOut).toFixed(2));
        el.setAttribute('stroke-opacity', (0.85 * t * t).toFixed(3));
      } else {
        el.setAttribute('r',              String(r));
        el.setAttribute('stroke-opacity', '0.85');
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cx, cy, r, durSec]);

  return (
    <circle
      ref={circleRef}
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeOpacity={0}
      strokeDasharray="6 4"
    />
  );
}

export function MapSelectionPulseEffects({
  cx,
  cy,
  color,
  nodeId,
  selected,
  showSelectionRing = false,
  ringExiting = false,
}: {
  cx: number;
  cy: number;
  color: string;
  nodeId: number;
  selected: boolean;
  showSelectionRing?: boolean;
  ringExiting?: boolean;
}) {
  const delay = `${(nodeId - 1) * 0.6}s`;
  const dur   = '2.6s';
  const glowDur   = '3.8s';
  const glowBegin = `${(nodeId - 1) * 0.6 + 1.1}s`;

  return (
    <>
      <circle cx={cx} cy={cy} fill="none" stroke={color} strokeWidth={1.2}>
        <animate
          attributeName="r"
          values="13;42"
          dur={dur}
          begin={delay}
          repeatCount="indefinite"
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.1 0 0.65 1"
        />
        <animate
          attributeName="stroke-opacity"
          values="0;0.55;0"
          dur={dur}
          begin={delay}
          keyTimes="0;0.18;1"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0 0 0.5 1;0.3 0 0.85 1"
        />
      </circle>
      <circle cx={cx} cy={cy} fill="none" stroke={color} strokeWidth={0.8}>
        <animate
          attributeName="r"
          values="13;42"
          dur={dur}
          begin={`${(nodeId - 1) * 0.6 + parseFloat(dur) / 2}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.1 0 0.65 1"
        />
        <animate
          attributeName="stroke-opacity"
          values="0;0.35;0"
          dur={dur}
          begin={`${(nodeId - 1) * 0.6 + parseFloat(dur) / 2}s`}
          keyTimes="0;0.18;1"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0 0 0.5 1;0.3 0 0.85 1"
        />
      </circle>
      <circle cx={cx} cy={cy} fill={color}>
        <animate
          attributeName="r"
          values="6;28"
          dur={glowDur}
          begin={glowBegin}
          repeatCount="indefinite"
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.1 0 0.6 1"
        />
        <animate
          attributeName="fill-opacity"
          values={`0;${selected ? 0.07 : 0.03};0`}
          dur={glowDur}
          begin={glowBegin}
          keyTimes="0;0.2;1"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0 0 0.5 1;0.3 0 0.85 1"
        />
      </circle>
      <circle cx={cx} cy={cy} fill={color}>
        <animate
          attributeName="r"
          values="4;18"
          dur={glowDur}
          begin={glowBegin}
          repeatCount="indefinite"
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.1 0 0.6 1"
        />
        <animate
          attributeName="fill-opacity"
          values={`0;${selected ? 0.12 : 0.06};0`}
          dur={glowDur}
          begin={glowBegin}
          keyTimes="0;0.2;1"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0 0 0.5 1;0.3 0 0.85 1"
        />
      </circle>
      {showSelectionRing && (
        <RotatingSelectionRing
          cx={cx}
          cy={cy}
          r={26}
          stroke={color}
          durSec={20}
          isExiting={ringExiting}
        />
      )}
    </>
  );
}
