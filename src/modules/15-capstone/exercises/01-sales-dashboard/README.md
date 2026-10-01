# Capstone: Sales analytics dashboard

The full spec, layout, architecture, milestones and rubric are in the **📖 Lesson** tab of this module. Read that first.

## Files

| File | What it is |
| --- | --- |
| `salesData.ts` | `orders` (about 9k rows), `REGIONS`, `CATEGORIES` and their types |
| `Starter.tsx` | the skeleton: the reducer, context, filter helper and every panel are stubs with `TODO`s |
| `Solution.tsx` | one complete reference implementation |

## Reusable pieces you've already built

- `shared/hooks/useChartDimensions`: responsive sizing
- `shared/charts/Axis`: D3 axes (the hybrid approach)
- `shared/charts/Tooltip`: an HTML tooltip that flips at the edges
- the brush pattern from example 12.04 and exercise 12.2
- the reducer + split-context pattern from example 07.03

## Tips

- Build the milestones **in order**, and check the page after each one.
- Get `applyFilters` right first. Every chart depends on it.
- Aggregations (weekly sums, per-category totals) belong in `useMemo`.
- Keep the brush selection in **dates**, not pixels.

Budget: 4–8 hours. Take your time. This is where the course comes together.
