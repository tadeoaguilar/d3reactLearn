# Module 04 — useEffect

> **An effect lets a component synchronize with something *outside* React**: the browser (title, timers, event listeners, `ResizeObserver`), the network (fetch), or a non-React library (**D3**, maps, video players).

If you only take one idea from this module, take this one: **effects are for synchronization, not for reacting to events and not for computing values.**

## 1. Where effects fit in the render cycle

```
  state/props change
        │
        ▼
  ┌───────────┐   React calls your component function.
  │  RENDER   │   It must be PURE: compute JSX and nothing else.
  └─────┬─────┘   (no fetch, no DOM changes, no timers)
        ▼
  ┌───────────┐
  │  COMMIT   │   React updates the real DOM.
  └─────┬─────┘
        ▼
  ┌───────────┐   The browser paints the screen.
  │   PAINT   │
  └─────┬─────┘
        ▼
  ┌───────────┐   React runs effects. The DOM exists now, so this is
  │  EFFECTS  │   where D3 can select and change elements.
  └───────────┘
```

Rendering must be pure because React may call your component many times, pause it, or throw a render away. Side effects go into effects (or event handlers).

## 2. Syntax

```tsx
import { useEffect } from "react";

useEffect(() => {
  // setup: runs after the render is committed to the screen
  const id = setInterval(tick, 1000);

  return () => {
    // cleanup: runs before the next setup and when the component unmounts
    clearInterval(id);
  };
}, [/* dependencies */]);
```

## 3. The dependency array

| Form | When setup runs | Typical use |
| --- | --- | --- |
| `useEffect(fn)` | after **every** render | rare, usually a mistake |
| `useEffect(fn, [])` | once after mount; cleanup on unmount | subscribe to window events, create a D3 simulation |
| `useEffect(fn, [a, b])` | after mount, and again whenever `a` or `b` changed (compared with `Object.is`) | refetch when `userId` changes; redraw when `data` changes |

**Every reactive value the effect reads must be listed.** Reactive values are props, state, and anything computed from them in the component body. The `react-hooks/exhaustive-deps` ESLint rule checks this for you.

```tsx
function Chart({ data, color }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    drawWithD3(ref.current!, data, color);
  }, [data, color]);   // ✅ both are read inside, so both are listed
}
```

> ❗ Don't lie about dependencies to make an effect "run once". If you leave something out, the effect uses a **stale** value from an old render. Fix the design instead (functional updates, moving code inside the effect, `useRef`, or removing the effect).

### Objects and functions as dependencies

`{}` !== `{}`. An object or function created during render is **new on every render**, so an effect that depends on it runs every render:

```tsx
const options = { threshold: 0.5 };          // new object every render
useEffect(() => { … }, [options]);            // ❌ runs every render

// Fixes:
// 1. Depend on primitives:     [options.threshold]
// 2. Move the object inside the effect
// 3. Memoize it:               const options = useMemo(() => ({ threshold }), [threshold]);   (Module 06)
```

## 4. Cleanup: the part people forget

Each effect should **undo** what it did:

| Setup | Cleanup |
| --- | --- |
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| `addEventListener` | `removeEventListener` (same function reference!) |
| `new ResizeObserver(...).observe(el)` | `observer.disconnect()` |
| `fetch` | `controller.abort()` or an `ignore` flag |
| `d3.forceSimulation(...)` | `simulation.stop()` |
| `d3.select(el).on("mousemove", ...)` | `.on("mousemove", null)` |
| `d3.zoom()` on an element | `selection.on(".zoom", null)` |

The sequence when a dependency changes:

```
render #1 → setup(#1)
render #2 (deps changed) → cleanup(#1) → setup(#2)
unmount   → cleanup(#2)
```

## 5. StrictMode runs your effect twice (on purpose)

In development, `<StrictMode>` (see `src/main.tsx`) mounts every component, **unmounts it, and mounts it again**. So you'll see:

```
setup → cleanup → setup
```

This is a **test**: if your effect breaks when it runs twice (two intervals, duplicated SVG elements, two fetches that both write to state), you're missing a cleanup. Production builds run the effect only once.

