"use client";

import { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";

// ── Types ─────────────────────────────────────────────────────
interface EgoGraph {
  center: number;
  neighbors: number[];
  internal: [number, number][];
}

interface ViewBox { x: number; y: number; w: number; h: number }
interface Pos { x: number; y: number }
interface Vel { vx: number; vy: number }

// ── Pre-computed ego graphs ────────────────────────────────────
const EGO_GRAPHS: Record<number, EgoGraph> = {
  0: {
    center: 0,
    neighbors: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80],
    internal: [[1,48],[1,53],[1,54],[1,73],[2,20],[3,9],[3,25],[3,26],[3,67],[3,72],[4,78],[7,22],[7,31],[7,38],[7,65],[9,21],[9,25],[9,26],[9,30],[9,56],[9,66],[9,67],[9,69],[9,72],[9,75],[9,79],[10,67],[13,21],[13,26],[13,56],[13,59],[13,65],[13,67],[14,20],[14,28],[14,41],[16,29],[17,19],[17,41],[19,41],[20,41],[20,44],[21,25],[21,26],[21,31],[21,39],[21,40],[21,55],[21,56],[21,66],[21,67],[25,26],[25,31],[25,39],[25,40],[25,51],[25,56],[25,65],[25,67],[25,69],[25,72],[25,73],[25,76],[25,79],[26,40],[26,55],[26,56],[26,62],[26,66],[26,67],[26,69],[26,72],[26,79],[27,54],[28,41],[29,40],[30,48],[30,56],[30,73],[31,51],[31,67],[33,42],[39,69],[40,56],[40,67],[40,72],[40,77],[41,44],[45,67],[48,53],[48,54],[48,57],[48,73],[48,80],[53,54],[55,56],[55,67],[56,59],[56,60],[56,62],[56,63],[56,66],[56,67],[56,72],[56,75],[57,80],[62,67],[66,67],[67,69],[67,72],[67,75],[67,79]],
  },
  107: {
    center: 107,
    neighbors: [0,58,171,348,353,363,366,376,389,414,420,428,475,483,484,517,526,538,563,566,580,596,601,606,629,637,641,649,651,896,897,898,899,900,901,902,903,904,905,906,907,908,909,910,911,912,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,930,931,932,933,934,935,936,937,938,939,940,941,942,943,944,945,946],
    internal: [[0,58],[0,171],[58,171],[348,353],[348,363],[348,366],[348,376],[348,414],[348,428],[348,475],[348,483],[348,484],[348,517],[348,526],[348,538],[353,363],[353,366],[353,376],[353,420],[353,428],[353,475],[353,483],[353,484],[353,517],[353,526],[353,538],[353,566],[353,580],[363,366],[363,376],[363,414],[363,475],[363,483],[363,484],[363,517],[363,526],[363,538],[363,566],[363,580],[366,376],[366,428],[366,475],[366,483],[366,484],[366,517],[366,526],[366,538],[366,566],[366,580],[376,414],[376,420],[376,428],[376,475],[376,483],[376,517],[376,526],[376,538],[376,566],[376,580],[414,428],[414,475],[414,483],[414,563],[414,566],[414,580],[414,596],[414,601],[414,606],[414,629],[414,637],[414,641],[428,475],[428,484],[428,517],[428,526],[428,563],[428,601],[428,606],[428,641],[475,483],[475,484],[475,517],[475,563],[475,566],[475,580],[475,606],[475,641],[483,484],[483,517],[483,526],[483,538],[483,563],[483,566],[483,580],[483,596],[483,601],[483,606],[483,637],[483,641],[484,517],[484,526],[484,538],[484,566],[484,580]],
  },
  1684: {
    center: 1684,
    neighbors: [58,107,171,860,990,1171,1405,1419,1450,1505,1534,1642,1656,1666,1726,1758,2661,2662,2663,2664,2665,2666,2667,2668,2669,2670,2671,2672,2673,2674,2675,2676,2677,2678,2679,2680,2681,2682,2683,2684,2685,2686,2687,2688,2689,2690,2691,2692,2693,2694,2695,2696,2697,2698,2699,2700,2701,2702,2703,2704,2705,2706,2707,2708,2709,2710,2711,2712,2713,2714,2715,2716,2717,2718,2719,2720,2721,2722,2723,2724],
    internal: [[58,107],[58,171],[107,171],[107,990],[107,1171],[107,1405],[107,1419],[107,1450],[107,1505],[107,1534],[107,1642],[107,1656],[107,1666],[107,1726],[107,1758],[1450,1505],[1450,1534],[1450,1656],[1450,1666],[1450,1726],[1505,1534],[1505,1656],[1505,1666],[1505,1758],[1534,1642],[1534,1666],[1534,1758],[1642,2677],[1656,1666],[1656,1726],[1666,1726],[2661,2674],[2661,2687],[2661,2708],[2661,2716],[2661,2719],[2664,2669],[2664,2673],[2664,2676],[2664,2698],[2666,2669],[2666,2676],[2666,2689],[2666,2698],[2669,2676],[2669,2679],[2669,2680],[2669,2683],[2669,2689],[2669,2694],[2669,2698],[2672,2684],[2672,2701],[2672,2708],[2672,2719],[2676,2683],[2676,2689],[2676,2694],[2676,2698],[2679,2681],[2679,2683],[2679,2689],[2680,2689],[2680,2694],[2680,2705],[2681,2683],[2681,2689],[2683,2689],[2684,2701],[2684,2708],[2686,2702],[2687,2716],[2689,2694],[2689,2705],[2689,2706],[2694,2706],[2699,2703],[2701,2708],[2701,2719],[2707,2719],[2708,2719],[2711,2714],[2711,2723],[2716,2719],[2716,2720],[2719,2720]],
  },
  3437: {
    center: 3437,
    neighbors: [567,698,857,862,1085,3438,3439,3440,3441,3442,3443,3444,3445,3446,3447,3448,3449,3450,3451,3452,3453,3454,3455,3456,3457,3458,3459,3460,3461,3462,3463,3464,3465,3466,3467,3468,3469,3470,3471,3472,3473,3474,3475,3476,3477,3478,3479,3480,3481,3482,3483,3484,3485,3486,3487,3488,3489,3490,3491,3492,3493,3494,3495,3496,3497,3498,3499,3500,3501,3502,3503,3504,3505,3506,3507,3508,3509,3510,3511,3512],
    internal: [[698,857],[698,862],[857,862],[857,3456],[857,3495],[862,1085],[862,3456],[862,3495],[862,3501],[1085,3440],[1085,3456],[1085,3495],[1085,3501],[3438,3448],[3438,3449],[3438,3456],[3438,3480],[3438,3491],[3438,3501],[3440,3495],[3440,3501],[3442,3455],[3442,3470],[3442,3472],[3442,3505],[3442,3508],[3443,3460],[3443,3464],[3443,3466],[3443,3469],[3448,3449],[3448,3456],[3448,3471],[3448,3475],[3448,3485],[3448,3491],[3448,3495],[3448,3501],[3449,3456],[3449,3480],[3449,3491],[3449,3495],[3449,3501],[3452,3462],[3452,3488],[3455,3470],[3455,3498],[3455,3505],[3456,3461],[3456,3495],[3456,3501],[3458,3468],[3458,3493],[3458,3506],[3460,3464],[3460,3466],[3460,3469],[3460,3474],[3461,3495],[3462,3488],[3463,3486],[3463,3506],[3464,3466],[3464,3469],[3464,3474],[3464,3510],[3465,3476],[3466,3469],[3466,3510],[3469,3474],[3469,3510],[3471,3475],[3471,3484],[3471,3485],[3472,3482],[3472,3505],[3472,3508],[3475,3484],[3475,3485],[3475,3488],[3475,3501],[3480,3491],[3482,3505],[3482,3508],[3483,3499],[3484,3501],[3485,3488],[3486,3493],[3486,3506],[3486,3509],[3487,3496],[3492,3496],[3493,3506],[3495,3501],[3496,3505],[3505,3508],[3505,3512],[3506,3507],[3506,3509],[3506,3511],[3507,3511]],
  },
};

