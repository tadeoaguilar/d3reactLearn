/**
 * Exercise 12.1: reference solution.
 */
import { memo, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../../shared/charts/Axis";
import { Tooltip } from "../../../../shared/charts/Tooltip";
import { stockSeries, type TimePoint } from "../../../../shared/data";
import { palette } from "../../../../shared/theme";

const color = d3.scaleOrdinal<string, string>().domain(stockSeries.map((s) => s.name)).range(palette);
const dates = stockSeries[0].values.map((v) => v.date);
const bisect = d3.bisector<Date, Date>((d) => d).center;
const fmtDate = d3.timeFormat("%b %d, %Y");
const fmtShort = d3.timeFormat("%b %d");

interface LayerProps {
  x: d3.ScaleTime<number, number>;
  y: d3.ScaleLinear<number, number>;
  innerWidth: number;
  innerHeight: number;
}

/** Everything that does NOT depend on the hover. memo skips it on hover. */
const StaticLayer = memo(function StaticLayer({ x, y, innerWidth, innerHeight }: LayerProps) {
  const renders = useRef(0);
  renders.current++;
  const line = d3.line<TimePoint>().x((d) => x(d.date)).y((d) => y(d.value));
  return (
    <>
      <Axis orientation="left" scale={y} gridSize={innerWidth} />
      <Axis orientation="left" scale={y} />
      <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} />
      {stockSeries.map((s) => (
        <path key={s.name} d={line(s.values)!} fill="none" stroke={color(s.name)} strokeWidth={1.8} />
      ))}
      <text x={innerWidth} y={-6} textAnchor="end" className="muted" fontSize={10}>
        static layer renders: {renders.current}
      </text>
    </>
  );
});

export default function CrosshairTooltip() {
  const [ref, dms] = useChartDimensions({ height: 360 });
  const [index, setIndex] = useState<number | null>(null);

  const x = useMemo(() => d3.scaleTime().domain(d3.extent(dates) as [Date, Date]).range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => {
    const all = stockSeries.flatMap((s) => s.values.map((v) => v.value));
    return d3.scaleLinear().domain(d3.extent(all) as [number, number]).nice().range([dms.innerHeight, 0]);
  }, [dms.innerHeight]);

  function onPointerMove(e: PointerEvent<SVGRectElement>) {
    const [mx] = d3.pointer(e, e.currentTarget);
    setIndex(bisect(dates, x.invert(mx)));
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    const step = e.shiftKey ? 10 : 1;
    const clamp = (i: number) => Math.max(0, Math.min(dates.length - 1, i));
    if (e.key === "ArrowRight") setIndex((i) => clamp((i ?? -1) + step));
    else if (e.key === "ArrowLeft") setIndex((i) => clamp((i ?? dates.length) - step));
    else if (e.key === "Escape") setIndex(null);
    else return;
    e.preventDefault();
  }

  const date = index !== null ? dates[index] : null;
  const rows =
    index !== null
      ? stockSeries.map((s) => ({ name: s.name, value: s.values[index].value })).sort((a, b) => b.value - a.value)
      : [];
  const pillW = 64;
  const pillX = date ? Math.max(0, Math.min(dms.innerWidth - pillW, x(date) - pillW / 2)) : 0;

  return (
    <div ref={ref} className="chart-wrapper">
      {dms.width > 0 && (
        <svg
          width={dms.width}
          height={dms.height}
          className="chart"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onBlur={() => setIndex(null)}
          role="img"
          aria-label="Three stock prices. Use arrow keys to inspect days."
        >
          <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
            <StaticLayer x={x} y={y} innerWidth={dms.innerWidth} innerHeight={dms.innerHeight} />

            {date && (
              <g pointerEvents="none">
                <line x1={x(date)} x2={x(date)} y1={0} y2={dms.innerHeight} stroke="currentColor" strokeOpacity={0.4} />
                {rows.map((r) => (
                  <circle key={r.name} cx={x(date)} cy={y(r.value)} r={4.5} fill={color(r.name)} stroke="var(--surface)" strokeWidth={2} />
                ))}
                <g transform={`translate(${pillX},${dms.innerHeight + 4})`}>
                  <rect width={pillW} height={18} rx={9} fill="currentColor" />
                  <text x={pillW / 2} y={13} textAnchor="middle" style={{ fill: "var(--surface)", fontWeight: 600 }}>
                    {fmtShort(date)}
                  </text>
                </g>
              </g>
            )}

            <rect width={dms.innerWidth} height={dms.innerHeight} fill="transparent" onPointerMove={onPointerMove} onPointerLeave={() => setIndex(null)} />
          </g>
        </svg>
      )}
      {date && (
        <Tooltip x={dms.margin.left + x(date)} y={dms.margin.top + 10} containerWidth={dms.width}>
          <div className="muted" style={{ marginBottom: 4 }}>
            {fmtDate(date)}
          </div>
          {rows.map((r) => (
            <div key={r.name} className="row" style={{ gap: 6 }}>
              <span className="swatch" style={{ background: color(r.name) }} />
              <span style={{ width: 60 }}>{r.name}</span>
              <strong>${r.value.toFixed(2)}</strong>
            </div>
          ))}
        </Tooltip>
      )}
    </div>
  );
}
