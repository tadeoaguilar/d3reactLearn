/**
 * Example 09.01: scales playground.
 *
 * Scales are pure functions, so this example calls them directly in render.
 * No effects or refs are needed.
 */
import { useState, type ReactNode } from "react";
import * as d3 from "d3";

const W = 520;

function Ruler({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card">
      <strong>{title}</strong>
      <svg width={W + 40} height={60} className="chart" style={{ display: "block" }}>
        <g transform="translate(20,20)">{children}</g>
      </svg>
    </div>
  );
}

export default function ScalesPlayground() {
  const [value, setValue] = useState(40);
  const [exponent, setExponent] = useState<"linear" | "sqrt" | "log">("linear");

  // 1. Continuous scale
  // All three share the ScaleContinuousNumeric interface (ticks, tickFormat, invert…)
  const continuous: d3.ScaleContinuousNumeric<number, number> =
    exponent === "linear"
      ? d3.scaleLinear().domain([1, 100]).range([0, W])
      : exponent === "sqrt"
        ? d3.scaleSqrt().domain([1, 100]).range([0, W])
        : d3.scaleLog().domain([1, 100]).range([0, W]);

  // 2. Band scale
  const categories = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const band = d3.scaleBand<string>().domain(categories).range([0, W]).padding(0.2);

  // 3. Time scale
  const time = d3.scaleTime().domain([new Date(2025, 0, 1), new Date(2025, 11, 31)]).range([0, W]);

  // 4. Color scales
  const sequential = d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);
  const ordinal = d3.scaleOrdinal<string, string>().domain(categories).range(d3.schemeTableau10);

  return (
    <div className="stack">
      <label className="row">
        value = <strong style={{ width: 30 }}>{value}</strong>
        <input type="range" min={1} max={100} value={value} onChange={(e) => setValue(e.target.valueAsNumber)} />
      </label>

      <Ruler title={`d3.scale${exponent === "linear" ? "Linear" : exponent === "sqrt" ? "Sqrt" : "Log"}().domain([1, 100]).range([0, ${W}]) → ${continuous(value).toFixed(1)}px`}>
        <line x1={0} x2={W} stroke="var(--chart-axis)" />
        {continuous.ticks(10).map((t) => (
          <g key={t} transform={`translate(${continuous(t)},0)`}>
            <line y2={6} stroke="var(--chart-axis)" />
            <text y={20} textAnchor="middle" fontSize={10}>
              {continuous.tickFormat(10, "~s")(t)}
            </text>
          </g>
        ))}
        <circle cx={continuous(value)} r={7} fill="#e0803a" />
      </Ruler>
      <div className="row">
        {(["linear", "sqrt", "log"] as const).map((e) => (
          <button key={e} className={`btn ${e === exponent ? "primary" : ""}`} onClick={() => setExponent(e)}>
            {e}
          </button>
        ))}
        <span className="muted">Same data, different mapping. Watch where the ticks land.</span>
      </div>

      <Ruler title={`scaleBand: bandwidth() = ${band.bandwidth().toFixed(1)}px, padding 0.2`}>
        {categories.map((c) => (
          <g key={c} transform={`translate(${band(c)},0)`}>
            <rect width={band.bandwidth()} height={14} fill={ordinal(c)} rx={2} />
            <text x={band.bandwidth() / 2} y={28} textAnchor="middle" fontSize={10}>
              {c}
            </text>
          </g>
        ))}
      </Ruler>

      <Ruler title="scaleTime: Dates → pixels, with calendar-aware ticks">
        <line x1={0} x2={W} stroke="var(--chart-axis)" />
        {time.ticks(d3.timeMonth.every(1)!).map((t) => (
          <g key={+t} transform={`translate(${time(t)},0)`}>
            <line y2={6} stroke="var(--chart-axis)" />
            <text y={20} textAnchor="middle" fontSize={10}>
              {d3.timeFormat("%b")(t)}
            </text>
          </g>
        ))}
      </Ruler>

      <Ruler title={`scaleSequential(interpolateViridis): ${value} → ${sequential(value)}`}>
        {d3.range(0, 101, 2).map((v) => (
          <rect key={v} x={(v / 100) * W} width={W / 50 + 1} height={14} fill={sequential(v)} />
        ))}
        <path d={`M${(value / 100) * W},18 l-6,10 h12 z`} fill="currentColor" />
      </Ruler>
    </div>
  );
}