const AVAILABLE_NODES = [0, 107, 1684, 3437];
const NODE_DEGREES: Record<number, number> = { 0: 347, 107: 1045, 1684: 792, 3437: 547 };

// ── Canvas & sim constants ────────────────────────────────────
const W = 900;
const H = 580;
const CX = W / 2;
const CY = H / 2;
const DEFAULT_VB: ViewBox = { x: 0, y: 0, w: W, h: H };

const REPULSION = 300;
const SPRING_K = 0.03;
const REST_LEN = 60;
const GRAVITY_K = 0.04;
const DAMPING = 0.88;
const MAX_VEL = 5;
const ENERGY_STOP = 0.3;
const MAX_TICKS = 600;

// ── Helpers ───────────────────────────────────────────────────
function nodeColor(id: number, center: number): string {
  if (id === center) return "#f59e0b";
  return `hsl(${(id * 97) % 360},65%,55%)`;
}

function initPositions(ego: EgoGraph): Record<number, Pos> {
  const pos: Record<number, Pos> = {};
  pos[ego.center] = { x: CX, y: CY };
  const n = ego.neighbors.length;
  ego.neighbors.forEach((nb, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const r = 90 + Math.random() * 110;
    pos[nb] = { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });
  return pos;
}

// ── Component ─────────────────────────────────────────────────
export default function FacebookEgoGraph() {
  const [selectedNode, setSelectedNode] = useState<number>(107);
  const [hovered, setHovered] = useState<number | null>(null);
  const [vb, setVbState] = useState<ViewBox>(DEFAULT_VB);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [minDeg, setMinDeg] = useState(0);
  const [showInternal, setShowInternal] = useState(true);
  const [showSpokes, setShowSpokes] = useState(true);

  // Mutable simulation state
  const posRef = useRef<Record<number, Pos>>({});
  const velRef = useRef<Record<number, Vel>>({});
  const pinnedRef = useRef(new Set<number>());
  const simRunRef = useRef(false);
  const frameRef = useRef(0);
  const tickCountRef = useRef(0);
  const egoRef = useRef<EgoGraph>(EGO_GRAPHS[selectedNode]);

  // Stable refs for interaction (avoids stale closures)
  const vbRef = useRef<ViewBox>(DEFAULT_VB);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: number; ox: number; oy: number; px: number; py: number } | null>(null);
  const panRef = useRef<{ mx: number; my: number; startVB: ViewBox } | null>(null);

  function setVb(next: ViewBox) {
    vbRef.current = next;
    setVbState(next);
  }

  // ── Force simulation tick ─────────────────────────────────
  const runTick = useCallback(() => {
    if (!simRunRef.current) return;

    const ego = egoRef.current;
    const pos = posRef.current;
    const vel = velRef.current;
    const pinned = pinnedRef.current;
    const allNodes = [ego.center, ...ego.neighbors];
    const spokes: [number, number][] = ego.neighbors.map(nb => [ego.center, nb]);
    const allEdges = [...spokes, ...ego.internal];

    const fx: Record<number, number> = {};
    const fy: Record<number, number> = {};
    for (const n of allNodes) { fx[n] = 0; fy[n] = 0; }

    // Repulsion between every pair
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        const a = allNodes[i], b = allNodes[j];
        const dx = pos[b].x - pos[a].x;
        const dy = pos[b].y - pos[a].y;
        const d = Math.sqrt(dx * dx + dy * dy) + 1;
        const f = REPULSION / (d * d);
        fx[a] -= f * dx / d; fy[a] -= f * dy / d;
        fx[b] += f * dx / d; fy[b] += f * dy / d;
      }
    }

    // Spring forces along edges
    for (const [a, b] of allEdges) {
      if (!pos[a] || !pos[b]) continue;
      const dx = pos[b].x - pos[a].x;
      const dy = pos[b].y - pos[a].y;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const f = SPRING_K * (d - REST_LEN);
      fx[a] += f * dx / d; fy[a] += f * dy / d;
      fx[b] -= f * dx / d; fy[b] -= f * dy / d;
    }

    // Gravity toward canvas center
    for (const n of allNodes) {
      fx[n] += GRAVITY_K * (CX - pos[n].x);
      fy[n] += GRAVITY_K * (CY - pos[n].y);
    }

    // Integrate velocities and positions
    let energy = 0;
    for (const n of allNodes) {
      if (pinned.has(n)) { vel[n] = { vx: 0, vy: 0 }; continue; }
      const rawVx = (vel[n].vx + fx[n]) * DAMPING;
      const rawVy = (vel[n].vy + fy[n]) * DAMPING;
      const vx = Math.max(-MAX_VEL, Math.min(MAX_VEL, rawVx));
      const vy = Math.max(-MAX_VEL, Math.min(MAX_VEL, rawVy));
      vel[n] = { vx, vy };
      energy += vx * vx + vy * vy;
      pos[n] = {
        x: Math.max(15, Math.min(W - 15, pos[n].x + vx)),
        y: Math.max(15, Math.min(H - 15, pos[n].y + vy)),
      };
    }

    tickCountRef.current++;
    forceUpdate();

    if (energy < ENERGY_STOP || tickCountRef.current >= MAX_TICKS) {
      simRunRef.current = false;
      return;
    }
    frameRef.current = requestAnimationFrame(runTick);
  }, []);

  // ── Start / restart simulation ────────────────────────────
  const startSim = useCallback((ego: EgoGraph, keepPos = false) => {
    cancelAnimationFrame(frameRef.current);
    simRunRef.current = false;
    egoRef.current = ego;
    pinnedRef.current = new Set();
    tickCountRef.current = 0;

    if (!keepPos) posRef.current = initPositions(ego);

    const spread = keepPos ? 0.4 : 1;
    const vel: Record<number, Vel> = {};
    vel[ego.center] = { vx: 0, vy: 0 };
    for (const nb of ego.neighbors) {
      vel[nb] = { vx: (Math.random() - 0.5) * spread, vy: (Math.random() - 0.5) * spread };
    }
    velRef.current = vel;
    simRunRef.current = true;
    frameRef.current = requestAnimationFrame(runTick);
  }, [runTick]);

  useEffect(() => {
    const ego = EGO_GRAPHS[selectedNode];
    // Recompute internal degrees to filter
    const deg: Record<number, number> = {};
    for (const nb of ego.neighbors) deg[nb] = 0;
    for (const [a, b] of ego.internal) { deg[a] = (deg[a] ?? 0) + 1; deg[b] = (deg[b] ?? 0) + 1; }
    const visNbrs = ego.neighbors.filter(nb => (deg[nb] ?? 0) >= minDeg);
    const visSet = new Set(visNbrs);
    const visInternal = ego.internal.filter(([a, b]) => visSet.has(a) && visSet.has(b));
    startSim({ center: ego.center, neighbors: visNbrs, internal: visInternal }, false);
    setVb(DEFAULT_VB);
    return () => { cancelAnimationFrame(frameRef.current); simRunRef.current = false; };
  }, [selectedNode, minDeg, startSim]);

  // ── SVG coordinate helpers ────────────────────────────────
  function toSVG(e: React.MouseEvent): [number, number] {
    const rect = svgRef.current!.getBoundingClientRect();
    const v = vbRef.current;
    return [
      v.x + ((e.clientX - rect.left) / rect.width) * v.w,
      v.y + ((e.clientY - rect.top) / rect.height) * v.h,
    ];
  }

  function clampVB(v: ViewBox): ViewBox {
    const w = Math.max(W * 0.15, Math.min(W * 3, v.w));
    const h = Math.max(H * 0.15, Math.min(H * 3, v.h));
    return { w, h, x: Math.max(-W, Math.min(W * 2 - w, v.x)), y: Math.max(-H, Math.min(H * 2 - h, v.y)) };
  }

  // ── Zoom ─────────────────────────────────────────────────
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const [cx, cy] = toSVG(e);
    const f = e.deltaY > 0 ? 1.12 : 0.89;
    const v = vbRef.current;
    const nw = v.w * f, nh = v.h * f;
    setVb(clampVB({ x: cx - (cx - v.x) * (nw / v.w), y: cy - (cy - v.y) * (nh / v.h), w: nw, h: nh }));
  }

  // ── Mouse events ─────────────────────────────────────────
  function handleSVGMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    panRef.current = { mx: e.clientX, my: e.clientY, startVB: vbRef.current };
  }

  function handleNodeMouseDown(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    const [sx, sy] = toSVG(e);
    const p = posRef.current[id];
    dragRef.current = { id, ox: sx, oy: sy, px: p.x, py: p.y };
    pinnedRef.current = new Set([id]);
    panRef.current = null;
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (dragRef.current) {
      const [sx, sy] = toSVG(e);
      const { id, ox, oy, px, py } = dragRef.current;
      posRef.current[id] = {
        x: Math.max(15, Math.min(W - 15, px + (sx - ox))),
        y: Math.max(15, Math.min(H - 15, py + (sy - oy))),
      };
      forceUpdate();
    } else if (panRef.current) {
      const { mx, my, startVB } = panRef.current;
      const rect = svgRef.current!.getBoundingClientRect();
      const dx = ((e.clientX - mx) / rect.width) * startVB.w;
      const dy = ((e.clientY - my) / rect.height) * startVB.h;
      setVb(clampVB({ ...startVB, x: startVB.x - dx, y: startVB.y - dy }));
    }
  }

  function handleMouseUp() {
    if (dragRef.current) {
      dragRef.current = null;
      pinnedRef.current = new Set();
      // Restart sim from current positions so nodes settle after drag
      if (!simRunRef.current) startSim(egoRef.current, true);
    }
    panRef.current = null;
  }

  // ── Derived render data ───────────────────────────────────
  const ego = EGO_GRAPHS[selectedNode];
  const pos = posRef.current;

  const internalDeg = useMemo(() => {
    const d: Record<number, number> = {};
    for (const nb of ego.neighbors) d[nb] = 0;
    for (const [a, b] of ego.internal) { d[a] = (d[a] ?? 0) + 1; d[b] = (d[b] ?? 0) + 1; }
    return d;
  }, [ego]);

  const maxInternalDeg = useMemo(() =>
    Math.max(0, ...ego.neighbors.map(nb => internalDeg[nb] ?? 0)),
  [ego, internalDeg]);

  const visibleNeighbors = useMemo(() =>
    ego.neighbors.filter(nb => (internalDeg[nb] ?? 0) >= minDeg),
  [ego, internalDeg, minDeg]);

  const visibleInternalEdges = useMemo(() => {
    const vis = new Set(visibleNeighbors);
    return ego.internal.filter(([a, b]) => vis.has(a) && vis.has(b));
  }, [ego, visibleNeighbors]);

  const internalSet = useMemo(() => {
    const s = new Set<string>();
    for (const [a, b] of visibleInternalEdges) { s.add(`${a}-${b}`); s.add(`${b}-${a}`); }
    return s;
  }, [visibleInternalEdges]);

  const hovNeighbors = useMemo(() => {
    if (hovered === null) return new Set<number>();
    if (hovered === ego.center) return new Set(visibleNeighbors);
    const s = new Set<number>();
    for (const [a, b] of visibleInternalEdges) {
      if (a === hovered) s.add(b);
      if (b === hovered) s.add(a);
    }
    s.add(ego.center);
    return s;
  }, [hovered, ego, visibleNeighbors, visibleInternalEdges]);

  const lit = (id: number) => hovered === null || id === hovered || hovNeighbors.has(id);
  const rNode = (id: number) => id === ego.center ? 18 : 4 + Math.min((internalDeg[id] ?? 0) * 0.7, 8);

  const clusterCoef = visibleNeighbors.length > 1
    ? (visibleInternalEdges.length * 2 / (visibleNeighbors.length * (visibleNeighbors.length - 1))).toFixed(3)
    : "—";

  return (
    <div className="flex flex-col gap-5">
      {/* Node selector */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>Nó central:</span>
        {AVAILABLE_NODES.map(n => (
          <button key={n} onClick={() => { setSelectedNode(n); setMinDeg(0); }}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: selectedNode === n ? "#f59e0b22" : "var(--bg-muted)",
              border: `1px solid ${selectedNode === n ? "#f59e0b" : "var(--border)"}`,
              color: selectedNode === n ? "#f59e0b" : "var(--fg-muted)",
            }}>
            Nó {n} <span className="text-xs opacity-60">({NODE_DEGREES[n]})</span>
          </button>
        ))}
        <button
          onClick={() => startSim(EGO_GRAPHS[selectedNode], false)}
          className="ml-auto px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--fg-muted)" }}>
          ↺ Refazer layout
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 flex flex-wrap gap-5 items-center"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {/* Toggle arestas internas */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-dim)" }}>Arestas</span>
          <button
            onClick={() => setShowInternal(v => !v)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: showInternal ? "#4f46e522" : "var(--bg-muted)",
              border: `1px solid ${showInternal ? "#4f46e5" : "var(--border)"}`,
              color: showInternal ? "#818cf8" : "var(--fg-muted)",
            }}>
            Internas
          </button>
          <button
            onClick={() => setShowSpokes(v => !v)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: showSpokes ? "#f59e0b22" : "var(--bg-muted)",
              border: `1px solid ${showSpokes ? "#f59e0b" : "var(--border)"}`,
              color: showSpokes ? "#f59e0b" : "var(--fg-muted)",
            }}>
            Spokes
          </button>
        </div>

        {/* Grau mínimo */}
        <div className="flex items-center gap-3 flex-1 min-w-48">
          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--fg-dim)" }}>
            Grau mínimo
          </span>
          <input
            type="range" min={0} max={maxInternalDeg} value={minDeg}
            onChange={e => setMinDeg(Number(e.target.value))}
            className="flex-1 accent-amber-400"
          />
          <span className="text-xs font-mono w-6 text-center" style={{ color: "var(--fg-muted)" }}>{minDeg}</span>
        </div>

        {minDeg > 0 && (
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {visibleNeighbors.length}/{ego.neighbors.length} vizinhos visíveis
          </span>
        )}
      </div>

      {/* Graph canvas */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#070e2a 0%,#0d1b3e 100%)", height: H }}>
        <svg
          ref={svgRef}
          width="100%"
          height={H}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          style={{ display: "block", cursor: dragRef.current ? "grabbing" : "grab", userSelect: "none" }}
          onWheel={handleWheel}
          onMouseDown={handleSVGMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <radialGradient id="fb-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a2a5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#070e2a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r={Math.max(W, H) * 0.6} fill="url(#fb-bg)" />

          {/* Internal edges */}
          {showInternal && visibleInternalEdges.map(([a, b], i) => {
            const pa = pos[a], pb = pos[b];
            if (!pa || !pb) return null;
            const dim = hovered !== null
              && !internalSet.has(`${hovered}-${a}`)
              && !internalSet.has(`${hovered}-${b}`)
              && hovered !== a && hovered !== b;
            return (
              <line key={`ie${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke="#4f46e5" strokeWidth={1} opacity={dim ? 0.04 : 0.28} />
            );
          })}

          {/* Spoke edges */}
          {showSpokes && pos[ego.center] && visibleNeighbors.map((nb, i) => {
            const p = pos[nb];
            if (!p) return null;
            const isHovEdge = hovered === nb;
            const dim = hovered !== null && !lit(nb);
            return (
              <line key={`sp${i}`}
                x1={pos[ego.center].x} y1={pos[ego.center].y}
                x2={p.x} y2={p.y}
                stroke="#f59e0b"
                strokeWidth={isHovEdge ? 2 : 0.7}
                opacity={dim ? 0.04 : isHovEdge ? 0.85 : 0.18}
              />
            );
          })}

          {/* Neighbor nodes */}
          {visibleNeighbors.map(nb => {
            const p = pos[nb];
            if (!p) return null;
            const isHov = hovered === nb;
            const isLit = lit(nb);
            const color = nodeColor(nb, ego.center);
            const r = rNode(nb);
            return (
              <g key={nb} style={{ cursor: "grab" }}
                onMouseEnter={() => setHovered(nb)}
                onMouseLeave={() => setHovered(null)}
                onMouseDown={e => handleNodeMouseDown(e, nb)}>
                {isHov && <circle cx={p.x} cy={p.y} r={r + 7} fill={color} opacity={0.18} />}
                <circle cx={p.x} cy={p.y} r={r}
                  fill={color}
                  opacity={isLit ? 0.88 : 0.1}
                  stroke={isHov ? "white" : "transparent"}
                  strokeWidth={1.5}
                />
                {isHov && (
                  <text x={p.x} y={p.y - r - 6} textAnchor="middle"
                    fill="white" fontSize={10} opacity={0.9}
                    style={{ pointerEvents: "none" }}>
                    {nb}
                  </text>
                )}
              </g>
            );
          })}

          {/* Center node */}
          {pos[ego.center] && (
            <g style={{ cursor: "grab" }}
              onMouseEnter={() => setHovered(ego.center)}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={e => handleNodeMouseDown(e, ego.center)}>
              <circle cx={pos[ego.center].x} cy={pos[ego.center].y} r={28} fill="#f59e0b" opacity={0.12} />
              <circle cx={pos[ego.center].x} cy={pos[ego.center].y} r={18}
                fill="#f59e0b" stroke="white" strokeWidth={2} />
              <text x={pos[ego.center].x} y={pos[ego.center].y + 5}
                textAnchor="middle" fill="white" fontSize={11} fontWeight="bold"
                style={{ pointerEvents: "none" }}>
                {ego.center}
              </text>
            </g>
          )}

          {/* Hover tooltip */}
          {hovered !== null && hovered !== ego.center && pos[hovered] && (() => {
            const p = pos[hovered];
            const nbCount = internalDeg[hovered] ?? 0;
            const tx = p.x > W / 2 ? p.x - 96 : p.x + 12;
            const ty = Math.max(8, p.y - 36);
            return (
              <foreignObject x={tx} y={ty} width={90} height={48}>
                <div style={{
                  background: "rgba(8,16,46,0.96)", border: "1px solid #f59e0b55",
                  borderRadius: 8, padding: "5px 8px", fontSize: 11, color: "white",
                }}>
                  <div style={{ fontWeight: "bold", color: "#f59e0b" }}>Nó {hovered}</div>
                  <div style={{ opacity: 0.7 }}>{nbCount} conexões internas</div>
                </div>
              </foreignObject>
            );
          })()}
        </svg>

        <div className="absolute bottom-3 left-3 text-xs pointer-events-none"
          style={{ color: "rgba(255,255,255,0.38)" }}>
          Arraste nós · Scroll para zoom · Drag no fundo para pan · {visibleNeighbors.length} vizinhos exibidos
        </div>
        <button
          onClick={() => setVb(DEFAULT_VB)}
          className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-lg transition-colors"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}>
          Reset view
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Grau (vizinhos totais)", value: NODE_DEGREES[selectedNode].toLocaleString("pt-BR") },
          { label: "Vizinhos exibidos",       value: visibleNeighbors.length },
          { label: "Arestas internas",         value: visibleInternalEdges.length },
          { label: "Clust. coef. local",       value: clusterCoef },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
            <div className="text-xl font-bold" style={{ color: "var(--fg)" }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="rounded-xl p-4 text-sm leading-relaxed"
        style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--fg-muted)" }}>
        <strong style={{ color: "var(--fg)" }}>O que é uma ego network?</strong> Subgrafo centrado em um
        nó: o nó central (ego) mais todos os seus vizinhos diretos (alters) e as conexões entre eles.
        Alta densidade de arestas internas indica que os amigos do nó também são amigos entre si —
        evidência de comunidades coesas e fenômeno de &ldquo;mundo pequeno&rdquo;.
      </div>
    </div>
  );
}
