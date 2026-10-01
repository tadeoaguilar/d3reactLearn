/**
 * Example 06.02: memo + useCallback + useMemo on a scatter plot.
 *
 * Hovering sets `hovered` state in the parent. Without memoization, all
 * 4,000 circles re-render on every mouse move. With it, only the small
 * highlight layer re-renders. Compare the render counters.
 */
import { memo, useCallback, useMemo, useRef, useState, type RefObject } from "react";
import * as d3 from "d3";
import { manyPoints } from "../../../shared/data";

type Point = { x: number; y: number; group: number };
const WIDTH = 520;
const HEIGHT = 300;
const data = manyPoints(4000);
const color = d3.scaleOrdinal<number, string>().range(["#2f6fdf", "#e0803a", "#2c9a6a", "#c2477f"]);

interface PointsProps {
  data: Point[];
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  onHover: (p: Point | null) => void;
  renderCount: RefObject<number>;
}

function PointsImpl({ data, x, y, onHover, renderCount }: PointsProps) {
  renderCount.current++;
  return (
    <g>
      {data.map((p, i) => (
        <circle
          key={i}
          cx={x(p.x)}
          cy={y(p.y)}
          r={2.5}
          fill={color(p.group)}
          opacity={0.6}
          onMouseEnter={() => onHover(p)}
        />
      ))}
    </g>
  );
}

const MemoPoints = memo(PointsImpl);

export default function MemoAndUseCallback() {
  const [optimized, setOptimized] = useState(true);
  const [hovered, setHovered] = useState<Point | null>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const renderCount = useRef(0);

  // ✅ memoized scales: same objects until scaleFactor changes
  const memoX = useMemo(() => d3.scaleLinear().domain([0, 100]).range([0, WIDTH * scaleFactor]), [scaleFactor]);
  const memoY = useMemo(() => d3.scaleLinear().domain([0, 100]).range([HEIGHT, 0]), []);
  // ✅ stable callback
  const memoOnHover = useCallback((p: Point | null) => setHovered(p), []);

  // ❌ unoptimized versions: new every render
  const x = optimized ? memoX : d3.scaleLinear().domain([0, 100]).range([0, WIDTH * scaleFactor]);
  const y = optimized ? memoY : d3.scaleLinear().domain([0, 100]).range([HEIGHT, 0]);
  const onHover = optimized ? memoOnHover : (p: Point | null) => setHovered(p);
  const Points = optimized ? MemoPoints : PointsImpl;

  return (
    <div className="stack">
      <div className="row">
        <label>
          <input type="checkbox" checked={optimized} onChange={(e) => setOptimized(e.target.checked)} /> memo +
          useMemo + useCallback
        </label>
        <button className="btn" onClick={() => setScaleFactor((s) => (s === 1 ? 0.8 : 1))}>
          Change x-range (forces a real update)
        </button>
        <button className="btn" onClick={() => (renderCount.current = 0)}>
          Reset counter
        </button>
      </div>
      <svg width={WIDTH} height={HEIGHT} className="chart" onMouseLeave={() => setHovered(null)}>
        <Points data={data} x={x} y={y} onHover={onHover} renderCount={renderCount} />
        {/* The only part that needs to change on hover */}
        {hovered && <circle cx={x(hovered.x)} cy={y(hovered.y)} r={7} fill="none" stroke="currentColor" strokeWidth={2} />}
      </svg>
      <p>
        Points layer rendered <strong>{renderCount.current}</strong> times · hovered:{" "}
        {hovered ? `(${hovered.x.toFixed(1)}, ${hovered.y.toFixed(1)})` : "—"}
      </p>
      <p className="muted">
        Move the mouse over the points with the checkbox off, then on. (StrictMode doubles the count in dev.)
      </p>
    </div>
  );
}
