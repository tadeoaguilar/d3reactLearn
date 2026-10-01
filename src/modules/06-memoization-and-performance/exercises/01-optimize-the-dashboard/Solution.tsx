/**
 * Exercise 06.1: reference solution.
 *
 * Profiling notes:
 *   - Every hover re-rendered Scatter (3,000 circles) and recomputed
 *     slowCorrelation, even though neither depends on `hovered`.
 *   - Every keystroke waited for the filter, stats and scatter render.
 */
import { memo, useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { manyPoints } from "../../../../shared/data";

interface Datum {
  id: number;
  label: string;
  x: number;
  y: number;
  group: number;
}

const WIDTH = 520;
const HEIGHT = 300;
const LABELS = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];
const allData: Datum[] = manyPoints(3000, 9).map((p, i) => ({
  id: i,
  label: `${LABELS[i % LABELS.length]}-${i}`,
  ...p,
}));
const color = d3.scaleOrdinal<number, string>().range(["#2f6fdf", "#e0803a", "#2c9a6a", "#c2477f"]);

// Scales that never change can live OUTSIDE the component: created once.
const x = d3.scaleLinear().domain([0, 100]).range([0, WIDTH]);
const y = d3.scaleLinear().domain([0, 100]).range([HEIGHT, 0]);

/** Stretch goal: Pearson correlation in a single pass. */
function correlation(data: Datum[]): number {
  const n = data.length;
  if (n < 2) return 0;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (const d of data) {
    sx += d.x;
    sy += d.y;
    sxx += d.x * d.x;
    syy += d.y * d.y;
    sxy += d.x * d.y;
  }
  const num = n * sxy - sx * sy;
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return den === 0 ? 0 : num / den;
}

function useRenderCounter() {
  const ref = useRef(0);
  ref.current++;
  return ref.current;
}

interface ScatterProps {
  data: Datum[];
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  onHover: (d: Datum | null) => void;
}

const Scatter = memo(function Scatter({ data, x, y, onHover }: ScatterProps) {
  const renders = useRenderCounter();
  return (
    <g>
      {data.map((d) => (
        <circle key={d.id} cx={x(d.x)} cy={y(d.y)} r={3} fill={color(d.group)} opacity={0.6} onMouseEnter={() => onHover(d)} />
      ))}
      <text x={WIDTH - 4} y={12} textAnchor="end" className="muted">
        Scatter renders: {renders}
      </text>
    </g>
  );
});

interface Stats {
  count: number;
  meanX: number;
  medianY: number;
  deviationY: number;
  correlation: number;
}

const StatsPanel = memo(function StatsPanel({ stats }: { stats: Stats }) {
  const renders = useRenderCounter();
  return (
    <div className="card" style={{ minWidth: 200 }}>
      <strong>Stats</strong>
      <div>count: {stats.count}</div>
      <div>mean x: {stats.meanX.toFixed(2)}</div>
      <div>median y: {stats.medianY.toFixed(2)}</div>
      <div>σ y: {stats.deviationY.toFixed(2)}</div>
      <div>corr(x, y): {stats.correlation.toFixed(3)}</div>
      <div className="muted">StatsPanel renders: {renders}</div>
    </div>
  );
});

export default function OptimizeTheDashboard() {
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<Datum | null>(null);

  // The input uses `query`. The expensive parts use the deferred copy.
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const data = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return allData.filter((d) => d.label.includes(q));
  }, [deferredQuery]);

  const stats = useMemo<Stats>(
    () => ({
      count: data.length,
      meanX: d3.mean(data, (d) => d.x) ?? 0,
      medianY: d3.median(data, (d) => d.y) ?? 0,
      deviationY: d3.deviation(data, (d) => d.y) ?? 0,
      correlation: correlation(data),
    }),
    [data],
  );

  // setHovered is already stable, so the callback has no dependencies.
  const handleHover = useCallback((d: Datum | null) => setHovered(d), []);

  return (
    <div className="stack">
      <input type="search" placeholder="filter by label, e.g. gamma" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="row" style={{ alignItems: "flex-start" }}>
        <svg
          width={WIDTH}
          height={HEIGHT}
          className="chart"
          onMouseLeave={() => setHovered(null)}
          style={{ opacity: isStale ? 0.5 : 1 }}
        >
          <Scatter data={data} x={x} y={y} onHover={handleHover} />
          {hovered && <circle cx={x(hovered.x)} cy={y(hovered.y)} r={8} fill="none" stroke="currentColor" strokeWidth={2} />}
        </svg>
        <div className="stack">
          <StatsPanel stats={stats} />
          <div className="card">
            <strong>Hovered</strong>
            <div>{hovered ? `${hovered.label} (${hovered.x.toFixed(1)}, ${hovered.y.toFixed(1)})` : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
