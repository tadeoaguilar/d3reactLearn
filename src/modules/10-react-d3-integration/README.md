# Module 10 — Integrating D3 with React

This is the **central module** of Part 3. Both React and D3 want to control the DOM:

- **React**: "Describe the UI and I'll create and update the elements."
- **D3 (selection)**: "Give me a node and I'll `append`, `attr` and `remove` things myself."

If both change **the same elements**, they conflict. React re-renders and wipes out D3's changes, or D3 removes nodes that React still thinks exist, and you get errors like *"Failed to execute 'removeChild' on 'Node'"*.

The fix is to **decide who owns each part of the DOM**. There are three strategies.

---

## Strategy A: D3 owns the DOM ("the ref escape hatch")

React renders an empty container. D3 does everything inside it from an effect. This is what you did in exercise 09.1.

```tsx
function Chart({ data }: { data: Datum[] }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = d3.select(ref.current!);
    // scales, joins, axes, transitions…
    svg.selectAll("rect").data(data).join("rect").attr(…);
  }, [data]);
  return <svg ref={ref} width={600} height={300} />;   // React never renders children here
}
```

| ✅ Pros | ❌ Cons |
| --- | --- |
| Paste and adapt any Observable/bl.ocks example | Two mental models in one component |
| Full access to D3 transitions, enter/exit animations | No JSX inside the chart: no React components for tooltips, labels, etc. |
| Very fast for complex animated updates | Harder to test; state lives partly in the DOM |
| | You must make the effect **idempotent** (join everything) and clean up listeners |

**Use it for:** porting existing D3 code, heavily animated charts, and D3 features that *require* owning the DOM (complex force layouts with drag, some zoom setups).

---

## Strategy B: React owns the DOM, D3 does the math ⭐ (default)

Use D3's **pure** modules (scales, shapes, layouts, arrays, formats) during render. React renders every element with JSX.

```tsx
function BarChart({ data, width, height }: Props) {
  const x = d3.scaleBand().domain(data.map((d) => d.label)).range([0, width]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value)!]).range([height, 0]);

  return (
    <svg width={width} height={height}>
      {data.map((d) => (
        <rect key={d.label} x={x(d.label)} y={y(d.value)} width={x.bandwidth()} height={height - y(d.value)} />
      ))}
    </svg>
  );
}
```

