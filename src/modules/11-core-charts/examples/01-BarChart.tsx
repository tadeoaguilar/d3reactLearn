/**
 * Example 11.01: a responsive bar chart with sorting and negative values.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../shared/charts/ChartFrame";
import { Axis } from "../../../shared/charts/Axis";
import { monthlyFinance } from "../../../shared/data";
import { colors } from "../../../shared/theme";

type Metric = "revenue" | "profit";
type Sort = "chronological" | "descending";

const fmt = d3.format("$~s");

function Bars({ metric, sort, innerWidth, innerHeight }: { metric: Metric; sort: Sort; innerWidth: number; innerHeight: number }) {
  // For demo purposes, give profit a few negative months
  const data = useMemo(
    () => monthlyFinance.map((d, i) => ({ month: d.month, value: metric === "revenue" ? d.revenue : d.profit - (i % 4 === 1 ? 14_000 : 0) })),
    [metric],
  );
  const ordered = useMemo(() => (sort === "descending" ? data.toSorted((a, b) => b.value - a.value) : data), [data, sort]);

  const x = useMemo(
    () => d3.scaleBand<string>().domain(ordered.map((d) => d.month)).range([0, innerWidth]).padding(0.2),
    [ordered, innerWidth],
  );
  const y = useMemo(() => {
    const [min, max] = d3.extent(data, (d) => d.value) as [number, number];
    // Bars must include zero, whatever the data.
    return d3.scaleLinear().domain([Math.min(0, min), Math.max(0, max)]).nice().range([innerHeight, 0]);
  }, [data, innerHeight]);

  return (
    <>
      <Axis orientation="left" scale={y} gridSize={innerWidth} ticks={6} />
      <Axis orientation="left" scale={y} ticks={6} tickFormat={fmt} />
      {ordered.map((d) => {
        const top = Math.min(y(0), y(d.value));
        const h = Math.abs(y(d.value) - y(0));
        return (
          <g key={d.month}>
            <rect
              x={x(d.month)}
              y={top}
              width={x.bandwidth()}
              height={h}
              rx={2}
              fill={d.value >= 0 ? colors.primary : colors.negative}
              style={{ transition: "all 400ms ease" }}
            >
              {/* A native SVG tooltip: zero-effort accessibility */}
              <title>{`${d.month}: ${fmt(d.value)}`}</title>
            </rect>
            {x.bandwidth() > 28 && (
              <text
                x={x(d.month)! + x.bandwidth() / 2}
                y={d.value >= 0 ? top - 4 : top + h + 12}
                textAnchor="middle"
                fontSize={10}
                style={{ transition: "all 400ms ease" }}
              >
                {fmt(d.value)}
              </text>
            )}
          </g>
        );
      })}
      {/* The x axis sits at y(0), which matters for negative values */}
      <Axis orientation="bottom" scale={x} transform={`translate(0,${y(0)})`} duration={400} />
    </>
  );
}

export default function BarChart() {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [sort, setSort] = useState<Sort>("chronological");
  return (
    <div className="stack">
      <div className="row">
        {(["revenue", "profit"] as const).map((m) => (
          <button key={m} className={`btn ${metric === m ? "primary" : ""}`} onClick={() => setMetric(m)}>
            {m}
          </button>
        ))}
        {(["chronological", "descending"] as const).map((s) => (
          <button key={s} className={`btn ${sort === s ? "primary" : ""}`} onClick={() => setSort(s)}>
            {s}
          </button>
        ))}
      </div>
      <ChartFrame height={340} margin={{ left: 56 }} svgProps={{ role: "img", "aria-label": `Monthly ${metric}, 2025` }}>
        {(d) => <Bars metric={metric} sort={sort} innerWidth={d.innerWidth} innerHeight={d.innerHeight} />}
      </ChartFrame>
    </div>
  );
}
