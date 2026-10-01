# Exercise 12.2: Brush to filter (linked views)

Brushing is how you filter data **by drawing on a chart**. Build two linked views of the penguins:

```
┌──────────── histogram of body mass ────────────┐
│  ▂▃▅▇█▇▅▃▂      ▂▃▅▆▇▆▅▃▂                      │ ← d3.brushX here
│      [=======brush=======]                      │
└─────────────────────────────────────────────────┘
┌──── scatter: flipper vs bill length ─┐  ┌─ summary ─┐
│  · ·  ●●●  ·   (brushed = colored,   │  │ n = 74    │
│        others = gray)                │  │ by species│
└──────────────────────────────────────┘  └───────────┘
```

## Requirements

1. **Histogram** of `bodyMass`, about 30 bins, with a `d3.brushX` overlay in a `<g ref>`.
2. The brush reports its selection in **grams** (use `x.invert`) to a `massRange: [number, number] | null` state in the parent.
3. **Histogram bars**: bins inside the range are colored, the rest gray.
4. **Scatter plot** (flipper length vs bill length): selected points are colored by species; unselected points are light gray and drawn **underneath** (render them first).
5. **Summary panel**: the count of selected penguins, and a small bar for each species showing its share of the selection.
6. **Clear**: clicking the histogram without dragging clears the brush (D3 does this by default; make sure your state becomes `null`). Also add a "Clear selection" button that clears it **from code** (`brush.move` with `null`).
7. Brushing must stay smooth: memoize the scales and the binned data, and keep the brush effect from re-creating the brush on every render.

## Stretch

Add a second brush (`d3.brush()`, 2D) on the scatter plot, and show only the penguins that match **both** selections.

## Done when

- [ ] Dragging on the histogram updates the scatter and the summary live
- [ ] Clearing works both by clicking and with the button
- [ ] The brush isn't re-created while you drag (log inside the setup effect to check)
