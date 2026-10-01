/**
 * Capstone: Sales analytics dashboard, reference solution.
 *
 * Architecture
 *   DashboardProvider   reducer + split contexts (filters / dispatch)
 *   applyFilters        one place that knows how to filter, with an `except` for cross-filtering
 *   useFilteredOrders   memoized access to filtered data
 *   Panels              each derives its own aggregation with useMemo
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../../shared/charts/Axis";
import { Tooltip } from "../../../../shared/charts/Tooltip";
import { CATEGORIES, REGIONS, orders, type Category, type Order, type Region } from "./salesData";

// ============================================================================
// Formatting & colors
// ============================================================================
const money = (v: number) => d3.format("$,.3~s")(v).replace("G", "B");
const moneyFull = d3.format("$,.0f");
const count = d3.format(",");
const pct = d3.format("+.1%");
const dateFmt = d3.timeFormat("%b %d");
const categoryColor = d3.scaleOrdinal<Category, string>().domain(CATEGORIES).range(["#2f6fdf", "#e0803a", "#2c9a6a", "#c2477f", "#7b5cd6"]);
const regionColor = d3.scaleOrdinal<Region, string>().domain(REGIONS).range(["#4e79a7", "#f28e2b", "#59a14f", "#b07aa1"]);
const moneyAxis = (v: d3.NumberValue) => money(+v);

// ============================================================================
// 1. State
// ============================================================================
interface Filters {
  dateRange: [Date, Date] | null;
  regions: Set<Region>;
  categories: Set<Category>;
}
type FilterKey = keyof Filters;

type FilterAction =
  | { type: "dateRangeChanged"; range: [Date, Date] | null }
  | { type: "regionToggled"; region: Region }
  | { type: "regionsSet"; regions: Region[] }
  | { type: "categoryToggled"; category: Category }
  | { type: "reset" };

const initialFilters: Filters = { dateRange: null, regions: new Set(), categories: new Set() };

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function filtersReducer(state: Filters, action: FilterAction): Filters {
  switch (action.type) {
    case "dateRangeChanged":
      return { ...state, dateRange: action.range };
    case "regionToggled":
      return { ...state, regions: toggle(state.regions, action.region) };
    case "regionsSet":
      return { ...state, regions: new Set(action.regions) };
    case "categoryToggled":
      return { ...state, categories: toggle(state.categories, action.category) };
    case "reset":
      return initialFilters;
  }
}

const FiltersContext = createContext<Filters | null>(null);
const DispatchContext = createContext<Dispatch<FilterAction> | null>(null);

function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(filtersReducer, initialFilters);
  return (
    <DispatchContext value={dispatch}>
      <FiltersContext value={filters}>{children}</FiltersContext>
    </DispatchContext>
  );
}

function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used inside <DashboardProvider>");
  return ctx;
}
function useFiltersDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useFiltersDispatch must be used inside <DashboardProvider>");
  return ctx;
}

function applyFilters(data: Order[], f: Filters, except?: FilterKey): Order[] {
  return data.filter(
    (o) =>
      (except === "dateRange" || !f.dateRange || (o.date >= f.dateRange[0] && o.date <= f.dateRange[1])) &&
      (except === "regions" || f.regions.size === 0 || f.regions.has(o.region)) &&
      (except === "categories" || f.categories.size === 0 || f.categories.has(o.category)),
  );
}

function useFilteredOrders(except?: FilterKey) {
  const filters = useFilters();
  // Only re-filter when a filter this view actually uses changes: an
  // excluded filter contributes `null` to the dependency list, so changing
  // it doesn't invalidate the memo.
  const { dateRange, regions, categories } = filters;
  return useMemo(
    () => applyFilters(orders, { dateRange, regions, categories }, except),
    [except === "dateRange" ? null : dateRange, except === "regions" ? null : regions, except === "categories" ? null : categories, except],
  );
}

/** Weekly revenue, with every week present (zeros where there are no orders). */
const allWeeks = d3.timeWeek.range(d3.timeWeek.floor(new Date(2025, 0, 1)), new Date(2026, 0, 1));
function weeklySeries(data: Order[], value: (v: Order[]) => number = (v) => d3.sum(v, (o) => o.revenue)) {
  const byWeek = d3.rollup(data, value, (o) => +d3.timeWeek.floor(o.date));
  return allWeeks.map((week) => ({ week, value: byWeek.get(+week) ?? 0 }));
}
type WeekPoint = ReturnType<typeof weeklySeries>[number];

