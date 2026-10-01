/**
 * Exercise 12.2: reference solution.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../../shared/charts/Axis";
import { penguins, type Penguin, type Species } from "../../../../shared/data";

const SPECIES: Species[] = ["Adelie", "Chinstrap", "Gentoo"];
const color = d3.scaleOrdinal<Species, string>().domain(SPECIES).range(["#2f6fdf", "#e0803a", "#2c9a6a"]);
type Range = [number, number] | null;
const massFormat = d3.format("~s");
const massExtent = d3.extent(penguins, (p) => p.bodyMass) as [number, number];

function MassHistogram({ range, onRangeChange }: { range: Range; onRangeChange: (r: Range) => void }) {
  const [ref, dms] = useChartDimensions({ height: 180, margin: { top: 10, bottom: 30 } });
  const brushG = useRef<SVGGElement>(null);
  const brushRef = useRef<d3.BrushBehavior<unknown> | null>(null);

  const x = useMemo(() => d3.scaleLinear().domain(massExtent).nice().range([0, dms.innerWidth]), [dms.innerWidth]);
  const bins = useMemo(
    () =>
      d3
        .bin<Penguin, number>()
        .value((p) => p.bodyMass)
        .domain(x.domain() as [number, number])
        .thresholds(x.ticks(30))(penguins),
    [x],
  );
  const y = useMemo(() => d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length) ?? 1]).nice().range([dms.innerHeight, 0]), [bins, dms.innerHeight]);

  // Brush setup: only re-created on resize (x changes), not during a drag.
  useEffect(() => {
    if (!brushG.current || dms.innerWidth === 0) return;
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [dms.innerWidth, dms.innerHeight],
      ])
      .on("brush end", (event: d3.D3BrushEvent<unknown>) => {
        if (!event.sourceEvent) return;
        const sel = event.selection as [number, number] | null;
        onRangeChange(sel ? [x.invert(sel[0]), x.invert(sel[1])] : null);
      });
    brushRef.current = brush;
    const g = d3.select(brushG.current).call(brush);
    return () => {
      g.on(".brush", null);
    };
  }, [x, dms.innerWidth, dms.innerHeight, onRangeChange]);

  // Clearing from code: move the brush away when the range is reset to null.
  useEffect(() => {
    if (range === null && brushG.current && brushRef.current && d3.brushSelection(brushG.current)) {
      d3.select(brushG.current).call(brushRef.current.move, null);
    }
  }, [range]);

  const inRange = (b: d3.Bin<Penguin, number>) => range === null || (b.x1! > range[0] && b.x0! < range[1]);

  return (
    <div ref={ref}>
      {dms.width > 0 && (
        <svg width={dms.width} height={dms.height} className="chart">
          <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
            {bins.map((b, i) => (
              <rect
                key={i}
                x={x(b.x0!) + 1}
                width={Math.max(0, x(b.x1!) - x(b.x0!) - 2)}
                y={y(b.length)}
                height={dms.innerHeight - y(b.length)}
                fill={inRange(b) ? "#7b5cd6" : "var(--chart-grid)"}
              />
            ))}
            <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} tickFormat={massFormat} duration={0} />
            <Axis orientation="left" scale={y} ticks={3} duration={0} />
            <g ref={brushG} />
          </g>
        </svg>
      )}
    </div>
  );
}

function Scatter({ selected }: { selected: Set<number> | null }) {
  const [ref, dms] = useChartDimensions({ height: 300 });
  const x = useMemo(() => d3.scaleLinear().domain(d3.extent(penguins, (p) => p.flipperLength) as [number, number]).nice().range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain(d3.extent(penguins, (p) => p.billLength) as [number, number]).nice().range([dms.innerHeight, 0]), [dms.innerHeight]);

  const isSel = (p: Penguin) => selected === null || selected.has(p.id);
  const off = penguins.filter((p) => !isSel(p));
  const on = penguins.filter(isSel);

  return (
    <div ref={ref}>
      {dms.width > 0 && (
        <svg width={dms.width} height={dms.height} className="chart">
          <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
            <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} duration={0} />
            <Axis orientation="left" scale={y} duration={0} />
            <text x={dms.innerWidth} y={dms.innerHeight - 6} textAnchor="end" className="muted" fontSize={10}>
              flipper length (mm) →
            </text>
            <text x={6} y={4} className="muted" fontSize={10}>
              ↑ bill length (mm)
            </text>
            {/* Unselected first, so the selected points paint on top */}
            {off.map((p) => (
              <circle key={p.id} cx={x(p.flipperLength)} cy={y(p.billLength)} r={3} fill="var(--chart-grid)" />
            ))}
            {on.map((p) => (
              <circle key={p.id} cx={x(p.flipperLength)} cy={y(p.billLength)} r={3.5} fill={color(p.species)} fillOpacity={0.8} />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}

function Summary({ rows }: { rows: Penguin[] }) {
  const counts = d3.rollup(rows, (v) => v.length, (p) => p.species);
  return (
    <div className="card stack" style={{ minWidth: 200 }}>
      <div>
        <strong style={{ fontSize: 24 }}>{rows.length}</strong> <span className="muted">of {penguins.length} penguins</span>
      </div>
      {SPECIES.map((s) => {
        const n = counts.get(s) ?? 0;
        const share = rows.length ? n / rows.length : 0;
        return (
          <div key={s}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>{s}</span>
              <span className="muted">
                {n} ({d3.format(".0%")(share)})
              </span>
            </div>
            <svg width={180} height={8}>
              <rect width={180} height={8} rx={4} fill="var(--surface-2)" />
              <rect width={180 * share} height={8} rx={4} fill={color(s)} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

export default function BrushToFilter() {
  const [massRange, setMassRange] = useState<Range>(null);

  const selectedRows = useMemo(
    () => (massRange ? penguins.filter((p) => p.bodyMass >= massRange[0] && p.bodyMass <= massRange[1]) : penguins),
    [massRange],
  );
  const selectedIds = useMemo(() => (massRange ? new Set(selectedRows.map((p) => p.id)) : null), [massRange, selectedRows]);

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => setMassRange(null)} disabled={!massRange}>
          Clear selection
        </button>
        <span className="muted">
          {massRange ? `${Math.round(massRange[0])} g – ${Math.round(massRange[1])} g` : "Drag across the histogram to select a body-mass range."}
        </span>
      </div>
      <MassHistogram range={massRange} onRangeChange={setMassRange} />
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 400px" }}>
          <Scatter selected={selectedIds} />
        </div>
        <Summary rows={selectedRows} />
      </div>
    </div>
  );
}
