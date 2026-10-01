# Exercise 11.1: Horizontal bar chart (top-N cities)

Horizontal bars are the best choice when **category labels are long** or there are **many categories**. Build one from `/data/cities.json`.

## Requirements

1. **Data**: load `/data/cities.json` with the `useFetch` pattern (write your own or copy it from example 08.02). Show loading and error states.
2. **Layout**: use `ChartFrame` (or `useChartDimensions`). The height depends on the number of bars: `rows × 28px + margins`.
3. **Scales**
   - `y`: `scaleBand` over the city names, `padding(0.15)`
   - `x`: `scaleLinear` from **0** to the max population, `.nice()`
4. **Marks**: one `<rect>` per city, with the city name **left of the bar** (inside the left margin, `textAnchor="end"`) and the value **at the end of the bar** (`"37.4M"`).
   - If a bar is too short for its label, put the label outside the bar instead.
5. **Controls**
   - "Top N" slider (5–18)
   - sort by population ↓ or by name A–Z
   - a country `<select>` (`All` plus the unique countries) that **highlights** matching bars (others at 30% opacity). It highlights; it doesn't filter.
6. **Axis**: an x axis on **top** (`orientation="top"`) with grid lines.

## Done when

- [ ] Loading and error states render
- [ ] Top N, sort and highlight all work together
- [ ] Labels never overlap or get cut off
- [ ] The chart is responsive
