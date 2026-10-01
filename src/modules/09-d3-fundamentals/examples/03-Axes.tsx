/**
 * Example 09.03: axes, tick formatting and grid lines.
 *
 * d3-axis GENERATES DOM (ticks, labels, the domain path), so it needs a
 * real <g> element: a ref plus an effect.
 */
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const W = 560;
const H = 260;
const M = { top: 20, right: 20, bottom: 40, left: 60 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;

const formats = {
  "default": null,
  "~s (SI)": "~s",
  "$,.0f": "$,.0f",
  ".0%": ".0%",
} as const;

export default function Axes() {
  const xRef = useRef<SVGGElement>(null);
  const yRef = useRef<SVGGElement>(null);
  const gridRef = useRef<SVGGElement>(null);

  const [maxValue, setMaxValue] = useState(1_000_000);
  const [ticks, setTicks] = useState(5);
  const [format, setFormat] = useState<keyof typeof formats>("~s (SI)");
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    const x = d3.scaleTime().domain([new Date(2025, 0, 1), new Date(2025, 11, 31)]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, format === ".0%" ? 1 : maxValue]).range([innerH, 0]).nice();
    const spec = formats[format];

    const t = d3.transition().duration(500);

    // x axis: bottom, with abbreviated month names
    d3.select(xRef.current!)
      .transition(t)
      .call(d3.axisBottom(x).ticks(d3.timeMonth.every(2)).tickFormat((d) => d3.timeFormat("%b")(d as Date)));

    // y axis: left, formatted
    const yAxis = d3.axisLeft(y).ticks(ticks);
    if (spec) yAxis.tickFormat(d3.format(spec));
    d3.select(yRef.current!).transition(t).call(yAxis);

    // grid lines: an axis with long ticks and no labels
    const grid = d3.select(gridRef.current!);
    if (showGrid) {
      grid
        .transition(t)
        .style("opacity", 1)
        .call(d3.axisLeft(y).ticks(ticks).tickSize(-innerW).tickFormat(() => ""));
    } else {
      grid.transition(t).style("opacity", 0);
    }
  }, [maxValue, ticks, format, showGrid]);

  return (
    <div className="stack">
      <div className="row">
        <label>
          y max{" "}
          <select value={maxValue} onChange={(e) => setMaxValue(Number(e.target.value))}>
            {[100, 5_000, 1_000_000, 2_500_000_000].map((v) => (
              <option key={v} value={v}>
                {v.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <label>
          ticks ≈ {ticks} <input type="range" min={2} max={12} value={ticks} onChange={(e) => setTicks(e.target.valueAsNumber)} />
        </label>
        <label>
          format{" "}
          <select value={format} onChange={(e) => setFormat(e.target.value as keyof typeof formats)}>
            {Object.keys(formats).map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> grid
        </label>
      </div>

      <svg width={W} height={H} className="chart">
        <g transform={`translate(${M.left},${M.top})`}>
          {/* Order matters: the grid goes first so the axes draw on top */}
          <g ref={gridRef} className="grid" />
          <g ref={xRef} className="axis" transform={`translate(0,${innerH})`} />
          <g ref={yRef} className="axis" />
        </g>
      </svg>
      <p className="muted">
        Note that "ticks ≈ N" is only a hint: D3 picks <em>nice</em> round values near that count.
      </p>
    </div>
  );
}
