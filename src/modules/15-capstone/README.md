# Module 15 — Capstone: Sales Analytics Dashboard

Time to put it all together. You'll build a complete, interactive, linked sales dashboard from a spec, the way you would at work.

There's no new theory in this module. Everything you need is in Modules 00–14. The exercise contains:

- `salesData.ts`: about 9,000 synthetic orders over 2025 (date, region, category, product, quantity, revenue)
- `Starter.tsx`: a skeleton with the architecture laid out and every piece left as a `TODO`
- `Solution.tsx`: one complete reference implementation (compare with it *after* you've built yours)

---

## The spec

### Layout (a responsive CSS grid)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Sales 2025         [Region ▾] [Category chips…]   [Reset filters]    │  ← filter bar
├──────────┬──────────┬──────────┬──────────┬──────────────────────────┤
│ Revenue  │ Orders   │ Avg order│ Top cat. │                          │  ← KPI cards (+ sparklines)
├──────────┴──────────┴──────────┴──────────┴──────────────────────────┤
│  Revenue over time (weekly line + area)                               │  ← focus chart
│  ▁▂▃▄▅▆▇ …                                                            │
│  [==== brush on the mini timeline sets the date range ====]           │  ← context + brush
├──────────────────────────────┬───────────────────────────────────────┤
│  Revenue by category (donut) │  Revenue by region (bars)              │  ← click to filter
├──────────────────────────────┴───────────────────────────────────────┤
│  Top 10 products table (sortable)                                     │
└──────────────────────────────────────────────────────────────────────┘
```

### Filters (global and combinable)

| Filter | Set by | Type |
| --- | --- | --- |
| `dateRange` | brushing the mini timeline | `[Date, Date] \| null` |
| `regions` | clicking region bars, or the region dropdown | `Set<Region>` (empty = all) |
| `categories` | clicking donut slices or category chips | `Set<Category>` (empty = all) |

**Cross-filtering rule:** each chart shows data filtered by **all the other filters, but not its own**, and it highlights its own selection. For example, the region chart shows every region (filtered by date and category) and highlights the selected ones. This keeps unselected options visible and clickable. It's how most BI tools behave.

### KPI cards

For the fully filtered data: **total revenue**, **order count**, **average order value**, and **top category**. Each has a sparkline of weekly values and the change vs the previous equal-length period.

### Interactions

- A hover tooltip on the time chart (nearest week via `bisector`)
- Hover on donut slices and bars; click to toggle the filter
- The table is sortable by any column
- "Reset filters" clears everything, including the brush

### Non-functional requirements

- **TypeScript strict**, with no `any`
- **Responsive**: works from 360px to 1600px wide
- **Performant**: memoize the filtering and aggregation; the brush must stay smooth
- **Accessible**: every chart has `role="img"` and an `aria-label`; interactive marks are keyboard-focusable (at least the bars and chips)
- **Readable**: formatted numbers (`$1.2M`, `8,934`), consistent colors per category/region, light gridlines

---

## Suggested architecture

```
Dashboard
├── DashboardProvider          useReducer(filtersReducer) + 2 contexts (state, dispatch)
├── FilterBar                  dispatch only
├── KpiRow                     useFilteredOrders("all")
├── TimeSeriesPanel            focus line + context brush (dateRange)
├── CategoryDonut              useFilteredOrders("except-categories")
├── RegionBars                 useFilteredOrders("except-regions")
└── TopProductsTable           useFilteredOrders("all")
```

Key helpers:

```ts
type FilterKey = "dateRange" | "regions" | "categories";
function applyFilters(orders: Order[], f: Filters, except?: FilterKey): Order[];
function useFilteredOrders(except?: FilterKey): Order[];   // useMemo on the relevant filters
```

## Milestones

1. **Data & state**: the reducer, actions, provider and `applyFilters`, with a unit-test-like console check (e.g. filter by one region and sum the revenue)
2. **Static layout**: the grid with placeholder cards; responsive
3. **KPIs**: numbers first, sparklines second
4. **Time series + brush**: weekly aggregation with `d3.timeWeek` and `d3.rollup`
5. **Donut + bars** with cross-filtering
6. **Table** with sorting
7. **Polish**: tooltips, empty states ("No orders match your filters"), keyboard, reset
8. **Performance pass**: profile, then memoize

## Self-assessment rubric

| Area | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| --- | --- | --- | --- |
| State | useState everywhere | reducer + context | reducer + split contexts, cross-filter helper |
| Charts | static | interactive | interactive + animated + accessible |
| D3/React split | D3 owns everything | React marks + D3 axes | + behaviors (brush) wired to state in data units |
| Responsiveness | fixed sizes | resizes | resizes + adaptive ticks and labels |
| Performance | recomputes everything | memoized aggregations | + no wasted renders while brushing |

## Stretch goals

- Persist the filters in the URL hash, so views can be shared
- Export the filtered orders as CSV (`d3.csvFormat`)
- A small-multiples view: one sparkline per category
- Switch the time chart to `<canvas>` and render **daily** points
- Animate the donut between filter states (`d3.interpolate` on the arcs' angles)
