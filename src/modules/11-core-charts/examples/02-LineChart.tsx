/**
 * Example 11.02: a time-series line chart with an area, a moving average,
 * missing data, and an annotation.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../shared/charts/ChartFrame";
import { Axis } from "../../../shared/charts/Axis";
import { randomWalk } from "../../../shared/data";

interface Point {
  date: Date;
  value: number | null; // null = missing measurement
}

// A year of data with a 10-day gap to show .defined()
const raw: Point[] = randomWalk(365, 4).map((d, i) => ({ date: d.date, value: i >= 150 && i < 160 ? null : d.value }));

function movingAverage(data: Point[], window: number): Point[] {
  return data.map((d, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1).filter((p) => p.value !== null);
    return { date: d.date, value: slice.length ? d3.mean(slice, (p) => p.value!)! : null };
  });
}

function Lines({ innerWidth, innerHeight, showArea, maWindow }: { innerWidth: number; innerHeight: number; showArea: boolean; maWindow: number }) {
  const x = useMemo(() => d3.scaleTime().domain(d3.extent(raw, (d) => d.date) as [Date, Date]).range([0, innerWidth]), [innerWidth]);
  const y = useMemo(
    () => d3.scaleLinear().domain(d3.extent(raw, (d) => d.value) as [number, number]).nice().range([innerHeight, 0]),
    [innerHeight],
  );
  const ma = useMemo(() => movingAverage(raw, maWindow), [maWindow]);

  const line = d3
    .line<Point>()
    .defined((d) => d.value !== null) // gaps instead of a fake straight line
    .x((d) => x(d.date))
    .y((d) => y(d.value!));
  const area = d3
    .area<Point>()
    .defined((d) => d.value !== null)
    .x((d) => x(d.date))
    .y0(innerHeight)
    .y1((d) => y(d.value!));

  // Annotation: the all-time high
  const peak = d3.greatest(raw, (d) => d.value ?? -Infinity)!;

  return (
    <>
      <Axis orientation="left" scale={y} gridSize={innerWidth} ticks={6} />
      <Axis orientation="left" scale={y} ticks={6} />
      <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} ticks={Math.max(2, Math.floor(innerWidth / 90))} />
      {showArea && <path d={area(raw)!} fill="#2f6fdf" fillOpacity={0.1} />}
      <path d={line(raw)!} fill="none" stroke="#2f6fdf" strokeOpacity={0.6} strokeWidth={1.2} />
      {maWindow > 1 && <path d={line(ma)!} fill="none" stroke="#e0803a" strokeWidth={2.5} />}

      {/* The gap annotation */}
      <text x={x(raw[155].date)} y={20} textAnchor="middle" className="muted" fontSize={10}>
        missing data
      </text>

      <g transform={`translate(${x(peak.date)},${y(peak.value!)})`}>
        <circle r={4} fill="none" stroke="currentColor" />
        <line y1={-6} y2={-26} stroke="currentColor" />
        <text y={-30} textAnchor="middle" fontSize={11}>
          peak {peak.value?.toFixed(1)} on {d3.timeFormat("%b %d")(peak.date)}
        </text>
      </g>
    </>
  );
}

export default function LineChart() {
  const [showArea, setShowArea] = useState(true);
  const [maWindow, setMaWindow] = useState(14);
  return (
    <div className="stack">
      <div className="row">
        <label>
          <input type="checkbox" checked={showArea} onChange={(e) => setShowArea(e.target.checked)} /> area
        </label>
        <label>
          moving average: {maWindow === 1 ? "off" : `${maWindow} days`}{" "}
          <input type="range" min={1} max={60} value={maWindow} onChange={(e) => setMaWindow(e.target.valueAsNumber)} />
        </label>
      </div>
      <ChartFrame height={340} margin={{ top: 40 }} svgProps={{ role: "img", "aria-label": "Daily value over one year" }}>
        {(d) => <Lines innerWidth={d.innerWidth} innerHeight={d.innerHeight} showArea={showArea} maWindow={maWindow} />}
      </ChartFrame>
    </div>
  );
}
