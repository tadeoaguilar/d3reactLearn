/**
 * Example 10.03: a responsive line chart.
 *
 * Resize the browser window. The chart fills its container, the scales
 * are rebuilt for the new width, and the tick count adapts so labels
 * never collide.
 */
import { useMemo } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { randomWalk, type TimePoint } from "../../../shared/data";

const data = randomWalk(365, 17);

export default function ResponsiveChart() {
  const [ref, dms] = useChartDimensions({ aspectRatio: 2.4, margin: { left: 48, right: 16 } });

  // Scales depend on the data and the inner size. Memoized so the <Axis>
  // effects only re-run when the size really changes.
  const x = useMemo(
    () => d3.scaleTime().domain(d3.extent(data, (d) => d.date) as [Date, Date]).range([0, dms.innerWidth]),
    [dms.innerWidth],
  );
  const y = useMemo(
    () => d3.scaleLinear().domain(d3.extent(data, (d) => d.value) as [number, number]).nice().range([dms.innerHeight, 0]),
    [dms.innerHeight],
  );

  const line = d3.line<TimePoint>().x((d) => x(d.date)).y((d) => y(d.value)).curve(d3.curveMonotoneX);
  const area = d3.area<TimePoint>().x((d) => x(d.date)).y0(dms.innerHeight).y1((d) => y(d.value)).curve(d3.curveMonotoneX);

  // Roughly one tick per 80px of width
  const xTicks = Math.max(2, Math.floor(dms.innerWidth / 80));
  const yTicks = Math.max(2, Math.floor(dms.innerHeight / 40));

  return (
    <div className="stack">
      <div ref={ref} style={{ width: "100%" }}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} className="chart">
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              <Axis orientation="left" scale={y} ticks={yTicks} gridSize={dms.innerWidth} duration={0} />
              <path d={area(data)!} fill="#2f6fdf" fillOpacity={0.12} />
              <path d={line(data)!} fill="none" stroke="#2f6fdf" strokeWidth={1.8} />
              <Axis orientation="bottom" scale={x} ticks={xTicks} transform={`translate(0,${dms.innerHeight})`} duration={0} />
              <Axis orientation="left" scale={y} ticks={yTicks} duration={0} />
            </g>
          </svg>
        )}
      </div>
      <p className="muted">
        {Math.round(dms.width)} × {dms.height}px · inner {Math.round(dms.innerWidth)} × {dms.innerHeight} · {xTicks} x-ticks,{" "}
        {yTicks} y-ticks
      </p>
    </div>
  );
}
