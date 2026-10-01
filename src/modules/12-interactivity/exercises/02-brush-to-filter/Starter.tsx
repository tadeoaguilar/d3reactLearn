/**
 * Exercise 12.2: Brush to filter (linked views). See README.md.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../../shared/charts/Axis";
import { penguins, type Penguin, type Species } from "../../../../shared/data";

const SPECIES: Species[] = ["Adelie", "Chinstrap", "Gentoo"];
const color = d3.scaleOrdinal<Species, string>().domain(SPECIES).range(["#2f6fdf", "#e0803a", "#2c9a6a"]);
type Range = [number, number] | null;

function MassHistogram({ range, onRangeChange }: { range: Range; onRangeChange: (r: Range) => void }) {
  const [ref, dms] = useChartDimensions({ height: 180, margin: { top: 10, bottom: 30 } });
  // TODO 1: x scale (mass), bins (memoized), y scale
  // TODO 1 + 2: brush in a <g ref>, reporting grams through onRangeChange
  // TODO 6: sync the brush when range becomes null from code
  return (
    <div ref={ref}>
      {dms.width > 0 && (
        <svg width={dms.width} height={dms.height} className="chart">
          <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
            {/* TODO 3: bars (colored inside range, gray outside) */}
            <text x={dms.innerWidth / 2} y={dms.innerHeight / 2} textAnchor="middle">
              histogram + brush
            </text>
          </g>
        </svg>
      )}
    </div>
  );
}

function Scatter({ selected }: { selected: Set<number> | null }) {
  // TODO 4: flipper length vs bill length; unselected points in gray, drawn first
  return <div className="todo-hint">scatter ({selected ? selected.size : "all"} selected)</div>;
}

function Summary({ rows }: { rows: Penguin[] }) {
  // TODO 5: count + share by species
  return <div className="todo-hint">summary: {rows.length}</div>;
}

export default function BrushToFilter() {
  const [massRange, setMassRange] = useState<Range>(null);

  // TODO: derive selected rows and a Set of their ids
  const selectedRows = penguins;

  return (
    <div className="stack">
      <div className="row">
        {/* TODO 6: clear button */}
        <span className="muted">Drag across the histogram to select a body-mass range.</span>
      </div>
      <MassHistogram range={massRange} onRangeChange={setMassRange} />
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 400px" }}>
          <Scatter selected={null} />
        </div>
        <Summary rows={selectedRows} />
      </div>
    </div>
  );
}
