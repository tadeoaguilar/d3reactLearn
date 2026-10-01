/**
 * Example 14.04: a small live operations dashboard.
 *
 * One custom hook (useMetricStream) owns the subscription and the rAF
 * batching. Every panel is a plain component that derives its own view
 * from the shared window of events. The layout is a responsive CSS grid.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { REGIONS, createMetricFeed, pushWindow, type MetricEvent } from "../../../shared/stream";
import { palette } from "../../../shared/theme";

// ---------------------------------------------------------------------------
// The data hook
// ---------------------------------------------------------------------------
function useMetricStream(capacity: number, paused: boolean) {
  const feed = useMemo(() => createMetricFeed({ intervalMs: 150 }), []);
  const [events, setEvents] = useState<MetricEvent[]>([]);
  const buffer = useRef<MetricEvent[]>([]);

  useEffect(() => {
    if (paused) return;
    const unsubscribe = feed.subscribe((e) => buffer.current.push(e));
    let frame = requestAnimationFrame(function flush() {
      if (buffer.current.length) {
        const batch = buffer.current.splice(0);
        setEvents((prev) => pushWindow(prev, batch, capacity));
      }
      frame = requestAnimationFrame(flush);
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [feed, capacity, paused]);

  return events;
}

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------
function Sparkline({ values, color, width = 120, height = 32 }: { values: number[]; color: string; width?: number; height?: number }) {
  const x = d3.scaleLinear().domain([0, Math.max(1, values.length - 1)]).range([0, width]);
  const [lo, hi] = d3.extent(values) as [number, number];
  const y = d3.scaleLinear().domain([lo ?? 0, hi ?? 1]).range([height - 2, 2]);
  const line = d3.line<number>().x((_, i) => x(i)).y((v) => y(v));
  const area = d3.area<number>().x((_, i) => x(i)).y0(height).y1((v) => y(v));
  return (
    <svg width={width} height={height}>
      <path d={area(values) ?? ""} fill={color} fillOpacity={0.12} />
      <path d={line(values) ?? ""} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

interface KpiProps {
  label: string;
  values: number[];
  format: (v: number) => string;
  color: string;
  /** above this, the KPI turns red */
  alertAbove?: number;
}

function KpiCard({ label, values, format, color, alertAbove }: KpiProps) {
  const current = values.at(-1) ?? 0;
  const previous = values.at(-21) ?? values[0] ?? 0; // ~3s ago
  const delta = current - previous;
  const alert = alertAbove !== undefined && current > alertAbove;
  return (
    <div className="card" style={{ borderColor: alert ? "var(--danger)" : undefined }}>
      <div className="muted" style={{ fontSize: 13 }}>
        {label} {alert && "⚠️"}
      </div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: alert ? "var(--danger)" : undefined }}>{format(current)}</div>
          <div style={{ fontSize: 12, color: delta >= 0 ? "var(--danger)" : "var(--ok)" }}>
            {delta >= 0 ? "▲" : "▼"} {format(Math.abs(delta))}
          </div>
        </div>
        <Sparkline values={values.slice(-80)} color={alert ? "#c43d3d" : color} />
      </div>
    </div>
  );
}

const regionColor = d3.scaleOrdinal<string, string>().domain(REGIONS).range(palette);

function RegionTraffic({ events }: { events: MetricEvent[] }) {
  const totals = d3.rollup(events, (v) => d3.sum(v, (e) => e.requests), (e) => e.region);
  const max = Math.max(1, ...totals.values());
  return (
    <div className="card">
      <strong>Requests by region (window)</strong>
      {REGIONS.map((r) => {
        const v = totals.get(r) ?? 0;
        return (
          <div key={r} style={{ marginTop: 8 }}>
            <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
              <span>{r}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{d3.format(",")(v)}</span>
            </div>
            <div style={{ height: 10, background: "var(--surface-2)", borderRadius: 5 }}>
              <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: regionColor(r), borderRadius: 5, transition: "width 300ms" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// No memo here: `latencies` is a new array every frame, so memo would never skip.
function LatencyHistogram({ latencies }: { latencies: number[] }) {
  const [ref, dms] = useChartDimensions({ height: 180, margin: { top: 10, right: 10, bottom: 28, left: 36 } });
  const x = useMemo(() => d3.scaleLinear().domain([0, 600]).range([0, dms.innerWidth]), [dms.innerWidth]);
  const bins = d3.bin().domain([0, 600]).thresholds(x.ticks(24))(latencies.map((l) => Math.min(l, 599)));
  const y = d3.scaleLinear().domain([0, Math.max(1, d3.max(bins, (b) => b.length) ?? 1)]).range([dms.innerHeight, 0]);
  const p95 = d3.quantile(latencies, 0.95) ?? 0;
  return (
    <div className="card">
      <strong>Latency distribution</strong> <span className="muted">p95 {Math.round(p95)} ms</span>
      <div ref={ref}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} className="chart">
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              {bins.map((b, i) => (
                <rect key={i} x={x(b.x0!) + 1} width={Math.max(0, x(b.x1!) - x(b.x0!) - 2)} y={y(b.length)} height={dms.innerHeight - y(b.length)} fill={b.x0! >= 300 ? "#c43d3d" : "#7b5cd6"} />
              ))}
              <line x1={x(Math.min(p95, 600))} x2={x(Math.min(p95, 600))} y2={dms.innerHeight} stroke="currentColor" strokeDasharray="3 3" />
              <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} ticks={6} duration={0} />
              <Axis orientation="left" scale={y} ticks={3} duration={0} />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function LiveDashboard() {
  const [paused, setPaused] = useState(false);
  const events = useMetricStream(400, paused);
  const cpu = events.map((e) => e.cpu);
  const mem = events.map((e) => e.memory);
  const lat = events.map((e) => e.latency);
  const rps = events.map((e) => e.requests);
  const last = events.at(-1);

  return (
    <div className="stack">
      <div className="row">
        <button className="btn primary" onClick={() => setPaused((p) => !p)}>
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <span className="muted">
          {last ? `last event ${d3.timeFormat("%H:%M:%S")(new Date(last.time))}` : "waiting for data…"} · {events.length} events in window
        </span>
      </div>
      {/* auto-fit grid: 1–4 columns depending on width */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        <KpiCard label="CPU" values={cpu} format={(v) => `${v.toFixed(0)}%`} color={palette[0]} alertAbove={80} />
        <KpiCard label="Memory" values={mem} format={(v) => `${v.toFixed(0)}%`} color={palette[2]} alertAbove={90} />
        <KpiCard label="Latency" values={lat} format={(v) => `${v.toFixed(0)} ms`} color={palette[4]} alertAbove={350} />
        <KpiCard label="Requests / tick" values={rps} format={(v) => v.toFixed(0)} color={palette[1]} />
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <RegionTraffic events={events} />
        <LatencyHistogram latencies={lat} />
      </div>
    </div>
  );
}
