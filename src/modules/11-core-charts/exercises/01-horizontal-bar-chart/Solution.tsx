/**
 * Exercise 11.1: reference solution.
 */
import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../../shared/charts/ChartFrame";
import { Axis } from "../../../../shared/charts/Axis";

interface City {
  city: string;
  country: string;
  population: number; // millions
}

type Result<T> = { status: "loading" } | { status: "error"; error: string } | { status: "success"; data: T };

function useJson<T>(url: string): Result<T> {
  const [result, setResult] = useState<Result<T>>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    setResult({ status: "loading" });
    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then((data) => setResult({ status: "success", data }))
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setResult({ status: "error", error: String(e) });
      });
    return () => controller.abort();
  }, [url]);
  return result;
}

const ROW_HEIGHT = 28;
const MARGIN = { left: 110, top: 30, right: 50, bottom: 10 };
const fmt = (v: number) => `${v.toFixed(1)}M`;
const axisFmt = (v: d3.NumberValue) => `${v}M`;

function Bars({ rows, highlight, innerWidth, innerHeight }: { rows: City[]; highlight: string; innerWidth: number; innerHeight: number }) {
  const y = useMemo(
    () => d3.scaleBand<string>().domain(rows.map((d) => d.city)).range([0, innerHeight]).padding(0.15),
    [rows, innerHeight],
  );
  const x = useMemo(
    () => d3.scaleLinear().domain([0, d3.max(rows, (d) => d.population) ?? 1]).nice().range([0, innerWidth]),
    [rows, innerWidth],
  );

  return (
    <>
      <Axis orientation="top" scale={x} gridSize={-innerHeight} ticks={5} />
      <Axis orientation="top" scale={x} ticks={5} tickFormat={axisFmt} />
      {rows.map((d) => {
        const w = x(d.population);
        const dim = highlight !== "All" && d.country !== highlight;
        const labelInside = w > 48;
        return (
          <g key={d.city} transform={`translate(0,${y(d.city)})`} opacity={dim ? 0.3 : 1} style={{ transition: "opacity 200ms" }}>
            <text x={-8} y={y.bandwidth() / 2} dy="0.35em" textAnchor="end">
              {d.city}
            </text>
            <rect width={w} height={y.bandwidth()} fill="#2f6fdf" rx={2}>
              <title>{`${d.city}, ${d.country}: ${fmt(d.population)}`}</title>
            </rect>
            <text
              x={labelInside ? w - 6 : w + 6}
              y={y.bandwidth() / 2}
              dy="0.35em"
              textAnchor={labelInside ? "end" : "start"}
              style={{ fill: labelInside ? "white" : undefined, fontWeight: 600 }}
            >
              {fmt(d.population)}
            </text>
          </g>
        );
      })}
    </>
  );
}

export default function HorizontalBarChart() {
  const result = useJson<City[]>("/data/cities.json");
  const [topN, setTopN] = useState(10);
  const [sort, setSort] = useState<"population" | "name">("population");
  const [highlight, setHighlight] = useState("All");

  const cities = result.status === "success" ? result.data : [];
  const countries = useMemo(() => ["All", ...new Set(cities.map((c) => c.country))].sort(), [cities]);

  const rows = useMemo(() => {
    const top = cities.toSorted((a, b) => b.population - a.population).slice(0, topN);
    return sort === "name" ? top.toSorted((a, b) => a.city.localeCompare(b.city)) : top;
  }, [cities, topN, sort]);

  if (result.status === "loading") return <p>Loading cities…</p>;
  if (result.status === "error") return <p style={{ color: "var(--danger)" }}>Failed to load: {result.error}</p>;

  return (
    <div className="stack">
      <div className="row">
        <label>
          Top {topN} <input type="range" min={5} max={cities.length} value={topN} onChange={(e) => setTopN(e.target.valueAsNumber)} />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as "population" | "name")}>
          <option value="population">Sort: population ↓</option>
          <option value="name">Sort: name A–Z</option>
        </select>
        <label>
          Highlight{" "}
          <select value={highlight} onChange={(e) => setHighlight(e.target.value)}>
            {countries.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <ChartFrame height={rows.length * ROW_HEIGHT + MARGIN.top + MARGIN.bottom} margin={MARGIN} svgProps={{ role: "img", "aria-label": `Top ${topN} cities by population` }}>
        {({ innerWidth, innerHeight }) => <Bars rows={rows} highlight={highlight} innerWidth={innerWidth} innerHeight={innerHeight} />}
      </ChartFrame>
    </div>
  );
}
