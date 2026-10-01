# Module 09 — D3 Fundamentals

**D3** (Data-Driven Documents) is not a charting library. It has no `<BarChart>`. It's a **toolkit** of about 30 small modules for turning data into visuals. You combine them into whatever chart you need.

```
                         ┌────────────── D3 ───────────────┐
  math (no DOM needed)   │ d3-array   d3-scale   d3-shape  │ ← React-friendly: pure functions
                         │ d3-format  d3-time    d3-geo    │
                         │ d3-hierarchy  d3-force  d3-interpolate │
                         ├──────────────────────────────────┤
  DOM manipulation       │ d3-selection  d3-transition      │ ← these touch the DOM directly
                         │ d3-axis  d3-brush  d3-zoom  d3-drag │
                         └──────────────────────────────────┘
```

This split is **the key to using D3 with React** (Module 10). The top half is pure math that works anywhere, including in React render. The bottom half manipulates the DOM, so it has to be carefully confined to refs and effects.

This module teaches D3 **on its own terms** first, so you understand what you're integrating.

```ts
import * as d3 from "d3";                        // everything (what this repo does)
import { scaleLinear } from "d3-scale";          // or individual modules (smaller bundles)
```

---

## 1. Scales: data space → pixel space

A scale is a **function** that maps an input **domain** (your data values) to an output **range** (pixels, colors, sizes).

```ts
const x = d3.scaleLinear()
  .domain([0, 100])     // data: 0 … 100
  .range([0, 500]);     // pixels: 0 … 500

x(50);          // 250
x.invert(250);  // 50 (pixels → data, useful for mouse interactions)
```

### The scales you'll use most

| Scale | Domain | Use for |
| --- | --- | --- |
| `scaleLinear` | continuous numbers | most quantitative axes |
| `scaleTime` / `scaleUtc` | `Date`s | time axes |
| `scaleLog`, `scaleSqrt`, `scalePow` | continuous | skewed data; `scaleSqrt` for circle **area** |
| `scaleBand` | discrete categories | bar positions: gives `bandwidth()` |
| `scalePoint` | discrete categories | dot plots, line charts with categories |
| `scaleOrdinal` | discrete categories | category → color |
| `scaleSequential` | continuous → an interpolator | heatmaps, choropleths (`d3.interpolateViridis`) |
| `scaleDiverging` | continuous with a midpoint | above/below average |
| `scaleQuantize` / `scaleQuantile` / `scaleThreshold` | continuous → discrete buckets | classed maps |

### Useful scale methods

```ts
d3.scaleLinear().domain(d3.extent(data, d => d.value) as [number, number]).range([h, 0]).nice();
//                                                                          ↑ y flipped: SVG y grows downward
scale.nice();          // round the domain to nice numbers (0–97 → 0–100)
scale.clamp(true);     // outputs never leave the range
scale.ticks(5);        // ≈5 "nice" tick values in the domain
scale.tickFormat(5, "~s");

const xBand = d3.scaleBand<string>().domain(["A", "B", "C"]).range([0, 300]).padding(0.2);
xBand("B");            // left edge of B's band
xBand.bandwidth();     // width of each band
```

> ⚠️ **SVG's y axis points down.** For "bigger values are higher", use `range([innerHeight, 0])`.

---

## 2. Selections: D3's jQuery-like DOM API

```ts
const svg = d3.select("#chart");                   // first match
const circles = svg.selectAll("circle");            // all matches

svg.append("rect")                                   // create a child
  .attr("x", 10).attr("width", 50)                   // SVG attributes
  .style("fill", "steelblue")                        // CSS styles
  .text("hi")                                         // text content
  .on("click", (event, d) => console.log(d));        // events
```

Methods return the selection, so you can **chain** them. `attr` and `style` accept a **function** `(d, i, nodes) => value` that runs once per element with its bound datum `d`.

In React you **never** select by a global CSS selector. You select the node React gave you: `d3.select(svgRef.current)`.

---

## 3. The data join: D3's central idea

The data join pairs an **array of data** with a **set of elements**, and sorts them into three groups:

```
               data:  [ A  B  C  D ]
          elements:  [ a  b  c ]            (from the previous render)

        ┌─────────┬──────────┬─────────┐
        │  ENTER  │  UPDATE  │  EXIT   │
        │ data w/o│ matched  │ elements│
        │ element │ pairs    │ w/o data│
        │   [D]   │ [Aa Bb Cc]│   []   │
        └─────────┴──────────┴─────────┘
         → append     → update   → remove
```

