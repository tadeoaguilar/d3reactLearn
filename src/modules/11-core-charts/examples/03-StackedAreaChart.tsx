/**
 * Example 11.03: stacked area chart with d3.stack() and different offsets.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../shared/charts/ChartFrame";
import { Axis } from "../../../shared/charts/Axis";
import { energyMix, type EnergyRow } from "../../../shared/data";
import { palette } from "../../../shared/theme";

const KEYS = ["solar", "wind", "hydro", "gas"] as const;
type EnergyKey = (typeof KEYS)[number];
const color = d3.scaleOrdinal<EnergyKey, string>().domain(KEYS).range(palette);

const offsets = {
  absolute: d3.stackOffsetNone,
  "100%": d3.stackOffsetExpand,
  streamgraph: d3.stackOffsetWiggle,
} as const;
type OffsetName = keyof typeof offsets;

function Areas({ innerWidth, innerHeight, offset, hidden }: { innerWidth: number; innerHeight: number; offset: OffsetName; hidden: Set<EnergyKey> }) {
  const keys = KEYS.filter((k) => !hidden.has(k));
  // `keys` is a new array every render. Its joined string is a primitive
  // that only changes when the visible keys change, so it's a safe dependency.
  const keysId = keys.join();
  const series = useMemo(
    () =>
      d3
        .stack<EnergyRow, EnergyKey>()
        .keys(keys)
        .offset(offsets[offset])
        .order(offset === "streamgraph" ? d3.stackOrderInsideOut : d3.stackOrderNone)(energyMix),
    [keysId, offset],
  );

  const x = d3.scaleTime().domain(d3.extent(energyMix, (d) => d.date) as [Date, Date]).range([0, innerWidth]);
  const y = d3
    .scaleLinear()
    .domain([d3.min(series, (s) => d3.min(s, (d) => d[0])) ?? 0, d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 1])
    .nice()
    .range([innerHeight, 0]);

  const area = d3
    .area<d3.SeriesPoint<EnergyRow>>()
    .x((d) => x(d.data.date))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(d3.curveBasis);

  return (
    <>
      {series.map((s) => (
        <path key={s.key} d={area(s)!} fill={color(s.key)} fillOpacity={0.85}>
          <title>{s.key}</title>
        </path>
      ))}
      {/* Direct labels at the widest point of each band beat a legend */}
      {series.map((s) => {
        const widest = d3.greatest(s, (d) => d[1] - d[0])!;
        const thickness = y(widest[0]) - y(widest[1]);
        return thickness > 14 ? (
          <text key={s.key} x={x(widest.data.date)} y={y((widest[0] + widest[1]) / 2)} dy="0.35em" textAnchor="middle" fill="white" style={{ fill: "white", fontWeight: 600 }}>
            {s.key}
          </text>
        ) : null;
      })}
      <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} />
      {offset !== "streamgraph" && <Axis orientation="left" scale={y} tickFormat={offset === "100%" ? d3.format(".0%") : undefined} />}
    </>
  );
}

export default function StackedAreaChart() {
  const [offset, setOffset] = useState<OffsetName>("absolute");
  const [hidden, setHidden] = useState<Set<EnergyKey>>(() => new Set());
  const toggle = (k: EnergyKey) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <div className="stack">
      <div className="row">
        {(Object.keys(offsets) as OffsetName[]).map((o) => (
          <button key={o} className={`btn ${o === offset ? "primary" : ""}`} onClick={() => setOffset(o)}>
            {o}
          </button>
        ))}
        <div className="legend">
          {KEYS.map((k) => (
            <button key={k} onClick={() => toggle(k)} style={{ opacity: hidden.has(k) ? 0.35 : 1 }}>
              <span className="swatch" style={{ background: color(k) }} /> {k}
            </button>
          ))}
        </div>
      </div>
      <ChartFrame height={340} svgProps={{ role: "img", "aria-label": "Energy mix over 24 months" }}>
        {(d) => <Areas innerWidth={d.innerWidth} innerHeight={d.innerHeight} offset={offset} hidden={hidden} />}
      </ChartFrame>
    </div>
  );
}