| ✅ Pros | ❌ Cons |
| --- | --- |
| One mental model: it's just React | Enter/exit **animations** need extra work (CSS transitions, or a library like react-spring or motion) |
| Keys = data join; React does enter/update/exit | You write axes yourself (they're only ~20 lines, see example 02) |
| Tooltips, labels and legends are plain components | Thousands of elements → re-render cost (use `memo`, or canvas) |
| Easy to test, type and server-render | |

**What maps to what:**

| D3 (selection) | React |
| --- | --- |
| `selectAll().data(data, key)` | `data.map(d => <el key={key(d)} />)` |
| `enter().append("rect")` | a new key appears → React mounts it |
| `exit().remove()` | a key disappears → React unmounts it |
| `.attr("x", d => x(d.a))` | `x={x(d.a)}` |
| `.on("click", handler)` | `onClick={() => handler(d)}` |
| `d3.select(this).attr("fill", …)` on hover | `hovered` state + a conditional `fill` |

---

## Strategy C: Hybrid (React renders structure and marks, D3 handles specific parts)

React renders the SVG, the groups and the marks. **Specific subtrees** that D3 is uniquely good at are handed to D3 through refs:

- **axes** (`d3.axisBottom`): a `<g ref>` that D3 fills with ticks
- **brush** (`d3.brushX`): a `<g ref>` with the brush overlay
- **zoom** (`d3.zoom`): attach the behavior to the `<svg>` ref, then put the resulting **transform in React state**
- **drag** (`d3.drag`): attach to nodes, write positions to state
- **transitions** on elements React created (carefully; see Module 12)

```tsx
function Axis({ scale, transform }: { scale: d3.ScaleLinear<number, number>; transform: string }) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    d3.select(ref.current!).call(d3.axisBottom(scale));   // D3 owns the INSIDE of this <g>
  }, [scale]);
  return <g ref={ref} transform={transform} />;            // React owns the <g> itself
}
```

**The golden rule of hybrid:** a DOM subtree is owned by **exactly one** of them. React can own a `<g>` and D3 its children, but D3 must never modify elements React renders, and React must never render children into a subtree D3 manages. (Adding attributes/listeners to a React-owned node, like attaching zoom to the `<svg>`, is fine because it doesn't change the tree structure.)

This repo's reusable `src/shared/charts/Axis.tsx` is a hybrid component.

---

## Decision guide

```
Is it a scale, shape, layout, format or array helper?      → call it in render (B)
Do you need a D3 *behavior* (axis, brush, zoom, drag)?     → ref + effect on a dedicated <g> (C)
Porting a big D3 example / heavy enter-exit animations?    → D3 owns the container (A)
Thousands of marks, updated at 60fps?                       → <canvas> + D3 math (Module 14)
```

---

## The margin convention in React

```tsx
const margin = { top: 20, right: 20, bottom: 40, left: 50 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

<svg width={width} height={height}>
  <g transform={`translate(${margin.left},${margin.top})`}>
    {/* everything uses (0,0)-(innerWidth,innerHeight) coordinates */}
    <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} />
    <Axis orientation="left" scale={y} />
    {bars}
  </g>
</svg>
```

## Responsive charts

A chart must know its pixel width to set the scale ranges. So:

1. Render a wrapper `<div>` at `width: 100%`.
2. Measure it with a `ResizeObserver` (`useChartDimensions`, which you wrote in exercise 08.2).
3. Put the width into the scale ranges.

```tsx
const [ref, dms] = useChartDimensions({ height: 300 });
const x = useMemo(() => d3.scaleLinear().domain(…).range([0, dms.innerWidth]), [dms.innerWidth]);
return <div ref={ref}>{dms.width > 0 && <svg width={dms.width} height={dms.height}>…</svg>}</div>;
```

> Alternatives: `viewBox` + `preserveAspectRatio` scales the whole SVG like an image, **including text and stroke widths**. That's fine for simple graphics, but text shrinks on phones. Measuring gives crisp text at every size.

## Memoize scales when effects depend on them

In hybrid components, the `Axis` effect depends on `scale`. A scale created in render is a **new object every render**, so the axis redraws (and restarts its transition) on every hover. Wrap the scale in `useMemo` with the data and dimensions as dependencies. (See Module 06.)

## Composition: a chart "kit"

Once the pieces are components, charts become composition:

```tsx
<ChartFrame height={300}>
  {({ innerWidth, innerHeight }) => (
    <>
      <Axis orientation="left" scale={y} gridSize={innerWidth} />
      <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} />
      <Bars data={data} x={x} y={y} />
      <HoverLayer … />
    </>
  )}
</ChartFrame>
```

`src/shared/charts/ChartFrame.tsx` does this. It measures, applies margins, and exposes dimensions through a render prop and `useChartContext()`.

## Common mistakes

| Mistake | Symptom |
| --- | --- |
| D3 appends into an element React also renders children into | Elements vanish or duplicate; `removeChild` errors |
| An effect that `append`s without join or cleanup | Duplicated axes/groups (StrictMode doubles them) |
| New scale objects every render, used as effect deps | Axes flicker or re-animate on every hover |
| Reading `ref.current` during render | `null` on the first render |
| Forgetting the flipped y range | Upside-down bars |
| Scale range uses `width` instead of `innerWidth` | Marks overflow into the margins |

## ✅ Checklist

- [ ] I can explain strategies A, B and C and pick one for a given chart
- [ ] I can write axes both ways (React-rendered and D3-rendered)
- [ ] I can make any chart responsive with `useChartDimensions`
- [ ] I memoize scales that effects depend on
- [ ] I never let React and D3 manage the same subtree
