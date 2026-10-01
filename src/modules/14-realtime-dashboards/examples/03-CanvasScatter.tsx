/**
 * Example 14.03: canvas rendering for big data, with an SVG overlay.
 *
 * Layers (bottom → top):
 *   <canvas>  all points (tens of thousands, drawn with fillRect)
 *   <svg>     axes + the hover highlight (crisp, few elements)
 * Hover uses a d3.quadtree to find the nearest point in O(log n).
 * Switch to "SVG" mode to compare. Above ~5k points it gets sluggish.
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { manyPoints } from "../../../shared/data";
import { palette } from "../../../shared/theme";

type Point = ReturnType<typeof manyPoints>[number];

export default function CanvasScatter() {
  const [ref, dms] = useChartDimensions({ aspectRatio: 1.7 });
  const [count, setCount] = useState(50_000);
  const [mode, setMode] = useState<"canvas" | "svg">("canvas");
  const [hovered, setHovered] = useState<Point | null>(null);
  const [drawMs, setDrawMs] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const data = useMemo(() => manyPoints(count, 3), [count]);
  const x = useMemo(() => d3.scaleLinear().domain([-10, 110]).range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain([-10, 110]).range([dms.innerHeight, 0]), [dms.innerHeight]);

  // Spatial index for hover. Rebuilt only when the data or scales change.
  const quadtree = useMemo(() => d3.quadtree(data, (d) => x(d.x), (d) => y(d.y)), [data, x, y]);

  // Draw on the canvas whenever the data or size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "canvas" || dms.innerWidth === 0) return;
    const start = performance.now();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dms.innerWidth * dpr; // bitmap size in device pixels…
    canvas.height = dms.innerHeight * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr); // …but draw in CSS pixels
    ctx.clearRect(0, 0, dms.innerWidth, dms.innerHeight);
    ctx.globalAlpha = 0.5;
    // Draw by group so fillStyle changes only 4 times (state changes are expensive)
    for (let g = 0; g < 4; g++) {
      ctx.fillStyle = palette[g];
      for (const p of data) if (p.group === g) ctx.fillRect(x(p.x) - 1, y(p.y) - 1, 2, 2);
    }
    setDrawMs(performance.now() - start);
  }, [data, x, y, mode, dms.innerWidth, dms.innerHeight]);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const [mx, my] = d3.pointer(e, e.currentTarget);
    setHovered(quadtree.find(mx, my, 12) ?? null);
  }

  return (
    <div className="stack">
      <div className="row">
        {(["canvas", "svg"] as const).map((m) => (
          <button key={m} className={`btn ${mode === m ? "primary" : ""}`} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
        <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {[1_000, 5_000, 20_000, 50_000, 200_000].map((n) => (
            <option key={n} value={n}>
              {n.toLocaleString()} points
            </option>
          ))}
        </select>
        <span className="muted">
          {mode === "canvas" ? `canvas draw: ${drawMs.toFixed(1)} ms` : "SVG: one DOM node per point"}
          {mode === "svg" && count > 5000 && <strong style={{ color: "var(--danger)" }}> (only the first 5,000 are drawn, to keep the tab usable)</strong>}
        </span>
      </div>
      <div ref={ref} className="chart-wrapper">
        {dms.width > 0 && (
          <>
            {mode === "canvas" && (
              <canvas
                ref={canvasRef}
                style={{ position: "absolute", left: dms.margin.left, top: dms.margin.top, width: dms.innerWidth, height: dms.innerHeight }}
              />
            )}
            <svg width={dms.width} height={dms.height} className="chart" style={{ position: "relative" }}>
              <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
                <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} />
                <Axis orientation="left" scale={y} />
                {mode === "svg" &&
                  data.slice(0, 5000).map((p, i) => <rect key={i} x={x(p.x) - 1} y={y(p.y) - 1} width={2} height={2} fill={palette[p.group]} opacity={0.5} />)}
                {hovered && <circle cx={x(hovered.x)} cy={y(hovered.y)} r={6} fill="none" stroke="currentColor" strokeWidth={2} />}
                <rect width={dms.innerWidth} height={dms.innerHeight} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHovered(null)} />
              </g>
            </svg>
          </>
        )}
      </div>
      <p className="muted">
        Hovered: {hovered ? `(${hovered.x.toFixed(2)}, ${hovered.y.toFixed(2)}) group ${hovered.group + 1}` : "—"} · Hover stays
        instant even at 200k points: the quadtree lookup is O(log n), and hover never redraws the canvas.
      </p>
    </div>
  );
}
