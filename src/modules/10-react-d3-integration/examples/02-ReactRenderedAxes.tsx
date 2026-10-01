/**
 * Example 10.02: axes as pure React components.
 *
 * d3-axis is convenient, but an axis is just a line plus some ticks.
 * Writing it in JSX lets you style it with React, render custom tick
 * content, and avoid refs entirely. Works with any scale that has
 * .ticks() (continuous) or .domain() + .bandwidth() (band).
 */
import * as d3 from "d3";
import { monthlyFinance } from "../../../shared/data";

interface ContinuousAxisProps {
  scale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>;
  ticks?: number;
  format?: (v: number | Date) => string;
}

export function AxisLeft({ scale, ticks = 5, format, gridWidth }: ContinuousAxisProps & { gridWidth?: number }) {
  const [start, end] = scale.range();
  const fmt = format ?? (scale.tickFormat(ticks) as (v: number | Date) => string);
  return (
    <g>
      <line y1={start} y2={end} stroke="var(--chart-axis)" />
      {scale.ticks(ticks).map((t) => (
        <g key={+t} transform={`translate(0,${scale(t)})`}>
          {gridWidth && <line x2={gridWidth} stroke="var(--chart-grid)" />}
          <line x2={-6} stroke="var(--chart-axis)" />
          <text x={-9} dy="0.32em" textAnchor="end" style={{ fill: "var(--muted)", fontSize: 11 }}>
            {fmt(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

export function AxisBottomBand({ scale, height }: { scale: d3.ScaleBand<string>; height: number }) {
  const [start, end] = scale.range();
  return (
    <g transform={`translate(0,${height})`}>
      <line x1={start} x2={end} stroke="var(--chart-axis)" />
      {scale.domain().map((v) => {
        const cx = scale(v)! + scale.bandwidth() / 2;
        return (
          <g key={v} transform={`translate(${cx},0)`}>
            <line y2={6} stroke="var(--chart-axis)" />
            <text y={18} textAnchor="middle" style={{ fill: "var(--muted)", fontSize: 11 }}>
              {v}
            </text>
          </g>
        );
      })}
    </g>
  );
}

const W = 640;
const H = 300;
const M = { top: 20, right: 20, bottom: 36, left: 64 };
const iw = W - M.left - M.right;
const ih = H - M.top - M.bottom;

export default function ReactRenderedAxes() {
  const x = d3
    .scaleBand<string>()
    .domain(monthlyFinance.map((d) => d.month))
    .range([0, iw])
    .padding(0.25);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(monthlyFinance, (d) => d.revenue)!])
    .nice()
    .range([ih, 0]);
  const money = d3.format("$~s");

  return (
    <svg width={W} height={H} className="chart">
      <g transform={`translate(${M.left},${M.top})`}>
        {/* The grid is drawn by the axis component, behind the bars */}
        <AxisLeft scale={y} ticks={6} format={(v) => money(v as number)} gridWidth={iw} />
        {monthlyFinance.map((d) => (
          <g key={d.month}>
            <rect x={x(d.month)} y={y(d.revenue)} width={x.bandwidth()} height={ih - y(d.revenue)} fill="#2f6fdf" rx={2} />
            <rect x={x(d.month)} y={y(d.expenses)} width={x.bandwidth()} height={2} fill="#e0803a" />
          </g>
        ))}
        <AxisBottomBand scale={x} height={ih} />
        <text x={iw} y={-6} textAnchor="end" style={{ fill: "var(--muted)" }}>
          ■ revenue ▬ expenses
        </text>
      </g>
    </svg>
  );
}
