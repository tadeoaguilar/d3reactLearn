/**
 * Example 11.04: scatter/bubble plot with a selectable x and y, bubbles
 * sized by a third variable, and a linear regression line.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../shared/charts/ChartFrame";
import { Axis } from "../../../shared/charts/Axis";
import { penguins, type Penguin, type Species } from "../../../shared/data";

type NumericKey = "billLength" | "billDepth" | "flipperLength" | "bodyMass";
const LABELS: Record<NumericKey, string> = {
  billLength: "Bill length (mm)",
  billDepth: "Bill depth (mm)",
  flipperLength: "Flipper length (mm)",
  bodyMass: "Body mass (g)",
};
const SPECIES: Species[] = ["Adelie", "Chinstrap", "Gentoo"];
const color = d3.scaleOrdinal<Species, string>().domain(SPECIES).range(["#2f6fdf", "#e0803a", "#2c9a6a"]);

/** Least-squares fit y = a + b·x */
function linearRegression(points: [number, number][]) {
  const mx = d3.mean(points, (p) => p[0])!;
  const my = d3.mean(points, (p) => p[1])!;
  const b = d3.sum(points, (p) => (p[0] - mx) * (p[1] - my)) / d3.sum(points, (p) => (p[0] - mx) ** 2);
  return { a: my - b * mx, b };
}

function Plot({ xKey, yKey, sized, innerWidth, innerHeight }: { xKey: NumericKey; yKey: NumericKey; sized: boolean; innerWidth: number; innerHeight: number }) {
  const x = useMemo(
    () => d3.scaleLinear().domain(d3.extent(penguins, (d) => d[xKey]) as [number, number]).nice().range([0, innerWidth]),
    [xKey, innerWidth],
  );
  const y = useMemo(
    () => d3.scaleLinear().domain(d3.extent(penguins, (d) => d[yKey]) as [number, number]).nice().range([innerHeight, 0]),
    [yKey, innerHeight],
  );
  // AREA proportional to mass → scaleSqrt for the radius
  const r = d3.scaleSqrt().domain([0, d3.max(penguins, (d) => d.bodyMass)!]).range([0, 9]);

  const fits = SPECIES.map((s) => {
    const pts = penguins.filter((p) => p.species === s).map((p) => [p[xKey], p[yKey]] as [number, number]);
    const { a, b } = linearRegression(pts);
    const [x0, x1] = d3.extent(pts, (p) => p[0]) as [number, number];
    return { species: s, x0, x1, y0: a + b * x0, y1: a + b * x1 };
  });

  return (
    <>
      <Axis orientation="left" scale={y} gridSize={innerWidth} />
      <Axis orientation="bottom" scale={x} gridSize={innerHeight} transform={`translate(0,${innerHeight})`} />
      <Axis orientation="left" scale={y} />
      <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} />
      <text x={innerWidth} y={innerHeight + 36} textAnchor="end">
        {LABELS[xKey]} →
      </text>
      <text x={-40} y={-8}>
        ↑ {LABELS[yKey]}
      </text>

      {penguins.map((d: Penguin) => (
        <circle
          key={d.id}
          cx={x(d[xKey])}
          cy={y(d[yKey])}
          r={sized ? r(d.bodyMass) : 3.5}
          fill={color(d.species)}
          fillOpacity={0.55}
          stroke={color(d.species)}
          style={{ transition: "cx 600ms, cy 600ms, r 600ms" }}
        >
          <title>{`${d.species}: ${LABELS[xKey]} ${d[xKey]}, ${LABELS[yKey]} ${d[yKey]}`}</title>
        </circle>
      ))}

      {fits.map((f) => (
        <line key={f.species} x1={x(f.x0)} x2={x(f.x1)} y1={y(f.y0)} y2={y(f.y1)} stroke={color(f.species)} strokeWidth={2.5} strokeDasharray="6 3" />
      ))}
    </>
  );
}

export default function ScatterPlot() {
  const [xKey, setXKey] = useState<NumericKey>("billLength");
  const [yKey, setYKey] = useState<NumericKey>("billDepth");
  const [sized, setSized] = useState(true);

  const select = (value: NumericKey, set: (k: NumericKey) => void) => (
    <select value={value} onChange={(e) => set(e.target.value as NumericKey)}>
      {(Object.keys(LABELS) as NumericKey[]).map((k) => (
        <option key={k} value={k}>
          {LABELS[k]}
        </option>
      ))}
    </select>
  );

  return (
    <div className="stack">
      <div className="row">
        x {select(xKey, setXKey)} y {select(yKey, setYKey)}
        <label>
          <input type="checkbox" checked={sized} onChange={(e) => setSized(e.target.checked)} /> size by body mass
        </label>
        <div className="legend">
          {SPECIES.map((s) => (
            <span key={s} className="row" style={{ gap: 4 }}>
              <span className="swatch" style={{ background: color(s) }} /> {s}
            </span>
          ))}
        </div>
      </div>
      <ChartFrame aspectRatio={1.6} margin={{ top: 28, bottom: 48 }} svgProps={{ role: "img", "aria-label": "Penguin measurements scatter plot" }}>
        {(d) => <Plot xKey={xKey} yKey={yKey} sized={sized} innerWidth={d.innerWidth} innerHeight={d.innerHeight} />}
      </ChartFrame>
      <p className="muted">
        Try flipper length vs body mass. Also look at bill length vs bill depth: overall the trend is negative, but
        within each species it's positive. That's Simpson's paradox.
      </p>
    </div>
  );
}
