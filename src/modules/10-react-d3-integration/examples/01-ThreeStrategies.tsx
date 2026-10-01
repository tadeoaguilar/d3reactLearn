/**
 * Example 10.01: the same bar chart built with all three strategies.
 *
 *   A. D3 owns the DOM: effect + joins
 *   B. React owns the DOM: D3 only computes scales
 *   C. Hybrid: React renders the bars, D3 renders the axes into <g ref>s
 *
 * Open DevTools → Elements and compare the output. It's nearly identical.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { fruitSales, type CategoryValue } from "../../../shared/data";

const W = 340;
const H = 220;
const M = { top: 12, right: 10, bottom: 34, left: 40 };
const iw = W - M.left - M.right;
const ih = H - M.top - M.bottom;

/** Shared, pure: D3 math used by all three versions. */
function makeScales(data: CategoryValue[]) {
  const x = d3
    .scaleBand<string>()
    .domain(data.map((d) => d.label.slice(0, 3)))
    .range([0, iw])
    .padding(0.2);
  const y = d3.scaleLinear().domain([0, 150]).range([ih, 0]);
  return { x, y };
}

// ---------------------------------------------------------------------------
// A. D3 owns the DOM
// ---------------------------------------------------------------------------
function ChartA({ data }: { data: CategoryValue[] }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const { x, y } = makeScales(data);
    const svg = d3.select(ref.current!);
    const g = svg.selectAll<SVGGElement, null>("g.bounds").data([null]).join("g").attr("class", "bounds").attr("transform", `translate(${M.left},${M.top})`);
    g.selectAll<SVGRectElement, CategoryValue>("rect")
      .data(data, (d) => d.label)
      .join("rect")
      .attr("fill", "#2f6fdf")
      .transition()
      .duration(500)
      .attr("x", (d) => x(d.label.slice(0, 3))!)
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => ih - y(d.value));
    g.selectAll<SVGGElement, null>("g.x").data([null]).join("g").attr("class", "x axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x));
    g.selectAll<SVGGElement, null>("g.y").data([null]).join("g").attr("class", "y axis").call(d3.axisLeft(y).ticks(5));
  }, [data]);
  return <svg ref={ref} width={W} height={H} className="chart" />;
}

// ---------------------------------------------------------------------------
// B. React owns the DOM (axes drawn with JSX from scale.ticks())
// ---------------------------------------------------------------------------
function ChartB({ data }: { data: CategoryValue[] }) {
  const { x, y } = makeScales(data);
  return (
    <svg width={W} height={H} className="chart">
      <g transform={`translate(${M.left},${M.top})`}>
        {data.map((d) => (
          <rect
            key={d.label}
            x={x(d.label.slice(0, 3))}
            y={y(d.value)}
            width={x.bandwidth()}
            height={ih - y(d.value)}
            fill="#2c9a6a"
            // A CSS transition on SVG geometry. Chromium browsers animate x/y/width/height
            // this way; others may just jump. Module 12 covers portable approaches.
            style={{ transition: "all 500ms ease" }}
          />
        ))}
        {/* y axis */}
        {y.ticks(5).map((t) => (
          <g key={t} transform={`translate(0,${y(t)})`}>
            <line x2={-6} stroke="var(--chart-axis)" />
            <text x={-9} dy="0.32em" textAnchor="end" style={{ fill: "var(--muted)" }}>
              {t}
            </text>
          </g>
        ))}
        <line y2={ih} stroke="var(--chart-axis)" />
        {/* x axis */}
        <g transform={`translate(0,${ih})`}>
          <line x2={iw} stroke="var(--chart-axis)" />
          {x.domain().map((label) => (
            <text key={label} x={x(label)! + x.bandwidth() / 2} y={16} textAnchor="middle" style={{ fill: "var(--muted)" }}>
              {label}
            </text>
          ))}
        </g>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// C. Hybrid: React bars + D3 axes
// ---------------------------------------------------------------------------
function D3Axis({ axis, transform }: { axis: (g: d3.Selection<SVGGElement, unknown, null, undefined>) => void; transform?: string }) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    d3.select(ref.current!).call(axis);
  }, [axis]);
  return <g ref={ref} className="axis" transform={transform} />;
}

function ChartC({ data }: { data: CategoryValue[] }) {
  const { x, y } = useMemo(() => makeScales(data), [data]);
  // Memoized so the axis effects only re-run when the data changes.
  const xAxis = useMemo(() => d3.axisBottom(x), [x]);
  const yAxis = useMemo(() => d3.axisLeft(y).ticks(5), [y]);
  return (
    <svg width={W} height={H} className="chart">
      <g transform={`translate(${M.left},${M.top})`}>
        {data.map((d) => (
          <rect
            key={d.label}
            x={x(d.label.slice(0, 3))}
            y={y(d.value)}
            width={x.bandwidth()}
            height={ih - y(d.value)}
            fill="#e0803a"
            style={{ transition: "all 500ms ease" }}
          />
        ))}
        <D3Axis axis={xAxis} transform={`translate(0,${ih})`} />
        <D3Axis axis={yAxis} />
      </g>
    </svg>
  );
}

export default function ThreeStrategies() {
  const [data, setData] = useState(fruitSales);
  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => setData((d) => d.map((x) => ({ ...x, value: Math.round(10 + Math.random() * 140) })))}>
          Randomize
        </button>
        <button className="btn" onClick={() => setData(fruitSales)}>
          Reset
        </button>
      </div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <figure style={{ margin: 0 }}>
          <ChartA data={data} />
          <figcaption className="muted">A · D3 owns the DOM</figcaption>
        </figure>
        <figure style={{ margin: 0 }}>
          <ChartB data={data} />
          <figcaption className="muted">B · React owns the DOM</figcaption>
        </figure>
        <figure style={{ margin: 0 }}>
          <ChartC data={data} />
          <figcaption className="muted">C · Hybrid (D3 axes)</figcaption>
        </figure>
      </div>
    </div>
  );
}
