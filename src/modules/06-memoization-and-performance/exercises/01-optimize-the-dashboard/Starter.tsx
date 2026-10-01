/**
 * Exercise 06.1: Optimize the dashboard. See README.md.
 *
 * This file WORKS. It's just slow. Don't change the output; make it fast.
 *
 * Profiling notes (TODO 1):
 *   -
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

/** Deliberately slow: O(n²)-ish work to simulate a heavy statistic. */
function slowCorrelation(data: Datum[]): number {
  let r = 0;
  for (let k = 0; k < 40; k++) {
    const mx = d3.mean(data, (d) => d.x) ?? 0;
    const my = d3.mean(data, (d) => d.y) ?? 0;
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (const d of data) {
      num += (d.x - mx) * (d.y - my);
      dx += (d.x - mx) ** 2;
      dy += (d.y - my) ** 2;
    }
    r = num / Math.sqrt(dx * dy || 1);
  }
  return r;
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

function Scatter({ data, x, y, onHover }: ScatterProps) {
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
}

interface Stats {
  count: number;
  meanX: number;
  medianY: number;
  deviationY: number;
  correlation: number;
}

function StatsPanel({ stats }: { stats: Stats }) {
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
}

export default function OptimizeTheDashboard() {
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<Datum | null>(null);

  const data = allData.filter((d) => d.label.includes(query.trim().toLowerCase()));

  const x = d3.scaleLinear().domain([0, 100]).range([0, WIDTH]);
  const y = d3.scaleLinear().domain([0, 100]).range([HEIGHT, 0]);

  const stats: Stats = {
    count: data.length,
    meanX: d3.mean(data, (d) => d.x) ?? 0,
    medianY: d3.median(data, (d) => d.y) ?? 0,
    deviationY: d3.deviation(data, (d) => d.y) ?? 0,
    correlation: slowCorrelation(data),
  };

  return (
    <div className="stack">
      <input type="search" placeholder="filter by label, e.g. gamma" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="row" style={{ alignItems: "flex-start" }}>
        <svg width={WIDTH} height={HEIGHT} className="chart" onMouseLeave={() => setHovered(null)}>
          <Scatter data={data} x={x} y={y} onHover={(d) => setHovered(d)} />
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
