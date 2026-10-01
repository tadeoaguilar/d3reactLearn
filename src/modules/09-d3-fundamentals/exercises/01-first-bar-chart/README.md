# Exercise 09.1: Your first D3 bar chart (the D3 way)

Build a vertical bar chart of `fruitSales` where **D3 owns the chart's DOM**. React renders just an `<svg ref>` and a few buttons. Everything inside the SVG is created by D3 in an effect.

This is how most D3 examples on the web (Observable, bl.ocks) are written. Learning it lets you read them, and in Module 10 you'll rewrite this chart the React way.

## Requirements

1. **Setup**: in the starter, React renders `<svg ref={svgRef} width={W} height={H} />`. Use the margin convention (`M`, `innerW`, `innerH` are already defined).
2. **Scales**
   - `x`: `d3.scaleBand()` over the fruit labels, `.padding(0.2)`
   - `y`: `d3.scaleLinear()` from 0 to the max value, `.nice()`, range `[innerH, 0]`
3. **Structure**: inside the effect, create (or reuse!) three groups: the bounds `<g>` translated by the margins, an x-axis `<g>`, and a y-axis `<g>`.
   - The effect runs again whenever the data changes, so it must not append a new `<g>` every time. Use the join pattern on the groups too: `svg.selectAll("g.bounds").data([null]).join("g").attr("class", "bounds")`.
4. **Bars**: use `.data(data, d => d.label).join(enter, update, exit)`:
   - enter: bars start with height 0 at the baseline and **grow** into place (a transition)
   - update: transition to the new position and height
   - exit: shrink to 0 and then `.remove()`
5. **Axes**: `axisBottom(x)` and `axisLeft(y)` with `~s` formatting, updated with a transition.
6. **Value labels** above each bar (a second join, on `text.label`).
7. **Buttons** (already in the starter): "Randomize values", "Sort", "Remove last", "Reset". They change React state, and your effect redraws.
8. **Hover**: bars change color on `mouseenter` and back on `mouseleave`, using `.on(...)`.

## Done when

- [ ] The chart renders with axes, bars and labels
- [ ] Every button animates the bars smoothly, with no duplicated elements (check in DevTools → Elements)
- [ ] It survives StrictMode's double effect run (no doubled groups)
