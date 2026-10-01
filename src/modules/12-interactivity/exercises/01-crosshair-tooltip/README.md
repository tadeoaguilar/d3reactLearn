# Exercise 12.1: Multi-series crosshair tooltip

Add a "financial chart" style crosshair to a multi-line chart of `stockSeries`.

## Requirements

1. The starter draws the three lines, the axes and an event-catching `<rect>`.
2. On pointer move:
   - convert the pointer x to a date with `d3.pointer` + `x.invert`
   - use `d3.bisector(...).center` to find the nearest index (all series share the same dates)
   - store **only the index** in state
3. Render, for the hovered index:
   - a vertical crosshair line
   - a dot on **each** line at that date
   - one HTML tooltip (use `shared/charts/Tooltip`) listing the date and each series' value, **sorted from highest to lowest**, with color swatches
4. **Date pill**: a small label on the x axis showing the hovered date (an SVG `<rect>` + `<text>`, centered on the crosshair and kept inside the chart).
5. **Keyboard**: the SVG is focusable. ← / → move by one day, Shift+← / Shift+→ by 10 days, Esc clears.
6. **Performance**: the lines, axes and scales must not re-render when the crosshair moves. Split them into a `memo`ized `<StaticLayer>` component and check with a render counter.

## Done when

- [ ] The tooltip lists all three values in sorted order and follows the crosshair
- [ ] Keyboard navigation works
- [ ] `StaticLayer` doesn't re-render on hover
