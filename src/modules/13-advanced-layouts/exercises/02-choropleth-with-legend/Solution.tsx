/**
 * Exercise 13.2: reference solution.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Tooltip } from "../../../../shared/charts/Tooltip";
import { borders, countries, countryIndex, type Country } from "../../../../shared/geo";

type Method = "quantize" | "quantile" | "threshold";
const COLORS = d3.schemeBlues[5];
const allValues = [...countryIndex.values()];
const THRESHOLDS = [20, 40, 60, 80];
const sphere: d3.GeoSphere = { type: "Sphere" };
const graticule = d3.geoGraticule10();

interface LegendClass {
  color: string;
  range: [number, number];
  count: number;
}

/** A classed color scale plus the value range of each class. */
function buildClasses(method: Method): { colorOf: (v: number) => string; classes: LegendClass[] } {
  let colorOf: (v: number) => string;
  let ranges: [number, number][];

  if (method === "quantize") {
    const s = d3.scaleQuantize<string>().domain([0, 100]).range(COLORS);
    colorOf = s;
    ranges = COLORS.map((c) => s.invertExtent(c) as [number, number]);
  } else if (method === "quantile") {
    const s = d3.scaleQuantile<string>().domain(allValues).range(COLORS);
    colorOf = s;
    ranges = COLORS.map((c) => s.invertExtent(c) as [number, number]);
  } else {
    const s = d3.scaleThreshold<number, string>().domain(THRESHOLDS).range(COLORS);
    colorOf = s;
    const edges = [0, ...THRESHOLDS, 100];
    ranges = COLORS.map((_, i) => [edges[i], edges[i + 1]]);
  }

  const classes = COLORS.map((color, i) => ({
    color,
    range: ranges[i],
    count: allValues.filter((v) => colorOf(v) === color).length,
  }));
  return { colorOf, classes };
}

export default function ChoroplethWithLegend() {
  const [ref, dms] = useChartDimensions({ aspectRatio: 1.9, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const [method, setMethod] = useState<Method>("quantize");
  const [hovered, setHovered] = useState<{ country: Country; x: number; y: number } | null>(null);
  const [hoveredClass, setHoveredClass] = useState<string | null>(null);

  const path = useMemo(() => d3.geoPath(d3.geoEqualEarth().fitSize([dms.width, dms.height], sphere)), [dms.width, dms.height]);
  const { colorOf, classes } = useMemo(() => buildClasses(method), [method]);

  const valueOf = (c: Country) => countryIndex.get(String(c.id));
  // The class the pointer is on: from the legend, or from the hovered country.
  const hoveredValue = hovered ? valueOf(hovered.country) : undefined;
  const activeClass = hoveredClass ?? (hoveredValue !== undefined ? colorOf(hoveredValue) : hovered ? "none" : null);
  const noDataCount = countries.features.length - allValues.length;

  return (
    <div className="stack">
      <div className="row">
        {(
          [
            ["quantize", "Equal interval"],
            ["quantile", "Quantile"],
            ["threshold", "Custom thresholds"],
          ] as const
        ).map(([m, label]) => (
          <button key={m} className={`btn ${method === m ? "primary" : ""}`} onClick={() => setMethod(m)}>
            {label}
          </button>
        ))}
      </div>

      <div ref={ref} className="chart-wrapper">
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} role="img" aria-label="Classed choropleth of a synthetic index">
            <defs>
              <pattern id="hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width={6} height={6} fill="var(--surface)" />
                <line y2={6} stroke="var(--chart-axis)" strokeWidth={1.5} />
              </pattern>
            </defs>
            <path d={path(sphere)!} fill="var(--surface-2)" />
            <path d={path(graticule)!} fill="none" stroke="var(--chart-grid)" />
            {countries.features.map((f) => {
              const v = valueOf(f);
              const cls = v === undefined ? "none" : colorOf(v);
              const dim = activeClass !== null && activeClass !== cls;
              return (
                <path
                  key={String(f.id) + f.properties.name}
                  d={path(f) ?? ""}
                  fill={v === undefined ? "url(#hatch)" : cls}
                  opacity={dim ? 0.2 : 1}
                  style={{ transition: "opacity 150ms" }}
                  onPointerMove={(e) => {
                    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHovered({ country: f, x: e.clientX - r.left, y: e.clientY - r.top });
                  }}
                  onPointerLeave={() => setHovered(null)}
                />
              );
            })}
            <path d={path(borders)!} fill="none" stroke="var(--surface)" strokeWidth={0.5} pointerEvents="none" />
          </svg>
        )}
        {hovered && (
          <Tooltip x={hovered.x} y={hovered.y} containerWidth={dms.width} containerHeight={dms.height}>
            <strong>{hovered.country.properties.name}</strong>
            <br />
            {hoveredValue !== undefined ? `index ${hoveredValue}` : "no data"}
          </Tooltip>
        )}
      </div>

      {/* Discrete legend: also a hover target */}
      <div className="row" style={{ gap: 4 }} onPointerLeave={() => setHoveredClass(null)}>
        {classes.map((c) => (
          <div
            key={c.color}
            onPointerEnter={() => setHoveredClass(c.color)}
            style={{
              padding: 4,
              borderRadius: 6,
              outline: activeClass === c.color ? "2px solid var(--accent)" : "none",
              cursor: "default",
              textAlign: "center",
              minWidth: 70,
            }}
          >
            <div style={{ background: c.color, height: 14, borderRadius: 3 }} />
            <div style={{ fontSize: 12 }}>
              {Math.round(c.range[0])}–{Math.round(c.range[1])}
            </div>
            <div className="muted" style={{ fontSize: 11 }}>
              {c.count} countries
            </div>
          </div>
        ))}
        <div
          onPointerEnter={() => setHoveredClass("none")}
          style={{ padding: 4, borderRadius: 6, outline: activeClass === "none" ? "2px solid var(--accent)" : "none", textAlign: "center", minWidth: 70 }}
        >
          <svg width="100%" height={14} style={{ display: "block", borderRadius: 3 }}>
            <rect width="100%" height={14} fill="url(#hatch)" />
          </svg>
          <div style={{ fontSize: 12 }}>No data</div>
          <div className="muted" style={{ fontSize: 11 }}>
            {noDataCount} countries
          </div>
        </div>
      </div>
    </div>
  );
}
