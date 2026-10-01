/**
 * Example 12.04: "focus + context" with d3.brushX.
 *
 * The small context chart has a brush. Its selection, stored in React
 * state in DATA units (dates), becomes the domain of the large focus chart.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { randomWalk, type TimePoint } from "../../../shared/data";

const data = randomWalk(730, 12);
const fullDomain = d3.extent(data, (d) => d.date) as [Date, Date];
const yDomain = d3.extent(data, (d) => d.value) as [number, number];
const CONTEXT_H = 70;
const fmt = d3.timeFormat("%b %d, %Y");

function Brush({ x, width, height, range, onChange }: { x: d3.ScaleTime<number, number>; width: number; height: number; range: [Date, Date] | null; onChange: (r: [Date, Date] | null) => void }) {
  const ref = useRef<SVGGElement>(null);
  const brushRef = useRef<d3.BrushBehavior<unknown> | null>(null);

  // Create the brush (again only when the size or scale changes).
  useEffect(() => {
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("brush end", (event: d3.D3BrushEvent<unknown>) => {
        if (!event.sourceEvent) return; // ignore moves we made from code (below)
        const sel = event.selection as [number, number] | null;
        onChange(sel ? [x.invert(sel[0]), x.invert(sel[1])] : null);
      });
    brushRef.current = brush;
    const g = d3.select(ref.current!).call(brush);
    return () => {
      g.on(".brush", null);
    };
  }, [x, width, height, onChange]); // onChange is a state setter, so it never changes

  // Keep the brush in sync with state (e.g. after a resize or a preset button).
  useEffect(() => {
    if (!brushRef.current || !ref.current) return;
    const target: [number, number] | null = range ? [x(range[0]), x(range[1])] : null;
    // Skip if the brush is already there (e.g. the change came from the
    // user dragging it). Moving it mid-gesture would fight the drag.
    const current = d3.brushSelection(ref.current) as [number, number] | null;
    const same = current && target ? Math.abs(current[0] - target[0]) < 1 && Math.abs(current[1] - target[1]) < 1 : current === target;
    if (!same) d3.select(ref.current).call(brushRef.current.move, target);
  }, [range, x]);

  return <g ref={ref} />;
}

export default function BrushFocusContext() {
  const [ref, dms] = useChartDimensions({ height: 380, margin: { top: 10, bottom: 30 } });
  const [range, setRange] = useState<[Date, Date] | null>([new Date(2025, 3, 1), new Date(2025, 8, 1)]);

  const focusH = dms.innerHeight - CONTEXT_H - 40;

  const xContext = useMemo(() => d3.scaleTime().domain(fullDomain).range([0, dms.innerWidth]), [dms.innerWidth]);
  const yContext = useMemo(() => d3.scaleLinear().domain(yDomain).range([CONTEXT_H, 0]), []);

  const focusDomain = range ?? fullDomain;
  const xFocus = useMemo(() => d3.scaleTime().domain(focusDomain).range([0, dms.innerWidth]), [focusDomain, dms.innerWidth]);
  const visible = data.filter((d) => d.date >= focusDomain[0] && d.date <= focusDomain[1]);
  const yFocus = useMemo(
    () => d3.scaleLinear().domain(d3.extent(visible, (d) => d.value) as [number, number]).nice().range([focusH, 0]),
    // `visible` is derived from focusDomain, so focusDomain covers it.
    [focusDomain, focusH],
  );

  const focusLine = d3.line<TimePoint>().x((d) => xFocus(d.date)).y((d) => yFocus(d.value));
  const contextArea = d3.area<TimePoint>().x((d) => xContext(d.date)).y0(CONTEXT_H).y1((d) => yContext(d.value));

  const presets: [string, [Date, Date] | null][] = [
    ["Q1 2025", [new Date(2025, 0, 1), new Date(2025, 3, 1)]],
    ["2025 H2", [new Date(2025, 6, 1), new Date(2026, 0, 1)]],
    ["All", null],
  ];

  return (
    <div className="stack">
      <div className="row">
        {presets.map(([label, r]) => (
          <button key={label} className="btn" onClick={() => setRange(r)}>
            {label}
          </button>
        ))}
        <span className="muted">
          {range ? `${fmt(range[0])} → ${fmt(range[1])}` : "Full range"} · {visible.length} points · drag on the bottom chart
        </span>
      </div>
      <div ref={ref}>
        {dms.width > 0 && focusH > 0 && (
          <svg width={dms.width} height={dms.height} className="chart">
            <defs>
              <clipPath id="focus-clip">
                <rect width={dms.innerWidth} height={focusH} />
              </clipPath>
            </defs>
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              {/* FOCUS */}
              <Axis orientation="left" scale={yFocus} gridSize={dms.innerWidth} duration={0} />
              <Axis orientation="left" scale={yFocus} duration={0} />
              <Axis orientation="bottom" scale={xFocus} transform={`translate(0,${focusH})`} duration={0} />
              <path d={focusLine(data)!} fill="none" stroke="#2f6fdf" strokeWidth={1.8} clipPath="url(#focus-clip)" />

              {/* CONTEXT */}
              <g transform={`translate(0,${focusH + 40})`}>
                <path d={contextArea(data)!} fill="#2f6fdf" fillOpacity={0.2} />
                <Axis orientation="bottom" scale={xContext} transform={`translate(0,${CONTEXT_H})`} duration={0} />
                <Brush x={xContext} width={dms.innerWidth} height={CONTEXT_H} range={range} onChange={setRange} />
              </g>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
