/**
 * Example 11.05: donut chart with hover, a center label, and "Other" grouping.
 */
import { useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { fruitSales, type CategoryValue } from "../../../shared/data";

const color = d3.scaleOrdinal<string, string>().range(d3.schemeTableau10);

/** Merge slices under `threshold` share into "Other". Too many tiny slices can't be read. */
function groupSmall(data: CategoryValue[], threshold: number): CategoryValue[] {
  const total = d3.sum(data, (d) => d.value);
  const big = data.filter((d) => d.value / total >= threshold);
  const small = data.filter((d) => d.value / total < threshold);
  return small.length > 1 ? [...big, { label: "Other", value: d3.sum(small, (d) => d.value) }] : data;
}

export default function DonutChart() {
  const [ref, dms] = useChartDimensions({ height: 340, margin: { top: 10, right: 10, bottom: 10, left: 10 } });
  const [hovered, setHovered] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.05);

  const data = groupSmall(fruitSales, threshold).toSorted((a, b) => b.value - a.value);
  const total = d3.sum(data, (d) => d.value);

  const radius = Math.min(dms.innerWidth, dms.innerHeight) / 2;
  const pie = d3.pie<CategoryValue>().value((d) => d.value).sort(null).padAngle(0.015);
  const arc = d3.arc<d3.PieArcDatum<CategoryValue>>().innerRadius(radius * 0.6).outerRadius(radius).cornerRadius(3);
  const arcHover = d3.arc<d3.PieArcDatum<CategoryValue>>().innerRadius(radius * 0.6).outerRadius(radius + 8).cornerRadius(3);
  const labelArc = d3.arc<d3.PieArcDatum<CategoryValue>>().innerRadius(radius * 0.8).outerRadius(radius * 0.8);
  const slices = pie(data);
  const active = slices.find((s) => s.data.label === hovered);
  const pct = d3.format(".0%");

  return (
    <div className="stack">
      <label className="row">
        group slices under {pct(threshold)} into "Other"
        <input type="range" min={0} max={0.15} step={0.01} value={threshold} onChange={(e) => setThreshold(e.target.valueAsNumber)} />
      </label>
      <div className="row" style={{ alignItems: "center" }}>
        <div ref={ref} style={{ flex: "1 1 300px", maxWidth: 420 }}>
          {dms.width > 0 && radius > 0 && (
            <svg width={dms.width} height={dms.height} role="img" aria-label="Fruit sales share" className="chart">
              <g transform={`translate(${dms.width / 2},${dms.height / 2})`} onMouseLeave={() => setHovered(null)}>
                {slices.map((s) => (
                  <path
                    key={s.data.label}
                    d={(s.data.label === hovered ? arcHover : arc)(s)!}
                    fill={color(s.data.label)}
                    opacity={hovered && s.data.label !== hovered ? 0.45 : 1}
                    onMouseEnter={() => setHovered(s.data.label)}
                    style={{ cursor: "pointer", transition: "opacity 200ms" }}
                  />
                ))}
                {slices.map((s) =>
                  s.endAngle - s.startAngle > 0.3 ? (
                    <text key={s.data.label} transform={`translate(${labelArc.centroid(s)})`} textAnchor="middle" dy="0.35em" pointerEvents="none" style={{ fill: "white", fontWeight: 600 }}>
                      {pct(s.data.value / total)}
                    </text>
                  ) : null,
                )}
                {/* Center label: the total, or the hovered slice */}
                <text textAnchor="middle" dy="-0.2em" style={{ fontSize: 26, fontWeight: 700 }}>
                  {active ? active.data.value : total}
                </text>
                <text textAnchor="middle" dy="1.4em" className="muted" style={{ fontSize: 13 }}>
                  {active ? active.data.label : "total units"}
                </text>
              </g>
            </svg>
          )}
        </div>
        {/* A legend that doubles as a table (more readable than the pie itself) */}
        <table style={{ fontSize: 14 }}>
          <tbody>
            {data.map((d) => (
              <tr
                key={d.label}
                onMouseEnter={() => setHovered(d.label)}
                onMouseLeave={() => setHovered(null)}
                style={{ fontWeight: d.label === hovered ? 700 : 400, cursor: "default" }}
              >
                <td>
                  <span className="swatch" style={{ background: color(d.label), display: "inline-block", width: 10, height: 10, borderRadius: 2 }} /> {d.label}
                </td>
                <td style={{ textAlign: "right", paddingLeft: 16 }}>{d.value}</td>
                <td style={{ textAlign: "right", paddingLeft: 12 }} className="muted">
                  {pct(d.value / total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
