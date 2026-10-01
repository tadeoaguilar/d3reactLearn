# Module 11 — Core Charts

Now we build the standard chart types with the React-owned (Strategy B) plus D3 axes (Strategy C) approach from Module 10. Every chart follows the same **recipe**:

```
1. Data        → shape it (filter, group, stack, bin): d3-array
2. Dimensions  → useChartDimensions / ChartFrame (margin convention)
3. Scales      → domain from the data, range from the dimensions: d3-scale (useMemo)
4. Generators  → path strings / layouts: d3-shape
5. Marks       → JSX: <rect>, <path>, <circle>, keyed by a data ID
6. Axes/labels → <Axis> (D3) or JSX axes; titles, legends, annotations
7. Interaction → state for hover/selection (Module 12)
```

## Choosing a chart

| Question | Chart |
| --- | --- |
| Compare values across categories | **Bar** (horizontal when labels are long) |
| Show change over time | **Line** (or area for a single series) |
| Show parts of a whole over time | **Stacked area** / stacked bar |
| Relationship between two numbers | **Scatter** (bubble size = a third variable) |
| Parts of a whole, few categories (≤ 6) | **Donut / pie** (bars are usually easier to compare) |
| Distribution of one variable | **Histogram** (or box/violin plots) |

## Recipes

### Bar chart

```tsx
const x = d3.scaleBand().domain(data.map((d) => d.label)).range([0, innerWidth]).padding(0.2);
const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.value)!]).nice().range([innerHeight, 0]);

<rect x={x(d.label)} y={y(d.value)} width={x.bandwidth()} height={innerHeight - y(d.value)} />
```

- **Bars must start at zero.** A truncated bar axis exaggerates differences.
- **Negative values:** domain `[min(0, minValue), max(0, maxValue)]`; each bar goes from `y(0)` to `y(value)`: `y={Math.min(y(0), y(v))}`, `height={Math.abs(y(v) - y(0))}`.
- **Sorting** by value usually makes a bar chart easier to read than alphabetical order.

### Line chart

```tsx
const x = d3.scaleTime().domain(d3.extent(data, (d) => d.date) as [Date, Date]).range([0, innerWidth]);
const y = d3.scaleLinear().domain(d3.extent(data, (d) => d.value) as [number, number]).nice().range([innerHeight, 0]);
const line = d3.line<Point>().x((d) => x(d.date)).y((d) => y(d.value));

<path d={line(data)!} fill="none" stroke="…" strokeWidth={2} />
```

- Lines **don't** need a zero baseline. Zoom into the range that shows the variation.
- `.defined((d) => d.value != null)` leaves gaps for missing data instead of drawing a misleading line.
- Multi-series: `d3.group(data, d => d.series)` and one `<path>` per group, with a direct label at the end of each line instead of a legend.

### Stacked area

```tsx
const series = d3.stack<Row>().keys(["solar", "wind", "hydro"]).offset(d3.stackOffsetNone)(rows);
// series[k][i] = [y0, y1] with .data = the original row
const area = d3.area<d3.SeriesPoint<Row>>().x((d) => x(d.data.date)).y0((d) => y(d[0])).y1((d) => y(d[1]));
```

Offsets: `stackOffsetNone` (absolute), `stackOffsetExpand` (100%), `stackOffsetWiggle` (streamgraph).

### Scatter plot

```tsx
const r = d3.scaleSqrt().domain([0, maxMass]).range([0, 10]);   // AREA ∝ value
<circle cx={x(d.a)} cy={y(d.b)} r={r(d.mass)} />
```

Use `scaleSqrt` for radius. A linear radius makes big values look quadratically bigger, because area grows with r².

### Donut

```tsx
const pie = d3.pie<Slice>().value((d) => d.value).sort(null);
const arc = d3.arc<d3.PieArcDatum<Slice>>().innerRadius(r * 0.6).outerRadius(r);
pie(data).map((s) => <path key={s.data.label} d={arc(s)!} />);
```

`arc.centroid(s)` gives a label position. Put the total in the hole.

### Histogram

```tsx
const bins = d3.bin().domain(x.domain() as [number, number]).thresholds(x.ticks(20))(values);
<rect x={x(b.x0!)} width={x(b.x1!) - x(b.x0!) - 1} y={y(b.length)} height={innerHeight - y(b.length)} />
```

The bin count changes the story. Let users adjust it, or pick it with a rule such as `d3.thresholdSturges`.

## Accessibility and polish

- Add `role="img"` and an `aria-label` (or a `<title>`) to each `<svg>` that summarizes it.
- Don't rely on color alone. Add direct labels, patterns or tooltips.
- Format numbers for people: `d3.format("$,.0f")`, `"~s"`, `".0%"`.
- Keep gridlines light, and remove chart junk (3D, heavy borders).
- Label the axes when the units aren't obvious.

## ✅ Checklist

- [ ] I can build bar, line, stacked area, scatter, donut and histogram charts from the recipe
- [ ] I know when a zero baseline is required
- [ ] I use `scaleSqrt` for circle sizes
- [ ] My charts are responsive, labeled and have an accessible name
