/**
 * Example 12.01: an HTML tooltip + crosshair using d3.bisector.
 *
 * An invisible <rect> catches pointer events over the plot. On move we
 * convert the pixel x to a date (x.invert), binary-search the nearest
 * point, and store it in state. React renders the crosshair and tooltip.
 * Keyboard: focus the chart (Tab) and use ← → to step through points.
 */
import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { Tooltip } from "../../../shared/charts/Tooltip";
import { randomWalk, type TimePoint } from "../../../shared/data";

const data = randomWalk(120, 31);
const bisectDate = d3.bisector<TimePoint, Date>((d) => d.date).center;
const fmtDate = d3.timeFormat("%a %b %d, %Y");

export default function TooltipAndNearestPoint() {
  const [ref, dms] = useChartDimensions({ height: 320 });
  const [index, setIndex] = useState<number | null>(null);

  const x = useMemo(() => d3.scaleTime().domain(d3.extent(data, (d) => d.date) as [Date, Date]).range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain(d3.extent(data, (d) => d.value) as [number, number]).nice().range([dms.innerHeight, 0]), [dms.innerHeight]);
  const line = d3.line<TimePoint>().x((d) => x(d.date)).y((d) => y(d.value));

  function onPointerMove(e: PointerEvent<SVGRectElement>) {
    const [mx] = d3.pointer(e, e.currentTarget);
    setIndex(bisectDate(data, x.invert(mx)));
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowRight") setIndex((i) => Math.min(data.length - 1, (i ?? -1) + 1));
    else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, (i ?? data.length) - 1));
    else if (e.key === "Escape") setIndex(null);
    else return;
    e.preventDefault();
  }

  const d = index !== null ? data[index] : null;
  const prev = index !== null && index > 0 ? data[index - 1] : null;
  const change = d && prev ? d.value - prev.value : 0;

  return (
    <div ref={ref} className="chart-wrapper">
      {dms.width > 0 && (
        <>
          <svg
            width={dms.width}
            height={dms.height}
            className="chart"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onBlur={() => setIndex(null)}
            role="img"
            aria-label="Daily value, use left and right arrow keys to inspect points"
            style={{ outline: "none" }}
          >
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              <Axis orientation="left" scale={y} gridSize={dms.innerWidth} />
              <Axis orientation="left" scale={y} />
              <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} />
              <path d={line(data)!} fill="none" stroke="#2f6fdf" strokeWidth={2} />

              {d && (
                <g pointerEvents="none">
                  <line x1={x(d.date)} x2={x(d.date)} y1={0} y2={dms.innerHeight} stroke="currentColor" strokeOpacity={0.35} />
                  <line x1={0} x2={dms.innerWidth} y1={y(d.value)} y2={y(d.value)} stroke="currentColor" strokeOpacity={0.15} />
                  <circle cx={x(d.date)} cy={y(d.value)} r={5} fill="#2f6fdf" stroke="var(--surface)" strokeWidth={2} />
                </g>
              )}

              {/* The event catcher goes LAST so it's on top of everything */}
              <rect width={dms.innerWidth} height={dms.innerHeight} fill="transparent" onPointerMove={onPointerMove} onPointerLeave={() => setIndex(null)} />
            </g>
          </svg>

          {d && (
            <Tooltip x={dms.margin.left + x(d.date)} y={dms.margin.top + y(d.value)} containerWidth={dms.width} containerHeight={dms.height}>
              <div className="muted">{fmtDate(d.date)}</div>
              <strong style={{ fontSize: 16 }}>{d.value.toFixed(2)}</strong>{" "}
              {prev && (
                <span style={{ color: change >= 0 ? "var(--ok)" : "var(--danger)" }}>
                  {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}
                </span>
              )}
            </Tooltip>
          )}
        </>
      )}
    </div>
  );
}
