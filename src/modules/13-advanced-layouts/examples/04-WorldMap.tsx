/**
 * Example 13.04: a world choropleth with a projection switcher, a
 * graticule, a legend, hover tooltips and city bubbles.
 *
 * Everything is React-rendered. d3-geo is pure math: geoPath(feature)
 * returns a path string, and projection([lon, lat]) returns pixels.
 * The orthographic globe can be rotated by dragging.
 */
import { useEffect, useMemo, useState, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Tooltip } from "../../../shared/charts/Tooltip";
import { borders, countries, countryIndex, type Country } from "../../../shared/geo";

interface City {
  city: string;
  country: string;
  population: number;
  lat: number;
  lon: number;
}

const projections = {
  naturalEarth: d3.geoNaturalEarth1,
  equalEarth: d3.geoEqualEarth,
  mercator: d3.geoMercator,
  orthographic: d3.geoOrthographic,
} as const;
type ProjectionName = keyof typeof projections;

const sphere: d3.GeoSphere = { type: "Sphere" };
const graticule = d3.geoGraticule10();
const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, 100]);

function Legend({ width }: { width: number }) {
  const w = Math.min(260, width - 20);
  const x = d3.scaleLinear().domain([0, 100]).range([0, w]);
  return (
    <svg width={w + 20} height={40} className="chart">
      <defs>
        <linearGradient id="map-legend">
          {d3.range(0, 1.01, 0.1).map((t) => (
            <stop key={t} offset={`${t * 100}%`} stopColor={color(t * 100)} />
          ))}
        </linearGradient>
      </defs>
      <g transform="translate(10,4)">
        <rect width={w} height={10} fill="url(#map-legend)" rx={2} />
        {x.ticks(5).map((t) => (
          <text key={t} x={x(t)} y={24} textAnchor="middle" fontSize={10}>
            {t}
          </text>
        ))}
        <text x={0} y={36} fontSize={10} className="muted">
          synthetic index (made-up data)
        </text>
      </g>
    </svg>
  );
}

export default function WorldMap() {
  const [ref, dms] = useChartDimensions({ aspectRatio: 1.75, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const [projName, setProjName] = useState<ProjectionName>("naturalEarth");
  const [rotation, setRotation] = useState<[number, number]>([-10, -20]);
  const [hovered, setHovered] = useState<{ country: Country; x: number; y: number } | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [showCities, setShowCities] = useState(true);
  const [drag, setDrag] = useState<{ x: number; y: number; rot: [number, number] } | null>(null);

  useEffect(() => {
    const c = new AbortController();
    fetch("/data/cities.json", { signal: c.signal })
      .then((r) => r.json() as Promise<City[]>)
      .then(setCities)
      .catch(() => {});
    return () => c.abort();
  }, []);

  const isGlobe = projName === "orthographic";

  const path = useMemo(() => {
    const projection = projections[projName]();
    if (isGlobe) projection.rotate([rotation[0], rotation[1]]);
    // fitSize scales and centers the projection so the object fits. Mercator's
    // sphere is infinitely tall, so fit it to the countries instead.
    projection.fitSize([dms.width, dms.height], projName === "mercator" ? countries : sphere);
    return d3.geoPath(projection);
  }, [projName, isGlobe, rotation, dms.width, dms.height]);

  const projection = path.projection() as d3.GeoProjection;
  const r = d3.scaleSqrt().domain([0, 40]).range([0, 14]);

  /** On a globe, points on the far side must be hidden. */
  const isVisible = (lon: number, lat: number) => {
    if (!isGlobe) return true;
    const center = projection.invert!([dms.width / 2, dms.height / 2])!;
    return d3.geoDistance([lon, lat], center) < Math.PI / 2;
  };

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    if (!isGlobe) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY, rot: rotation });
  }
  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    if (!drag) return;
    const k = 0.4; // degrees per pixel
    setRotation([drag.rot[0] + (e.clientX - drag.x) * k, Math.max(-90, Math.min(90, drag.rot[1] - (e.clientY - drag.y) * k))]);
  }

  return (
    <div className="stack">
      <div className="row">
        {(Object.keys(projections) as ProjectionName[]).map((p) => (
          <button key={p} className={`btn ${projName === p ? "primary" : ""}`} onClick={() => setProjName(p)}>
            {p}
          </button>
        ))}
        <label>
          <input type="checkbox" checked={showCities} onChange={(e) => setShowCities(e.target.checked)} /> cities
        </label>
        {isGlobe && <span className="muted">drag to rotate</span>}
      </div>
      <div ref={ref} className="chart-wrapper">
        {dms.width > 0 && (
          <svg
            width={dms.width}
            height={dms.height}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => setDrag(null)}
            style={{ cursor: isGlobe ? (drag ? "grabbing" : "grab") : "default", touchAction: "none" }}
            role="img"
            aria-label="World map colored by a synthetic index"
          >
            <path d={path(sphere)!} fill="var(--surface-2)" stroke="var(--border)" />
            <path d={path(graticule)!} fill="none" stroke="var(--chart-grid)" />
            {countries.features.map((f) => (
              <path
                key={String(f.id)}
                d={path(f) ?? ""}
                fill={countryIndex.has(String(f.id)) ? color(countryIndex.get(String(f.id))!) : "#ccc"}
                stroke={hovered?.country === f ? "currentColor" : "none"}
                strokeWidth={1.5}
                onPointerMove={(e) => {
                  const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHovered({ country: f, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onPointerLeave={() => setHovered(null)}
              />
            ))}
            {/* Borders as ONE path: much lighter than stroking all 177 countries */}
            <path d={path(borders)!} fill="none" stroke="var(--surface)" strokeWidth={0.5} pointerEvents="none" />
            {showCities &&
              cities
                .filter((c) => isVisible(c.lon, c.lat))
                .map((c) => {
                  const [cx, cy] = projection([c.lon, c.lat])!;
                  return (
                    <circle key={c.city} cx={cx} cy={cy} r={r(c.population)} fill="#c2477f" fillOpacity={0.6} stroke="white" strokeWidth={0.8} pointerEvents="none">
                      <title>{`${c.city}: ${c.population}M`}</title>
                    </circle>
                  );
                })}
          </svg>
        )}
        {hovered && (
          <Tooltip x={hovered.x} y={hovered.y} containerWidth={dms.width} containerHeight={dms.height}>
            <strong>{hovered.country.properties.name}</strong>
            <br />
            index: {countryIndex.get(String(hovered.country.id)) ?? "n/a"}
          </Tooltip>
        )}
      </div>
      <Legend width={dms.width} />
    </div>
  );
}
