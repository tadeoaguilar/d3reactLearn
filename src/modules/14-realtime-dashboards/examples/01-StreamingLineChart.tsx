/**
 * Example 14.01: a streaming line chart.
 *
 *   - subscribes to a fake feed in an effect (cleanup = unsubscribe)
 *   - buffers events in a ref and flushes them ONCE per animation frame
 *   - keeps a sliding window of the last 30 seconds
 *   - moves the x domain with the clock every frame, so it scrolls smoothly
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { createMetricFeed, pushWindow, type MetricEvent } from "../../../shared/stream";

const WINDOW_MS = 30_000;
const CAPACITY = 2_000;
const timeFmt = d3.timeFormat("%H:%M:%S");
const pctFmt = (v: d3.NumberValue) => `${v}%`;

export default function StreamingLineChart() {
  const [ref, dms] = useChartDimensions({ height: 320, margin: { right: 70 } });
  const feed = useMemo(() => createMetricFeed({ intervalMs: 100 }), []);
  const [points, setPoints] = useState<MetricEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(10); // events per second
  const bufferRef = useRef<MetricEvent[]>([]);
  const statsRef = useRef({ events: 0, frames: 0, since: performance.now() });
  const [stats, setStats] = useState({ eventsPerSec: 0, rendersPerSec: 0 });

  // Change the feed rate without re-subscribing
  useEffect(() => feed.setInterval(1000 / rate), [feed, rate]);

  // 1. Subscribe: push into a buffer, never setState per message
  useEffect(() => {
    if (paused) return;
    const unsubscribe = feed.subscribe((e) => {
      bufferRef.current.push(e);
      statsRef.current.events++;
    });
    return unsubscribe;
  }, [feed, paused]);

  // 2. One flush per animation frame
  useEffect(() => {
    if (paused) return;
    let frame = requestAnimationFrame(function flush() {
      const batch = bufferRef.current.splice(0);
      if (batch.length) setPoints((prev) => pushWindow(prev, batch, CAPACITY).filter((p) => p.time > Date.now() - WINDOW_MS - 1000));
      setNow(Date.now());
      statsRef.current.frames++;

      const s = statsRef.current;
      const elapsed = performance.now() - s.since;
      if (elapsed > 1000) {
        setStats({ eventsPerSec: Math.round((s.events * 1000) / elapsed), rendersPerSec: Math.round((s.frames * 1000) / elapsed) });
        statsRef.current = { events: 0, frames: 0, since: performance.now() };
      }
      frame = requestAnimationFrame(flush);
    });
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  // The x domain follows the clock: [now - 30s, now]
  const x = d3.scaleTime().domain([now - WINDOW_MS, now]).range([0, dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain([0, 100]).range([dms.innerHeight, 0]), [dms.innerHeight]);
  const cpuLine = d3.line<MetricEvent>().x((d) => x(d.time)).y((d) => y(d.cpu)).curve(d3.curveMonotoneX);
  const memLine = d3.line<MetricEvent>().x((d) => x(d.time)).y((d) => y(d.memory)).curve(d3.curveMonotoneX);
  const last = points.at(-1);

  return (
    <div className="stack">
      <div className="row">
        <button className="btn primary" onClick={() => setPaused((p) => !p)}>
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <label>
          feed rate {rate}/s <input type="range" min={1} max={100} value={rate} onChange={(e) => setRate(e.target.valueAsNumber)} />
        </label>
        <span className="muted">
          {stats.eventsPerSec} events/s → {stats.rendersPerSec} renders/s · {points.length} points in window
        </span>
      </div>
      <div ref={ref}>
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height} className="chart">
            <defs>
              <clipPath id="stream-clip">
                <rect width={dms.innerWidth} height={dms.innerHeight} />
              </clipPath>
            </defs>
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              <Axis orientation="left" scale={y} gridSize={dms.innerWidth} ticks={5} duration={0} />
              <Axis orientation="left" scale={y} ticks={5} tickFormat={pctFmt} duration={0} />
              <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} ticks={5} tickFormat={(d) => timeFmt(d as Date)} duration={0} />
              <g clipPath="url(#stream-clip)">
                <path d={memLine(points) ?? ""} fill="none" stroke="#2c9a6a" strokeWidth={2} />
                <path d={cpuLine(points) ?? ""} fill="none" stroke="#2f6fdf" strokeWidth={2} />
              </g>
              {/* Live value labels pinned to the right edge */}
              {last && (
                <>
                  <text x={dms.innerWidth + 6} y={y(last.cpu)} dy="0.35em" style={{ fill: "#2f6fdf", fontWeight: 600 }}>
                    CPU {last.cpu.toFixed(0)}%
                  </text>
                  <text x={dms.innerWidth + 6} y={y(last.memory)} dy="0.35em" style={{ fill: "#2c9a6a", fontWeight: 600 }}>
                    MEM {last.memory.toFixed(0)}%
                  </text>
                </>
              )}
            </g>
          </svg>
        )}
      </div>
      <p className="muted">
        Push the rate to 100/s: renders stay at about 60/s (the screen refresh rate) because events are batched per
        frame.
      </p>
    </div>
  );
}
