/**
 * Exercise 14.1: Live KPI cards. See README.md.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { createMetricFeed, pushWindow, type Feed, type MetricEvent } from "../../../../shared/stream";
import { palette } from "../../../../shared/theme";

// TODO A: useFeedWindow(feed, capacity)

// TODO B: Sparkline + KpiCard

export default function LiveKpiCards() {
  const feed = useMemo(() => createMetricFeed({ intervalMs: 120 }), []);
  const [outage, setOutage] = useState(false);

  // TODO A: const { events, lastEventAt, paused, setPaused } = useFeedWindow(feed, 500);
  // Hint for "outage": subscribe only while !outage, but keep the UI running.

  // TODO C: now clock + live / paused / stale indicator

  return (
    <div className="stack">
      <div className="row">
        <button className="btn">⏸ Pause</button>
        <button className="btn" onClick={() => setOutage((o) => !o)}>
          {outage ? "End outage" : "Simulate outage"}
        </button>
        {/* TODO C: status indicator */}
      </div>
      {/* TODO D: grid of four KpiCards */}
      <div className="todo-hint">KPI cards go here</div>
    </div>
  );
}