// ============================================================================
// Shared bits
// ============================================================================
function Panel({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <section className="card" style={{ minWidth: 0 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <strong>{title}</strong>
        {subtitle && <span className="muted" style={{ fontSize: 12 }}>{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 110;
  const h = 30;
  const x = d3.scaleLinear().domain([0, Math.max(1, values.length - 1)]).range([0, w]);
  const y = d3.scaleLinear().domain([0, d3.max(values) || 1]).range([h - 1, 1]);
  return (
    <svg width={w} height={h} aria-hidden>
      <path d={d3.area<number>().x((_, i) => x(i)).y0(h).y1((v) => y(v)).curve(d3.curveMonotoneX)(values) ?? ""} fill={color} fillOpacity={0.15} />
      <path d={d3.line<number>().x((_, i) => x(i)).y((v) => y(v)).curve(d3.curveMonotoneX)(values) ?? ""} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

const EmptyState = () => <p className="muted" style={{ textAlign: "center", padding: 24 }}>No orders match your filters.</p>;

// ============================================================================
// Filter bar
// ============================================================================
function FilterBar() {
  const filters = useFilters();
  const dispatch = useFiltersDispatch();
  const regionValue = filters.regions.size === 1 ? [...filters.regions][0] : filters.regions.size === 0 ? "all" : "multiple";
  const active = filters.dateRange || filters.regions.size || filters.categories.size;

  return (
    <div className="row">
      <select
        value={regionValue}
        onChange={(e) => dispatch({ type: "regionsSet", regions: e.target.value === "all" ? [] : [e.target.value as Region] })}
        aria-label="Region filter"
      >
        <option value="all">All regions</option>
        {regionValue === "multiple" && <option value="multiple">{filters.regions.size} regions</option>}
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {CATEGORIES.map((c) => {
        const on = filters.categories.has(c);
        return (
          <button
            key={c}
            className="btn"
            aria-pressed={on}
            onClick={() => dispatch({ type: "categoryToggled", category: c })}
            style={{ borderColor: on ? categoryColor(c) : undefined, background: on ? categoryColor(c) : undefined, color: on ? "white" : undefined }}
          >
            {c}
          </button>
        );
      })}
      <button className="btn" onClick={() => dispatch({ type: "reset" })} disabled={!active}>
        Reset filters
      </button>
      {filters.dateRange && (
        <span className="muted">
          {dateFmt(filters.dateRange[0])} – {dateFmt(filters.dateRange[1])}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// KPIs
// ============================================================================
function KpiRow() {
  const filtered = useFilteredOrders();
  const filters = useFilters();
  const withoutDate = useFilteredOrders("dateRange");

  const kpis = useMemo(() => {
    const revenue = d3.sum(filtered, (o) => o.revenue);
    const n = filtered.length;
    const byCat = d3.rollups(filtered, (v) => d3.sum(v, (o) => o.revenue), (o) => o.category).sort((a, b) => b[1] - a[1]);

    // Previous equal-length period (only meaningful when a date range is set)
    let prev: Order[] | null = null;
    if (filters.dateRange) {
      const [a, b] = filters.dateRange;
      const len = +b - +a;
      const pa = new Date(+a - len);
      prev = withoutDate.filter((o) => o.date >= pa && o.date < a);
    }
    const prevRevenue = prev ? d3.sum(prev, (o) => o.revenue) : null;
    const prevN = prev ? prev.length : null;

    const weeksRevenue = weeklySeries(filtered).map((w) => w.value);
    const weeksOrders = weeklySeries(filtered, (v) => v.length).map((w) => w.value);
    const weeksAov = weeklySeries(filtered, (v) => (v.length ? d3.sum(v, (o) => o.revenue) / v.length : 0)).map((w) => w.value);
    const trim = (xs: number[]) => (filters.dateRange ? xs.filter((_, i) => allWeeks[i] >= d3.timeWeek.floor(filters.dateRange![0]) && allWeeks[i] <= filters.dateRange![1]) : xs);

    return [
      { label: "Revenue", value: money(revenue), change: prevRevenue ? revenue / prevRevenue - 1 : null, spark: trim(weeksRevenue), color: "#2f6fdf" },
      { label: "Orders", value: count(n), change: prevN ? n / prevN - 1 : null, spark: trim(weeksOrders), color: "#2c9a6a" },
      {
        label: "Avg order value",
        value: n ? moneyFull(revenue / n) : "—",
        change: prevRevenue && prevN ? revenue / n / (prevRevenue / prevN) - 1 : null,
        spark: trim(weeksAov),
        color: "#7b5cd6",
      },
      {
        label: "Top category",
        value: byCat[0]?.[0] ?? "—",
        change: null,
        spark: [] as number[],
        color: byCat[0] ? categoryColor(byCat[0][0]) : "#999",
        note: byCat[0] ? `${money(byCat[0][1])} · ${d3.format(".0%")(byCat[0][1] / (revenue || 1))} of revenue` : "",
      },
    ];
  }, [filtered, withoutDate, filters.dateRange]);

  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
      {kpis.map((k) => (
        <div key={k.label} className="card">
          <div className="muted" style={{ fontSize: 13 }}>
            {k.label}
          </div>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.label === "Top category" ? k.color : undefined }}>{k.value}</div>
              <div style={{ fontSize: 12 }} className={k.change === null ? "muted" : undefined}>
                {k.change !== null ? (
                  <span style={{ color: k.change >= 0 ? "var(--ok)" : "var(--danger)" }}>{pct(k.change)} vs prev. period</span>
                ) : "note" in k ? (
                  k.note
                ) : (
                  "select a date range to compare"
                )}
              </div>
            </div>
            {k.spark.length > 1 && <Sparkline values={k.spark} color={k.color} />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Time series + brush
// ============================================================================
const CONTEXT_H = 50;
// Module-level constants keep stable references, so <Axis> effects don't re-run on hover.
const FULL_DOMAIN = d3.extent(allWeeks) as [Date, Date];
const EVERY_MONTH = d3.timeMonth.every(1);
const monthFormat = (d: Date | d3.NumberValue) => d3.timeFormat("%b")(d as Date);
const bisectWeek = d3.bisector<WeekPoint, Date>((d) => d.week).center;

function TimeSeriesPanel() {
  const data = useFilteredOrders("dateRange"); // cross-filter: ignore our own filter
  const { dateRange } = useFilters();
  const dispatch = useFiltersDispatch();
  const [ref, dms] = useChartDimensions({ height: 330, margin: { top: 16, right: 16, bottom: 24, left: 56 } });
  const [hover, setHover] = useState<WeekPoint | null>(null);
  const brushG = useRef<SVGGElement>(null);
  const brushRef = useRef<d3.BrushBehavior<unknown> | null>(null);

  const series = useMemo(() => weeklySeries(data), [data]);
  const focusH = Math.max(0, dms.innerHeight - CONTEXT_H - 36);
  const xContext = useMemo(() => d3.scaleTime().domain(FULL_DOMAIN).range([0, dms.innerWidth]), [dms.innerWidth]);
  const yContext = useMemo(() => d3.scaleLinear().domain([0, d3.max(series, (d) => d.value) || 1]).range([CONTEXT_H, 0]), [series]);
  const focusDomain = dateRange ?? FULL_DOMAIN; // both are stable references
  const xFocus = useMemo(() => d3.scaleTime().domain(focusDomain).range([0, dms.innerWidth]), [focusDomain, dms.innerWidth]);
  const visible = useMemo(
    () => series.filter((d) => d.week >= d3.timeWeek.floor(focusDomain[0]) && d.week <= focusDomain[1]),
    [series, focusDomain],
  );
  const yFocus = useMemo(() => d3.scaleLinear().domain([0, d3.max(visible, (d) => d.value) || 1]).nice().range([focusH, 0]), [visible, focusH]);

  const onBrush = useCallback((range: [Date, Date] | null) => dispatch({ type: "dateRangeChanged", range }), [dispatch]);

  // Brush setup (re-created only on resize)
  useEffect(() => {
    if (!brushG.current || dms.innerWidth === 0) return;
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [dms.innerWidth, CONTEXT_H],
      ])
      .on("brush end", (event: d3.D3BrushEvent<unknown>) => {
        if (!event.sourceEvent) return;
        const sel = event.selection as [number, number] | null;
        onBrush(sel ? [xContext.invert(sel[0]), xContext.invert(sel[1])] : null);
      });
    brushRef.current = brush;
    const g = d3.select(brushG.current).call(brush);
    return () => {
      g.on(".brush", null);
    };
  }, [xContext, dms.innerWidth, onBrush]);

  // Keep the brush in sync with state (reset button, resize)
  useEffect(() => {
    if (!brushG.current || !brushRef.current) return;
    const target: [number, number] | null = dateRange ? [xContext(dateRange[0]), xContext(dateRange[1])] : null;
    const current = d3.brushSelection(brushG.current) as [number, number] | null;
    const same = current && target ? Math.abs(current[0] - target[0]) < 1 && Math.abs(current[1] - target[1]) < 1 : current === target;
    if (!same) d3.select(brushG.current).call(brushRef.current.move, target);
  }, [dateRange, xContext]);

  const line = d3.line<WeekPoint>().x((d) => xFocus(d.week)).y((d) => yFocus(d.value)).curve(d3.curveMonotoneX);
  const area = d3.area<WeekPoint>().x((d) => xFocus(d.week)).y0(focusH).y1((d) => yFocus(d.value)).curve(d3.curveMonotoneX);
  const contextArea = d3.area<WeekPoint>().x((d) => xContext(d.week)).y0(CONTEXT_H).y1((d) => yContext(d.value)).curve(d3.curveMonotoneX);

  function onMove(e: PointerEvent<SVGRectElement>) {
    const [mx] = d3.pointer(e, e.currentTarget);
    setHover(visible[bisectWeek(visible, xFocus.invert(mx))] ?? null);
  }

  return (
    <Panel title="Weekly revenue" subtitle="drag on the mini timeline to select dates">
      <div ref={ref} className="chart-wrapper">
        {dms.width > 0 && focusH > 0 && (
          <>
            <svg width={dms.width} height={dms.height} className="chart" role="img" aria-label="Weekly revenue over 2025">
              <defs>
                <clipPath id="capstone-clip">
                  <rect width={dms.innerWidth} height={focusH} />
                </clipPath>
              </defs>
              <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
                <Axis orientation="left" scale={yFocus} gridSize={dms.innerWidth} ticks={5} duration={250} />
                <Axis orientation="left" scale={yFocus} ticks={5} tickFormat={moneyAxis} duration={250} />
                <Axis orientation="bottom" scale={xFocus} transform={`translate(0,${focusH})`} ticks={Math.max(2, Math.floor(dms.innerWidth / 90))} duration={0} />
                <g clipPath="url(#capstone-clip)">
                  <path d={area(series) ?? ""} fill="#2f6fdf" fillOpacity={0.12} />
                  <path d={line(series) ?? ""} fill="none" stroke="#2f6fdf" strokeWidth={2} />
                </g>
                {hover && (
                  <g pointerEvents="none">
                    <line x1={xFocus(hover.week)} x2={xFocus(hover.week)} y2={focusH} stroke="currentColor" strokeOpacity={0.35} />
                    <circle cx={xFocus(hover.week)} cy={yFocus(hover.value)} r={4.5} fill="#2f6fdf" stroke="var(--surface)" strokeWidth={2} />
                  </g>
                )}
                <rect width={dms.innerWidth} height={focusH} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />

                <g transform={`translate(0,${focusH + 36})`}>
                  <path d={contextArea(series) ?? ""} fill="#2f6fdf" fillOpacity={0.25} />
                  <Axis orientation="bottom" scale={xContext} transform={`translate(0,${CONTEXT_H})`} ticks={EVERY_MONTH} tickFormat={monthFormat} duration={0} />
                  <g ref={brushG} />
                </g>
              </g>
            </svg>
            {hover && (
              <Tooltip x={dms.margin.left + xFocus(hover.week)} y={dms.margin.top + yFocus(hover.value)} containerWidth={dms.width}>
                <div className="muted">Week of {dateFmt(hover.week)}</div>
                <strong>{moneyFull(hover.value)}</strong>
              </Tooltip>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}

// ============================================================================
// Category donut
// ============================================================================
function CategoryDonut() {
  const data = useFilteredOrders("categories");
  const { categories } = useFilters();
  const dispatch = useFiltersDispatch();
  const [hovered, setHovered] = useState<Category | null>(null);
  const [ref, dms] = useChartDimensions({ height: 260, margin: { top: 0, right: 0, bottom: 0, left: 0 } });

  const totals = useMemo(
    () => CATEGORIES.map((c) => ({ category: c, revenue: d3.sum(data, (o) => (o.category === c ? o.revenue : 0)) })),
    [data],
  );
  const total = d3.sum(totals, (t) => t.revenue);
  const r = Math.min(dms.width, dms.height) / 2 - 6;
  const arcs = d3.pie<(typeof totals)[number]>().value((d) => d.revenue).sort(null).padAngle(0.02)(totals);
  const arc = d3.arc<d3.PieArcDatum<(typeof totals)[number]>>().innerRadius(r * 0.58).outerRadius(r).cornerRadius(3);
  const active = hovered ? totals.find((t) => t.category === hovered)! : null;
  const isSelected = (c: Category) => categories.size === 0 || categories.has(c);

  const onKey = (e: KeyboardEvent, c: Category) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dispatch({ type: "categoryToggled", category: c });
    }
  };

  return (
    <Panel title="Revenue by category" subtitle="click a slice to filter">
      <div ref={ref}>
        {dms.width > 0 && r > 0 &&
          (total === 0 ? (
            <EmptyState />
          ) : (
            <svg width={dms.width} height={dms.height} role="img" aria-label="Revenue share by category">
              <g transform={`translate(${dms.width / 2},${dms.height / 2})`}>
                {arcs.map((a) => (
                  <path
                    key={a.data.category}
                    d={arc(a)!}
                    fill={categoryColor(a.data.category)}
                    opacity={isSelected(a.data.category) ? (hovered && hovered !== a.data.category ? 0.6 : 1) : 0.2}
                    tabIndex={0}
                    role="button"
                    aria-label={`${a.data.category}: ${money(a.data.revenue)}`}
                    aria-pressed={categories.has(a.data.category)}
                    onClick={() => dispatch({ type: "categoryToggled", category: a.data.category })}
                    onKeyDown={(e) => onKey(e, a.data.category)}
                    onPointerEnter={() => setHovered(a.data.category)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(a.data.category)}
                    onBlur={() => setHovered(null)}
                    style={{ cursor: "pointer", outline: "none", transition: "opacity 150ms" }}
                  />
                ))}
                <text textAnchor="middle" dy="-0.1em" style={{ fontSize: 20, fontWeight: 700 }}>
                  {money(active ? active.revenue : total)}
                </text>
                <text textAnchor="middle" dy="1.3em" className="muted">
                  {active ? `${active.category} · ${d3.format(".0%")(active.revenue / total)}` : "total"}
                </text>
              </g>
            </svg>
          ))}
      </div>
    </Panel>
  );
}

// ============================================================================
// Region bars
// ============================================================================
function RegionBars() {
  const data = useFilteredOrders("regions");
  const { regions } = useFilters();
  const dispatch = useFiltersDispatch();
  const [ref, dms] = useChartDimensions({ height: 260, margin: { top: 10, right: 60, bottom: 24, left: 60 } });

  const totals = useMemo(
    () => REGIONS.map((r) => ({ region: r, revenue: d3.sum(data, (o) => (o.region === r ? o.revenue : 0)) })).sort((a, b) => b.revenue - a.revenue),
    [data],
  );
  const y = d3.scaleBand<Region>().domain(totals.map((t) => t.region)).range([0, dms.innerHeight]).padding(0.25);
  const x = useMemo(() => d3.scaleLinear().domain([0, d3.max(totals, (t) => t.revenue) || 1]).nice().range([0, dms.innerWidth]), [totals, dms.innerWidth]);
  const isSelected = (r: Region) => regions.size === 0 || regions.has(r);

  return (
    <Panel title="Revenue by region" subtitle="click a bar to filter">
      <div ref={ref}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} className="chart" role="img" aria-label="Revenue by region">
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              <Axis orientation="bottom" scale={x} gridSize={dms.innerHeight} ticks={4} transform={`translate(0,${dms.innerHeight})`} />
              <Axis orientation="bottom" scale={x} ticks={4} tickFormat={moneyAxis} transform={`translate(0,${dms.innerHeight})`} />
              {totals.map((t) => (
                <g
                  key={t.region}
                  // CSS transform so the reordering animates
                  style={{ transform: `translate(0px, ${y(t.region)}px)`, transition: "transform 400ms ease", cursor: "pointer", outline: "none" }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={regions.has(t.region)}
                  aria-label={`${t.region}: ${money(t.revenue)}`}
                  onClick={() => dispatch({ type: "regionToggled", region: t.region })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      dispatch({ type: "regionToggled", region: t.region });
                    }
                  }}
                  opacity={isSelected(t.region) ? 1 : 0.25}
                >
                  <text x={-8} y={y.bandwidth() / 2} dy="0.35em" textAnchor="end">
                    {t.region}
                  </text>
                  <rect width={x(t.revenue)} height={y.bandwidth()} rx={3} fill={regionColor(t.region)} style={{ transition: "width 400ms ease" }} />
                  <text x={x(t.revenue) + 6} y={y.bandwidth() / 2} dy="0.35em" style={{ fontWeight: 600 }}>
                    {money(t.revenue)}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        )}
      </div>
    </Panel>
  );
}

// ============================================================================
// Top products
// ============================================================================
type SortKey = "product" | "category" | "orders" | "units" | "revenue";

function TopProductsTable() {
  const data = useFilteredOrders();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "revenue", dir: -1 });

  const rows = useMemo(() => {
    const grouped = d3.rollups(
      data,
      (v) => ({ orders: v.length, units: d3.sum(v, (o) => o.quantity), revenue: d3.sum(v, (o) => o.revenue), category: v[0].category }),
      (o) => o.product,
    ).map(([product, s]) => ({ product, ...s }));
    const top = grouped.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    return top.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
    });
  }, [data, sort]);

  const maxRevenue = d3.max(rows, (r) => r.revenue) || 1;
  const header = (key: SortKey, label: string, align: "left" | "right" = "left") => (
    <th
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === "product" || key === "category" ? 1 : -1 }))}
      style={{ cursor: "pointer", textAlign: align, padding: "4px 8px", userSelect: "none", whiteSpace: "nowrap" }}
      aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
    >
      {label} {sort.key === key ? (sort.dir === 1 ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <Panel title="Top 10 products" subtitle={`${count(data.length)} orders in view`}>
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {header("product", "Product")}
                {header("category", "Category")}
                {header("orders", "Orders", "right")}
                {header("units", "Units", "right")}
                {header("revenue", "Revenue", "right")}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.product} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "4px 8px" }}>{r.product}</td>
                  <td style={{ padding: "4px 8px", color: categoryColor(r.category) }}>{r.category}</td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>{count(r.orders)}</td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>{count(r.units)}</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <svg width={60} height={8} style={{ marginRight: 8 }} aria-hidden>
                      <rect width={60 * (r.revenue / maxRevenue)} height={8} rx={2} fill={categoryColor(r.category)} />
                    </svg>
                    {moneyFull(r.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ============================================================================
// Layout
// ============================================================================
export default function SalesDashboard() {
  return (
    <DashboardProvider>
      <div className="stack">
        <h3 style={{ margin: 0 }}>Sales 2025 · {count(orders.length)} orders</h3>
        <FilterBar />
        <KpiRow />
        <TimeSeriesPanel />
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <CategoryDonut />
          <RegionBars />
        </div>
        <TopProductsTable />
      </div>
    </DashboardProvider>
  );
}
