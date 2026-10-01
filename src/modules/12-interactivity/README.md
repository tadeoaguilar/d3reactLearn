# Module 12 — Interactivity

Interaction is what an on-screen chart can do that a printed one can't. This module covers the five core interactions and how each one splits between React and D3:

| Interaction | Who owns it | Where the state lives |
| --- | --- | --- |
| Hover / tooltip | React (events + JSX) | `hovered` state |
| Nearest-point lookup | D3 math (`bisector`, `Delaunay`, `quadtree`) | computed on pointer move |
| Animated transitions | D3 `transition` / `interpolate`, or CSS | nothing (visual only) |
| Brushing | D3 behavior (`d3.brushX`) in a `<g ref>` | `selection: [x0, x1]` in React state |
| Zoom & pan | D3 behavior (`d3.zoom`) on the `<svg>` | `transform` in React state |

**The pattern:** D3 *behaviors* handle the messy pointer math (drag gestures, wheel, touch, inertia) and report the result. React stores the result in state and renders from it.

---

## 1. Pointer coordinates

Event coordinates are relative to the page. You need them relative to the chart's inner `<g>`:

```tsx
import { pointer } from "d3";

function onPointerMove(e: React.PointerEvent<SVGRectElement>) {
  const [mx, my] = d3.pointer(e, e.currentTarget);  // coordinates in the target's space
  const date = x.invert(mx);                         // pixels → data
}

// An invisible rect catches events over the whole plot area:
<rect width={innerWidth} height={innerHeight} fill="transparent" onPointerMove={onPointerMove} onPointerLeave={() => setHover(null)} />
```

`d3.pointer(event, target)` accounts for SVG transforms, so it works inside translated groups. Pass `e.nativeEvent` or `e`; both work.

## 2. Tooltips

| | SVG tooltip (`<g>` in the chart) | HTML tooltip (a `<div>` over the chart) |
| --- | --- | --- |
| Rich content (tables, images, wrapping text) | ❌ hard | ✅ easy |
| Can overflow the SVG | ❌ clipped | ✅ |
| Styling with CSS | limited | full |

This repo uses **HTML tooltips** (`src/shared/charts/Tooltip.tsx`): a `position: absolute` div inside a `position: relative` wrapper, placed at `margin.left + x(d)`, `margin.top + y(d)`, and flipped when it would overflow.

**Position the tooltip at the data point, not at the mouse.** It's steadier and it points at what it describes.

## 3. Finding the nearest point

Hovering tiny targets is frustrating. Look up the **nearest** datum instead:

```tsx
// Along x (line charts): binary search, O(log n)
const bisect = d3.bisector<Point, Date>((d) => d.date).center;
const i = bisect(data, x.invert(mx));
const nearest = data[i];

// In 2D (scatter plots): Delaunay triangulation, O(log n) per query
const delaunay = d3.Delaunay.from(data, (d) => x(d.a), (d) => y(d.b));   // useMemo!
const i = delaunay.find(mx, my);
// Optional: ignore it if it's farther than 40px
```

`delaunay.voronoi([0, 0, w, h])` gives you the Voronoi cells too, if you want to draw hover regions.

## 4. Transitions with React

React re-renders **instantly**. To animate between two states you have three choices:

**A. CSS transitions.** Put `style={{ transition: "all 400ms" }}` on elements. Chromium browsers animate SVG geometry this way (`x`, `y`, `width`, `height`, `cx`, `cy`, `r`), while others may jump. `transform` and `opacity` animate everywhere when set as CSS styles. Can't animate a path `d` portably.

**B. A D3 transition on a React-created element.** React renders the element *without* the animated attribute, and D3 animates that attribute from an effect:

```tsx
function AnimatedRect({ y, height, ...rest }) {
  const ref = useRef<SVGRectElement>(null);
  useEffect(() => {
    d3.select(ref.current!).transition().duration(500).attr("y", y).attr("height", height);
  }, [y, height]);
  return <rect ref={ref} {...rest} />;   // ❗ y/height NOT passed as props, so React never fights D3
}
```

