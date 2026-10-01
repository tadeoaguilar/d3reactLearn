# Module 14 — Real-time Dashboards

Dashboards combine everything so far: several charts, shared filters, live data, and more data than a naive implementation can handle. This module covers the three hard parts:

1. **Streaming data**: new points arrive constantly
2. **Linked views**: interacting with one chart updates the others
3. **Scale**: tens of thousands of marks at 60 fps

---

## 1. Streaming data

### The data source

Real feeds are WebSockets, Server-Sent Events, or polling. They all look alike to React: an **external source you subscribe to** in an effect:

```tsx
useEffect(() => {
  const socket = new WebSocket(url);
  socket.onmessage = (msg) => handle(JSON.parse(msg.data));
  return () => socket.close();              // cleanup!
}, [url]);
```

`src/shared/stream.ts` has a fake feed (`createMetricFeed`) with the same subscribe/unsubscribe shape.

### Keep a sliding window

Don't let arrays grow forever. Keep the last *N* points, or the last *T* seconds:

```ts
setPoints((prev) => pushWindow(prev, event, 300));     // last 300 events
// or by time:
setPoints((prev) => [...prev, event].filter((p) => p.time > Date.now() - 60_000));
```

### Batch updates to animation frames

A feed can fire faster than the screen refreshes (60 Hz). Rendering on every message wastes work. **Buffer** incoming events in a ref and flush them once per frame:

```tsx
const bufferRef = useRef<Event[]>([]);
useEffect(() => {
  const unsubscribe = feed.subscribe((e) => bufferRef.current.push(e));   // no setState here
  let frame = requestAnimationFrame(function flush() {
    if (bufferRef.current.length) {
      const batch = bufferRef.current.splice(0);
      setPoints((prev) => pushWindow(prev, batch, CAPACITY));            // ONE render per frame
    }
    frame = requestAnimationFrame(flush);
  });
  return () => { unsubscribe(); cancelAnimationFrame(frame); };
}, []);
```

### A moving time axis

For a scrolling chart, the x domain is `[now - window, now]`, where `now` updates every frame. Points slide left smoothly even if data arrives in bursts. Let the domain end at the **newest data point** or at the **clock**, depending on whether you want gaps to show.

### Pause, rate and freshness

- **Pause** = stop applying updates (keep buffering, or drop them)
- Show a "last update: 2s ago" indicator and a stale warning. Live dashboards need it.

---

## 2. Linked views

When a selection in one chart (click a region, brush a range, hover a time) affects the others, the selection must live **above** all of them:

```
               ┌───────── dashboard store ─────────┐
               │ selectedRegion, timeRange, hover  │
               └──┬────────────┬────────────┬──────┘
             read+write     read         read
                  ▼            ▼            ▼
             <BarChart/>  <LineChart/>  <Table/>
```

Options, from simplest to most scalable:

| Approach | Good for |
| --- | --- |
| Lift state to the dashboard component + props | 2–3 charts |
| Reducer + context (Module 07) | a medium dashboard |
| An external store + `useSyncExternalStore` with **selectors** | many charts and high-frequency state (hover) |

**Hover** is special: it changes about 60 times per second. With context, *every* consumer re-renders on every move. A store with selectors lets each chart re-render only when *its* slice changes:

```tsx
function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}
const hoveredTime = useStore((s) => s.hoveredTime);    // re-renders only when hoveredTime changes
```

(This is what Zustand's `useStore(selector)` does.) The selector must return a primitive, or the same object reference when nothing changed.

---

## 3. Rendering lots of marks: canvas

SVG creates one DOM node per mark. At around 5–10k nodes, layout, style and paint get slow, and React's reconciliation adds more cost. **Canvas** is a single bitmap: you draw pixels, and there's no DOM per mark.

| | SVG | Canvas |
| --- | --- | --- |
| Marks at 60fps | ~1–5k | ~50–500k |
| Events per element | ✅ built in | ❌ you hit-test yourself |
| CSS styling, crisp text | ✅ | manual |
| Accessibility | better | needs extra work |

**D3 works with both.** Scales, shapes and layouts don't care. `d3.line().context(ctx)` even draws straight to canvas.

### The canvas pattern

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
useEffect(() => {
  const canvas = canvasRef.current!;
  const dpr = window.devicePixelRatio || 1;        // crisp on retina screens
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  for (const d of data) {
    ctx.fillStyle = color(d.group);
    ctx.fillRect(x(d.x), y(d.y), 2, 2);            // fillRect is faster than arc() for tiny dots
  }
}, [data, width, height, x, y]);

return <canvas ref={canvasRef} style={{ width, height }} />;
```

### Hit-testing with a quadtree

```ts
const qt = d3.quadtree(data, (d) => x(d.x), (d) => y(d.y));   // useMemo
const nearest = qt.find(mx, my, 10);                          // within 10px, or undefined
```

### Hybrid layers

Stack an SVG **on top of** the canvas (both `position: absolute`) to get crisp axes, the hover highlight and the brush, with the bulk of the marks drawn on the canvas below.

---

## 4. Dashboard layout and polish

- CSS grid: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`, with each chart measuring its own cell (`useChartDimensions`)
- **KPI cards**: a big number, the change vs the previous period, and a sparkline
- Consistent colors per entity (a region has the same color in every chart)
- Show loading, empty and error states for every panel

## Performance checklist

- [ ] Batch high-frequency updates (rAF)
- [ ] Bound your arrays (sliding windows)
- [ ] `memo` static layers; hover state in the smallest possible component or a selector store
- [ ] `useMemo` scales, layouts and indexes (quadtree, Delaunay)
- [ ] Canvas beyond a few thousand marks
- [ ] Profile with React DevTools and the browser Performance panel
