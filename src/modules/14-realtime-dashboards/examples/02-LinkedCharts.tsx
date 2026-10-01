/**
 * Example 14.02: linked charts with a selector-based store.
 *
 * Three views share `selectedRegion` and `hoveredDay` through a tiny
 * external store read with useSyncExternalStore + selectors. Each view
 * re-renders ONLY when the slice it selects changes. Watch the render
 * counters while you hover the line chart: the bar chart doesn't move.
 */
import { memo, useMemo, useRef, useSyncExternalStore, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { REGIONS, type MetricEvent } from "../../../shared/stream";
import { palette } from "../../../shared/theme";

type Region = MetricEvent["region"];

// ---------------------------------------------------------------------------
// Data: 60 days × 3 regions of request counts
// ---------------------------------------------------------------------------
interface DayRow {
  day: Date;
  region: Region;
  requests: number;
}
const rows: DayRow[] = (() => {
  const rnd = d3.randomLcg(77);
  const start = new Date(2025, 5, 1);
  return d3.range(60).flatMap((i) =>
    REGIONS.map((region, r) => ({
      day: d3.timeDay.offset(start, i),
      region,
      requests: Math.round(800 + r * 300 + Math.sin((i + r * 7) / 6) * 250 + rnd() * 200 + (i % 7 >= 5 ? -300 : 0)),
    })),
  );
})();
const days = [...new Set(rows.map((r) => +r.day))].map((t) => new Date(t));
const regionColor = d3.scaleOrdinal<Region, string>().domain(REGIONS).range(palette);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
interface State {
  selectedRegion: Region | null;
  hoveredDay: number | null; // timestamp
}

function createStore(initial: State) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(partial: Partial<State>) {
      state = { ...state, ...partial };
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}
const store = createStore({ selectedRegion: null, hoveredDay: null });

/** Selector hook: the selector must return a primitive or a stable reference. */
function useDashboard<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

function useRenderCount() {
  const r = useRef(0);
  r.current++;
  return r.current;
}

// ---------------------------------------------------------------------------
// View 1: totals by region (click to select)
// ---------------------------------------------------------------------------
const RegionBars = memo(function RegionBars() {
  const selected = useDashboard((s) => s.selectedRegion); // NOT subscribed to hover
  const renders = useRenderCount();
  const totals = useMemo(() => d3.rollups(rows, (v) => d3.sum(v, (d) => d.requests), (d) => d.region), []);
  const max = d3.max(totals, (d) => d[1])!;
  return (
    <div className="card" style={{ flex: "1 1 240px" }}>
      <strong>Total requests by region</strong> <span className="muted">(renders {renders})</span>
      <svg width="100%" height={totals.length * 34} style={{ display: "block", marginTop: 8 }}>
        {totals.map(([region, total], i) => (
          <g
            key={region}
            transform={`translate(0,${i * 34})`}
            onClick={() => store.set({ selectedRegion: selected === region ? null : region })}
            style={{ cursor: "pointer" }}
            opacity={selected && selected !== region ? 0.3 : 1}
          >
            <text y={12} fontSize={12}>
              {region}
            </text>
            <rect y={16} width={`${(total / max) * 100}%`} height={12} rx={3} fill={regionColor(region)} />
            <text x="99%" y={12} textAnchor="end" fontSize={11}>
              {d3.format(",")(total)}
            </text>
          </g>
        ))}
      </svg>
      <div className="muted" style={{ fontSize: 12 }}>
        click a bar to filter
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// View 2: daily lines (hover writes hoveredDay)
// ---------------------------------------------------------------------------
function DailyLines() {
  const selected = useDashboard((s) => s.selectedRegion);
  const hovered = useDashboard((s) => s.hoveredDay);
  const renders = useRenderCount();
  const [ref, dms] = useChartDimensions({ height: 240, margin: { left: 50, right: 10 } });

  const x = useMemo(() => d3.scaleTime().domain(d3.extent(days) as [Date, Date]).range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain([0, d3.max(rows, (d) => d.requests)!]).nice().range([dms.innerHeight, 0]), [dms.innerHeight]);
  const byRegion = useMemo(() => d3.groups(rows, (d) => d.region), []);
  const line = d3.line<DayRow>().x((d) => x(d.day)).y((d) => y(d.requests));
  const bisect = d3.bisector<Date, Date>((d) => d).center;

  function onMove(e: PointerEvent<SVGRectElement>) {
    const [mx] = d3.pointer(e, e.currentTarget);
    const day = +days[bisect(days, x.invert(mx))];
    if (day !== store.get().hoveredDay) store.set({ hoveredDay: day });
  }

  return (
    <div className="card" style={{ flex: "3 1 420px" }}>
      <strong>Daily requests</strong> <span className="muted">(renders {renders})</span>
      <div ref={ref}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} className="chart">
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              <Axis orientation="left" scale={y} gridSize={dms.innerWidth} ticks={4} />
              <Axis orientation="left" scale={y} ticks={4} />
              <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} ticks={5} />
              {byRegion.map(([region, values]) => (
                <path
                  key={region}
                  d={line(values)!}
                  fill="none"
                  stroke={regionColor(region)}
                  strokeWidth={selected === region ? 3 : 1.6}
                  strokeOpacity={selected && selected !== region ? 0.15 : 1}
                />
              ))}
              {hovered !== null && <line x1={x(hovered)} x2={x(hovered)} y2={dms.innerHeight} stroke="currentColor" strokeOpacity={0.4} />}
              <rect width={dms.innerWidth} height={dms.innerHeight} fill="transparent" onPointerMove={onMove} onPointerLeave={() => store.set({ hoveredDay: null })} />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View 3: details for the hovered day
// ---------------------------------------------------------------------------
const DayDetails = memo(function DayDetails() {
  const hovered = useDashboard((s) => s.hoveredDay);
  const selected = useDashboard((s) => s.selectedRegion);
  const renders = useRenderCount();
  const dayRows = hovered === null ? [] : rows.filter((r) => +r.day === hovered && (!selected || r.region === selected));
  return (
    <div className="card" style={{ flex: "1 1 200px" }}>
      <strong>{hovered ? d3.timeFormat("%a %b %d")(new Date(hovered)) : "Hover the chart"}</strong>{" "}
      <span className="muted">(renders {renders})</span>
      <table style={{ marginTop: 8, fontSize: 13 }}>
        <tbody>
          {dayRows.map((r) => (
            <tr key={r.region}>
              <td>
                <span className="swatch" style={{ background: regionColor(r.region), display: "inline-block", width: 10, height: 10, borderRadius: 2 }} /> {r.region}
              </td>
              <td style={{ textAlign: "right", paddingLeft: 12 }}>{d3.format(",")(r.requests)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default function LinkedCharts() {
  const selected = useDashboard((s) => s.selectedRegion);
  return (
    <div className="stack">
      <div className="row">
        <span>
          Filter: <strong>{selected ?? "all regions"}</strong>
        </span>
        {selected && (
          <button className="btn" onClick={() => store.set({ selectedRegion: null })}>
            Clear
          </button>
        )}
      </div>
      <div className="row" style={{ alignItems: "stretch" }}>
        <RegionBars />
        <DailyLines />
        <DayDetails />
      </div>
    </div>
  );
}
