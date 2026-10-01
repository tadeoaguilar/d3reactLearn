/**
 * Exercise 10.1: reference solution. React owns the marks, D3 draws the
 * axes (hybrid), and the chart is responsive.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { penguins, type Penguin, type Species } from "../../../../shared/data";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../../shared/charts/Axis";
import { Tooltip } from "../../../../shared/charts/Tooltip";

const SPECIES: Species[] = ["Adelie", "Chinstrap", "Gentoo"];
const color = d3.scaleOrdinal<Species, string>().domain(SPECIES).range(["#2f6fdf", "#e0803a", "#2c9a6a"]);

// The domains use ALL the data, so they never change. Compute them once.
const xDomain = d3.extent(penguins, (d) => d.billLength) as [number, number];
const yDomain = d3.extent(penguins, (d) => d.billDepth) as [number, number];
const rScale = d3
  .scaleSqrt()
  .domain(d3.extent(penguins, (d) => d.bodyMass) as [number, number])
  .range([2, 9]);

export default function RefactorToReact() {
  const [ref, dms] = useChartDimensions({ aspectRatio: 3 / 2, margin: { top: 20, right: 20, bottom: 50, left: 56 } });
  const [hovered, setHovered] = useState<Penguin | null>(null);
  const [hidden, setHidden] = useState<Set<Species>>(() => new Set());

  // Only the ranges depend on size, so hovering never rebuilds these.
  const x = useMemo(() => d3.scaleLinear().domain(xDomain).nice().range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain(yDomain).nice().range([dms.innerHeight, 0]), [dms.innerHeight]);

  const visible = penguins.filter((p) => !hidden.has(p.species));

  function toggle(s: Species) {
    setHidden((prev) => {
      const next = new Set(prev); // new Set → new reference → React re-renders
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
    setHovered(null);
  }

  return (
    <div className="stack">
      <div className="legend">
        {SPECIES.map((s) => (
          <button key={s} onClick={() => toggle(s)} style={{ opacity: hidden.has(s) ? 0.4 : 1 }}>
            <span className="swatch" style={{ background: color(s) }} /> {s}
          </button>
        ))}
      </div>

      <div ref={ref} className="chart-wrapper">
        {dms.width > 0 && (
          <>
            <svg width={dms.width} height={dms.height} className="chart" onMouseLeave={() => setHovered(null)}>
              <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
                <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} />
                <Axis orientation="left" scale={y} />
                <text x={dms.innerWidth} y={dms.innerHeight + 40} textAnchor="end">
                  Bill length (mm)
                </text>
                <text x={-dms.margin.left + 8} y={-6}>
                  Bill depth (mm)
                </text>

                {visible.map((d) => (
                  <circle
                    key={d.id}
                    cx={x(d.billLength)}
                    cy={y(d.billDepth)}
                    r={rScale(d.bodyMass)}
                    fill={color(d.species)}
                    fillOpacity={0.7}
                    onMouseEnter={() => setHovered(d)}
                  />
                ))}

                {/* The hovered point, drawn last so it's on top */}
                {hovered && (
                  <circle
                    cx={x(hovered.billLength)}
                    cy={y(hovered.billDepth)}
                    r={rScale(hovered.bodyMass) * 1.6}
                    fill={color(hovered.species)}
                    stroke="currentColor"
                    pointerEvents="none"
                  />
                )}
              </g>
            </svg>

            {hovered && (
              <Tooltip
                x={dms.margin.left + x(hovered.billLength)}
                y={dms.margin.top + y(hovered.billDepth)}
                containerWidth={dms.width}
                containerHeight={dms.height}
              >
                <strong>{hovered.species}</strong>
                <br />
                bill {hovered.billLength} × {hovered.billDepth} mm
                <br />
                {hovered.bodyMass.toLocaleString()} g
              </Tooltip>
            )}
          </>
        )}
      </div>
    </div>
  );
}
