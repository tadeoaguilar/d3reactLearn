/**
 * Example 12.02: nearest-point hover in 2D with d3.Delaunay.
 *
 * Tiny circles are hard to hit. Delaunay.find() returns the closest point
 * to the pointer in O(log n). Toggle "show Voronoi cells" to see the
 * invisible hover regions: each cell is the area closest to one point.
 */
import { useMemo, useState, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { Tooltip } from "../../../shared/charts/Tooltip";
import { penguins, type Species } from "../../../shared/data";

const color = d3.scaleOrdinal<Species, string>().domain(["Adelie", "Chinstrap", "Gentoo"]).range(["#2f6fdf", "#e0803a", "#2c9a6a"]);
const MAX_DISTANCE = 40; // px: farther than this counts as "no point"
const massFormat = d3.format("~s"); // module-level: a stable reference for <Axis>

export default function VoronoiHover() {
  const [ref, dms] = useChartDimensions({ aspectRatio: 1.7 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [showCells, setShowCells] = useState(true);

  const x = useMemo(() => d3.scaleLinear().domain(d3.extent(penguins, (d) => d.flipperLength) as [number, number]).nice().range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain(d3.extent(penguins, (d) => d.bodyMass) as [number, number]).nice().range([dms.innerHeight, 0]), [dms.innerHeight]);

  // Rebuild the triangulation only when the scales change (i.e. on resize).
  const delaunay = useMemo(() => d3.Delaunay.from(penguins, (d) => x(d.flipperLength), (d) => y(d.bodyMass)), [x, y]);
  const voronoi = useMemo(() => delaunay.voronoi([0, 0, dms.innerWidth, dms.innerHeight]), [delaunay, dms.innerWidth, dms.innerHeight]);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const [mx, my] = d3.pointer(e, e.currentTarget);
    const i = delaunay.find(mx, my);
    const p = penguins[i];
    const dist = Math.hypot(x(p.flipperLength) - mx, y(p.bodyMass) - my);
    setHovered(dist < MAX_DISTANCE ? i : null);
  }

  const h = hovered !== null ? penguins[hovered] : null;

  return (
    <div className="stack">
      <label>
        <input type="checkbox" checked={showCells} onChange={(e) => setShowCells(e.target.checked)} /> show Voronoi cells
      </label>
      <div ref={ref} className="chart-wrapper">
        {dms.width > 0 && (
          <>
            <svg width={dms.width} height={dms.height} className="chart">
              <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
                <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} />
                <Axis orientation="left" scale={y} tickFormat={massFormat} />
                {showCells && <path d={voronoi.render()} fill="none" stroke="currentColor" strokeOpacity={0.12} />}
                {showCells && hovered !== null && <path d={voronoi.renderCell(hovered)} fill="#e0803a" fillOpacity={0.12} />}
                {penguins.map((d, i) => (
                  <circle key={d.id} cx={x(d.flipperLength)} cy={y(d.bodyMass)} r={i === hovered ? 6 : 2.5} fill={color(d.species)} />
                ))}
                <rect width={dms.innerWidth} height={dms.innerHeight} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHovered(null)} />
              </g>
            </svg>
            {h && (
              <Tooltip x={dms.margin.left + x(h.flipperLength)} y={dms.margin.top + y(h.bodyMass)} containerWidth={dms.width} containerHeight={dms.height}>
                <strong style={{ color: color(h.species) }}>{h.species}</strong>
                <br />
                flipper {h.flipperLength} mm · {h.bodyMass} g
              </Tooltip>
            )}
          </>
        )}
      </div>
    </div>
  );
}
