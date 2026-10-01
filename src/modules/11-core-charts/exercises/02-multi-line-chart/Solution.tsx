/**
 * Exercise 11.2: reference solution.
 */
import { useEffect, useMemo, useRef, useState, type SVGProps } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../../shared/charts/ChartFrame";
import { Axis } from "../../../../shared/charts/Axis";
import { stockSeries, type Series, type TimePoint } from "../../../../shared/data";
import { palette } from "../../../../shared/theme";

type Mode = "absolute" | "indexed";
const color = d3.scaleOrdinal<string, string>().domain(stockSeries.map((s) => s.name)).range(palette);

/**
 * Hybrid: React owns the <path> element; D3 only animates its `d`.
 * The first render sets `d` directly so nothing animates in from empty.
 */
function AnimatedPath({ d, ...rest }: { d: string } & SVGProps<SVGPathElement>) {
  const ref = useRef<SVGPathElement>(null);
  const first = useRef(true);
  useEffect(() => {
    const path = d3.select(ref.current!);
    if (first.current) {
      path.attr("d", d);
      first.current = false;
    } else {
      path.transition().duration(700).ease(d3.easeCubicInOut).attr("d", d);
    }
  }, [d]);
  // No `d` prop here, so React never overwrites what D3 animates.
  return <path ref={ref} {...rest} />;
}

function indexSeries(s: Series): Series {
  const base = s.values[0].value;
  return { name: s.name, values: s.values.map((p) => ({ date: p.date, value: (p.value / base) * 100 })) };
}

function Lines({ mode, hidden, onToggle, innerWidth, innerHeight }: { mode: Mode; hidden: Set<string>; onToggle: (name: string) => void; innerWidth: number; innerHeight: number }) {
  const series = useMemo(() => (mode === "indexed" ? stockSeries.map(indexSeries) : stockSeries), [mode]);
  const visible = series.filter((s) => !hidden.has(s.name));

  const x = useMemo(
    () => d3.scaleTime().domain(d3.extent(stockSeries[0].values, (d) => d.date) as [Date, Date]).range([0, innerWidth]),
    [innerWidth],
  );
  const visibleKey = visible.map((s) => s.name).join();
  const y = useMemo(() => {
    const values = visible.flatMap((s) => s.values.map((v) => v.value));
    return d3
      .scaleLinear()
      .domain(values.length ? (d3.extent(values) as [number, number]) : [0, 1])
      .nice()
      .range([innerHeight, 0]);
    // `visible` is a new array every render. `series` + the primitive
    // `visibleKey` identify its contents, so they're used as dependencies.
  }, [series, visibleKey, innerHeight]);

  const line = d3.line<TimePoint>().x((d) => x(d.date)).y((d) => y(d.value)).curve(d3.curveMonotoneX);
  const yFormat = useMemo(() => (mode === "indexed" ? d3.format("~r") : d3.format("$~r")), [mode]);
  const pct = d3.format("+.1%");

  return (
    <>
      <Axis orientation="left" scale={y} gridSize={innerWidth} duration={700} />
      <Axis orientation="left" scale={y} tickFormat={yFormat} duration={700} />
      <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} />
      {mode === "indexed" && <line x1={0} x2={innerWidth} y1={y(100)} y2={y(100)} stroke="currentColor" strokeDasharray="4 4" strokeOpacity={0.6} />}

      {series.map((s) => {
        const isHidden = hidden.has(s.name);
        const last = s.values[s.values.length - 1];
        const change = last.value / s.values[0].value - 1;
        return (
          <g key={s.name}>
            {!isHidden && <AnimatedPath d={line(s.values)!} fill="none" stroke={color(s.name)} strokeWidth={2} />}
            {/* Direct label, which is also the toggle */}
            <g
              transform={`translate(${innerWidth + 8},${isHidden ? 0 : y(last.value)})`}
              onClick={() => onToggle(s.name)}
              style={{ cursor: "pointer", opacity: isHidden ? 0.35 : 1 }}
            >
              <text dy="0.35em" style={{ fill: color(s.name), fontWeight: 700 }}>
                {s.name}
              </text>
              <text x={62} dy="0.35em" style={{ fill: mode === "indexed" ? (change >= 0 ? "#2c8a4b" : "#c43d3d") : undefined }}>
                {mode === "indexed" ? pct(change) : d3.format("$.2f")(last.value)}
              </text>
            </g>
          </g>
        );
      })}
    </>
  );
}

export default function MultiLineChart() {
  const [mode, setMode] = useState<Mode>("absolute");
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const toggle = (name: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });

  return (
    <div className="stack">
      <div className="row">
        {(["absolute", "indexed"] as const).map((m) => (
          <button key={m} className={`btn ${mode === m ? "primary" : ""}`} onClick={() => setMode(m)}>
            {m === "absolute" ? "Absolute price" : "Indexed (start = 100)"}
          </button>
        ))}
        <span className="muted">Click a label on the right to toggle a series.</span>
      </div>
      <ChartFrame height={360} margin={{ right: 130 }} svgProps={{ role: "img", "aria-label": "Stock prices over 180 days" }}>
        {({ innerWidth, innerHeight }) => <Lines mode={mode} hidden={hidden} onToggle={toggle} innerWidth={innerWidth} innerHeight={innerHeight} />}
      </ChartFrame>
    </div>
  );
}
