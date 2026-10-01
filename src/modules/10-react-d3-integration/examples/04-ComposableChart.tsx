/**
 * Example 10.04: composable charts with ChartFrame + context.
 *
 * ChartFrame (src/shared/charts/ChartFrame.tsx) measures itself, applies
 * the margin convention, and exposes the dimensions to its children through
 * a render prop and useChartContext(). Marks become small, focused
 * components.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { ChartFrame, useChartContext } from "../../../shared/charts/ChartFrame";
import { Axis } from "../../../shared/charts/Axis";
import { monthlyFinance, type MonthlyRecord } from "../../../shared/data";

type Key = "revenue" | "expenses" | "profit";
const COLORS: Record<Key, string> = { revenue: "#2f6fdf", expenses: "#e0803a", profit: "#2c9a6a" };
// Defined once at module level. An inline arrow would be a new function every
// render, which would re-run the <Axis> effect every render.
const moneyFormat = d3.format("$~s");

/** Reads the chart size from context, so no width/height props are needed. */
function ZeroLine({ y }: { y: d3.ScaleLinear<number, number> }) {
  const { innerWidth } = useChartContext();
  return <line x1={0} x2={innerWidth} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.5} />;
}

function LineSeries({ data, k, x, y }: { data: MonthlyRecord[]; k: Key; x: d3.ScalePoint<string>; y: d3.ScaleLinear<number, number> }) {
  const line = d3.line<MonthlyRecord>().x((d) => x(d.month)!).y((d) => y(d[k])).curve(d3.curveMonotoneX);
  return (
    <g>
      <path d={line(data)!} fill="none" stroke={COLORS[k]} strokeWidth={2.5} />
      {data.map((d) => (
        <circle key={d.month} cx={x(d.month)} cy={y(d[k])} r={3.5} fill={COLORS[k]} />
      ))}
    </g>
  );
}

function Chart({ keys, innerWidth, innerHeight }: { keys: Key[]; innerWidth: number; innerHeight: number }) {
  const x = useMemo(
    () => d3.scalePoint<string>().domain(monthlyFinance.map((d) => d.month)).range([0, innerWidth]).padding(0.3),
    [innerWidth],
  );
  const y = useMemo(() => {
    const values = monthlyFinance.flatMap((d) => keys.map((k) => d[k]));
    return d3
      .scaleLinear()
      .domain([Math.min(0, d3.min(values) ?? 0), d3.max(values) ?? 1])
      .nice()
      .range([innerHeight, 0]);
  }, [keys, innerHeight]);

  return (
    <>
      <Axis orientation="left" scale={y} gridSize={innerWidth} ticks={6} />
      <Axis orientation="left" scale={y} ticks={6} tickFormat={moneyFormat} />
      <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} />
      <ZeroLine y={y} />
      {keys.map((k) => (
        <LineSeries key={k} data={monthlyFinance} k={k} x={x} y={y} />
      ))}
    </>
  );
}

export default function ComposableChart() {
  const [keys, setKeys] = useState<Key[]>(["revenue", "expenses"]);
  const toggle = (k: Key) => setKeys((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]));

  return (
    <div className="stack">
      <div className="legend">
        {(Object.keys(COLORS) as Key[]).map((k) => (
          <button key={k} onClick={() => toggle(k)} style={{ opacity: keys.includes(k) ? 1 : 0.4 }}>
            <span className="swatch" style={{ background: COLORS[k] }} /> {k}
          </button>
        ))}
      </div>
      <ChartFrame height={320} margin={{ left: 60 }}>
        {({ innerWidth, innerHeight }) => <Chart keys={keys} innerWidth={innerWidth} innerHeight={innerHeight} />}
      </ChartFrame>
    </div>
  );
}
