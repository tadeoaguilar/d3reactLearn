/**
 * Exercise 14.1: reference solution.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { createMetricFeed, pushWindow, type Feed, type MetricEvent } from "../../../../shared/stream";
import { palette } from "../../../../shared/theme";

// ---------------------------------------------------------------------------
// A. The hook
// ---------------------------------------------------------------------------
function useFeedWindow(feed: Feed<MetricEvent>, capacity: number, { connected = true } = {}) {
  const [events, setEvents] = useState<MetricEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const buffer = useRef<MetricEvent[]>([]);

  // Subscription: only while connected and not paused
  useEffect(() => {
    if (!connected || paused) return;
    return feed.subscribe((e) => buffer.current.push(e));
  }, [feed, connected, paused]);

  // One flush per frame
  useEffect(() => {
    if (paused) return;
    let frame = requestAnimationFrame(function flush() {
      if (buffer.current.length) {
        const batch = buffer.current.splice(0);
        setEvents((prev) => pushWindow(prev, batch, capacity));
        setLastEventAt(batch[batch.length - 1].time);
      }
      frame = requestAnimationFrame(flush);
    });
    return () => cancelAnimationFrame(frame);
  }, [paused, capacity]);

  return { events, lastEventAt, paused, setPaused };
}

// ---------------------------------------------------------------------------
// B. Cards
// ---------------------------------------------------------------------------
function Sparkline({ values, color, width = 140, height = 36 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} />;
  const x = d3.scaleLinear().domain([0, values.length - 1]).range([0, width]);
  const y = d3.scaleLinear().domain(d3.extent(values) as [number, number]).nice().range([height - 2, 2]);
  return (
    <svg width={width} height={height} aria-hidden>
      <path d={d3.area<number>().x((_, i) => x(i)).y0(height).y1((v) => y(v))(values)!} fill={color} fillOpacity={0.12} />
      <path d={d3.line<number>().x((_, i) => x(i)).y((v) => y(v))(values)!} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={width} cy={y(values[values.length - 1])} r={2.5} fill={color} />
    </svg>
  );
}

interface KpiCardProps {
  label: string;
  events: MetricEvent[];
  value: (e: MetricEvent) => number;
  format: (v: number) => string;
  color: string;
  warnAbove?: number;
  alertAbove?: number;
}

function KpiCard({ label, events, value, format, color, warnAbove, alertAbove }: KpiCardProps) {
  const last = events.at(-1);
  const current = last ? value(last) : 0;

  // Time-based comparison: the latest event at least 5s older than the newest
  const bisect = d3.bisector<MetricEvent, number>((e) => e.time).right;
  const past = last ? events[Math.max(0, bisect(events, last.time - 5000) - 1)] : undefined;
  const delta = past ? current - value(past) : 0;

  const status = alertAbove !== undefined && current > alertAbove ? "alert" : warnAbove !== undefined && current > warnAbove ? "warn" : "ok";
  const statusColor = { ok: color, warn: "#d99a1e", alert: "#c43d3d" }[status];

  return (
    <div className="card" style={{ borderLeft: `4px solid ${statusColor}` }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted" style={{ fontSize: 13 }}>
          {label}
        </span>
        {status !== "ok" && <span style={{ fontSize: 11, color: statusColor, fontWeight: 700 }}>{status.toUpperCase()}</span>}
      </div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{last ? format(current) : "—"}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {delta >= 0 ? "▲" : "▼"} {format(Math.abs(delta))} vs 5s ago
          </div>
        </div>
        <Sparkline values={events.slice(-100).map(value)} color={statusColor} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C + D
// ---------------------------------------------------------------------------
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function LiveKpiCards() {
  const feed = useMemo(() => createMetricFeed({ intervalMs: 120 }), []);
  const [outage, setOutage] = useState(false);
  const { events, lastEventAt, paused, setPaused } = useFeedWindow(feed, 500, { connected: !outage });
  const now = useNow(500);

  const stale = !paused && (lastEventAt === null ? false : now - lastEventAt > 2000);
  const status = paused
    ? { text: "⏸ paused", color: "var(--muted)" }
    : stale
      ? { text: `⚠ stale (${Math.round((now - lastEventAt!) / 1000)}s since last event)`, color: "var(--danger)" }
      : { text: "● live", color: "var(--ok)" };

  const pct = (v: number) => `${v.toFixed(0)}%`;

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => setPaused((p) => !p)}>
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button className="btn" onClick={() => setOutage((o) => !o)}>
          {outage ? "End outage" : "Simulate outage"}
        </button>
        <strong style={{ color: status.color }}>{status.text}</strong>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        <KpiCard label="CPU" events={events} value={(e) => e.cpu} format={pct} color={palette[0]} warnAbove={65} alertAbove={80} />
        <KpiCard label="Memory" events={events} value={(e) => e.memory} format={pct} color={palette[2]} warnAbove={75} alertAbove={90} />
        <KpiCard label="Latency" events={events} value={(e) => e.latency} format={(v) => `${v.toFixed(0)} ms`} color={palette[4]} warnAbove={200} alertAbove={350} />
        <KpiCard label="Requests" events={events} value={(e) => e.requests} format={(v) => v.toFixed(0)} color={palette[1]} />
      </div>
    </div>
  );
}
