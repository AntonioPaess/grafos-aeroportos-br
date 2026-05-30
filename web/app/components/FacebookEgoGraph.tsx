"use client";

import { useState, useMemo } from "react";

// ── Pre-computed ego graphs ────────────────────────────────────
const EGO_GRAPHS: Record<number, { center: number; neighbors: number[]; internal: [number, number][] }> = {
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

const W = 520;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const R_INNER = 30;
const R_ORBIT = 170;

function nodeColor(id: number, center: number): string {
  if (id === center) return "#f59e0b";
  const h = (id * 97) % 360;
  return `hsl(${h},65%,55%)`;
}

function buildLayout(ego: { center: number; neighbors: number[]; internal: [number, number][] }) {
  const positions: Record<number, [number, number]> = {};
  positions[ego.center] = [CX, CY];
  const n = ego.neighbors.length;
  ego.neighbors.forEach((nb, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions[nb] = [CX + R_ORBIT * Math.cos(angle), CY + R_ORBIT * Math.sin(angle)];
  });
  return positions;
}

export default function FacebookEgoGraph() {
  const [selectedNode, setSelectedNode] = useState<number>(107);
  const [hovered, setHovered] = useState<number | null>(null);

  const ego = EGO_GRAPHS[selectedNode];
  const positions = useMemo(() => buildLayout(ego), [ego]);

  // Build edge sets for quick lookup
  const internalSet = useMemo(() => {
    const s = new Set<string>();
    for (const [a, b] of ego.internal) { s.add(`${a}-${b}`); s.add(`${b}-${a}`); }
    return s;
  }, [ego]);

  const hoveredNeighbors = useMemo(() => {
    if (hovered === null) return new Set<number>();
    if (hovered === ego.center) return new Set(ego.neighbors);
    const s = new Set<number>();
    for (const [a, b] of ego.internal) {
      if (a === hovered) s.add(b);
      if (b === hovered) s.add(a);
    }
    s.add(ego.center);
    return s;
  }, [hovered, ego]);

  const isHighlighted = (id: number) => hovered === null || id === hovered || hoveredNeighbors.has(id);

  return (
    <div className="flex flex-col gap-5">
      {/* Node selector */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>Nó central:</span>
        {AVAILABLE_NODES.map((n) => (
          <button
            key={n}
            onClick={() => setSelectedNode(n)}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: selectedNode === n ? "#f59e0b22" : "var(--bg-muted)",
              border: `1px solid ${selectedNode === n ? "#f59e0b" : "var(--border)"}`,
              color: selectedNode === n ? "#f59e0b" : "var(--fg-muted)",
            }}
          >
            Nó {n} <span className="text-xs opacity-60">({NODE_DEGREES[n]} vizinhos)</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* SVG Graph */}
        <div
          className="relative rounded-2xl overflow-hidden flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#070e2a 0%,#0d1b3e 100%)", width: W, height: H }}
        >
          <svg width={W} height={H} style={{ display: "block" }}>
            <defs>
              <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a2a5e" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#070e2a" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R_ORBIT + 15} fill="url(#bg-grad)" />

            {/* Internal edges (between neighbors) */}
            {ego.internal.map(([a, b], i) => {
              const pa = positions[a];
              const pb = positions[b];
              if (!pa || !pb) return null;
              const dim = hovered !== null && !internalSet.has(`${hovered}-${a}`) && !internalSet.has(`${hovered}-${b}`) && hovered !== a && hovered !== b;
              return (
                <line key={`i${i}`} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]}
                  stroke="#4f46e5" strokeWidth={1} opacity={dim ? 0.06 : 0.35} />
              );
            })}

            {/* Spoke edges (center → neighbor) */}
            {ego.neighbors.map((nb, i) => {
              const p = positions[nb];
              if (!p) return null;
              const dim = hovered !== null && !isHighlighted(nb);
              return (
                <line key={`s${i}`} x1={CX} y1={CY} x2={p[0]} y2={p[1]}
                  stroke="#f59e0b" strokeWidth={hovered === nb ? 2.5 : 1}
                  opacity={dim ? 0.06 : (hovered === nb ? 0.9 : 0.3)} />
              );
            })}

            {/* Neighbor nodes */}
            {ego.neighbors.map((nb) => {
              const p = positions[nb];
              if (!p) return null;
              const isHov = hovered === nb;
              const lit = isHighlighted(nb);
              const color = nodeColor(nb, ego.center);
              return (
                <g key={nb} style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHovered(nb)}
                  onMouseLeave={() => setHovered(null)}>
                  {isHov && <circle cx={p[0]} cy={p[1]} r={12} fill={color} opacity={0.2} />}
                  <circle cx={p[0]} cy={p[1]} r={isHov ? 7 : 5}
                    fill={color} opacity={lit ? 1 : 0.15}
                    stroke={isHov ? "white" : "transparent"} strokeWidth={1.5} />
                </g>
              );
            })}

            {/* Center node */}
            <g style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(ego.center)}
              onMouseLeave={() => setHovered(null)}>
              <circle cx={CX} cy={CY} r={R_INNER} fill="#f59e0b" opacity={0.15} />
              <circle cx={CX} cy={CY} r={18} fill="#f59e0b" stroke="white" strokeWidth={2} />
              <text x={CX} y={CY + 5} textAnchor="middle" fill="white"
                fontSize={11} fontWeight="bold" style={{ pointerEvents: "none" }}>
                {ego.center}
              </text>
            </g>

            {/* Hover tooltip */}
            {hovered !== null && hovered !== ego.center && (() => {
              const p = positions[hovered];
              if (!p) return null;
              const nbCount = ego.internal.filter(([a, b]) => a === hovered || b === hovered).length;
              const tx = p[0] > W / 2 ? p[0] - 90 : p[0] + 14;
              const ty = Math.max(10, p[1] - 28);
              return (
                <foreignObject x={tx} y={ty} width={85} height={44}>
                  <div style={{
                    background: "rgba(10,20,50,0.95)", border: "1px solid #f59e0b55",
                    borderRadius: 8, padding: "5px 8px", fontSize: 11, color: "white",
                  }}>
                    <div style={{ fontWeight: "bold", color: "#f59e0b" }}>Nó {hovered}</div>
                    <div style={{ opacity: 0.7 }}>{nbCount} conexões internas</div>
                  </div>
                </foreignObject>
              );
            })()}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Passe o mouse para explorar · {ego.neighbors.length} vizinhos exibidos
          </div>
        </div>

        {/* Stats panel */}
        <div className="flex-1 flex flex-col gap-3">
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-dim)" }}>
              Ego Network — Nó {selectedNode}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Grau (vizinhos totais)", value: NODE_DEGREES[selectedNode].toLocaleString("pt-BR") },
                { label: "Exibidos no grafo",      value: ego.neighbors.length },
                { label: "Arestas internas",        value: ego.internal.length },
                { label: "Clust. coef. local",      value: (ego.internal.length * 2 / (ego.neighbors.length * (ego.neighbors.length - 1))).toFixed(3) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg p-3 text-center"
                  style={{ background: "var(--bg-card)" }}>
                  <div className="text-xl font-bold" style={{ color: "var(--fg)" }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-4 text-sm leading-relaxed"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--fg-muted)" }}
          >
            <strong style={{ color: "var(--fg)" }}>O que é uma ego network?</strong> É o subgrafo centrado em um
            nó: o nó central (ego) mais todos os seus vizinhos diretos (alters) e as
            conexões entre eles. Alta densidade de arestas internas indica que os
            amigos do nó também são amigos entre si — evidência de comunidades coesas
            e fenômeno de &ldquo;mundo pequeno&rdquo;.
          </div>
        </div>
      </div>
    </div>
  );
}
