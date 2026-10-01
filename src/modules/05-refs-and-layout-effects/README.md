# Module 05 — Refs & Layout Effects

`useRef` is the most important hook for D3 + React work. D3 needs a **real DOM node** to work on, and a ref is how React gives you one.

## 1. `useRef` in one sentence

`useRef(initial)` returns a plain object `{ current: initial }` that **stays the same across renders**, and changing `.current` **does not cause a re-render**.

```tsx
const ref = useRef(0);
ref.current++;     // no re-render; the value is kept until the component unmounts
```

It has two jobs:

| Use | Example |
| --- | --- |
| **A. Point at a DOM element** | `<svg ref={svgRef}>`, then `d3.select(svgRef.current)` |
| **B. Keep a mutable value** that shouldn't trigger renders | interval IDs, the previous value, a D3 simulation instance, "is mounted" flags |

## 2. DOM refs

```tsx
function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  );
}
```

- **Type:** `useRef<HTMLInputElement>(null)`. The generic is the element type. Common ones: `HTMLDivElement`, `HTMLCanvasElement`, `SVGSVGElement`, `SVGGElement`, `SVGPathElement`.
- **When is `.current` set?** React sets it **after commit**, before effects run. During render it's still `null` on the first pass. **Never read DOM refs during render.** Read them in effects or event handlers.
- React sets it back to `null` when the element unmounts.

```
render (ref.current === null on mount) → commit (ref.current = <input>) → effects run (safe to use)
```

## 3. Refs for mutable values

```tsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);   // not shown on screen → ref, not state

  const start = () => {
    if (intervalRef.current !== null) return;
    intervalRef.current = window.setInterval(() => setElapsed((e) => e + 10), 10);
  };
  const stop = () => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };
  …
}
```

### Ref or state?

| | `useState` | `useRef` |
| --- | --- | --- |
| Changing it re-renders | ✅ yes | ❌ no |
| Value available in render | ✅ | ⚠️ you shouldn't read or write it during render |
| Use for | anything shown on screen | IDs, instances, previous values, DOM nodes |

**Rule:** if it affects what the user sees, use state. If it's bookkeeping, use a ref.

### Refs and D3

In Module 13 you'll keep a `d3.forceSimulation` in a ref. It's created once, it's mutable, and it shouldn't cause renders:

```tsx
const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
```

## 4. `useLayoutEffect`: effects that run before paint

```
render → commit DOM → useLayoutEffect → PAINT → useEffect
                        ↑ blocks painting            ↑ after paint
```

`useLayoutEffect` has the same API as `useEffect`, but it runs **synchronously after the DOM is updated and before the browser paints**. If it sets state, React re-renders **before** the user sees anything, so there's no flicker.

Use it when you need to **measure the DOM and then change the layout**:

- measure a container's width, then size the chart to fit (Module 10)
- measure a tooltip's size, then flip it to stay inside the viewport
- measure an SVG `<text>` with `getBBox()`, then position a background rect behind it

```tsx
const [width, setWidth] = useState(0);
useLayoutEffect(() => {
  setWidth(containerRef.current!.getBoundingClientRect().width);
}, []);
```

**Default to `useEffect`.** Switch to `useLayoutEffect` only if you see a visual flicker from measuring. It blocks painting, so slow code inside it makes the UI feel janky.

## 5. Passing refs to your own components (React 19)

In React 19, `ref` is a **regular prop** for function components:

```tsx
function FancyInput({ ref, ...props }: React.ComponentProps<"input">) {
  return <input ref={ref} className="fancy" {...props} />;
}

const r = useRef<HTMLInputElement>(null);
<FancyInput ref={r} />
```

> Older code (React ≤ 18) wraps the component in `forwardRef((props, ref) => …)`. It still works, and you'll see it in many libraries.

### `useImperativeHandle`: expose an API instead of the DOM node

```tsx
export interface ChartHandle { resetZoom(): void; exportPng(): string }

function ZoomableChart({ ref }: { ref?: React.Ref<ChartHandle> }) {
  useImperativeHandle(ref, () => ({
    resetZoom() { /* d3 zoom transition */ },
    exportPng() { /* canvas.toDataURL() */ return ""; },
  }), []);
  …
}

// parent
const chartRef = useRef<ChartHandle>(null);
<button onClick={() => chartRef.current?.resetZoom()}>Reset</button>
```

Use this sparingly. Props are usually better, but "reset zoom" or "download image" are real imperative actions.

## 6. Callback refs

Besides a ref object, you can pass a **function**. React calls it with the node on mount, and (in React 19) calls the cleanup it returns on unmount:

```tsx
<div ref={(node) => {
  if (!node) return;
  const ro = new ResizeObserver(() => console.log(node.clientWidth));
  ro.observe(node);
  return () => ro.disconnect();     // React 19: callback-ref cleanup
}} />
```

This is handy when the element appears conditionally, because the callback runs whenever the node attaches.

## Common mistakes

| Mistake | Fix |
| --- | --- |
| Reading `ref.current` during render | Read it in an effect or handler |
| `ref.current.x` → TS error "possibly null" | Check first: `if (!ref.current) return;` or use `?.` |
| Storing on-screen values in a ref (the UI doesn't update) | Use state |
| `useRef<SVGSVGElement>()` without `null` | Pass `null` for DOM refs: `useRef<SVGSVGElement>(null)` |
| Measuring in `useEffect` causes a one-frame jump | Use `useLayoutEffect` |

## ✅ Checklist

- [ ] I can attach a ref to a DOM/SVG element and use it in an effect
- [ ] I know when to pick a ref over state
- [ ] I understand the render → commit → layout effect → paint → effect order
- [ ] I can pass a ref to a child component (React 19 style)
