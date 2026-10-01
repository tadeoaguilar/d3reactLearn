# Exercise 10.1: Refactor a D3-owned chart to React

`Starter.tsx` has a **working** scatter plot written in "D3 owns the DOM" style (Strategy A), the way you'd find it in an online example. Refactor it into **Strategy B/C**:

- React renders every circle, label and legend item
- D3 is used for **math** (scales, extent, format) and **axes only** (use `src/shared/charts/Axis`)
- the chart is **responsive** (use `useChartDimensions` from `src/shared/hooks`)

## Requirements

1. Keep the features the original has:
   - penguins plotted as bill length (x) vs bill depth (y), colored by species
   - circle **area** proportional to body mass (`scaleSqrt`)
   - axes with labels ("Bill length (mm)", "Bill depth (mm)")
   - hovering a circle enlarges it and shows a tooltip with the details
   - a species legend: clicking a species toggles its visibility
2. Replace every D3 DOM operation (`select`, `append`, `attr`, `on`) except the axes with JSX.
3. Hover, tooltip content and hidden species become **React state**.
4. Use the shared `Tooltip` component (`src/shared/charts/Tooltip`) as an HTML overlay. Its position comes from the scales, not from the mouse event.
5. `useMemo` the scales so the axes don't redraw on hover.
6. Resize the window: the plot fills the width with a 3:2 aspect ratio.

## Hints

- For the legend toggle, keep `hidden: Set<Species>` in state. Create a **new Set** on every change (`new Set(prev)`), never mutate it.
- To draw hovered points on top, render the hovered circle again after the others (SVG has no z-index: later elements paint on top).
- The scale domains should use **all** the data, not just the visible species, so the axes stay put when you toggle.

## Done when

- [ ] No `d3.select` in the file except inside the shared `Axis`
- [ ] Same features as the starter, and responsive
- [ ] Hovering doesn't re-render the axes (a `console.log` in a memo'd scale shows it isn't recomputed)