**C. Interpolate the data, not the DOM.** Animate the numbers in state with `d3.timer`/`requestAnimationFrame` and `d3.interpolate`, and let React render each frame. It's the most "React" approach and works for anything, including paths:

```tsx
function useAnimatedValue<T>(target: T, duration = 500): T {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const interp = d3.interpolate(fromRef.current, target);
    const timer = d3.timer((elapsed) => {
      const t = Math.min(1, elapsed / duration);
      const v = interp(d3.easeCubicOut(t));
      fromRef.current = v;
      setValue(v);
      if (t === 1) timer.stop();
    });
    return () => timer.stop();
  }, [target, duration]);
  return value;
}
```

It re-renders every frame, so use it for tens or hundreds of elements, not thousands.

**Enter and exit animations** are the hard part in React, because an element that is removed from JSX disappears right away. Options: keep "exiting" items in state for the animation's duration, use a library (`motion`, `react-spring`), or let D3 own that layer (Strategy A).

> Respect `prefers-reduced-motion`: shorten or skip animations when `matchMedia("(prefers-reduced-motion: reduce)").matches`.

## 5. Brushing

A brush lets the user select a range by dragging. D3 draws the overlay, handles and gestures:

```tsx
const brushRef = useRef<SVGGElement>(null);

useEffect(() => {
  const brush = d3.brushX()
    .extent([[0, 0], [innerWidth, innerHeight]])
    .on("brush end", (event: d3.D3BrushEvent<unknown>) => {
      if (!event.sourceEvent) return;                     // ignore programmatic moves
      const sel = event.selection as [number, number] | null;
      setRange(sel ? [x.invert(sel[0]), x.invert(sel[1])] : null);   // pixels → data → React state
    });
  const g = d3.select(brushRef.current!).call(brush);
  return () => { g.on(".brush", null); };                  // cleanup
}, [innerWidth, innerHeight, x]);

<g ref={brushRef} />     // D3 owns the inside of this group
```

Store the selection in **data units** (dates, values), not pixels, so it survives resizes. Moving the brush from code: `d3.select(brushRef.current).call(brush.move, [x(a), x(b)])`.

**Focus + context:** a small overview chart with a brush controls the domain of a large detail chart.

## 6. Zoom and pan

```tsx
const [transform, setTransform] = useState(d3.zoomIdentity);

useEffect(() => {
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 20])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", (event) => setTransform(event.transform));
  const svg = d3.select(svgRef.current!).call(zoom);
  return () => { svg.on(".zoom", null); };
}, [width, height]);

// Re-scale instead of CSS-transforming the whole plot (keeps strokes and text crisp):
const zx = transform.rescaleX(x);
const zy = transform.rescaleY(y);
```

- **Semantic zoom** (`rescaleX`): the axes update, and circles stay the same size. Usually what you want.
- **Geometric zoom** (`<g transform={transform.toString()}>`): everything scales, including stroke widths. Fine for maps and pictures.
- **Reset**: keep the zoom behavior in a ref and call `svg.transition().call(zoomRef.current.transform, d3.zoomIdentity)`.

## 7. Accessibility

- Make interactive marks focusable (`tabIndex={0}`), and show the tooltip on `onFocus` as well as hover.
- Arrow keys to move between points is a big improvement for keyboard users.
- Never put information *only* in a tooltip. Provide a table view or summary text too.

## ✅ Checklist

- [ ] I can convert pointer events to data values with `d3.pointer` + `scale.invert`
- [ ] I can find the nearest point with `bisector` (1D) and `Delaunay` (2D)
- [ ] I know three ways to animate, and which to use when
- [ ] I can wire `d3.brushX` to React state in data units
- [ ] I can add zoom/pan with the transform in state and `rescaleX`
