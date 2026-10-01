# React + D3 Cheat Sheet

A one-page reference for the patterns used throughout this course.

## React hooks

| Hook | Use it for | Remember |
| --- | --- | --- |
| `useState(init)` | values shown on screen | `setX(prev => …)` when the next value depends on the previous one; never mutate |
| `useEffect(fn, deps)` | syncing with things **outside** React (DOM APIs, network, timers, D3 behaviors) | list every reactive value in `deps`; return a cleanup |
| `useLayoutEffect` | measuring the DOM before paint | default to `useEffect` unless you see a flicker |
| `useRef(init)` | DOM nodes; mutable values that shouldn't re-render (timers, simulations) | don't read or write `.current` during render |
| `useMemo(fn, deps)` | expensive derivations; stable references (scales!) | only for pure computation |
| `useCallback(fn, deps)` | stable function props for `memo` children / effect deps | state setters and `dispatch` are already stable |
| `memo(Component)` | skip re-rendering when props are equal | useless if you pass new objects/functions every render |
| `useReducer(reducer, init)` | related state with many transitions | the reducer is pure; actions are a discriminated union |
| `useContext(Ctx)` | app-wide values without prop drilling | every consumer re-renders when the value changes |
| `useSyncExternalStore(sub, get)` | external stores, browser APIs | `get` must return a stable snapshot |
| `useTransition` / `useDeferredValue` | keeping input responsive during slow renders | pair `useDeferredValue` with `memo` |

**Effect cleanup table**

| Setup | Cleanup |
| --- | --- |
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| `addEventListener` | `removeEventListener` (same function) |
| `new ResizeObserver` | `.disconnect()` |
| `fetch` | `AbortController.abort()` |
| `requestAnimationFrame` | `cancelAnimationFrame` |
| `d3.forceSimulation` | `.stop()` |
| `d3.brush` / `d3.zoom` on a selection | `.on(".brush", null)` / `.on(".zoom", null)` |
| feed / socket subscription | `unsubscribe()` / `socket.close()` |

## D3 with React: who owns what

| D3 module | Where it goes |
| --- | --- |
| `d3-scale`, `d3-shape`, `d3-array`, `d3-format`, `d3-time`, `d3-hierarchy`, `d3-geo`, `d3-delaunay`, `d3-quadtree` | **in render** (pure math, usually `useMemo`) |
| `d3-axis` | `<g ref>` + effect (or write the axis in JSX) |
| `d3-brush`, `d3-zoom`, `d3-drag` | `<g ref>` / `<svg ref>` + effect; results go into **React state** |
| `d3-transition` | effect on a ref, animating attributes React **doesn't** set |
| `d3-force` | simulation in a ref, created in an effect, `setTick` on tick, `stop()` in cleanup |
| `d3-selection` (joins) | only when D3 owns a whole container (Strategy A) |

## Chart recipe

```tsx
const [ref, dms] = useChartDimensions({ height: 300 });                       // 1. size
const x = useMemo(() => d3.scaleBand().domain(ids).range([0, dms.innerWidth]).padding(0.2), [ids, dms.innerWidth]);   // 2. scales
const y = useMemo(() => d3.scaleLinear().domain([0, max]).nice().range([dms.innerHeight, 0]), [max, dms.innerHeight]);

return (
  <div ref={ref}>
    {dms.width > 0 && (
      <svg width={dms.width} height={dms.height} role="img" aria-label="…">
        <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>       {/* 3. margin convention */}
          <Axis orientation="left" scale={y} />                                 {/* 4. axes */}
          <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} />
          {data.map((d) => (                                                    /* 5. marks, keyed */
            <rect key={d.id} x={x(d.id)} y={y(d.v)} width={x.bandwidth()} height={dms.innerHeight - y(d.v)} />
          ))}
        </g>
      </svg>
    )}
  </div>
);
```

## Scales at a glance

| Data | Scale |
| --- | --- |
| numbers → pixels | `scaleLinear` (`.nice()`) |
| dates → pixels | `scaleTime` |
| categories → bands | `scaleBand` (`.bandwidth()`) |
| categories → points | `scalePoint` |
| categories → colors | `scaleOrdinal(d3.schemeTableau10)` |
| numbers → circle radius | `scaleSqrt` (so area is proportional) |
| numbers → color ramp | `scaleSequential(d3.interpolateViridis)` |
| numbers → N color classes | `scaleQuantize` / `scaleQuantile` / `scaleThreshold` |

## Interaction snippets

```ts
const [mx, my] = d3.pointer(event, event.currentTarget);         // pointer in local coordinates
const date = x.invert(mx);                                        // pixels → data
const i = d3.bisector((d: P) => d.date).center(data, date);       // nearest in 1D
const j = d3.Delaunay.from(data, fx, fy).find(mx, my);            // nearest in 2D
const k = d3.quadtree(data, fx, fy).find(mx, my, 10);             // nearest within 10px
const zx = transform.rescaleX(x);                                  // zoomed scale
```

## Formatting

```ts
d3.format(",.0f")(1234567)   // "1,234,567"
d3.format("$,.2f")(12.5)     // "$12.50"
d3.format("~s")(1_500_000)   // "1.5M"
d3.format(".0%")(0.256)      // "26%"
d3.format("+.1%")(-0.031)    // "−3.1%"
d3.timeFormat("%b %d, %Y")   // "Jan 05, 2025"
```

## Performance ladder

1. Don't store derived data in state
2. `useMemo` scales, layouts and indexes
3. `memo` static layers; keep hover state small and local, or in a selector store
4. Batch streaming updates to `requestAnimationFrame`
5. Move thousands of marks to `<canvas>`, with an SVG overlay for axes and highlights
