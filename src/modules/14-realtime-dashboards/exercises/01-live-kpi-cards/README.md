# Exercise 14.1: Live KPI cards

Build a row of live KPI cards fed by `createMetricFeed` (from `src/shared/stream.ts`).

## Part A: `useFeedWindow(feed, capacity)`

A custom hook that:

1. subscribes to the feed in an effect (and unsubscribes in the cleanup)
2. pushes incoming events into a **ref buffer** (no `setState` per event)
3. flushes the buffer **once per animation frame** into state, keeping only the last `capacity` events (`pushWindow`)
4. returns `{ events, lastEventAt, paused, setPaused }`

## Part B: `<KpiCard>`

Props: `label`, `values: number[]`, `format`, `color`, and optional `warnAbove` / `alertAbove`.

- a big current value
- the **change over the last 5 seconds** (find the value from ~5s ago using the event timestamps, not a fixed index)
- a **sparkline** (`d3.line` + `d3.area`, about 140×36) of the last 100 values
- status colors: normal / **warning** (amber) / **alert** (red), with a colored left border

## Part C: freshness

- A "● live / ⏸ paused / ⚠ stale" indicator. The dashboard is **stale** when no event has arrived for more than 2 seconds.
- Because staleness depends on the current time, you need a clock. A 500ms interval that updates a `now` state works.

## Part D: the dashboard

Four cards (CPU, memory, latency, requests) in a responsive CSS grid, plus a pause button. To test staleness, the starter has a "Simulate outage" button that pauses the feed without pausing the UI.

## Done when

- [ ] Renders happen at most once per frame, however fast the feed is
- [ ] The 5-second change is time-based
- [ ] Warning and alert states work (CPU spikes go past 80 now and then)
- [ ] The outage button makes the indicator stale after ~2s
