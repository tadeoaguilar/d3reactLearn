/**
 * Example 11.06: histogram with adjustable bins, per-species overlay and
 * summary markers.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../shared/charts/ChartFrame";
import { Axis } from "../../../shared/charts/Axis";
import { penguins, type Species } from "../../../shared/data";

const SPECIES: Species[] = ["Adelie", "Chinstrap", "Gentoo"];
const color = d3.scaleOrdinal<Species, string>().domain(SPECIES).range(["#2f6fdf", "#e0803a", "#2c9a6a"]);
const masses = penguins.map((p) => p.bodyMass);

function Hist({ binCount, bySpecies, innerWidth, innerHeight }: { binCount: number; bySpecies: boolean; innerWidth: number; innerHeight: number }) {
  const x = useMemo(() => d3.scaleLinear().domain(d3.extent(masses) as [number, number]).nice().range([0, innerWidth]), [innerWidth]);

  // Binning is the expensive part, so memoize it on its inputs.
  const { all, groups } = useMemo(() => {
    const bin = d3
      .bin<(typeof penguins)[number], number>()
      .value((p) => p.bodyMass)
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(binCount));
    return {
      all: bin(penguins),
      groups: SPECIES.map((s) => ({ species: s, bins: bin(penguins.filter((p) => p.species === s)) })),
    };
  }, [x, binCount]);

  const maxCount = d3.max(all, (b) => b.length) ?? 1;
  const y = d3.scaleLinear().domain([0, maxCount]).nice().range([innerHeight, 0]);

  const mean = d3.mean(masses)!;
  const median = d3.median(masses)!;

  return (
    <>
      <Axis orientation="left" scale={y} gridSize={innerWidth} ticks={5} />
      {bySpecies
        ? groups.map((g) =>
            g.bins.map((b, i) => (
              <rect
                key={`${g.species}-${i}`}
                x={x(b.x0!) + 1}
                width={Math.max(0, x(b.x1!) - x(b.x0!) - 2)}
                y={y(b.length)}
                height={innerHeight - y(b.length)}
                fill={color(g.species)}
                fillOpacity={0.5}
              />
            )),
          )
        : all.map((b, i) => (
            <rect key={i} x={x(b.x0!) + 1} width={Math.max(0, x(b.x1!) - x(b.x0!) - 2)} y={y(b.length)} height={innerHeight - y(b.length)} fill="#7b5cd6">
              <title>{`${b.x0}–${b.x1} g: ${b.length} penguins`}</title>
            </rect>
          ))}

      {[
        { label: "mean", v: mean, dash: "" },
        { label: "median", v: median, dash: "4 3" },
      ].map((m, i) => (
        <g key={m.label} transform={`translate(${x(m.v)},0)`}>
          <line y2={innerHeight} stroke="currentColor" strokeDasharray={m.dash} />
          <text y={-6 - i * 12} textAnchor="middle" fontSize={10}>
            {m.label} {Math.round(m.v)}g
          </text>
        </g>
      ))}

      <Axis orientation="left" scale={y} ticks={5} />
      <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} tickFormat={d3.format("~s")} />
      <text x={innerWidth} y={innerHeight + 34} textAnchor="end">
        body mass (g) →
      </text>
    </>
  );
}

export default function Histogram() {
  const [binCount, setBinCount] = useState(20);
  const [bySpecies, setBySpecies] = useState(false);
  return (
    <div className="stack">
      <div className="row">
        <label>
          ≈ {binCount} bins <input type="range" min={3} max={60} value={binCount} onChange={(e) => setBinCount(e.target.valueAsNumber)} />
        </label>
        <label>
          <input type="checkbox" checked={bySpecies} onChange={(e) => setBySpecies(e.target.checked)} /> overlay by species
        </label>
      </div>
      <ChartFrame height={320} margin={{ top: 36, bottom: 44 }} svgProps={{ role: "img", "aria-label": "Distribution of penguin body mass" }}>
        {(d) => <Hist binCount={binCount} bySpecies={bySpecies} innerWidth={d.innerWidth} innerHeight={d.innerHeight} />}
      </ChartFrame>
      <p className="muted">
        With few bins the distribution looks unimodal. Add more bins, or overlay by species, and the separate groups
        appear. Bin count is an editorial choice.
      </p>
    </div>
  );
}
