"use client";

import { useEffect, useRef, useState } from "react";
import { Airport } from "../lib/types";
import { REGION_COLORS, AIRPORT_MAP } from "../lib/data";

const MIN_LON = -73.99;
const MAX_LON = -28.85;
const MIN_LAT = -33.75;
const MAX_LAT = 5.27;
const IMG_W = 1920;
const IMG_H = 1694;
const PAD_X = 0.015;
const PAD_Y = 0.015;

function project(lat: number, lon: number): [number, number] {
  const fx = (lon - MIN_LON) / (MAX_LON - MIN_LON);
  const fy = (MAX_LAT - lat) / (MAX_LAT - MIN_LAT);
  return [
    (PAD_X + fx * (1 - 2 * PAD_X)) * IMG_W,
    (PAD_Y + fy * (1 - 2 * PAD_Y)) * IMG_H,
  ];
}

interface ViewBox { x: number; y: number; w: number; h: number }
const DEFAULT_VB: ViewBox = { x: 0, y: 0, w: IMG_W, h: IMG_H };

interface Props {
  airports: Airport[];
  edges: [string, string, number][];
  highlightedPath: string[] | null;
  highlightedNodes: Set<string>;
  onAirportClick?: (iata: string) => void;
  selectedSource?: string;
  selectedTarget?: string;
}

