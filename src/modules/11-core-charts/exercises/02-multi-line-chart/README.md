# Exercise 11.2: Multi-line chart with normalization

Plot the three stock series from `stockSeries` (in `src/shared/data.ts`) on one chart.

## Requirements

1. **One `<path>` per series** with `d3.line()`, each in its own color (`palette` from `shared/theme`).
2. **Direct labels**: put each series' name at the **right end** of its line instead of a legend. Leave room in `margin.right`.
3. **Mode toggle**
   - **Absolute**: y shows the price
   - **Indexed**: each series is divided by its first value and multiplied by 100, so every line starts at 100 and you compare *relative* performance. Draw a dashed baseline at 100.
   - Transition between the modes. The simplest portable approach: animate with `d3.transition` inside a small `AnimatedPath` component that interpolates `d` (hint: `d3.select(ref.current).transition().attr("d", newD)`). Stretch: use `d3.interpolatePath`-style logic, or CSS `d` transitions in Chromium.
4. **Series toggle**: clicking a label toggles that series. The y domain recalculates from the **visible** series only.
5. **Last-value readout**: next to each label, show the last value (price, or `+12.3%` in indexed mode, colored green or red).
6. **Time axis** at the bottom. Use a y-axis format that matches the mode (`$` vs `~r`).

## Done when

- [ ] All three lines draw with correct direct labels
- [ ] Indexed mode starts every line at 100
- [ ] Toggling a series rescales the y axis
- [ ] Switching modes animates smoothly
