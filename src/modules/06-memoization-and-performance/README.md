# Module 06 — Memoization & Performance

Charts turn a lot of data into a lot of elements, so performance matters more for data visualization than for most UI work. This module covers React's tools for **skipping work you don't need to do**.

> ⚠️ **Measure first.** Most components are fast enough without any of this. Add memoization when you can *see* a slowdown (or the React DevTools Profiler shows one), not by default.

## 1. Why components re-render

A component re-renders when:

1. its **state** changes
2. its **parent** re-renders (by default, all children re-render too, whether or not their props changed)
3. a **context** it reads changes (Module 07)

A re-render is not a DOM update. React re-runs your function, compares the new JSX with the old, and touches the DOM only where something differs. Re-renders are usually cheap. They get expensive when:

- the render does **heavy computation** (binning 100k points, building a force layout, sorting large arrays)
- the render produces **thousands of elements** (a scatter plot with 5,000 `<circle>`s)

## 2. `useMemo`: cache a computed value

```tsx
const bins = useMemo(
  () => d3.bin().thresholds(40)(values),   // runs only when `values` changes
  [values],
);
```

- The first render runs the function and stores the result.
- Later renders return the **cached** result while the dependencies are the same (`Object.is`).

Use it for:

| Use case | Example |
| --- | --- |
| Expensive calculations | binning, stats, layouts, sorting/filtering big arrays |
| **Stable references** for dependencies | an object/array passed to a `memo` child or used in an effect's deps |
| D3 scales | `const x = useMemo(() => d3.scaleLinear().domain(…).range(…), [data, width])` |

That last one matters for D3: a scale created in render is a **new object every render**, so any effect that depends on it re-runs every render. `useMemo` keeps it the same until its inputs change.

## 3. `memo`: skip re-rendering a component

```tsx
import { memo } from "react";

const Points = memo(function Points({ data, xScale, yScale }: PointsProps) {
  return <g>{data.map((d) => <circle key={d.id} cx={xScale(d.x)} cy={yScale(d.y)} r={2} />)}</g>;
});
```

`memo` makes React compare the new props with the old ones (shallowly, key by key, with `Object.is`). If all are equal, it **reuses the last render**.

It only works if the props really stay equal. These all break it:

```tsx
<Points data={data.filter(…)} />      // new array each render
<Points style={{ color: "red" }} />   // new object each render
<Points onHover={(d) => setHovered(d)} />   // new function each render
```

## 4. `useCallback`: a stable function

```tsx
const handleHover = useCallback((d: Datum | null) => setHovered(d), []);
<Points onHover={handleHover} />       // same function every render → memo works
```

`useCallback(fn, deps)` is just `useMemo(() => fn, deps)`. It's useful when:

- the function is passed to a `memo` child
- the function is a dependency of an effect

Setter functions from `useState` are **already stable**, so you never need to list or wrap them.

## 5. The typical chart case

```
Chart (state: hovered)
├── Axes           ← doesn't care about hover
├── Points (5,000 circles)  ← doesn't care about hover
└── Tooltip        ← cares about hover
```

Every mouse move sets `hovered`, so React re-renders the whole chart, including 5,000 circles, about 60 times per second. The fix:

1. `useMemo` the scales, so they keep the same reference
2. `useCallback` the hover handler
3. `memo` the `Points` component

Now only `Tooltip` re-renders on hover. Example 02 shows this.

## 6. Concurrent features: `useTransition` and `useDeferredValue`

Sometimes a render is unavoidably slow: a filter really does change 5,000 elements. React 18+ can render **urgent** updates (typing in an input) before **non-urgent** ones (redrawing the chart), so the input stays responsive.

### `useDeferredValue`

```tsx
const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query);   // "lags behind" query while React is busy

<input value={query} onChange={(e) => setQuery(e.target.value)} />   // updates instantly
<SlowChart filter={deferredQuery} />                                   // catches up when it can
```

For this to help, `SlowChart` must be wrapped in `memo`, so it skips re-rendering while `deferredQuery` hasn't changed yet.

### `useTransition`

```tsx
const [isPending, startTransition] = useTransition();

function selectTab(tab: Tab) {
  startTransition(() => setTab(tab));   // mark this update as interruptible
}
{isPending && <Spinner />}
```

Use `useTransition` when **you** trigger the update (a click handler). Use `useDeferredValue` when you **receive** a value (for example, a prop) and want a lagging copy.

## 7. React Compiler

The **React Compiler** (a build-time Babel/Vite plugin) adds `useMemo`, `useCallback` and `memo` for you automatically. If your project uses it, you rarely write them by hand. It's still worth understanding what they do, because you'll read a lot of code that uses them and you'll need to debug the cases the compiler skips.

## 8. Other performance tips for charts

| Problem | Solution |
| --- | --- |
| Thousands of SVG elements | Draw them on `<canvas>` instead (Module 14) |
| Recomputing layouts on hover | Keep hover state out of the component that does the layout |
| Big lists in the DOM | Virtualize them (e.g. `@tanstack/react-virtual`) |
| Resize storms | Debounce or throttle, or `requestAnimationFrame` |
| `d3.select(...).on("mousemove")` doing heavy work | Look up the nearest point with `d3.bisector` or `d3.quadtree` instead of scanning every point |

## Common mistakes

| Mistake | Why it's bad |
| --- | --- |
| Wrapping everything in `useMemo` | Adds memory and comparison cost, and hurts readability. It only pays off for expensive work or reference stability |
| `memo` child that still gets an inline object/function | memo never skips |
| Missing dependencies in `useMemo` | Stale values: the same bugs as with effects |
| Using `useMemo` for side effects | It's for **pure** computation. Side effects go in effects |

## ✅ Checklist

- [ ] I can list the three reasons a component re-renders
- [ ] I can memoize a D3 scale and explain why it helps
- [ ] I can make `memo` actually skip renders (stable props via `useMemo`/`useCallback`)
- [ ] I can keep an input responsive with `useDeferredValue`
