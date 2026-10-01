/**
 * Example 09.04: shape generators: line, area, arc and pie.
 *
 * They return SVG path strings, so React renders them directly with
 * <path d={…} />. No refs or effects needed.
 */
import { useState } from "react";
import * as d3 from "d3";
import { fruitSales, randomWalk, type CategoryValue, type TimePoint } from "../../../shared/data";

const curves = {
  curveLinear: d3.curveLinear,
  curveMonotoneX: d3.curveMonotoneX,
  curveBasis: d3.curveBasis,
  curveStep: d3.curveStep,
  curveCardinal: d3.curveCardinal,
  curveNatural: d3.curveNatural,
} as const;

const points = randomWalk(24, 8);
const W = 520;
const H = 200;

export default function ShapeGenerators() {
  const [curveName, setCurveName] = useState<keyof typeof curves>("curveMonotoneX");
  const [innerRadius, setInnerRadius] = useState(50);
  const [padAngle, setPadAngle] = useState(0.02);

  // ---- line + area -------------------------------------------------------
  const x = d3.scaleTime().domain(d3.extent(points, (d) => d.date) as [Date, Date]).range([0, W]);
  const y = d3.scaleLinear().domain(d3.extent(points, (d) => d.value) as [number, number]).nice().range([H, 0]);

  const line = d3.line<TimePoint>().x((d) => x(d.date)).y((d) => y(d.value)).curve(curves[curveName]);
  const area = d3.area<TimePoint>().x((d) => x(d.date)).y0(H).y1((d) => y(d.value)).curve(curves[curveName]);

  // ---- pie + arc ---------------------------------------------------------
  const pie = d3.pie<CategoryValue>().value((d) => d.value).sort(null).padAngle(padAngle);
  const arc = d3.arc<d3.PieArcDatum<CategoryValue>>().innerRadius(innerRadius).outerRadius(110).cornerRadius(4);
  const labelArc = d3.arc<d3.PieArcDatum<CategoryValue>>().innerRadius(125).outerRadius(125);
  const color = d3.scaleOrdinal<string, string>().domain(fruitSales.map((d) => d.label)).range(d3.schemeTableau10);
  const slices = pie(fruitSales);

  return (
    <div className="stack">
      <h4>d3.line() + d3.area()</h4>
      <div className="row">
        {(Object.keys(curves) as (keyof typeof curves)[]).map((c) => (
          <button key={c} className={`btn ${c === curveName ? "primary" : ""}`} onClick={() => setCurveName(c)}>
            {c}
          </button>
        ))}
      </div>
      <svg width={W} height={H} className="chart">
        <path d={area(points)!} fill="#2f6fdf" fillOpacity={0.15} />
        <path d={line(points)!} fill="none" stroke="#2f6fdf" strokeWidth={2.5} />
        {points.map((d) => (
          <circle key={+d.date} cx={x(d.date)} cy={y(d.value)} r={3} fill="#e0803a" />
        ))}
      </svg>
      <details>
        <summary className="muted">What does the path string look like?</summary>
        <pre className="log">{line(points)}</pre>
      </details>

      <h4>d3.pie() + d3.arc()</h4>
      <div className="row">
        <label>
          innerRadius {innerRadius}{" "}
          <input type="range" min={0} max={100} value={innerRadius} onChange={(e) => setInnerRadius(e.target.valueAsNumber)} />
        </label>
        <label>
          padAngle {padAngle}{" "}
          <input type="range" min={0} max={0.1} step={0.005} value={padAngle} onChange={(e) => setPadAngle(e.target.valueAsNumber)} />
        </label>
      </div>
      <svg width={360} height={300} className="chart">
        <g transform="translate(180,150)">
          {slices.map((s) => (
            <g key={s.data.label}>
              <path d={arc(s)!} fill={color(s.data.label)} />
              <text transform={`translate(${labelArc.centroid(s)})`} textAnchor="middle" dy="0.35em" fontSize={10}>
                {s.data.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