> Classic D3 bug: an effect that does `d3.select(svg).append("g")` without cleanup. In StrictMode you get **two** `<g>`s and a doubled chart. The fix is either a cleanup that removes it, or the **join** pattern (Module 09), which is safe to run many times.

## 6. Fetching data correctly

```tsx
type State<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

function UserDetails({ userId }: { userId: number }) {
  const [state, setState] = useState<State<User>>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<User>;
      })
      .then((data) => setState({ status: "success", data }))
      .catch((err) => {
        if (err.name !== "AbortError") setState({ status: "error", error: String(err) });
      });

    return () => controller.abort();   // cancel if userId changes or we unmount
  }, [userId]);
  …
}
```

### Race conditions

Say the user clicks user 1, then user 2 right away. If request 1 finishes **after** request 2, a naive effect shows user 1's data under user 2's name. The cleanup (abort, or an `ignore = true` flag) fixes this: when `userId` changes, the old request is cancelled or its result ignored. Example 03 shows the bug and the fix side by side.

> In production apps, a data library (TanStack Query, SWR) or a framework's loader handles caching, deduplication and retries. Learn the manual way first so you understand what they do.

## 7. You might not need an effect

Effects are an **escape hatch**. Many beginner effects should just be code in the render body or an event handler.

### ❌ Derived state in an effect

```tsx
const [filtered, setFiltered] = useState<Item[]>([]);
useEffect(() => {
  setFiltered(items.filter((i) => i.active));
}, [items]);
```

This renders twice (first with stale `filtered`, then with the right one) and adds code that can break.

### ✅ Compute during render

```tsx
const filtered = items.filter((i) => i.active);
// if it's expensive: const filtered = useMemo(() => items.filter(...), [items]);
```

### ❌ Event logic in an effect

```tsx
useEffect(() => {
  if (submitted) { post(form); showToast(); }
}, [submitted]);
```

### ✅ Do it in the event handler

```tsx
function handleSubmit() { post(form); showToast(); }
```

### ❌ Resetting state when a prop changes

```tsx
useEffect(() => { setComment(""); }, [postId]);
```

### ✅ Give the component a `key`

```tsx
<CommentBox key={postId} />   // new key = fresh component = fresh state
```

**Decision guide:**

```
Is it caused by a specific user action?          → event handler
Can it be computed from props/state?             → compute during render (useMemo if slow)
Must it stay in sync with something outside React
(DOM API, network, timer, D3, third-party lib)?  → useEffect ✅
```

## 8. `useEffect` and D3: a preview

Here's the pattern you'll use in Module 10 when D3 controls part of the DOM:

```tsx
function Axis({ scale }: { scale: d3.ScaleLinear<number, number> }) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    d3.select(ref.current!).call(d3.axisBottom(scale));   // D3 draws into the <g> React made
  }, [scale]);                                              // redraw when the scale changes
  return <g ref={ref} />;
}
```

React creates the `<g>`. After commit, the effect gives it to D3. When `scale` changes, the effect runs again, and `axisBottom` updates the ticks in place.

## Common mistakes

| Symptom | Likely cause |
| --- | --- |
| Infinite render loop | The effect sets state that is in its own dependency list, or there's an object/function dependency that is new every render |
| Value inside `setInterval` never updates | A stale closure: use `setX(x => x + 1)` or add the dependency |
| Doubled D3 elements / two timers in dev | Missing cleanup (StrictMode made it visible) |
| Old data flashes, then new data | A race condition: abort, or ignore stale responses |
| "Can't perform a React state update on an unmounted component" | Missing cleanup for an async task |

## ✅ Checklist

- [ ] I can explain when an effect runs relative to render and paint
- [ ] I list every reactive value in the dependency array
- [ ] Every effect that subscribes/starts something has a cleanup
- [ ] I understand why StrictMode runs effects twice in dev
- [ ] I can fetch data with loading/error states and no race condition
- [ ] I can spot an effect that should be a derived value or an event handler