export default function BrazilAirportMap({
  airports, edges, highlightedPath, highlightedNodes,
  onAirportClick, selectedSource, selectedTarget,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState<ViewBox>(DEFAULT_VB);
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{ mx: number; my: number; vb: ViewBox } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [planePos, setPlanePos] = useState<[number, number] | null>(null);
  const progressRef = useRef(0);
  const frameRef = useRef<number>(0);

  // ── Animated plane ──────────────────────────────────────────
  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    progressRef.current = 0;
    if (!highlightedPath || highlightedPath.length < 2) { setPlanePos(null); return; }
    const segs = highlightedPath.length - 1;
    const tick = () => {
      progressRef.current = (progressRef.current + 0.003) % 1;
      const g = progressRef.current * segs;
      const si = Math.min(Math.floor(g), segs - 1);
      const t = g - si;
      const a = AIRPORT_MAP.get(highlightedPath[si]);
      const b = AIRPORT_MAP.get(highlightedPath[si + 1]);
      if (a && b) {
        const [x1, y1] = project(a.lat, a.lon);
        const [x2, y2] = project(b.lat, b.lon);
        setPlanePos([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [highlightedPath]);

  // ── Zoom helpers ────────────────────────────────────────────
  function clamp(v: ViewBox): ViewBox {
    const w = Math.max(IMG_W * 0.15, Math.min(IMG_W, v.w));
    const h = Math.max(IMG_H * 0.15, Math.min(IMG_H, v.h));
    return {
      w, h,
      x: Math.max(0, Math.min(IMG_W - w, v.x)),
      y: Math.max(0, Math.min(IMG_H - h, v.y)),
    };
  }

  function zoomAt(cx: number, cy: number, factor: number) {
    setVb((prev) => {
      const newW = prev.w * factor;
      const newH = prev.h * factor;
      const newX = cx - (cx - prev.x) * (newW / prev.w);
      const newY = cy - (cy - prev.y) * (newH / prev.h);
      return clamp({ x: newX, y: newY, w: newW, h: newH });
    });
  }

  // Convert screen coords → SVG/viewbox coords
  function screenToVB(e: React.MouseEvent | React.WheelEvent): [number, number] {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      vb.x + ((e.clientX - rect.left) / rect.width) * vb.w,
      vb.y + ((e.clientY - rect.top) / rect.height) * vb.h,
    ];
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const [cx, cy] = screenToVB(e);
    zoomAt(cx, cy, e.deltaY > 0 ? 1.15 : 0.87);
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    setDragging(true);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, vb: { ...vb } };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragOrigin.current) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = ((e.clientX - dragOrigin.current.mx) / rect.width) * dragOrigin.current.vb.w;
    const dy = ((e.clientY - dragOrigin.current.my) / rect.height) * dragOrigin.current.vb.h;
    setVb(clamp({
      ...dragOrigin.current.vb,
      x: dragOrigin.current.vb.x - dx,
      y: dragOrigin.current.vb.y - dy,
    }));
  }

  function handleMouseUp() { setDragging(false); dragOrigin.current = null; }

  // ── Path edges set ──────────────────────────────────────────
  const pathEdges = new Set<string>();
  if (highlightedPath) {
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      pathEdges.add(`${highlightedPath[i]}|${highlightedPath[i + 1]}`);
      pathEdges.add(`${highlightedPath[i + 1]}|${highlightedPath[i]}`);
    }
  }

  const zoom = IMG_W / vb.w;
  const nodeR = (base: number) => base / zoom;
  const sw = (base: number) => base / zoom;

  const hoveredAp = hovered ? AIRPORT_MAP.get(hovered) : null;
  const hoveredPos = hoveredAp ? project(hoveredAp.lat, hoveredAp.lon) : null;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg,#070e2a 0%,#0a1628 100%)", minHeight: 560 }}>

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: 1.2, height: 1.2, top: `${(i * 37) % 100}%`, left: `${(i * 61) % 100}%`, opacity: 0.15 + (i % 5) * 0.05 }} />
        ))}
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", display: "block", cursor: dragging ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Brazil map */}
        <image href="/brazil-map.png" x={0} y={0} width={IMG_W} height={IMG_H}
          opacity={0.22} style={{ filter: "brightness(1.9) saturate(0)" }} />

        {/* Regular edges */}
        {edges.map(([u, v]) => {
          const a = AIRPORT_MAP.get(u); const b = AIRPORT_MAP.get(v);
          if (!a || !b || pathEdges.has(`${u}|${v}`)) return null;
          const [x1, y1] = project(a.lat, a.lon);
          const [x2, y2] = project(b.lat, b.lon);
          return <line key={`e${u}${v}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(148,163,184,0.2)" strokeWidth={sw(3)} strokeLinecap="round" />;
        })}

        {/* Highlighted edges */}
        {highlightedPath?.slice(0, -1).map((node, i) => {
          const a = AIRPORT_MAP.get(node); const b = AIRPORT_MAP.get(highlightedPath[i + 1]);
          if (!a || !b) return null;
          const [x1, y1] = project(a.lat, a.lon);
          const [x2, y2] = project(b.lat, b.lon);
          return (
            <g key={`p${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth={sw(14)} strokeLinecap="round" opacity={0.18} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth={sw(5)} strokeLinecap="round" opacity={0.95} />
            </g>
          );
        })}

        {/* Airport nodes */}
        {airports.map((ap) => {
          const [cx, cy] = project(ap.lat, ap.lon);
          const color = REGION_COLORS[ap.regiao] ?? "#94a3b8";
          const isSrc = ap.iata === selectedSource;
          const isTgt = ap.iata === selectedTarget;
          const isPath = highlightedNodes.has(ap.iata);
          const isHov = hovered === ap.iata;
          const r = nodeR(isSrc || isTgt ? 20 : isPath ? 16 : 11);

          return (
            <g key={ap.iata} style={{ cursor: "pointer" }}
              onClick={() => onAirportClick?.(ap.iata)}
              onMouseEnter={() => setHovered(ap.iata)}
              onMouseLeave={() => setHovered(null)}>
              {(isSrc || isTgt) && (
                <circle cx={cx} cy={cy} r={r + nodeR(14)} fill="none"
                  stroke={isSrc ? "#22d3ee" : "#f43f5e"} strokeWidth={sw(2.5)} opacity={0.4}
                  style={{ animation: "ping 1.5s ease-out infinite" }} />
              )}
              {(isPath || isHov) && <circle cx={cx} cy={cy} r={r + nodeR(8)} fill={color} opacity={0.2} />}
              <circle cx={cx} cy={cy} r={r} fill={color}
                stroke={isSrc ? "#22d3ee" : isTgt ? "#f43f5e" : isPath ? "#fbbf24" : "rgba(255,255,255,0.3)"}
                strokeWidth={sw(isSrc || isTgt || isPath ? 3.5 : 1.5)} />
              <text x={cx} y={cy - r - nodeR(6)} textAnchor="middle"
                fill={isSrc ? "#22d3ee" : isTgt ? "#f43f5e" : isPath ? "#fbbf24" : "rgba(255,255,255,0.8)"}
                fontSize={nodeR(isSrc || isTgt ? 22 : 18)} fontWeight={isPath ? "700" : "500"}
                fontFamily="monospace" paintOrder="stroke"
                stroke="rgba(0,0,0,0.85)" strokeWidth={nodeR(5)}
                style={{ pointerEvents: "none" }}>
                {ap.iata}
              </text>
            </g>
          );
        })}

        {/* Animated plane */}
        {planePos && (
          <g>
            <circle cx={planePos[0]} cy={planePos[1]} r={nodeR(16)} fill="#fbbf24" opacity={0.25} />
            <circle cx={planePos[0]} cy={planePos[1]} r={nodeR(9)} fill="#fbbf24" stroke="white" strokeWidth={sw(2)} />
          </g>
        )}

        {/* Tooltip */}
        {hoveredAp && hoveredPos && (
          <foreignObject x={hoveredPos[0] + nodeR(24)} y={hoveredPos[1] - nodeR(50)} width={220} height={80}>
            <div style={{
              background: "rgba(10,20,50,0.97)", border: `1.5px solid ${REGION_COLORS[hoveredAp.regiao]}`,
              borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "white",
              whiteSpace: "nowrap", boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
            }}>
              <div style={{ fontWeight: "bold", color: REGION_COLORS[hoveredAp.regiao] }}>
                {hoveredAp.iata} — {hoveredAp.cidade}
              </div>
              <div style={{ opacity: 0.55, fontSize: 11, marginTop: 2 }}>{hoveredAp.regiao}</div>
            </div>
          </foreignObject>
        )}
      </svg>

      {/* Zoom controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-20">
        <button onClick={() => zoomAt(vb.x + vb.w / 2, vb.y + vb.h / 2, 0.75)}
          className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 text-white text-lg leading-none hover:bg-slate-700 active:scale-95 flex items-center justify-center shadow">
          +
        </button>
        <button onClick={() => zoomAt(vb.x + vb.w / 2, vb.y + vb.h / 2, 1.35)}
          className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 text-white text-lg leading-none hover:bg-slate-700 active:scale-95 flex items-center justify-center shadow">
          −
        </button>
        <button onClick={() => setVb(DEFAULT_VB)} title="Resetar zoom"
          className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-400 text-xs hover:bg-slate-700 active:scale-95 flex items-center justify-center shadow">
          ⊡
        </button>
      </div>

      {/* Zoom level badge */}
      <div className="absolute top-4 left-14 bg-slate-900/70 text-slate-400 text-xs px-2 py-1 rounded-lg border border-slate-700/50 z-20">
        {zoom.toFixed(1)}×
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur rounded-xl p-3 border border-slate-700/50 z-20">
        <div className="text-xs font-semibold text-slate-300 mb-2">Regiões</div>
        {Object.entries(REGION_COLORS).map(([r, c]) => (
          <div key={r} className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 5px ${c}88` }} />
            {r}
          </div>
        ))}
      </div>

      {/* Route banner */}
      {highlightedPath && highlightedPath.length > 1 && (
        <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur rounded-xl px-4 py-2.5 border border-amber-500/40 z-20 max-w-xs">
          <div className="text-xs font-semibold text-amber-400 mb-0.5">✈ Rota destacada</div>
          <div className="text-xs text-slate-300 font-mono">{highlightedPath.join(" → ")}</div>
        </div>
      )}

      {/* Hint */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-600 z-20">
        Scroll para zoom · Arraste para mover
      </div>
    </div>
  );
}