Modern D3 (v6+) handles all three with `.join()`:

```ts
svg.selectAll("rect")
  .data(data, (d) => d.id)          // ← key function: match by id, not by index
  .join(
    (enter)  => enter.append("rect").attr("fill", "green"),   // new items
    (update) => update.attr("fill", "gray"),                  // existing items
    (exit)   => exit.remove(),                                // removed items
  )
  .attr("x", (d) => x(d.name)!)      // applied to enter + update
  .attr("height", (d) => y(d.value));

// Short form, when you don't need custom enter/exit:
svg.selectAll("rect").data(data).join("rect").attr(…);
```

**This is the same idea as React's `key` prop!** `data.map(d => <rect key={d.id} />)` does a data join too. React does enter/update/exit for you. D3 makes you do it by hand, but gives you precise control, which is useful for animated enter and exit transitions.

**`.join()` is idempotent:** running it again with the same data changes nothing. That's what makes D3 code safe inside effects that run many times (including StrictMode's double run).

---

## 4. Axes

`d3-axis` **generates DOM**: ticks, labels and a domain line inside a `<g>`:

```ts
const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.format("~s"));
d3.select(gElement)
  .attr("transform", `translate(0, ${innerHeight})`)
  .call(xAxis);                      // .call(fn) = fn(selection)
```

| Generator | Ticks point… | Typical position |
| --- | --- | --- |
| `axisBottom` | down | `translate(0, innerHeight)` |
| `axisLeft` | left | `translate(0, 0)` |
| `axisTop`, `axisRight` | up, right | |

Grid lines trick: `d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => "")`.

---

## 5. Shape generators: data → SVG path strings

These are **pure functions** that return `d` attribute strings. That makes them perfect for React.

```ts
const line = d3.line<Point>()
  .x((d) => x(d.date))
  .y((d) => y(d.value))
  .curve(d3.curveMonotoneX);           // smoothing

line(points);   // "M0,120L20,98C…"  → <path d={line(points)!} />

const area = d3.area<Point>().x((d) => x(d.date)).y0(innerHeight).y1((d) => y(d.value));

const pie = d3.pie<Slice>().value((d) => d.value);             // angles
const arc = d3.arc<d3.PieArcDatum<Slice>>().innerRadius(60).outerRadius(100);
pie(slices).map((s) => arc(s));                                  // path per slice

const stack = d3.stack<Row>().keys(["solar", "wind"]);          // stacked layers
```

---

## 6. Data utilities (`d3-array`, `d3-format`, `d3-time-format`)

```ts
d3.extent(data, d => d.value)             // [min, max]
d3.max(data, d => d.value)
d3.mean / d3.median / d3.sum / d3.deviation
d3.group(data, d => d.species)            // Map<species, rows[]>
d3.rollup(data, v => v.length, d => d.species)   // Map<species, count>
d3.bin().thresholds(20)(values)           // histogram bins
d3.bisector(d => d.date).center(data, date)      // nearest index (tooltips!)
d3.range(5)                               // [0,1,2,3,4]

d3.format(",.2f")(1234.5)    // "1,234.50"
d3.format("~s")(1_500_000)   // "1.5M"
d3.format(".0%")(0.25)       // "25%"
d3.timeFormat("%b %d")(date) // "Jan 05"
d3.timeParse("%Y-%m-%d")("2025-01-05")
```

---

## 7. Transitions

```ts
selection.transition()
  .duration(750)
  .ease(d3.easeCubicOut)
  .attr("y", d => y(d.value))
  .attr("height", d => innerHeight - y(d.value));
```

A transition smoothly interpolates attributes from their current values to new ones. D3 knows how to interpolate numbers, colors, strings with embedded numbers, and even path strings (roughly). Module 12 covers transitions with React.

---

## ✅ Checklist

- [ ] I can pick the right scale for a data type and explain domain vs range
- [ ] I can flip the y range for SVG
- [ ] I can explain enter / update / exit and write a `.join()` with a key function
- [ ] I can render an axis into a `<g>` with `.call()`
- [ ] I can make a path with `d3.line` and `d3.area`, and slices with `d3.pie` + `d3.arc`
- [ ] I know which D3 modules are "pure math" and which touch the DOM
